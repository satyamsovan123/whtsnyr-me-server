import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { getConfig } from "./config/env.js";
import { createLogger } from "./config/logger.js";

async function startServer() {
  const config = getConfig();
  const logger = createLogger();
  await connectDatabase();

  const server = createApp().listen(config.port, () => {
    logger.info({ port: config.port }, "API listening on /api/v1");
  });

  const shutdown = (signal) => {
    logger.info({ signal }, "Shutting down API server");
    server.close(() => process.exit(0));
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});
