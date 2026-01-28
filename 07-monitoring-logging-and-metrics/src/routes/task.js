import { Router } from "express";
import {
  createTaskSchema,
  taskIdSchema,
  taskQuerySchema,
  updateTaskSchema,
  validateRequest,
} from "../validation/index.js";
import { AppError } from "../utils/AppError.js";
import prisma from "../prismaClient.js";
import { redisAvailable, redisClient } from "../config/redis.js";
import { sendMessageToQueue } from "../utils/rabbitmq.js";
import { taskCreatedEventSchema } from "../events/taskCreated.event.schema.js";
import crypto from "crypto";
import { readLimiter, writeLimiter } from "../middlewares/rateLimiter.js";
import { withRetry } from "../utils/withRetry.js";
import {
  idempotencyMiddleware,
  saveIdempotentResponse,
} from "../middlewares/idempotency.js";

const router = Router();

const TASK_EVENTS_QUEUE = process.env.QUEUE_NAME;

async function invalidateTaskCache() {
  const keys = await redisClient.keys("tasks:*");

  if (keys.length > 0) {
    await redisClient.del(keys);
  }
}

// Used during observability testing to validate error logging & metrics
// router.get("/force-error", (req, res) => {
//   throw new Error("Intentional test failure");
// });

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Get all tasks
 *     description: Returns a list of all tasks with optional filtering, sorting, and pagination
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in-progress, completed]
 *         description: Filter tasks by their status
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filter tasks by user
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: Filter tasks by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search text within title, description, user name or category name
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort tasks by creation date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: A paginated list of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/Task"
 *       400:
 *         description: Invalid query parameters (e.g., non-integer page or limit)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 */

// Get all tasks
router.get(
  "/",
  readLimiter,
  validateRequest(taskQuerySchema, "query"),
  async (req, res, next) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));

      const cacheKey = `tasks:${JSON.stringify(req.query)}`;

      // Check Redis first
      let cachedResponse;

      if (redisAvailable) {
        try {
          cachedResponse = await withRetry(() => redisClient.get(cacheKey), {
            retries: 2,
            baseDelay: 100,
            shouldRetry: () => true,
          });
        } catch (error) {
          console.warn(
            "Redis GET failed, continuing without cache:",
            error.message,
          );
        }
      }

      if (cachedResponse) {
        return res.status(200).json(JSON.parse(cachedResponse));
      }

      let { status, userId, categoryId, search, sort, page, limit } = req.query;

      page = parseInt(page) || 1;
      limit = parseInt(limit) || 10;

      if (page < 1 || limit < 1) {
        return next(
          AppError(
            400,
            "Invalid query parameters. 'page' and 'limit' must be positive integers.",
          ),
        );
      }

      // Filtering
      let filters = {};

      // Filtering by status
      if (status) {
        filters.status = status;
      }

      // Filtering by user
      if (userId) {
        filters.userId = Number(userId);
      }

      // Filtering by category
      if (categoryId) {
        filters.categoryId = Number(categoryId);
      }

      // Full-text search (title + description + user name + category name)
      if (search) {
        const lowerCaseSearch = search.toLowerCase();

        // Return tasks where any of these conditions are true
        filters.OR = [
          { title: { contains: lowerCaseSearch, mode: "insensitive" } },
          { description: { contains: lowerCaseSearch, mode: "insensitive" } },
          {
            user: {
              name: {
                contains: lowerCaseSearch,
                mode: "insensitive",
              },
            },
          },
          {
            category: {
              name: {
                contains: lowerCaseSearch,
                mode: "insensitive",
              },
            },
          },
        ];
      }

      // Sorting by timestamp
      let orderBy = undefined;
      if (sort === "asc") {
        orderBy = { createdAt: "asc" };
      } else if (sort === "desc") {
        orderBy = { createdAt: "desc" };
      }

      // Pagination
      const skip = (page - 1) * limit;
      const take = limit;

      // Count Total Tasks
      const total = await prisma.task.count({ where: filters });

      // Get Tasks From DB
      const tasks = await prisma.task.findMany({
        where: filters,
        orderBy,
        skip,
        take,
        include: {
          user: true,
          category: true,
        },
      });

      const responsePayload = {
        status: 200,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        data: tasks,
      };

      if (redisAvailable) {
        try {
          await withRetry(
            () =>
              redisClient.set(cacheKey, JSON.stringify(responsePayload), {
                EX: 30,
              }),
            { retries: 2, baseDelay: 100 },
          );
        } catch (error) {
          console.warn("Redis SET failed, continuing:", error.message);
        }
      }

      res.status(200).json(responsePayload);
    } catch (error) {
      console.warn("Redis cache write failed:", error.message);
    }
  },
);

