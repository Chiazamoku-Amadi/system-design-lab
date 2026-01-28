import { connectRedis } from "./config/redis.js";
import { app } from "./index.js";

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectRedis();
  const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
  });

  // Server-level timeout
  server.setTimeout(10_000); // 10secs
};

startServer();
