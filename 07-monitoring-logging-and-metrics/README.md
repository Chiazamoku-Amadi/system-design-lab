# System Design Lab

## 7. Monitoring, Metrics & Logging

### Task Management API - Observable & Debbugable

This challenge evolves the Task Management API to make failures visible, performance measurable, and behaviour explainable in production.

The focus is on observability, that is, understanding what your system is doing internally based on the signals it emits.

Everything built here exists to answer one core question:  
_“If something goes wrong at 2am, can I figure out what happened without guessing?”_

**Core Concepts**

Observability is built on three distinct layers:

- Logs describe individual events and explain why something happened.
- Metrics measure system behavior over time: how often and how much.
- Monitoring evaluates metrics against expectations to decide if the system is healthy.

Together, they allow teams to detect issues, assess impact, and perform root-cause analysis without guesswork.

### Key improvements & Insights

- Structured logging replaces `console.log`
- Every request is logged with context and traceability.
- Latency, errors, and rate-limit hits are measured.
- Failures are visible without touching business logic.
- No stack traces leak to clients.
- One error = one log = one metric increment.

This ensures the API can be debugged, monitored, and trusted under real-world conditions.

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
- **Pino**: High-performance structured JSON logger.
- **pino-http**: HTTP request logging middleware.

### Structured Logging

**Purpose**  
Make logs machine-readable, searchable, and useful in production systems.

**Implementation**

- Introduced Pino as the primary logger.
- Logs are emitted in JSON format.
- Each request gets a unique requestId.
- Logs include:
  - HTTP method
  - Path
  - Status code
  - Response time
  - Error context (if any)

**Installation**

```
npm install pino pino-http uuid
```

**Logging Flow**

1. Request logger middleware logs every incoming request.
2. Request context (requestId, timing) is attached to req.
3. Global error handler logs errors once with full context.
4. Clients receive clean error responses without stack traces.

### Metrics Collection

**Purpose**  
Quantify system health and performance over time.

**Metrics Tracked**

- `requestCount` → Total requests processed
- `errorCount` → Total application errors
- `averageLatencyMs` → Average request latency
- `rateLimitHits` → Number of rejected requests

**Instrumentation Points**

- **Requests**: Increment request count and track latency.
- **Errors**: Increment error count in the global error handler.
- **Rate limits**: Increment rate-limit hits when requests are blocked.

**Metrics Endpoint**
Metrics are exposed via:

```
GET /metrics
```

Example response:

```
{
  "requestCount": 19,
  "errorCount": 0,
  "averageLatencyMs": 77,
  "rateLimitHits": 5
}
```

### Monitoring View (Interpretation)

Metrics are designed to be interpretable, not just collected.

There's no need for dashboards yet since the `/metrics` endpoint already answers key questions:

- Is traffic increasing?
- Are errors happening?
- Is the system slowing down?
- Are rate limits being hit?

### Failure Visibility Scenarios

**1. Rate Limit Rejection**  
**Goal**  
Prove that:

- Rate limits are enforced
- Rejections are visible in metrics
- Logs capture context

**Steps**  
i. Hit a rate-limited endpoint repeatedly:

```
for i in {1..10}; do curl -i http://localhost:3000/tasks; done
```

ii. Check metrics:

```
curl http://localhost:3000/metrics
```

**Result:**

```
{
  "requestCount": 19,
  "errorCount": 0,
  "averageLatencyMs": 77,
  "rateLimitHits": 5
}
```

✔️ Rate limiting works  
✔️ Rejections are measurable  
✔️ No need to inspect application code

**2. Forced Application Error**  
**Goal**  
Prove that:

- Errors are logged once
- Error metrics increment once
- No stack traces leak to clients

**Setup**  
i. Temporary failure route:

```
router.get("/force-error", (req, res) => {
  throw new Error("Intentional test failure");
});
```

ii. Trigger error:

```
curl http://localhost:3000/tasks/force-error
```

**Results:**

- One error log emitted
- One error metric incremented
- Client receives a clean error response

✔️ No duplicate logs  
✔️ No cascading failures  
✔️ Production-safe error handling

**3. Slow Request (Latency Spike)**  
**Goal**  
Prove that:

- Latency is measured
- Performance degradation is visible
- Logs are not required to detect slowness

**Setup**  
i. Add artificial delay:

```
await new Promise((resolve) => setTimeout(resolve, 600));
```

ii. Make several requests, then check metrics:

```
curl http://localhost:3000/metrics
```

**Result:**

```
{
  "requestCount": 5,
  "errorCount": 0,
  "averageLatencyMs": 676,
  "rateLimitHits": 0
}
```

✔️ Latency spike is immediately visible  
✔️ No debugging required  
✔️ Metrics surface performance issues early

### Workflow & Architecture

1. Client sends request.
2. Request logger starts timing and logs metadata.
3. Metrics counters are updated.
4. Business logic executes.
5. Errors (if any) are logged and counted once.
6. Response is sent to the client.
7. Metrics reflect system behavior in real time.

### Observations & Notes

- Logs explain why something happened.
- Metrics explain how bad it is.
- Monitoring answers whether this is acceptable.
- No business logic was changed.
- No debug prints were added.
- No local reproduction was required.
