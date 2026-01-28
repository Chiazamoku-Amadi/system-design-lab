import Joi from "joi";

export const taskCreatedEventSchema = Joi.object({
  type: Joi.string().valid("task.created").required(),

  payload: Joi.object({
    id: Joi.number().integer().required(),
    title: Joi.string().min(1).max(200).required(),
    description: Joi.string().allow("").max(1000).optional(),
    userId: Joi.number().integer().required(),
    categoryId: Joi.number().integer().allow(null),
    status: Joi.string()
      .valid("pending", "in-progress", "completed")
      .required(),
  }).required(),

  metadata: Joi.object({
    eventId: Joi.string().uuid().required(),
    timestamp: Joi.date().iso().required(),
    source: Joi.string().required(),
  }).required(),
});
