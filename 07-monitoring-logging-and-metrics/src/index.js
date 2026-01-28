import dotenv from "dotenv";
import express from "express";
import {
  categoryRoutes,
  metricsRoutes,
  taskRoutes,
  userRoutes,
} from "./routes/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./docs/swaggerConfig.js";
import timeout from "connect-timeout";
import { haltOnTimedout } from "./middlewares/haltOnTimedout.js";
import { requestLogger } from "./middlewares/requestLogger.js";

dotenv.config();

const app = express();

app.use(express.json());

app.use(requestLogger);

app.use(timeout("10s"));
app.use(haltOnTimedout);

app.use("/tasks", taskRoutes);
app.use("/users", userRoutes);
app.use("/categories", categoryRoutes);
app.use("/metrics", metricsRoutes);

// Serve the Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(errorHandler);

// The "unhandledRejection" event catches promises that were rejected but never handled
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION", err); // Log the error
  // Exit with error. Gracefully kill the app because after an unhandled rejection, it might be in a broken state. Killing and restarting (with a process manager like PM2 or Docker) is safer.
  process.exit(1);
});

// The "uncaughtException" event catches errors that were thrown but never wrapped in try/catch
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION", err); // Log the error
  // Exit with error. Gracefully kill the app because after an unhandled rejection, it might be in a broken state. Killing and restarting (with a process manager like PM2 or Docker) is safer.
  process.exit(1);
});

export { app };
