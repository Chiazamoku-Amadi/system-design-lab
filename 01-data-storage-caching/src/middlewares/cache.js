import NodeCache from "node-cache";
import models from "../models/index.js";

// Create a new cache instance with default TTL of 60s
export const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

// Simulate a slow data-fetching process from the DB
export const fetchDataFromDatabase = async (messageId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (messageId) {
        resolve(models.messages[messageId] || null);
      } else {
        const sortedMessages = Object.values(models.messages).sort(
          (a, b) => b.timeStamp - a.timeStamp
        );
        resolve(sortedMessages);
      }
    }, 3000);
  });
};

const buildCacheKey = (req) => {
  const { messageId } = req.params;
  if (messageId) return messageId;
  const limit = parseInt(req.query.limit, 10);

  return limit ? `all_messages_limit_${limit}` : "all_messages";
};

// Middleware for checking the cache before processing the request
export const checkCache = (req, res, next) => {
  const key = buildCacheKey(req);
  const cachedData = cache.get(key);

  if (cachedData) {
    return res.status(200).json({ source: "cache", data: cachedData });
  }

  next();
};

export const clearCache = (req, res, next) => {
  const { messageId } = req.params;

  const keys = cache.keys();
  const keysToDelete = keys.filter(
    (key) => key === messageId || key.startsWith("all_messages")
  );

  if (keysToDelete.length > 0) {
    cache.del(keysToDelete);
    console.log(`Cleared cache for keys: ${keysToDelete.join(", ")}`);
  } else {
    console.log("No matching cache keys to clear.");
  }

  next();
};
