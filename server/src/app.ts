import "express-async-errors";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import path from "path";
import { config } from "./config";
import apiRouter from "./routes";
import { errorHandler, notFound } from "./middleware/errorHandler";
import { generalLimiter } from "./middleware/rateLimiter";

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://192.168.1.100:3000",
      "http://192.168.1.100:3001",
      "http://192.168.1.100:3002",
      "https://localhost:3000",
      "https://192.168.1.100:3000",
      config.origin,
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }));
  app.use(compression());
  app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(cookieParser());
  app.use(generalLimiter);

  // Serve uploaded files
  app.use("/uploads", express.static(path.resolve(config.storage.uploadDir)));

  app.use("/api/v1", apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
