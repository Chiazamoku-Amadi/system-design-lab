/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         title:
 *           type: string
 *           example: "Build Task API"
 *         description:
 *           type: string
 *           example: "Understand how to build REST APIs"
 *         status:
 *           type: string
 *           enum: [pending, in-progress, completed]
 *           example: "in-progress"
 *         createdAt:
 *           type: integer
 *           example: 1700000000000
 *         updatedAt:
 *           type: integer
 *           example: 1700000000000
 *
 *     CreateTaskInput:
 *       type: object
 *       required:
 *         - title:
 *       properties:
 *         title:
 *           type: string
 *           example: "Build Task API"
 *         description:
 *           type: string
 *           example: "Understand REST APIs"
 *         status:
 *           type: string
 *           enum:
 *             - pending
 *             - in-progress
 *             - completed
 *           example: "pending"
 *         userId:
 *           type: integer
 *           example: 1
 *         categoryId:
 *           type: integer
 *           example: 1
 *
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Jane Doe"
 *         email:
 *           type: string
 *           example: "janedoe@taskapp.com"
 *         password:
 *           type: string
 *           writeOnly: true
 *           example: "my-super-encrypted-password"
 *         taskIds:
 *           type: array
 *           items:
 *             type: integer,
 *           example: [1, 2, 4]
 *         createdAt:
 *           type: integer
 *           example: 1700000000000
 *         updatedAt:
 *           type: integer
 *           example: 1700000000000
 *
 *     CreateUserInput:
 *       type: object
 *       required:
 *         - name:
 *       properties:
 *         name:
 *           type: string
 *           example: "Jane Doe"
 *         email:
 *           type: string
 *           example: "janedoe@taskapp.com"
 *         password:
 *           type: string
 *           example: "my-super-encrypted-password"
 *
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Personal"
 *         taskIds:
 *           type: array
 *           items:
 *             type: integer,
 *           example: [1, 2, 4]
 *         createdAt:
 *           type: integer
 *           example: 1700000000000
 *         updatedAt:
 *           type: integer
 *           example: 1700000000000
 *
 *     CreateCategoryInput:
 *       type: object
 *       required:
 *         - name:
 *       properties:
 *         name:
 *           type: string
 *           example: "Personal"
 *
 *     ApiResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: integer
 *           example: 201
 *         message:
 *           type: string
 *           example: "Task created successfully"
 *         data:
 *           type: object
 *
 *     ErrorItem:
 *       type: object
 *       properties:
 *         path:
 *           type: string
 *           example: "title"
 *         message:
 *           type: string
 *           example: "title is required"
 *
 *     ValidationErrorResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: "error"
 *         message:
 *           type: string
 *           example: "Validation error"
 *         errors:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ErrorItem'
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: integer
 *           example: 404
 *         message:
 *           type: string
 *           example: "Task not found"
 */
