export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (req.timedout) {
    return res.status(408).json({
      error: "Request timeout",
    });
  }

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
