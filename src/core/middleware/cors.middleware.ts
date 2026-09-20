import cors, { type CorsOptions } from "cors";
import { env } from "../../config/env.js";

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server, mobile, or requests from whitelisted origins
    if (!origin || env.ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Request-ID"],
};

export const corsMiddleware = cors(corsOptions);
