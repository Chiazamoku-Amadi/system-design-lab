import request from "supertest";
import { app } from "../src";
import { setupTestDB } from "./helpers/test-db";
import prisma from "../src/prismaClient";

setupTestDB();

describe("Category CRUD", () => {
  test("can create category", async () => {
    // Create a category
    const catRes = await request(app)
      .post("/categories")
      .send({
        name: "Personal",
      })
      .expect(201);

    // Check category name in response
    expect(catRes.body.data.name).toBe("Personal");

    // Check database directly
    const dbCategory = await prisma.category.findUnique({
      where: { id: catRes.body.data.id },
    });

    expect(dbCategory).not.toBeNull;
  });

  test("can update and delete a category", async () => {
    // Create category
    const category = await prisma.category.create({
      data: {
        name: "Work",
      },
    });

    // Update category
    const updateRes = await request(app)
      .put(`/categories/${category.id}`)
      .send({ name: "Miscellaneous" })
      .expect(200);

    expect(updateRes.body.data.name).toBe("Miscellaneous");

    // Delete category
    await request(app).delete(`/categories/${category.id}`).expect(200);

    // Check database directly
    const deleted = await prisma.category.findUnique({
      where: { id: category.id },
    });
    expect(deleted).toBeNull();
  });
});
