// src/server.ts - application entrypoint
import { app } from "./app.js";
import { env } from "./config/env.js";
import { checkDatabaseConnection, pool } from "./config/database.js";
import { logger } from "./core/logger/index.js";
import { getOrganizationInfo } from "./data/organizations.js";

const server = app.listen(env.PORT, async () => {
  logger.info(`Server listening on http://localhost:${env.PORT}`);
  logger.info(`Swagger docs available at http://localhost:${env.PORT}/doc`);

  // Verify database connectivity
  await checkDatabaseConnection();

  // Preload organization settings from database
  await getOrganizationInfo(true);
});

// Graceful Shutdown Handlers
const shutdown = async (signal: string, exitCode = 0) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  // Hard timeout: force exit if graceful cleanup hangs beyond 10 seconds
  const forceKillTimer = setTimeout(() => {
    logger.error("Graceful shutdown timed out after 10 seconds. Forcing process termination.");
    process.exit(1);
  }, 10000);
  forceKillTimer.unref();

  server.close(async () => {
    logger.info("HTTP server closed.");
    try {
      await pool.end();
      logger.info("Database connection pool closed.");
    } catch (err) {
      logger.error({ err }, "Error closing database connection pool");
    }
    process.exit(exitCode);
  });
};

process.on("SIGINT", () => shutdown("SIGINT", 0));
process.on("SIGTERM", () => shutdown("SIGTERM", 0));

process.on("unhandledRejection", (reason: unknown) => {
  logger.error({ err: reason }, "UNHANDLED REJECTION! Initiating emergency shutdown...");
  shutdown("unhandledRejection", 1);
});

process.on("uncaughtException", (err: Error) => {
  logger.error({ err }, "UNCAUGHT EXCEPTION! Initiating emergency shutdown...");
  shutdown("uncaughtException", 1);
});