import express from "express";
import taskRoutes from "./routes/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./docs/swaggerConfig.js";

const app = express();

app.use(express.json());
app.use("/tasks", taskRoutes);
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

app.listen(3000, () => {
  console.log("Server listening on port 3000");
  console.log("Swagger docs available at http://localhost:3000/api-docs");
});
