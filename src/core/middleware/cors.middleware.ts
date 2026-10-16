import cors, { type CorsOptions } from "cors";
import { env } from "../../config/env.js";
import { AppError } from "../errors/app-error.js";

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // 1. Allow non-browser clients (Postman, curl, server-to-server, mobile apps) where no Origin header is present
    if (!origin) {
      return callback(null, true);
    }

    // 2. Allow whitelisted origins configured in CLIENT_URL / ALLOWED_ORIGINS
    if (env.ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    // 3. Strictly reject unauthorized browser origins with 403 Forbidden
    return callback(
      new AppError(
        `Access blocked: Origin '${origin}' is not authorized by CORS policy.`,
        403,
      ),
    );
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-Request-ID",
  ],
};

export const corsMiddleware = cors(corsOptions);
