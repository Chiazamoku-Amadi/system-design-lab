import { Router } from "express";
import prisma from "../prismaClient.js";
import { validateRequest } from "../validation/middlewares/validateRequest.js";
import {
  categoryIdSchema,
  createCategorySchema,
  updateCategorySchema,
} from "../validation/schemas/category.schema.js";

const router = Router();

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     description: Returns a list of all categories with name and optional tasks
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
 *         description: A paginated list of categories
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
 *                     $ref: "#/components/schemas/Category"
 *       400:
 *         description: Invalid query parameters (e.g., non-integer page or limit)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 */

// Get all categories
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

    const total = await prisma.category.count();
    const categories = await prisma.category.findMany({
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
      data: categories,
    });
  } catch (error) {
    next(AppError(500, "Failed to fetch users"));
  }
});

/**
 * @swagger
 * /categories/{categoryId}:
 *   get:
 *      summary: Get a category by ID
 *      description: Return a single category by its ID
 *      parameters:
 *        - in: path
 *          name: categoryId
 *          schema:
 *            type: integer
 *          description: The ID of the category to retrieve
 *      responses:
 *        200:
 *          description: Successfully retrieved category
 *          content:
 *            application/json:
 *              schema:
 *                $ref: "#/components/schemas/Category"
 *        404:
 *          description: Category not found
 */

// Get a single category
router.get(
  "/:categoryId",
  validateRequest(categoryIdSchema, "params"),
  async (req, res, next) => {
    try {
      const { categoryId } = req.params;

      let category = await prisma.category.findUnique({
        where: { id: Number(categoryId) },
        include: {
          tasks: true,
        },
      });

      if (!category) {
        return next(
          AppError(404, "Category not found. Please check the category ID.")
        );
      }

      res.status(201).json({
        status: 200,
        data: category,
      });
    } catch (error) {
      next(AppError(500, "Failed to fetch category"));
    }
  }
);

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category
 *     description: Creates a new category
 *     requestBody:
 *       required: true,
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryInput'
 *     responses:
 *       201:
 *         description: Category created successfully
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

// Create a category
router.post(
  "/",
  validateRequest(createCategorySchema),
  async (req, res, next) => {
    try {
      const { name } = req.body;

      const category = await prisma.category.create({
        data: {
          name,
        },
      });

      res.status(201).json({
        status: 201,
        message: "Category created successfully",
        data: category,
      });
    } catch (error) {
      if (error.code === "P2002") {
        return next(AppError(400, "Category already exists"));
      }

      next(AppError(500, "Failed to create category"));
    }
  }
);

/**
 * @swagger
 * /categories/{categoryId}:
 *   put:
 *     summary: Update a category's profile
 *     description: Update non-sensitive category fields. You can update one or more fields
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the category to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Category Name"
 *     responses:
 *       200:
 *         description: Category updated successfully
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
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// Update a category
router.put(
  "/:categoryId",
  validateRequest(categoryIdSchema, "params"),
  validateRequest(updateCategorySchema, "body"),
  async (req, res, next) => {
    try {
      const { categoryId } = req.params;
      const { name } = req.body;

      const data = {
        ...(name && { name }),
      };

      const category = await prisma.category.update({
        where: { id: Number(categoryId) },
        data,
      });

      res.status(200).json({
        status: 200,
        data: category,
      });
    } catch (error) {
      if (error.code === "P2025") {
        return next(AppError(404, "Category not found"));
      }
      next(AppError(500, "Failed to update category"));
    }
  }
);

/**
 * @swagger
 * /categories/{categoryId}:
 *   delete:
 *     summary: Delete a category
 *     description: Deletes a category by its unique ID
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the category to delete
 *     responses:
 *       200:
 *         description: Category deleted successfully
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
 *                  example: "Category deleted successfully"
 *                data:
 *                  type: object
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// Delete a category
router.delete(
  "/:categoryId",
  validateRequest(categoryIdSchema, "params"),
  async (req, res, next) => {
    try {
      const { categoryId } = req.params;

      await prisma.category.delete({
        where: { id: Number(categoryId) },
      });

      res.status(200).json({
        status: 200,
        message: "Category deleted successfully",
      });
    } catch (error) {
      next(AppError(500, "Failed to delete category"));
    }
  }
);

export default router;
