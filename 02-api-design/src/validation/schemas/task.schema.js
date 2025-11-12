import Joi from "joi";

const statusEnum = ["pending", "in-progress", "completed"];

// Reuseable schemas
export const id = Joi.string().required();
export const pagination = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(10).max(20).default(10),
};

// Create task Schema
export const createTaskSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().allow("").max(1000).optional(),
  status: Joi.string()
    .valid(...statusEnum)
    .default("pending"),
});

// Update task schema
export const updateTaskSchema = Joi.object({
  title: Joi.string().min(1).max(200),
  description: Joi.string().allow("").max(1000),
  status: Joi.string().valid(...statusEnum),
})
  .min(1) // Require at least one field when updating
  .messages({
    "object.min":
      "At least one of title, description, or status must be provided",
  });

// Params schema for :taskId
export const taskIdSchema = Joi.object({
  taskId: id,
});

// Query schema for GET /tasks (filter/sort/pagination)
export const taskQuerySchema = Joi.object({
  status: Joi.string().valid(...statusEnum),
  sort: Joi.string().valid("asc", "desc").insensitive().default("desc"),
  page: pagination.page,
  limit: pagination.limit,
});
