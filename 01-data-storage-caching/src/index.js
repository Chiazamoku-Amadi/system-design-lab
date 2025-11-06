import express from "express";
import routes from "./routes/index.js";

const app = express();

app.use("/messages", routes);

app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
