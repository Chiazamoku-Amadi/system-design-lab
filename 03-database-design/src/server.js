import { app } from "./index.js";

app.listen(3000, () => {
  console.log("Server listening on port 3000");
  console.log("Swagger docs available at http://localhost:3000/api-docs");
});
