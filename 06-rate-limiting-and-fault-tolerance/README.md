# System Design Lab

## 6. Rate Limiting and Fault Tolerance

### Task Management API - Resilient & Safe

This challenge evolves the Task Management API to handle high traffic, handle failures gracefully, and prevent duplicate operations.

The focus is on:

- Rate limiting – preventing resource starvation and API abuse.
- Fault tolerance – handling slow or failing dependencies without crashing.
- Idempotency – making retryable and concurrent operations safe.

This setup ensures your API responds predictably even under stress, and side effects (cache, events) do not block the main request.

### Key improvements & Insights

- **Rate limiting**: Limits expensive write operations and allows higher read throughput.
- **Client feedback**: 429 responses with headers showing remaining quota and reset time.
- **Timeouts**: Avoids long-running requests from blocking the server.
- **Retries & exponential backoff**: Safe retries for transient failures (e.g., Redis).
- **Fallbacks**: API responds even if a dependency is down.
- **Idempotency**: Safely handles retries and concurrent requests without creating duplicates.
- **Asynchronous side-effects**: Cache invalidation and event publishing are done in the background.

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
- **express-rate-limit**: Express middleware for protecting the API against excessive requests by limiting how many requests a client can make within a time window. Used to apply stricter limits to write operations and higher limits to read operations.
- **connect-timeout**: Middleware for enforcing request timeouts, ensuring the server does not wait indefinitely on slow or failing operations. Helps the API fail fast and remain responsive under degraded conditions.

### Rate Limiting

**Purpose:** Prevent API abuse and overloading.

**Implementation:**

- Installed `express-rate-limit`.
- Created `rateLimiter.js` with logic for per-route limits.
- Different limits for read and write operations:

| Method          | Limit    | Window    |
| --------------- | -------- | --------- |
| GET             | Higher   | 3 minutes |
| POST/PUT/DELETE | Stricter | 3 minutes |

- Although both read and write operations share the same time window, write operations have significantly lower request limits because they mutate state and are more expensive to process.

**Client Feedback:**

- When limit is reached: _HTTP 429 Too Many Requests_
- Headers indicate remaining requests and reset time:

```
RateLimit-Limit: 5
RateLimit-Remaining: 0
RateLimit-Reset: 180
```

**Testing:**

```
curl -i http://localhost:3000/tasks
```

- Observe headers for remaining requests and reset time.
- If you exceed limit, you'll get a 429 response.

### Fault Tolerance

**Purpose:** Keep the API operational even if dependencies fail.

**Techniques Used:**

1. **Timeouts**

- Prevents requests from blocking server.
- Tested by simulating slow Redis responses. Client receives 408 Request Timeout.

2. **Retries with Exponential Backoff**

- Here, withRetry utility wraps Redis and other dependency calls:

```
await withRetry(() => redisClient.get(key), { retries: 2, baseDelay: 100 });
```

- Delays increase exponentially: 100ms → 200ms → 400ms.
- Logs confirm retry attempts.

3. **Fallbacks**

- If retries fail, API continues without the cache.
- Ensures Redis failure does not crash the API.

### Idempotency

**Purpose:** Ensure repeated requests do not create duplicates and concurrent requests are safe.

**Scope:**

- POST /tasks → Create task
- PUT /tasks/:taskId → Update task

**How It Works:**

- Client provides Idempotency-Key header.
- Middleware checks Redis:
  - In-progress: Respond 409 "Request already in progress"
  - Completed: Return cached response
- On success: Response cached in Redis with TTL.
- Lock released after request completes → key free for future independent requests.

**Behaviour Example:**
| Request | Outcome |
| ----- | ----- |
| First | Task created, response cached |
| Second (same key) | Cached response returned, no duplicate |
| Concurrent requests | Only one request proceeds; others get 409 |
| Redis unavailable | Returns 503 `"Idempotency service unavailable"` |

### Workflow & Architecture

1. Client hits /tasks.
2. Rate limiter checks quota.
3. Idempotency middleware ensures safe retries/concurrent requests.
4. API validates payload → Prisma creates/updates DB record.
5. Timeouts + retries prevent dependency failures from blocking.
6. Response sent immediately to client.
7. Post-create/update side-effects (cache invalidation, event publishing) run asynchronously.
8. Failures in side-effects are logged but do not affect the main response.

### Step-By-Step Implementation

#### 1. Rate Limiting Setup

```
npm install express-rate-limit
```

Example middleware:

```
import rateLimit from "express-rate-limit";

export const writeLimiter = rateLimit({
  windowMs: 3 * 60 * 1000, // 3 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});
```

Apply per route:

```
router.post("/", writeLimiter, idempotencyMiddleware, createTaskHandler);
```

#### 2. Fault Tolerance Utilities

- Server timeout: server.setTimeout(10000)
- Retry with exponential backoff:

```
await withRetry(() => redisClient.get(key), { retries: 2, baseDelay: 100 });
```

- Fallbacks: Continue without Redis if retries fail.

#### 3. Idempotency Middleware

- Checks for existing key in Redis
- Locks request while processing
- Saves response after completion
- Releases lock to allow future requests

Key Snippet:

```
const key = req.header("Idempotency-Key");
const existing = await redisClient.get(key);

if (existing) {
  /* return cached or in-progress */
}

await redisClient.set(key, JSON.stringify({ status: "in-progress" }), { EX: 300 });
```

### Testing

1. Start API:

```
npm run dev
```

2. Test rate limiting:

```
curl -i http://localhost:3000/tasks
```

- Observe 429 after exceeding limits

3. Test idempotency:

```
curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -H "Idempotency-Key: test-key-001" -d '{
  "title":"Concurrent Task",
  "description":"Race test",
  "status":"pending",
  "userId": 1,
  "categoryId": 1,
  }'
```

- Repeat same request → cached response returned.

4. Simulate dependency failure (Redis down) and observe retries and fallback response.
5. Test concurrent requests with same key → only one request proceeds.

### Observations & Notes

- Write-heavy routes have stricter rate limits while reads are cheaper and get higher limits.
- Fault tolerance ensures API survives dependency failures.
- Idempotency prevents duplicate tasks and makes concurrent or retried requests safe.
- Immediate response ensures client doesn’t wait for side effects (like cache invalidation or event publishing).
- Asynchronous post-processing ensures scalability and separation of concerns.
