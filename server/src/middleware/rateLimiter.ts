import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

export const scanLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { success: false, error: "Scan rate limit exceeded" },
  standardHeaders: true,
  legacyHeaders: false,
});

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  message: { success: false, error: "Too many requests" },
  standardHeaders: true,
  legacyHeaders: false,
});
