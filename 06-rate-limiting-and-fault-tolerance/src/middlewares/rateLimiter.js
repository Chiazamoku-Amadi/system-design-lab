import rateLimit from "express-rate-limit";

export const readLimiter = rateLimit({
  windowMs: 3 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 100 requests per window
  standardHeaders: true, // return rate limit info in headers
  legacyHeaders: false, // disable X-RateLimit-* headers
  message: {
    status: 429,
    error: "Too many requests. Please try again later.",
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
});
