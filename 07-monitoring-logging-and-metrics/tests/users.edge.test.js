import request from "supertest";
import { setupTestDB } from "./helpers/test-db";
import { app } from "../src";

setupTestDB();

describe("Users - Edge Cases & Error Handling", () => {
  test("fails when creating a user without required fields", async () => {
    const res = await request(app)
      .post("/users")
      .send({
        // Missing name and password
        email: "noname@test.com",
      })
      .expect(400);

    expect(res.body).toHaveProperty("message");
  });

  test("fails when creating user with invalid email", async () => {
    const res = await request(app)
      .post("/users")
      .send({
        name: "Invalid Email User",
        email: "invalid_email",
        password: "secret",
      })
      .expect(400);

    expect(res.body).toHaveProperty("message");
  });

  test("updating with invalid id returns 400", async () => {
    await request(app)
      .put("/users/abc")
      .send({
        name: "Invalid ID",
      })
      .expect(400);
  });

  test("updating a non-existent user returns 404", async () => {
    const res = await request(app)
      .put("/users/1234")
      .send({
        name: "Ghost Update",
      })
      .expect(404);

    expect(res.body).toHaveProperty("message");
  });

  test("deleting a non-existent user returns 404", async () => {
    const res = await request(app).delete("/users/1234").expect(404);

    expect(res.body).toHaveProperty("message");
  });

  test("sending invalid JSON returns 400", async () => {
    const res = await request(app)
      .post("/users")
      .set("Content-Type", "application/json") // forces Express to parse invalid JSON since you've explicitly set the content type to application/json
      .send("This is not json")
      .expect(400);

    expect(res.body).toHaveProperty("message");
  });
});