/**
 * @swagger
 * /tasks/{taskId}:
 *   get:
 *      summary: Get a task by ID
 *      description: Return a single task by its ID
 *      parameters:
 *        - in: path
 *          name: taskId
 *          schema:
 *            type: integer
 *          description: The ID of the task to retrieve
 *      responses:
 *        200:
 *          description: Successfully retrieved task
 *          content:
 *            application/json:
 *              schema:
 *                $ref: "#/components/schemas/Task"
 *        404:
 *          description: Task not found
 */

// Get a single task
router.get(
  "/:taskId",
  readLimiter,
  validateRequest(taskIdSchema, "params"),
  async (req, res, next) => {
    try {
      const { taskId } = req.params;

      const task = await prisma.task.findUnique({
        where: { id: Number(taskId) },
        include: {
          user: true,
          category: true,
        },
      });

      if (!task) {
        return next(AppError(404, "Task not found. Please check the task ID."));
      }

      res.status(200).json({
        status: 200,
        data: task,
      });
    } catch (error) {
      next(AppError(500, "Failed to fetch task"));
    }
  },
);

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a new task
 *     description: Creates a new task with a title, description, and optional status
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskInput'
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error (invalid input)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 */

// Create a new task
router.post(
  "/",
  writeLimiter,
  idempotencyMiddleware,
  validateRequest(createTaskSchema),
  async (req, res, next) => {
    if (!req.idempotencyKey) return next();

    const lockKey = `idem:lock:${req.idempotencyKey}`;

    try {
      const { title, description, status, userId, categoryId } = req.body;

      // Simulate delay for concurrency testing
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Check user
      if (userId) {
        const userExists = await prisma.user.findUnique({
          where: { id: userId },
        });
        if (!userExists) return next(AppError(400, "User does not exist"));
      }

      // Check category
      if (categoryId) {
        const categoryExists = await prisma.category.findUnique({
          where: { id: categoryId },
        });
        if (!categoryExists)
          return next(AppError(400, "Category does not exist"));
      }

      const task = await prisma.task.create({
        data: {
          title,
          description,
          status: status || "pending",
          user: {
            connect: { id: Number(userId) },
          },
          ...(categoryId && {
            category: {
              connect: { id: Number(categoryId) },
            },
          }),
        },
      });

      // Save idempotent response to Redis
      const responsePayload = {
        status: 201,
        body: { status: 201, message: "Task created successfully", data: task },
      };
      await redisClient.set(
        `idem:response:${req.idempotencyKey}`,
        JSON.stringify(responsePayload),
        { EX: 3600 },
      );

      // Release lock
      await redisClient.del(lockKey);

      // Invalidate cache for tasks list if needed
      await invalidateTaskCache();

      // Event publishing
      const event = {
        type: "task.created",
        payload: {
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          userId: task.userId,
          categoryId: task.categoryId,
        },
        metadata: {
          eventId: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          source: "task-service",
        },
      };

      const { error, value } = taskCreatedEventSchema.validate(event);
      if (error) {
        console.error("Invalid TaskCreated event:", error.details);
        return next(AppError(500, "Internal event formatting error"));
      }
      await withRetry(() => sendMessageToQueue(TASK_EVENTS_QUEUE, value), {
        retries: 3,
        baseDelay: 500,
        shouldRetry: () => true,
      });

      return res.status(201).json(responsePayload.body);
    } catch (error) {
      if (error.code === "P2003") {
        // Foreign key constraint failed (invalid userId or categoryId)
        return next(AppError(400, "Invalid userId or categoryId"));
      }

      next(AppError(500, "Failed to create task"));
    } finally {
      // Ensure lock is released even if an error happens
      await redisClient.del(lockKey).catch(() => {});
    }
  },
);

