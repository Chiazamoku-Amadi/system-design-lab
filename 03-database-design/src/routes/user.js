import { Router } from "express";
import prisma from "../prismaClient.js";
import { AppError } from "../utils/AppError.js";
import {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
  validateRequest,
} from "../validation/index.js";

const router = Router();

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Returns a list of all users with email, password and optional tasks
 *     parameters:
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
 *         description: A paginated list of users
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
 *                     $ref: "#/components/schemas/User"
 *       400:
 *         description: Invalid query parameters (e.g., non-integer page or limit)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 */

// Get all users
router.get("/", async (req, res, next) => {
  try {
    let { page, limit } = req.query;

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

    const total = await prisma.user.count();
    const users = await prisma.user.findMany({
      include: {
        tasks: true,
      },
    });

    res.status(200).json({
      status: 200,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: users,
    });
  } catch (error) {
    next(AppError(500, "Failed to fetch users"));
  }
});

/**
 * @swagger
 * /users/{userId}:
 *   get:
 *      summary: Get a user by ID
 *      description: Return a single user by its ID
 *      parameters:
 *        - in: path
 *          name: userId
 *          schema:
 *            type: integer
 *          description: The ID of the user to retrieve
 *      responses:
 *        200:
 *          description: Successfully retrieved user
 *          content:
 *            application/json:
 *              schema:
 *                $ref: "#/components/schemas/User"
 *        404:
 *          description: User not found
 */

// Get a single user
router.get(
  "/:userId",
  validateRequest(userIdSchema, "params"),
  async (req, res, next) => {
    try {
      const { userId } = req.params;

      let user = await prisma.user.findUnique({
        where: { id: Number(userId) },
        include: {
          tasks: true,
        },
      });

      if (!user) {
        return next(AppError(404, "User not found. Please check the user ID."));
      }

      res.status(201).json({
        status: 200,
        data: user,
      });
    } catch (error) {
      next(AppError(500, "Failed to fetch user"));
    }
  }
);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     description: Creates a new user with a name, email, and password
 *     requestBody:
 *       required: true,
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserInput'
 *     responses:
 *       201:
 *         description: User created successfully
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

// Create a user
router.post("/", validateRequest(createUserSchema), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password,
      },
    });

    const { password: userPassword, ...publicUser } = user;

    res.status(201).json({
      status: 201,
      message: "User created successfully",
      data: publicUser,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return next(AppError(400, "User already exists"));
    }

    next(AppError(500, "Failed to create user"));
  }
});

/**
 * @swagger
 * /users/{userId}:
 *   put:
 *     summary: Update a user's profile
 *     description: Update non-sensitive user fields. You can update one or more fields
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated User Name"
 *               email:
 *                 type: string
 *                 example: "admin@taskapp.com"
 *     responses:
 *       200:
 *         description: User updated successfully
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
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// Update a user
router.put(
  "/:userId",
  validateRequest(userIdSchema, "params"),
  validateRequest(updateUserSchema, "body"),
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { name, email } = req.body;

      const data = {
        ...(name && { name }),
        ...(email && { email }),
      };

      const user = await prisma.user.update({
        where: { id: Number(userId) },
        data,
        include: {
          tasks: true,
        },
      });

      // Don't leak password. Remove it from response
      const { password, ...publicUser } = user;

      res.status(200).json({
        status: 200,
        data: publicUser,
      });
    } catch (error) {
      if (error.code === "P2025") {
        return next(AppError(404, "User not found"));
      }

      if (error.code === "P2002" && error.meta?.target?.includes("email")) {
        return next(AppError(400, "Email already in use"));
      }

      next(AppError(500, "Failed to update user"));
    }
  }
);

/**
 * @swagger
 * /users/{userId}:
 *   delete:
 *     summary: Delete a user
 *     description: Deletes a user by its unique ID
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
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
 *                  example: "User deleted successfully"
 *                data:
 *                  type: object
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// Delete a user
router.delete(
  "/:userId",
  validateRequest(userIdSchema, "params"),
  async (req, res, next) => {
    try {
      const { userId } = req.params;

      await prisma.user.delete({
        where: { id: Number(userId) },
      });

      res.status(200).json({
        status: 200,
        message: "User deleted successfully",
      });
    } catch (error) {
      if (error.code === "P2025") {
        return next(AppError(404, "User not found."));
      }

      next(AppError(500, "Failed to delete user"));
    }
  }
);

export default router;
