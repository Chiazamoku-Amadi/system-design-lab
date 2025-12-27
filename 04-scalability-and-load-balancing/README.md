# System Design Lab

## 4. Scalability & Load Balancing

### Task Management API

This challenge takes the database-backed Task Management API from Week 3 and scales it. The API itself stays the same, but the infrastructure evolves into something production-minded and resilient.

Here, I explored how real systems handle traffic when users multiply. Instead of one lonely server doing all the work, multiple API instances run side-by-side, with a load balancer orchestrating the flow. Redis joins the architecture as a high-speed memory layer, helping offload read-heavy traffic from PostgreSQL. And the app becomes fully stateless — meaning any server can answer any request at any time.

This is where the system stops being a project and starts becoming an ecosystem.

### Key improvements:

- Horizontal scaling: multiple API instances running on different ports.
- NGINX load balancing: requests distributed evenly in round-robin style
- Redis caching: GET `/tasks` is cached to reduce database pressure
- Stateless API design: all persistent and ephemeral state lives in PostgreSQL and Redis.

Every instance becomes interchangeable. No server “remembers.”

### Technologies & Tools

- **Node.js**: JavaScript runtime environment.
- **Express.js**: Web framework for Node.js. For routing, middleware handling, and HTTP utilities.
- **Prisma ORM**: For database modeling, migrations, and type-safe queries.
- **PostgreSQL**: Relational database used for storing users, tasks, and categories.
- **Redis**: Caching layer for high-read endpoints.
- **NGINX**: Load balancer distributing traffic across API instances.
- **Joi**: Schema-based validation for requests.
- **Swagger JSDoc**: For generating the OpenAPI (Swagger) documentation automatically from the JSDoc comments in the code.
- **Swagger UI Express**: For displaying the generated documentation in an interactive web interface where the API endpoints can be viewed and tested.
- **hey**: Load testing tool to simulate concurrent traffic.

### Horizontal Scaling & Load Balancing

Multiple instances of the API run on separate ports:
| Instance | Port |
| ----- | ----- |
| API #1 | 3000 |
| API #2 | 3001 |
| API #3 | 3002 |
| API #4 | 3003 |

NGINX acts as the traffic conductor, listening on port 8080 and distributing requests to backend servers in round-robin fashion:

```
events {}

http {
  upstream task_api {
    server localhost:3001;
    server localhost:3002;
    server localhost:3003;
  }

  server {
    listen 8080;

    location / {
      proxy_pass http://task_api;
      proxy_set_header Host $host;
      proxy_set_header X-Forwarded-For $remote_addr;
    }
  }
}
```

#### Notes

- Requests are evenly distributed across multiple API instances.
- Logs in each instance confirm requests are being handled by different ports.

### Traffic Simulation: Single Instance vs Load Balanced

Using hey, I simulated traffic with:

```
200 requests
20 concurrent users
```

From the report summaries, histograms, and percentile distributions, I observed:

- The server handled requests quickly for most users
- But a small latency tail appeared, a reminder that scaling is about the outliers, not the average
- All requests returned 200 OK, confirming reliability

This helped set the stage for load balancing.

### Load Balancing with NGINX

After configuring NGINX to distribute requests to multiple API instances, I repeated load testing.

#### Outcome

- Throughput changed
- Average latency shifted
- The database became the bottleneck — not the API. This was the biggest insight

Because:

- Multiple app servers → more parallel DB calls
- NGINX fans traffic out
- PostgreSQL absorbs the pressure
- Response wait time rises

What I learned:

- Scaling APIs doesn’t magically scale databases.
- Load balancers add overhead.
- Real scaling means designing the whole system, not just the server.

### Redis Caching — Before vs After

To reduce DB strain, I identified `/tasks` as a high-read endpoint and layered Redis on top.

Then I tested performance using:

```
hey -n 500 -c 50 http://localhost:3000/tasks
```

#### Run #1 (Cold Cache)

- Average latency: ~ 64 ms
- Requests/sec: ~ 758 req/sec

Latency tail (90th–99th percentile):

- 0.40–0.48 seconds

This is the cache warming phase — Redis is filling up.

#### Run #2 (Warm Cache)

- Average latency: ~ 20 ms
- Requests/sec: ~ 2400 req/sec

Tight latency spread:

- 50% completed ~ 19 ms
- 90% completed ~ 23 ms
- 99% under 40 ms

Translation:
Once cached, the API barely had to think; it just streamed bytes from memory.

All 500 requests returned 200 OK. Zero failures.

### Cache Invalidation

To keep data fresh:

- POST /tasks
- PUT /tasks/:id
- DELETE /tasks/:id

→ trigger cache invalidation

So Redis always reflects the real world.

### Stateless Design

The API now stores:

- Persistent data → PostgreSQL
- Ephemeral / high-speed data → Redis
- Nothing critical in memory

Meaning:

- Any server can handle any request
- Scaling becomes plug-and-play
- No node affinity

If 10 instances spin up:

- They share Redis + Postgres
- No instance is special
- No instance remembers

### Load Balancing Validation

NGINX distributes traffic in round-robin, confirmed via request logs.

Result:

- Load spreads across instances
- System resilience improves
- Performance stabilizes under concurrency

Not just fast, but graceful under pressure.

### Load Testing

Load was simulated using hey:

```
/c/Tools/hey/hey.exe -n 200 -c 20 http://localhost:8080/tasks
```

Observations:

- Requests spread across multiple API instances.
- Latency distribution improved compared to a single instance.
- Redis caching further reduced response times for repeated requests.

### Database Entities

Entities remain unchanged from Challenge 3:

- User
- Category
- Task

Full relational modeling, foreign key constraints, safe deletes, filtering, searching, sorting, pagination, and indexing are still present.

### Routes & Features

Unchanged from Challenge 3:

- CRUD for Tasks, Users, Categories
- Advanced filtering & search
- Swagger documentation for interactive testing

New addition for Challenge 4:

- Logs in all instances show which port handled each request (confirming load balancing).

### Setup

1. Start Multiple API Instances

```
npm start          # 3000
npm run dev:3001   # 3001
npm run dev:3002   # 3002
npm run dev:3003   # 3003
```

2. Start Redis

```
docker run -p 6379:6379 redis
```

3. Start NGINX

```
cd C:\Tools\nginx
.\nginx.exe
```

4. Test Load Balancing

```
curl http://localhost:8080/tasks
```

5. Load Testing

```
/c/Tools/hey/hey.exe -n 200 -c 20 http://localhost:8080/tasks
```

### Testing

All tests from Challenge 3 remain valid. Redis caching, multiple instances, and stateless design have been integrated without breaking existing test suites.

### Notes for Reviewers

- Core focus: horizontal scaling, load balancing, Redis caching, stateless API.
- Logs confirm requests are served by multiple instances.
- Fully compatible with previous Challenge 3 features and tests.
- Challenge 4 adds infrastructure and performance improvements without changing the API surface.
