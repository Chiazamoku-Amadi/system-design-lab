import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import models from "../models/index.js";
import {
  cache,
  checkCache,
  clearCache,
  fetchDataFromDatabase,
} from "../middlewares/cache.js";

const router = Router();

router.get("/", checkCache, async (req, res) => {
  const limitQuery = req.query.limit;
  let limit = parseInt(limitQuery, 10);

  const cacheKey = limit ? `all_messages_limit_${limit}` : "all_messages";

  const allMessages = await fetchDataFromDatabase();
  const limitedMessages =
    limit && limit > 0 ? allMessages.slice(0, limit) : allMessages;

  cache.set(cacheKey, limitedMessages);

  return res.status(200).json({
    source: "database",
    count: limitedMessages.length,
    data: limitedMessages,
  });
});

// API to fetch a single message, using cache where applicable
router.get("/:messageId", checkCache, async (req, res) => {
  const { messageId } = req.params;
  const data = await fetchDataFromDatabase(messageId);

  cache.set(messageId, data);

  return res.status(200).json({ source: "database", data });
});

router.post("/", clearCache, (req, res) => {
  let message = {
    id: uuidv4(),
    text: "Hi",
    author: "Jane Doe",
    timeStamp: Date.now(),
  };

  models.messages[message.id] = message;

  return res.send(message);
});

// API to manually clear a specific cache entry
router.delete("/:messageId", (req, res) => {
  const { messageId } = req.params;
  cache.del(messageId);

  res.status(200).json({ message: `Cache cleared for key: ${messageId}` });
});

// API to clear all cache entries
router.delete("/", (req, res) => {
  cache.flushAll();

  res.status(200).json({ message: "All cache cleared." });
});

export default router;
