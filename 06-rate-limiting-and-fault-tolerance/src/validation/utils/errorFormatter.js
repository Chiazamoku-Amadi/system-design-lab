export const formatJoiError = (err) => {
  if (!err || !err.details) return { message: "Validation error", errors: [] };

  const errors = err.details.map((detail) => ({
    path: detail.path.join("."),
    message: detail.message.replace(/["]/g, ""), // .replace(/["]/g, "") - find all '"' characters and replace them with empty strings
  }));

  return {
    status: "error",
    message: "Validation error",
    errors,
  };
};
