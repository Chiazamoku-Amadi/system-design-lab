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

const router = Router();

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
  validateRequest(taskQuerySchema, "query"),
  async (req, res, next) => {
    try {
      let { status, userId, categoryId, search, sort, page, limit } = req.query;

      page = parseInt(page) || 1;
      limit = parseInt(limit) || 10;

      if (page < 1 || limit < 1) {
        return next(
          AppError(
            400,
            "Invalid query parameters. 'page' and 'limit' must be positive integers."
          )
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

      res.status(200).json({
        status: 200,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        data: tasks,
      });
    } catch (error) {
      next(AppError(500, "Failed to fetch tasks"));
    }
  }
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
  }
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
router.post("/", validateRequest(createTaskSchema), async (req, res, next) => {
  try {
    const { title, description, status, userId, categoryId } = req.body;

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

    res.status(201).json({
      status: 201,
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    if (error.code === "P2003") {
      // Foreign key constraint failed (invalid userId or categoryId)
      return next(AppError(400, "Invalid userId or categoryId"));
    }

    next(AppError(500, "Failed to create task"));
  }
});

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
  validateRequest(taskIdSchema, "params"),
  validateRequest(updateTaskSchema, "body"),
  async (req, res, next) => {
    try {
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

      res.status(200).json({
        status: 200,
        message: "Task updated successfully",
        data: updatedTask,
      });
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
            "Invalid userId or categoryId. The referenced record does not exist."
          )
        );
      }

      next(AppError(500, "Failed to update task"));
    }
  }
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
  validateRequest(taskIdSchema, "params"),
  async (req, res, next) => {
    try {
      const { taskId } = req.params;

      await prisma.task.delete({
        where: { id: Number(taskId) },
      });

      res.status(200).json({
        status: 200,
        message: "Task deleted successfully",
      });
    } catch (error) {
      if (error.code === "P2025") {
        return next(
          AppError(404, "Task not found. Cannot delete a non-existent task")
        );
      }
      next(AppError(500, "Failed to delete task"));
    }
  }
);

export default router;
