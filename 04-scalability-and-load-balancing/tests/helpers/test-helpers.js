import prisma from "../../src/prismaClient.js";

// Deletes everything in the database in the right order
export const clearDb = async () => {
  // delete in the right order to avoid relation errors
  await prisma.task.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
};

// Disconnects the database
export const closeDb = async () => {
  await prisma.$disconnect();
};
