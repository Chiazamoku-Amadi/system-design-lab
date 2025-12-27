import request from "supertest";
import { app } from "../src";
import { setupTestDB } from "./helpers/test-db";

setupTestDB();

describe("Users - Security/Response Shape", () => {
  test("password should never be returned in user creation response", async () => {
    const userData = {
      name: "Safe User",
      email: "safe@test.com",
      password: "supersecret",
    };

    const res = await request(app).post("/users").send(userData);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("data");

    const returnedUser = res.body.data;
    expect(returnedUser).not.toHaveProperty("password");
    expect(returnedUser).toHaveProperty("id");
    expect(returnedUser).toHaveProperty("name");
    expect(returnedUser).toHaveProperty("email");
  });

  test("response shape for errors follows {message} format", async () => {
    const res = await request(app)
      .post("/users")
      .send({ email: "no-name@test.com" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
    expect(typeof res.body.message).toBe("string");
  });
});
