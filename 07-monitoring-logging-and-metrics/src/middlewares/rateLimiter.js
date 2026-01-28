import rateLimit from "express-rate-limit";
import { metrics } from "../metrics.js";
import logger from "../logger.js";

export const readLimiter = rateLimit({
  windowMs: 3 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 100 requests per window
  standardHeaders: true, // return rate limit info in headers
  legacyHeaders: false, // disable X-RateLimit-* headers
  message: {
    status: 429,
    error: "Too many requests. Please try again later.",
  },
  handler: (req, res) => {
    metrics.rateLimitHits += 1;

    logger.warn({
      level: "warn",
      message: "Rate limit exceeded",
      path: req.originalUrl,
      method: req.method,
      requestId: req.requestId,
    });

    res.status(429).json({
      status: 429,
      error: "Too many requests. Please try again later.",
    });
  },
});

export const writeLimiter = rateLimit({
  windowMs: 3 * 60 * 1000, // 15 minutes
  max: 15, // limit each IP to 100 requests per window
  standardHeaders: true, // return rate limit info in headers
  legacyHeaders: false, // disable X-RateLimit-* headers
  message: {
    status: 429,
    error: "Too many requests. Please try again later.",
  },
  handler: (req, res) => {
    metrics.rateLimitHits += 1;

    logger.warn({
      level: "warn",
      message: "Rate limit exceeded",
      path: req.originalUrl,
      method: req.method,
      requestId: req.requestId,
    });

    res.status(429).json({
      status: 429,
      error: "Too many requests. Please try again later.",
    });
  },
});
