export const errorHandler = (err, req, res, next) => {
  console.error("Error caught by middleware:", err);

  const statusCode = err.statusCode || 500;
  const message = err.isOperational
    ? err.message
    : "Something went wrong on the server.";

  res.status(statusCode).json({
    status: statusCode,
    message,
  });
};
