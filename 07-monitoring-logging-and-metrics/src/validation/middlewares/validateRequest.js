import { formatJoiError } from "../utils/errorFormatter.js";

// "property" refers to where exactly to look in the request object ("body", "query", or "params")
export const validateRequest = (schema, property = "body") => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Shows all errors, not just the first
      stripUnknown: true, // Removes any extra fields not defined in schema
      convert: true, // Converts types (e.g., "10" -> 10)
      errors: { wrap: { label: false } }, // Cleans error messages
    });

    if (!error) {
      if (property === "query" || property === "params") {
        Object.assign(req[property], value); // Mutates the raw data with the cleaned and validated version
      } else {
        req[property] = value; // Replaces the raw data with the cleaned and validated version
      }

      return next();
    }

    const payload = formatJoiError(error);

    return res.status(400).json(payload);
  };
};
