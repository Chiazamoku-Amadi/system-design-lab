# System Design Lab

## 4. Scalability & Load Balancing

### Task Management API

This version of the Task Management API builds on Challenge 3, adding scalability, load balancing, and performance enhancements to handle more users and concurrent traffic.

The API itself hasn’t fundamentally changed, but the infrastructure and design patterns now reflect real-world distributed systems.

Key improvements:

- Horizontal scaling: multiple API instances running on different ports.
- Load balancing using NGINX to distribute requests evenly.
- Redis caching for high-read endpoints (GET /tasks).
- Stateless API design: all persistent and ephemeral state lives in PostgreSQL and Redis.

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

### Caching

Redis is used to offload read-heavy endpoints, particularly GET /tasks:

- Cached results reduce database load under high concurrency.
- Cache is invalidated when tasks are created, updated, or deleted.

Example flow:

- Client requests GET /tasks.
- API checks Redis cache:
  - If cached → return cached response.
  - If not → fetch from PostgreSQL, store result in Redis, then return.

### Stateless Design

All critical state is externalized:

- No in-memory storage of tasks.
- Persistent state in PostgreSQL.
- Ephemeral, high-read state in Redis.
- Any instance can serve requests independently.

This allows horizontal scaling without data inconsistency.

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
