// src/server.ts
import { app } from "./app.js";
import { env } from "./config/env.js";
import { checkDatabaseConnection, pool } from "./config/database.js";
import { logger } from "./core/logger/index.js";
import { getCompanyInfo } from "./data/company.js";

const server = app.listen(env.PORT, async () => {
  logger.info(`Server listening on http://localhost:${env.PORT}`);
  logger.info(`Swagger docs available at http://localhost:${env.PORT}/doc`);

  // Verify database connectivity
  await checkDatabaseConnection();

  // Preload company settings from database
  await getCompanyInfo(true);
});

// Graceful Shutdown Handlers
const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    logger.info("HTTP server closed.");
    await pool.end();
    logger.info("Database connection pool closed.");
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason: unknown) => {
  logger.error({ err: reason }, "UNHANDLED REJECTION! Shutting down...");
  server.close(async () => {
    await pool.end();
    process.exit(1);
  });
});

process.on("uncaughtException", (err: Error) => {
  logger.error({ err }, "UNCAUGHT EXCEPTION! Shutting down...");
  server.close(async () => {
    await pool.end();
    process.exit(1);
  });
});