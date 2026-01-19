import { createClient } from "redis";

export const redisClient = createClient({
  url: "redis://localhost:6379",
  socket: {
    reconnectStrategy: false,
  },
});

redisClient.on("error", (err) => {
  console.warn("Redis unavailable");
});

export let redisAvailable = true;

export const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log("Redis connected");
      redisAvailable = true;
    }
  } catch (err) {
    console.warn("Redis unavailable. Continuing without cache.");
    redisAvailable = false;
  }
};
