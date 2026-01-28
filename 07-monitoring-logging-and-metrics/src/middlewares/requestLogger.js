import { v4 as uuidv4 } from "uuid";
import logger from "../logger.js";
import { metrics } from "../metrics.js";

export const requestLogger = (req, res, next) => {
  const requestId = uuidv4();
  const start = Date.now();

  req.requestId = requestId;

  res.on("finish", () => {
    const durationMs = Date.now() - start;

    metrics.requestCount += 1;
    metrics.totalResponseTimeMs += durationMs;

    logger.info({
      level: "info",
      message: "Incoming request",
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs,
      requestId,
    });
  });

  next();
};
