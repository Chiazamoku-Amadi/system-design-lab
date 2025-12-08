import Joi from "joi";

// Create category schema
export const createCategorySchema = Joi.object({
  name: Joi.string().required(),
});

// Update category schema
export const updateCategorySchema = Joi.object({
  name: Joi.string(),
})
  .min(1)
  .messages({
    "object.min": "At least one field should be provided.",
  });

// Params schema for :categoryId
export const categoryIdSchema = Joi.object({
  categoryId: Joi.number().integer().required(),
});
