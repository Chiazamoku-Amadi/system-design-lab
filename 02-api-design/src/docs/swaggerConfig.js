import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0", // OpenAPI version
    info: {
      title: "Task Management API",
      version: "1.0.0",
      description: "API documentation for the Task Management API",
    },
    servers: [
      {
        url: "http://localhost:3000", // Local dev url
        description: "Local development server",
      },
    ],
  },
  // Where Swagger would find endpoint comments
  apis: ["./src/routes/*.js", "./src/docs/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
