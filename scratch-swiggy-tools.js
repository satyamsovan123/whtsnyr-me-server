import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { ProviderConnection } from "./src/modules/providers/provider-connection.model.js";
import mongoose from "mongoose";
import { getConfig } from "./src/config/env.js";
import { decryptSecret } from "./src/common/security/crypto.js";

async function run() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/whtsnyr");
  
  // Find a connected Swiggy connection
  const connection = await ProviderConnection.findOne({ provider: "SWIGGY", status: "CONNECTED" })
    .select("+tokenEnvelope +tokenEnvelope.iv +tokenEnvelope.ciphertext +tokenEnvelope.tag").lean();
    
  if (!connection) {
    console.log("No connected Swiggy user found.");
    process.exit(1);
  }
  
  const aad = `${connection.userId}|SWIGGY|ACCESS_TOKEN`;
  const accessToken = decryptSecret(connection.tokenEnvelope, aad);
  
  const config = getConfig();
  
  for (const server of ["food", "im"]) {
    console.log(`\n\n=== Tools for ${server} ===`);
    const client = new Client({ name: "test", version: "1.0.0" });
    const transport = new StreamableHTTPClientTransport(
      new URL(`${config.swiggy.mcpBaseUrl}/${server}`),
      {
        requestInit: {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      },
    );
    client.onerror = () => {};
    
    try {
      await client.connect(transport);
      const tools = await client.listTools();
      for (const tool of tools.tools) {
        if (tool.name === "get_addresses") {
            console.log(`\nTool: ${tool.name}`);
            console.log(JSON.stringify(tool.inputSchema, null, 2));
        }
      }
    } catch (e) {
      console.error(`Error connecting to ${server}:`, e.message);
    } finally {
      await transport.close().catch(() => {});
    }
  }
  
  process.exit(0);
}

run().catch(console.error);
