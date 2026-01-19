import { redisClient } from "../config/redis.js";

export async function idempotencyMiddleware(req, res, next) {
  const key = req.headers["idempotency-key"];
  if (!key) return next(); // skip if no key

  const cacheKey = `idem:response:${key}`;
  const lockKey = `idem:lock:${key}`;

  try {
    // Check if a cached response exists
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      return res.status(data.status).json(data.body);
    }

    // Try to acquire lock atomically
    const acquired = await redisClient.set(lockKey, "locked", {
      NX: true,
      PX: 10000,
    }); // 10s lock
    if (!acquired) {
      return res
        .status(409)
        .json({ message: "Request already in progress. Try again shortly." });
    }

    // Pass control to the route handler
    req.idempotencyKey = key;
    next();
  } catch (err) {
    console.error("Idempotency middleware error", err);
    return res.status(503).json({ message: "Idempotency service unavailable" });
  }
}

export const saveIdempotentResponse = async (key, status, body) => {
  await redisClient.set(`idem:${key}`, JSON.stringify({ status, body }), {
    EX: 60 * 10,
  });
};
