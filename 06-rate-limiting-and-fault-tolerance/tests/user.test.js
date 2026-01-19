import request from "supertest";
import { setupTestDB } from "./helpers/test-db";
import { app } from "../src/index.js";
import prisma from "../src/prismaClient.js";

// Hook up the DB lifecycle
setupTestDB();

describe("Users CRUD", () => {
  test("can create a user", async () => {
    // Create User
    const userRes = await request(app)
      .post("/users")
      .send({
        name: "Beth",
        email: "beth@test.com",
        password: "secret123",
      })
      .expect(201);

    // Check user's name in response
    expect(userRes.body.data.name).toBe("Beth");

    // Check database directly
    const dbUser = await prisma.user.findUnique({
      where: { id: userRes.body.data.id },
    });

    expect(dbUser).not.toBeNull();
  });

  test("can update and delete a user", async () => {
    // Create User
    const user = await prisma.user.create({
      data: {
        name: "Danny",
        email: "danny@test.com",
        password: "secretpassword123",
      },
    });

    // Update User
    const updateRes = await request(app)
      .put(`/users/${user.id}`)
      .send({
        name: "Daniel",
      })
      .expect(200);

    expect(updateRes.body.data.name).toBe("Daniel");

    // Delete User
    await request(app).delete(`/users/${user.id}`).expect(200);

    // Check database directly
    const deleted = await prisma.user.findUnique({
      where: { id: user.id },
    });
    expect(deleted).toBeNull();
  });
});
