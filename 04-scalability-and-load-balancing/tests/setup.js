import dotenv from "dotenv";

// Ensure tests use the test database and that Jest loads env variables before the app files import Prisma
dotenv.config({ path: ".env.test" });
