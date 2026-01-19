import request from "supertest";
import { setupTestDB } from "./helpers/test-db";
import { app } from "../src";

setupTestDB();

describe("Categories - Edge Cases & Error Handling", () => {
  test("fails when creating a category without required fields", async () => {
    const res = await request(app)
      .post("/categories")
      .send({
        // Missing name
      })
      .expect(400);

    expect(res.body).toHaveProperty("message");
  });

  test("updating with invalid id returns 400", async () => {
    await request(app)
      .put("/categories/abc")
      .send({
        name: "Invalid ID",
      })
      .expect(400);
  });

  test("updating a non-existent category returns 404", async () => {
    const res = await request(app)
      .put("/categories/1234")
      .send({
        name: "Ghost Update",
      })
      .expect(404);

    expect(res.body).toHaveProperty("message");
  });

  test("deleting a non-existent category returns 404", async () => {
    const res = await request(app).delete("/categories/1234").expect(404);

    expect(res.body).toHaveProperty("message");
  });

  test("sending invalid JSON returns 400", async () => {
    const res = await request(app)
      .post("/categories")
      .set("Content-Type", "application/json") // forces Express to parse invalid JSON since you've explicitly set the content type to application/json
      .send("This is not json")
      .expect(400);

    expect(res.body).toHaveProperty("message");
  });
});
