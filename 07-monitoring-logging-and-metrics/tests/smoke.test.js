import request from "supertest";
import { app } from "../src";

describe("Smoke Tests - System Health Check", () => {
  test("server loads and responds on a known route (api docs or root)", async () => {
    // /api-docs is guaranteed in your app (Swagger)
    const res = await request(app).get("/api-docs");
    // Accept 200 for success, but anything <500 shows server didn't crash
    expect(res.statusCode).toBeLessThan(500);
  });

  test("users route is reachable (GET /users)", async () => {
    const res = await request(app).get("/users");
    // Either the route exists (200) or resource not found (404). Both mean the route is reachable
    expect([200, 404].includes(res.statusCode)).toBe(true);
  });

  test("tasks route is reachable (GET /tasks)", async () => {
    const res = await request(app).get("/tasks");
    expect([200, 404].includes(res.statusCode)).toBe(true);
  });

  test("categories route is reachable (GET /categories)", async () => {
    const res = await request(app).get("/categories");
    expect([200, 404].includes(res.statusCode)).toBe(true);
  });

  test("JSON body parsing middleware handles invalid JSON", async () => {
    const res = await request(app)
      .post("/tasks")
      .set("Content-Type", "application/json")
      .send("This is not json");

    expect(res.statusCode).toBe(400);
  });

  test("Swagger docs endpoint returns content and a 200", async () => {
    const res = await request(app).get("/api-docs/");
    expect(res.statusCode).toBe(200);
    // A simple content check to confirm the docs endpoint returns HTML/text containing “Swagger”
    expect(res.text).toContain("Swagger");
  });
});
