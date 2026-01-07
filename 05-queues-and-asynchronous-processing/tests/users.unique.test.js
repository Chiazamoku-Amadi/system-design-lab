import request from "supertest";
import { app } from "../src";
import prisma from "../src/prismaClient";
import { setupTestDB } from "./helpers/test-db";

setupTestDB();

describe("Users - Unique Constraints/Concurrency", () => {
  test("should prevent creating users with duplicate email", async () => {
    const userData = {
      name: "Unique User",
      email: "unique@test.com",
      password: "secret123",
    };

    // First creation should succeed
    const res1 = await request(app).post("/users").send(userData);
    expect(res1.status).toBe(201);

    // Second creation should fail
    const res2 = await request(app).post("/users").send(userData);
    // Duplicate email errors can surface from two layers:
    // - Joi/request validation → 400 (Bad Request)
    // - Prisma unique constraint → 409 (Conflict)
    // Either outcome is correct, so we allow both
    expect([400, 409]).toContain(res2.status);
    expect(res2.body).toHaveProperty("message");

    // DB should only have 1 record
    const users = await prisma.user.findMany({
      where: { email: userData.email },
    });
    expect(users.length).toBe(1);
  });
});
