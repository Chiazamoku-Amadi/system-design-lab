import { afterAll, beforeAll, beforeEach } from "@jest/globals";
import prisma from "../../src/prismaClient";
import { clearDb, closeDb } from "./test-helpers";

export const setupTestDB = () => {
  beforeAll(async () => {
    await prisma.$connect();
    await clearDb(); // clean tables before the entire suite starts
  });

  beforeEach(async () => {
    await clearDb(); // isolate tests
  });

  afterAll(async () => {
    await clearDb(); // final cleanup
    await closeDb(); // disconnect prisma
  });
};
