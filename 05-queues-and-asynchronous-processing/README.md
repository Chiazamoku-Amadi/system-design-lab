# System Design Lab

## 5. Queues and Asynchronous Processing

### Task Management API - Level Up

With this challenge, the Task Management API evolves from a synchronous, request-driven system into one capable of asynchronous, decoupled processing.

Instead of every task creation, update, or deletion happening in real time on the main request thread, certain operations are now delegated to background workers via a message queue.

This is a huge step toward resilient, scalable, and distributed system design.

### Key improvements & Insights

- Message queues: RabbitMQ is integrated to handle events asynchronously.
- Producers & consumers: API produces events; workers consume and process them independently.
- Retry logic & dead-letter queues: Transient failures are retried automatically; poisoned messages are isolated.
- Idempotent consumers: Even if a message is delivered multiple times, processing only happens once.
- Horizontal worker scaling: Multiple workers can consume from the same queue, dynamically balancing load.

In summary, tasks are no longer blocking, workers can fail and retry safely, and the system thinks in events, not just requests.

### Technologies & Tools

- **Node.js**: JavaScript runtime environment.
- **Express.js**: Web framework for Node.js. For routing, middleware handling, and HTTP utilities.
- **Prisma ORM**: For database modeling, migrations, and type-safe queries.
- **PostgreSQL**: Relational database used for storing users, tasks, and categories.
- **RabbitMQ (amqplib)**: Message broker for asynchronous processing
- **node-cron**: TTL cleanup for processed messages.
- **Docker**: RabbitMQ containerized for easy setup.
- **Redis**: Caching layer for high-read endpoints.
- **NGINX**: Load balancer distributing traffic across API instances.
- **Joi**: Schema-based validation for requests.
- **Swagger JSDoc**: For generating the OpenAPI (Swagger) documentation automatically from the JSDoc comments in the code.
- **Swagger UI Express**: For displaying the generated documentation in an interactive web interface where the API endpoints can be viewed and tested.
- **hey**: Load testing tool to simulate concurrent traffic.

### Workflow & Architecture

1. API creates a task → stores in PostgreSQL
2. API produces an event → sends a message to RabbitMQ
3. Worker listens → consumes messages asynchronously
4. Worker performs side work → sends notification emails, logs, etc.
5. Retries / DLQ → failed processing goes through retry cycle; persistent failures land in Dead-Letter Queue
6. Idempotency check → Prisma table ensures the same message isn’t processed twice
7. Horizontal scaling → multiple workers can pick up messages; load is balanced automatically

This pattern decouples the system and sets the foundation for large-scale distributed architectures.

### Step-By-Step Implementation

#### 1. RabbitMQ Setup

```
docker run -d --hostname my-queue --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

- 5672 → messaging port
- 15672 → management UI (http://localhost:15672)
- Login: guest / guest

Check queues, exchanges, and message flow via the UI.

#### 2. Configure Queue in Node.js

- Install amqplib:

```
npm install amqplib
```

- `.env` configuration:

```
RABBITMQ_URL=amqp://localhost:5672
QUEUE_NAME=task_events
RETRY_QUEUE=task_events.retry
DLQ=task_events.dlq
```

- `src/utils/rabbitmq.js` contains connection helper & producer logic.

#### 3. Produce Events in API

- Task controller now produces events after DB operations:

```
await sendMessageToQueue('task_events', {
  type: 'TASK_CREATED',
  payload: { id: task.id, title: task.title, userId: task.userId },
  metadata: { eventId: uuid(), timestamp: new Date().toISOString() }
});
```

- API response is non-blocking; the work is offloaded.

#### 4. Worker Implementation

- Write your worker logic in `src/workers/notificationWorker.js`
- Retry & Dead-Letter logic ensures resilience.
- Idempotency prevents duplicate side effects.

#### 5. Testing

1. Start RabbitMQ:

```
docker start rabbitmq
```

2. Start worker:

```
node src/workers/notificationWorker.js
```

3. Start API server.

4. Create tasks with curl:

```
curl -X POST "http://localhost:3000/tasks" \
  -H "Content-Type: application/json" \
  -d '{ "title": "Write Docs", "description": "Testing async", "status": "in-progress", "userId": 1 }'
```

5. Observe worker logs:

```
Received message: {...}
Email sent to ...
```

6. Simulate failures → verify retry + DLQ flow.

7. Test multiple workers → see load balancing between workers.

### Observations & Notes

- Retry cycle example:

| Attempt  | Worker       |
| -------- | ------------ |
| Original | 1            |
| Retry 1  | 3            |
| Retry 2  | 1            |
| Retry 3  | 2 ✅ Success |

- TTL logic on `processedMessages` prevents the table from growing indefinitely.
- Event schema validation ensures only valid messages are processed.
- Horizontal scaling makes workers interchangeable; any worker can process retries.
