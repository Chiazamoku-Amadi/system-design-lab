import logger from "../logger.js";
import { metrics } from "../metrics.js";

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (req.timedout) {
    return res.status(408).json({
      error: "Request timeout",
    });
  }

  metrics.errorCount += 1;

  const isProd = process.env.NODE_ENV === "production";
  const statusCode = err.statusCode || 500;

  logger.error({
    level: "error",
    message: err.message,
    statusCode,
    stack: isProd ? undefined : err.stack,
    path: req.originalUrl,
    method: req.method,
    requestId: req.requestId,
  });

  const message = err.isOperational
    ? err.message
    : "Something went wrong on the server.";

  res.status(statusCode).json({
    status: statusCode,
    message,
  });
};
