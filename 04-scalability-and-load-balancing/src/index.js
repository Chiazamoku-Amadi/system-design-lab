import dotenv from "dotenv";
import express from "express";
import { categoryRoutes, taskRoutes, userRoutes } from "./routes/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./docs/swaggerConfig.js";

dotenv.config();

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

// Logs every incoming request
app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.url} -- port ${PORT}`
  );
  next();
});

app.use("/tasks", taskRoutes);
app.use("/users", userRoutes);
app.use("/categories", categoryRoutes);
app.use(errorHandler);

// Serve the Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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
