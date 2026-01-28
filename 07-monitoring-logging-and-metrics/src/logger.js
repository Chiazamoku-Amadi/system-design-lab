import pino from "pino";

const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
});

export default logger;