/**
 * @swagger
 * /tasks/{taskId}:
 *   put:
 *     summary: Update a task
 *     description: Update an existing task by its ID. You can update one or more fields
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the task to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated Task Title"
 *               description:
 *                 type: string
 *                 example: "Updated description for the task"
 *               status:
 *                 type: string
 *                 enum: [pending, in-progress, completed]
 *                 example: "completed"
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error (invalid update data)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// Update a task
router.put(
  "/:taskId",
  writeLimiter,
  idempotencyMiddleware,
  validateRequest(taskIdSchema, "params"),
  validateRequest(updateTaskSchema, "body"),
  async (req, res, next) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const { taskId } = req.params;
      const { title, description, status, userId, categoryId } = req.body;

      const data = {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(userId !== undefined && {
          userId: userId === null ? null : Number(userId),
        }),
        ...(categoryId !== undefined && {
          categoryId: categoryId === null ? null : Number(categoryId),
        }),
      };

      const updatedTask = await prisma.task.update({
        where: { id: Number(taskId) },
        data,
        include: {
          user: true,
          category: true,
        },
      });

      const responseBody = {
        status: 200,
        message: "Task updated successfully",
        data: updatedTask,
      };

      // Save idempotent response
      if (req.idempotencyKey) {
        await saveIdempotentResponse(req.idempotencyKey, 200, responseBody);

        await redisClient.del(`idem:lock:${req.idempotencyKey}`);
      }

      // Clear caches
      await invalidateTaskCache();

      // Send event
      await sendMessageToQueue(TASK_EVENTS_QUEUE, {
        type: "task.updated",
        timestamp: new Date().toISOString(),
        payload: updatedTask,
      });

      res.status(200).json(responseBody);
    } catch (error) {
      // If no record found
      if (error.code === "P2025") {
        return next(AppError(404, "Task not found. Please check the task ID."));
      }

      if (error.code === "P2003") {
        // P2003 occurs when foreign key constraint fails in some contexts
        return next(
          AppError(
            400,
            "Invalid userId or categoryId. The referenced record does not exist.",
          ),
        );
      }

      next(AppError(500, "Failed to update task"));
    }
  },
);

/**
 * @swagger
 * /tasks/{taskId}:
 *   delete:
 *     summary: Delete a task
 *     description: Deletes a task by its unique ID
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the task to delete
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: integer
 *                  example: 200
 *                message:
 *                  type: string
 *                  example: "Task deleted successfully"
 *                data:
 *                  type: object
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// Delete a task
router.delete(
  "/:taskId",
  writeLimiter,
  validateRequest(taskIdSchema, "params"),
  async (req, res, next) => {
    try {
      const { taskId } = req.params;

      await prisma.task.delete({
        where: { id: Number(taskId) },
      });

      // Clear cached task lists
      await invalidateTaskCache();

      // Send event
      await sendMessageToQueue(TASK_EVENTS_QUEUE, {
        type: "task.deleted",
        timestamp: new Date().toISOString(),
        payload: { id: Number(taskId) },
      });

      res.status(200).json({
        status: 200,
        message: "Task deleted successfully",
      });
    } catch (error) {
      if (error.code === "P2025") {
        return next(
          AppError(404, "Task not found. Cannot delete a non-existent task"),
        );
      }
      next(AppError(500, "Failed to delete task"));
    }
  },
);

export default router;
