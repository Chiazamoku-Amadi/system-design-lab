import { Router } from "express";
import { metrics } from "../metrics.js";

const router = Router();

/**
 * @swagger
 * /metrics:
 *   get:
 *     summary: Get system metrics
 *     description: Returns a list of all categories with name and optional tasks. These metrics help determine system health, performance, and reliability.
 *     tags:
 *       - Monitoring
 *     responses:
 *       200:
 *         description: Current system metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 requestCount:
 *                   type: integer
 *                   example: 120
 *                 errorCount:
 *                   type: integer
 *                   example: 3
 *                 averageLatencyMs:
 *                   type: integer
 *                   example: 45
 *                 rateLimitHits:
 *                   type: integer
 *                   example: 7
 */

router.get("/", (req, res) => {
  res.json({
    requestCount: metrics.requestCount,
    errorCount: metrics.errorCount,
    averageLatencyMs:
      metrics.requestCount === 0
        ? 0
        : Math.round(metrics.totalResponseTimeMs / metrics.requestCount),
    rateLimitHits: metrics.rateLimitHits,
  });
});

export default router;
