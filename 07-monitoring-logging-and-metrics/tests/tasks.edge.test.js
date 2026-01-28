import request from "supertest";
import { app } from "../src";
import { setupTestDB } from "./helpers/test-db";
import prisma from "../src/prismaClient";

setupTestDB();

describe("Tasks - Edge Cases & Error Handling", () => {
  test("fails when creating a task without required fields", async () => {
    const res = await request(app)
      .post("/tasks")
      .send({
        // Missing title, userId, categoryId
        description: "No title task",
        status: "pending",
      })
      .expect(400);

    expect(res.body).toHaveProperty("message");
  });

  test("fails when creating a task with invalid status", async () => {
    // Create user
    const user = await prisma.user.create({
      data: {
        name: "Zoe",
        email: "zoe@test.com",
        password: "secret",
      },
    });

    // Create category
    const category = await prisma.category.create({
      data: { name: "Err Category" },
    });

    const res = await request(app)
      .post("/tasks")
      .send({
        title: "Bad Status",
        description: "Invalid status",
        status: "unknow-status",
        userId: user.id,
        categoryId: category.id,
      })
      .expect(400);

    expect(res.body).toHaveProperty("message");
  });

  test("fails when userId is not a valid id", async () => {
    const category = await prisma.category.create({
      data: { name: "BadIdCat" },
    });

    const res = await request(app)
      .post("/tasks")
      .send({
        title: "Invalid ID",
        description: "Bad userId format",
        status: "pending",
        userId: "8.2", // Floating point number
        categoryId: category.id,
      })
      .expect(400);

    expect(res.body).toHaveProperty("message");
  });

  test("updating with invalid id returns 400", async () => {
    await request(app)
      .put("/tasks/abc")
      .send({ title: "Invalid ID" })
      .expect(400);
  });

  test("updating a non-existent task returns 404", async () => {
    const res = await request(app)
      .put(`/tasks/1234`)
      .send({ title: "Ghost Update" })
      .expect(404);

    expect(res.body).toHaveProperty("message");
  });

  test("deleting a non-existent task returns 404", async () => {
    const res = await request(app).delete(`/tasks/1234`).expect(404);

    expect(res.body).toHaveProperty("message");
  });

  test("sending invalid JSON returns 400", async () => {
    const res = await request(app)
      .post("/tasks")
      .set("Content-Type", "application/json") // forces Express to parse invalid JSON since you've explicitly set the content type to application/json
      .send("This is not JSON")
      .expect(400);

    expect(res.body).toHaveProperty("message");
  });
});
