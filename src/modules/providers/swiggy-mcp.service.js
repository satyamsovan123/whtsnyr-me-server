import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

import { AppError } from "../../common/errors/app-error.js";
import { getConfig } from "../../config/env.js";
import { getSwiggyAccessToken } from "./swiggy-oauth.service.js";

const SERVER_PATHS = Object.freeze({ food: "food", instamart: "im", dineout: "dineout" });

const READ_TOOL_ALLOWLIST = Object.freeze({
  food: new Set([
    "get_addresses",
    "search_restaurants",
    "search_menu",
    "get_restaurant_menu",
    "fetch_food_coupons",
    "get_food_cart",
    "get_food_orders",
    "get_food_order_details",
    "track_food_order",
  ]),
  instamart: new Set([
    "get_addresses",
    "search_products",
    "your_go_to_items",
    "get_cart",
    "get_orders",
    "get_order_details",
    "track_order",
  ]),
  dineout: new Set([
    "get_saved_locations",
    "search_restaurants_dineout",
    "get_restaurant_details",
    "get_available_slots",
    "get_booking_status",
  ]),
});

function parseToolResult(result) {
  if (result.structuredContent !== undefined) return result.structuredContent;
  const items = Array.isArray(result.content) ? result.content : [];
  const parsed = items.map((item) => {
    if (item.type !== "text") return item;
    try {
      return JSON.parse(item.text);
    } catch {
      return item.text;
    }
  });
  return parsed.length === 1 ? parsed[0] : parsed;
}

class SwiggyWriteAmbiguousError extends Error {
  constructor(message, cause) {
    super(message, { cause });
    this.name = "SwiggyWriteAmbiguousError";
  }
}

class SwiggyToolRejectedError extends Error {
  constructor(message, result) {
    super(message);
    this.name = "SwiggyToolRejectedError";
    this.result = result;
  }
}

async function executeTool({ server, tool, args, accessToken, write }) {
  const config = getConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.swiggy.timeoutMs);
  const client = new Client({ name: "whtsnyr-me-server", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(
    new URL(`${config.swiggy.mcpBaseUrl}/${SERVER_PATHS[server]}`),
    {
      requestInit: {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: controller.signal,
      },
    },
  );
  client.onerror = () => {};

  try {
    await client.connect(transport);
    const result = await client.callTool({ name: tool, arguments: args });
    const data = parseToolResult(result);
    if (JSON.stringify(data).length > 2_000_000) {
      throw new AppError({
        status: 502,
        code: "SWIGGY_RESPONSE_TOO_LARGE",
        message: "Swiggy returned more data than this endpoint permits",
      });
    }
    if (result.isError) {
      if (write) throw new SwiggyToolRejectedError("Swiggy rejected the requested action", data);
      throw new AppError({
        status: 502,
        code: "SWIGGY_TOOL_ERROR",
        message: "Swiggy could not complete the requested lookup",
        details: data,
      });
    }
    return data;
  } catch (error) {
    if (error instanceof AppError || error instanceof SwiggyToolRejectedError) throw error;
    if (write) {
      throw new SwiggyWriteAmbiguousError(
        "The Swiggy write outcome is unknown and must be reconciled",
        error,
      );
    }
    throw new AppError({
      status: 502,
      code: "SWIGGY_UPSTREAM_UNAVAILABLE",
      message: "Swiggy is temporarily unavailable",
      cause: error,
    });
  } finally {
    clearTimeout(timeout);
    await transport.close().catch(() => {});
  }
}

async function callSwiggyReadTool(userId, server, tool, args) {
  if (!READ_TOOL_ALLOWLIST[server]?.has(tool)) {
    throw new AppError({
      status: 500,
      code: "SWIGGY_TOOL_NOT_ALLOWLISTED",
      message: "The backend attempted a non-allowlisted Swiggy tool",
    });
  }
  const { connection, accessToken } = await getSwiggyAccessToken(userId);
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const data = await executeTool({ server, tool, args, accessToken, write: false });
      await connection.updateOne({ $set: { lastUsedAt: new Date() } });
      return data;
    } catch (error) {
      lastError = error;
      if (error.code === "SWIGGY_TOOL_ERROR" || attempt === 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 150 + Math.random() * 100));
    }
  }
  throw lastError;
}

async function callSwiggyDineoutBooking(userId, args) {
  const config = getConfig();
  if (!config.swiggy.writesEnabled) {
    throw new AppError({
      status: 503,
      code: "SWIGGY_WRITES_DISABLED",
      message: "Swiggy booking writes are disabled in this environment",
    });
  }
  const { connection, accessToken } = await getSwiggyAccessToken(userId);
  const data = await executeTool({
    server: "dineout",
    tool: "book_table",
    args,
    accessToken,
    write: true,
  });
  await connection.updateOne({ $set: { lastUsedAt: new Date() } });
  return data;
}

export {
  SwiggyWriteAmbiguousError,
  SwiggyToolRejectedError,
  callSwiggyReadTool,
  callSwiggyDineoutBooking,
};
