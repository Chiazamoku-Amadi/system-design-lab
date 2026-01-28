import amqplib from "amqplib";

let connection = null;
let channel = null;

// Connect to RabbitMQ and return the channel
export const createRabbitConnection = async () => {
  if (channel) return channel;

  try {
    connection = await amqplib.connect(process.env.RABBITMQ_URL); // Connect to the RabbitMQ server
    channel = await connection.createChannel(); // Create a channel

    console.log("Connected to RabbitMQ");

    return channel;
  } catch (error) {
    console.error("RabbitMQ connection failed:", error);

    throw error;
  }
};

// Send a message into RabbitMQ
export const sendMessageToQueue = async (queueName, message) => {
  const channel = await createRabbitConnection();

  channel.sendToQueue(
    queueName,
    Buffer.from(JSON.stringify(message)), // RabbitMQ sends bytes, not objects. So, convert JS object to string. Then, convert string to bytes.
    {
      persistent: true, // Stores the message on disk
    }
  );
};

export const configureQueueTopology = async () => {
  const channel = await createRabbitConnection();

  const MAIN = process.env.QUEUE_NAME;
  const RETRY = process.env.RETRY_QUEUE;
  const DLQ = process.env.DLQ;

  await channel.assertQueue(DLQ, { durable: true });

  await channel.assertQueue(RETRY, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": "",
      "x-dead-letter-routing-key": MAIN,
      "x-message-ttl": 5000, // retry after 5 seconds
    },
  });

  await channel.assertQueue(MAIN, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": "",
      "x-dead-letter-routing-key": RETRY,
    },
  });

  return channel;
};
