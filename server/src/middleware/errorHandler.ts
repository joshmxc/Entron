import { Request, Response, NextFunction } from "express";
import winston from "winston";

const logger = winston.createLogger({
  level: "error",
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
});

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error(err.message, { stack: err.stack });

  if (res.headersSent) return;

  const status = (err as { status?: number }).status ?? 500;
  res.status(status).json({
    success: false,
    error: status === 500 ? "Internal server error" : err.message,
  });
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ success: false, error: "Route not found" });
}
