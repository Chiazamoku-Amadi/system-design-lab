import prisma from "../prismaClient.js";
import cron from "node-cron";

const DAYS = 30;

const cleanup = async () => {
  const cutoff = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);

  const result = await prisma.processedMessage.deleteMany({
    where: {
      processedAt: {
        lt: cutoff,
      },
    },
  });

  console.log(`Deleted ${result.count} old processed messages`);
};

cron.schedule("0 3 * * *", cleanup, {
  timezone: "UTC",
});

console.log("Cleanup job scheduled for 03:00 UTC daily");
