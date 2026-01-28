import dotenv from "dotenv";
import { configureQueueTopology } from "../utils/rabbitmq.js";
import { taskCreatedEventSchema } from "../events/taskCreated.event.schema.js";
import prisma from "../prismaClient.js";

dotenv.config();
const QUEUE_NAME = process.env.QUEUE_NAME;

const WORKER_ID = process.env.WORKER_ID || Math.floor(Math.random() * 1000);
console.log(`Worker ${WORKER_ID} started, listening on ${QUEUE_NAME}`);

// Worker startup function
const startWorker = async () => {
  const channel = await configureQueueTopology();

  console.log(`Worker is now listening on queue: ${QUEUE_NAME}`);

  // Consume messages
  channel.consume(
    QUEUE_NAME,
    async (message) => {
      // Anytime there's a message, call this function
      try {
        // Messages are raw bytes, not objects. So, convert bytes to string. Then, convert string to JS object.
        const raw = JSON.parse(message.content.toString());

        // Validate incoming event
        const { error, value } = taskCreatedEventSchema.validate(raw);

        if (error) {
          console.error("Invalid event received:", error.details);

          // Move to DLQ immediately - this isn't retryable
          channel.sendToQueue(process.env.DLQ, message.content);
          return channel.ack(message);
        }

        const data = value;
        const messageId = data?.metadata?.eventId;

        if (!messageId) {
          console.log("Message missing ID, skipping");
          channel.ack(message);

          return;
        }

        // Idempotency check
        const alreadyProcessed = await prisma.processedMessage.findUnique({
          where: { messageId },
        });

        if (alreadyProcessed) {
          console.log(`Message ${messageId} already processed, skipping`);
          channel.ack(message);

          return;
        }

        console.log("Received message:", data);

        // Pretend work is happening here
        await fakeEmailSender(data);

        // Mark as processed
        await prisma.processedMessage.create({
          data: {
            messageId,
            type: data.type,
            processedAt: new Date(),
          },
        });

        channel.ack(message); // Mark as processed
      } catch (error) {
        console.error("Error processing message:", error);

        handleFailure(channel, message);
      }
    },
    { noAck: false }
  );
};

const fakeEmailSender = async (data) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const userId = data?.payload?.userId;

  if (!userId) {
    console.log("No user attached to task.");

    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user) {
    console.log("User not found");

    return;
  }

  if (Math.random() < 0.5) {
    throw new Error("Random failure");
  }

  console.log(`Email sent to ${user.email} for task ${data.payload.title}`);
};

const handleFailure = (channel, message) => {
  const MAX_RETRIES = 3;

  const headers = message.properties.headers || {};
  const retryCount = headers["x-retry-count"] || 0;

  if (retryCount >= MAX_RETRIES) {
    console.log("Moving message to DLQ");

    channel.sendToQueue(process.env.DLQ, message.content);
    channel.ack(message);

    return;
  }

  console.log(`Retry #${retryCount + 1}`);

  channel.sendToQueue(process.env.RETRY_QUEUE, message.content, {
    headers: { "x-retry-count": retryCount + 1 },
    persistent: true,
  });

  channel.ack(message);
};

startWorker();
