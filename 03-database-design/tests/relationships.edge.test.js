import request from "supertest";
import { app } from "../src";
import prisma from "../src/prismaClient";
import { setupTestDB } from "./helpers/test-db";

setupTestDB();

describe("Relationship Edge Cases (Users, Tasks, Categories", () => {
  let user, category, task;

  beforeEach(async () => {
    user = await prisma.user.create({
      data: {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      },
    });

    category = await prisma.category.create({
      data: {
        name: "Testing",
      },
    });

    task = await prisma.task.create({
      data: {
        title: "Edge Case",
        userId: user.id,
        categoryId: category.id,
      },
    });
  });

  //   USER -> TASK (onDelete: SET NULL)
  test("should set task.userId to null when parent user is deleted", async () => {
    // Delete the user
    await prisma.user.delete({ where: { id: user.id } });

    const updatedTask = await prisma.task.findUnique({
      where: { id: task.id },
    });
    expect(updatedTask.userId).toBeNull();
  });

  //  TASK -> CATEGORY (onDelete: SET NULL)
  test("should set task.categoryId to null when a category is deleted", async () => {
    // Delete the category
    await prisma.category.delete({ where: { id: category.id } });

    const updatedTask = await prisma.task.findUnique({
      where: { id: task.id },
    });
    expect(updatedTask.categoryId).toBeNull();
  });

  //  API-Level Checks (tasks tied to users & categories)
  test("API: Creating a task with invalid userId should fail", async () => {
    const res = await request(app).post("/tasks").send({
      title: "Bad User",
      userId: 1234,
      categoryId: category.id,
    });

    expect(res.status).toBe(400);
  });

  test("API: Creating a task with invalid categoryId should fail", async () => {
    const res = await request(app).post("/tasks").send({
      title: "Bad Category",
      userId: user.id,
      categoryId: 1234,
    });

    expect(res.status).toBe(400);
  });

  test("deleting a user should not delete the task, but unlink it", async () => {
    await prisma.user.delete({ where: { id: user.id } });

    const updatedTask = await prisma.task.findUnique({
      where: { id: task.id },
    });
    expect(updatedTask).not.toBeNull();
    expect(updatedTask.userId).toBeNull();
  });

  test("deleting a category should not delete the task, but unlink it", async () => {
    await prisma.category.delete({ where: { id: category.id } });

    const updatedTask = await prisma.task.findUnique({
      where: { id: task.id },
    });
    expect(updatedTask).not.toBeNull();
    expect(updatedTask.categoryId).toBeNull();
  });
});
