import request from "supertest";
import { app } from "../src";
import { setupTestDB } from "./helpers/test-db";
import prisma from "../src/prismaClient";

setupTestDB();

describe("Integration: Users, Categories, Tasks", () => {
  let user, category, task;

  beforeEach(async () => {
    await prisma.task.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.category.deleteMany({});

    const userRes = await request(app).post("/users").send({
      name: "User",
      email: "user@test.com",
      password: "secret",
    });
    user = userRes.body.data;

    const categoryRes = await request(app).post("/categories").send({
      name: "Testing",
    });
    category = categoryRes.body.data;

    const taskRes = await request(app).post("/tasks").send({
      title: "Initial Task",
      description: "Start point",
      userId: user.id,
      categoryId: category.id,
    });
    task = taskRes.body.data;
  });

  test("should create a user, category, task, and retrieve them correctly", async () => {
    await prisma.task.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.category.deleteMany({});

    // Create User
    const newUserRes = await request(app).post("/users").send({
      name: "Test Flow User",
      email: "user@test.com",
      password: "supersecret",
    });

    expect(newUserRes.status).toBe(201);
    const newUser = newUserRes.body.data;

    // Create Category
    const newCategoryRes = await request(app)
      .post("/categories")
      .send({ name: "Deep Work" });

    expect(newCategoryRes.status).toBe(201);
    const newCategory = newCategoryRes.body.data;

    // Create Task
    const newTaskRes = await request(app).post("/tasks").send({
      title: "Integration",
      userId: newUser.id,
      categoryId: newCategory.id,
    });

    expect(newTaskRes.status).toBe(201);
    const task = newTaskRes.body.data;

    // GET task -> embedded user & category
    const taskFetch = await request(app).get(`/tasks/${task.id}`);

    expect(taskFetch.status).toBe(200);
    expect(taskFetch.body.data.userId).toBe(newUser.id);
    expect(taskFetch.body.data.categoryId).toBe(newCategory.id);
  });

  test("should update task fields successfully", async () => {
    const res = await request(app).put(`/tasks/${task.id}`).send({
      title: "Updated Title",
      description: "Updated Description",
      status: "completed",
    });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Updated Title");
    expect(res.body.data.description).toBe("Updated Description");
    expect(res.body.data.status).toBe("completed");
  });

  test("deleting a user should set task.userId to null", async () => {
    await prisma.user.delete({ where: { id: user.id } });

    const updatedTask = await prisma.task.findUnique({
      where: { id: task.id },
    });

    expect(updatedTask.userId).toBeNull();
  });

  test("deleting a category should set task.categoryId to null", async () => {
    await prisma.category.delete({ where: { id: category.id } });

    const updatedTask = await prisma.task.findUnique({
      where: { id: task.id },
    });

    expect(updatedTask.categoryId).toBeNull();
  });

  test("should filter, sort, and paginate tasks", async () => {
    const tasksData = [
      {
        title: "Task 1",
        description: "A",
        userId: user.id,
        categoryId: category.id,
      },
      {
        title: "Task 2",
        description: "B",
        userId: user.id,
        categoryId: category.id,
      },
      {
        title: "Task 3",
        description: "C",
        userId: user.id,
        categoryId: category.id,
      },
    ];

    for (const task of tasksData) await request(app).post("/tasks").send(task);

    // Filter
    let res = await request(app).get("/tasks").query({ search: "2" });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe("Task 2");

    // Page 1
    res = await request(app).get("/tasks").query({
      page: 1,
      limit: 2,
      sort: "asc",
    });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.total).toBe(4); // 1 initial + 3 added

    // Page 2
    res = await request(app).get("/tasks").query({
      page: 2,
      limit: 2,
      sort: "asc",
    });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);

    // Descending order
    res = await request(app).get("/tasks").query({ sort: "desc" });

    expect(res.status).toBe(200);
    expect(res.body.data[0].title).toBe("Task 3");
  });
});
