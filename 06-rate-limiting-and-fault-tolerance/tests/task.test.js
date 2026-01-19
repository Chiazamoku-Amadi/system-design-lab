import request from "supertest";
import prisma from "../src/prismaClient.js"; // To query the DB directly
import { app } from "../src/index.js";
import { setupTestDB } from "./helpers/test-db.js";

// Hook up the DB lifecycle
setupTestDB();

// Group of tests for Tasks
describe("Tasks CRUD", () => {
  test("can create a task", async () => {
    // Create a user (needed because tasks belong to a user)
    const userRes = await request(app)
      .post("/users")
      .send({
        name: "Jane",
        email: "jane@test.com",
        password: "secret123",
      })
      .expect(201); // expect HTTP 201 Created

    const userId = userRes.body.data.id;

    // Create a category
    const catRes = await request(app)
      .post("/categories")
      .send({
        name: "Work",
      })
      .expect(201);

    const categoryId = catRes.body.data.id;

    // Create a task
    const taskRes = await request(app)
      .post("/tasks")
      .send({
        title: "Test Task",
        description: "Test task description",
        status: "pending",
        userId,
        categoryId,
      })
      .expect(201);

    // Check task title in response
    expect(taskRes.body.data.title).toBe("Test Task");

    // Check database directly
    const dbTask = await prisma.task.findUnique({
      where: { id: taskRes.body.data.id },
      include: { user: true, category: true },
    });

    expect(dbTask).not.toBeNull();
    expect(dbTask.user.id).toBe(userId);
    expect(dbTask.category.id).toBe(categoryId);
  });

  test("can update and delete a task", async () => {
    // Create user
    const user = await prisma.user.create({
      data: { name: "UpUser", email: "up@test.com", password: "pw" },
    });

    // Create a category
    const category = await prisma.category.create({
      data: { name: "Work" },
    });

    // Create task
    const task = await prisma.task.create({
      data: {
        title: "Old Title",
        description: "Task description",
        userId: user.id,
        categoryId: category.id,
      },
    });

    // Update task
    const updateRes = await request(app)
      .put(`/tasks/${task.id}`)
      .send({ title: "New Title" })
      .expect(200);

    expect(updateRes.body.data.title).toBe("New Title");

    // Delete task
    await request(app).delete(`/tasks/${task.id}`).expect(200);

    // Check database directly
    const deleted = await prisma.task.findUnique({ where: { id: task.id } });
    expect(deleted).toBeNull();
  });
});
