import { Router } from "express";
import models from "../models/index.js";
import { v4 as uuidv4 } from "uuid";
import {
  createTaskSchema,
  taskIdSchema,
  taskQuerySchema,
  updateTaskSchema,
  validateRequest,
} from "../validation/index.js";
import { AppError } from "../utils/AppError.js";

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
router.get("/", validateRequest(taskQuerySchema, "query"), (req, res, next) => {
  let { status, sort, page, limit } = req.query;

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

  let tasks = [...models.tasks];

  // Filtering by status
  if (status) {
    tasks = tasks.filter((task) => task.status === status);
  }

  // Sorting by timestamp
  if (sort === "asc") {
    tasks.sort((a, b) => a.createdAt - b.createdAt);
  } else if (sort === "desc") {
    tasks.sort((a, b) => b.createdAt - a.createdAt);
  }

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedTasks = tasks.slice(startIndex, endIndex);

  res.status(200).json({
    status: 200,
    total: tasks.length,
    page,
    limit,
    totalPages: Math.ceil(tasks.length / limit),
    data: paginatedTasks,
  });
});

/**
 * @swagger
 * /tasks/{taskId}:
 *   get:
 *      summary: Get a task by ID
 *      description: Return a single task by its ID
 *      parameters:
 *        - in: query
 *          name: taskId
 *          schema:
 *            type: string
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
  (req, res, next) => {
    const { taskId } = req.params;
    const task = models.tasks.find((task) => task.id === taskId);

    if (!task) {
      return next(AppError(404, "Task not found. Please check the task ID."));
    }

    res.status(200).json({
      status: 200,
      data: task,
    });
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
router.post("/", validateRequest(createTaskSchema), (req, res) => {
  const { title, description, status } = req.body;

  const task = {
    id: uuidv4(),
    title,
    description,
    status: status || "pending",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  models.tasks.push(task);

  res.status(201).json({
    status: 201,
    message: "Task created successfully",
    data: task,
  });
});

/**
 * @swagger
 * /tasks/{taskId}:
 *   put:
 *     summary: Update a task
 *     description: Updates an existing task by its ID. You can update one or more fields
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
  (req, res, next) => {
    const { taskId } = req.params;
    const { title, description, status } = req.body;

    const task = models.tasks.find((task) => task.id === taskId);

    if (!task) {
      return next(AppError(404, "Task not found. Please check the task ID."));
    }

    if (title) task.title = title;
    if (description) task.description = description;
    if (status) task.status = status;

    task.updatedAt = Date.now();

    res.status(201).json({
      status: 201,
      message: "Task updated successfully",
      data: task,
    });
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
  (req, res, next) => {
    const { taskId } = req.params;
    const taskIndex = models.tasks.findIndex((task) => task.id === taskId);

    if (taskIndex === -1) {
      return next(
        AppError(404, "Task not found. Cannot delete a non-existent task.")
      );
    }

    models.tasks.splice(taskIndex, 1);

    res.status(200).json({
      status: 200,
      message: "Task deleted successfully",
    });
  }
);

export default router;
