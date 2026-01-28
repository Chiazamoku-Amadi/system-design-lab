import Joi from "joi";

// Create user schema
export const createUserSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

// Update user schema
export const updateUserSchema = Joi.object({
  name: Joi.string(),
  email: Joi.string().email(),
})
  .min(1)
  .messages({
    "object.min": "At least one field should be provided.",
  });

// Params schema for :userId
export const userIdSchema = Joi.object({
  userId: Joi.number().integer().required(),
});
