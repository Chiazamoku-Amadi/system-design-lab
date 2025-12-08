# System Design Lab

## 3. Database Modeling & Query Optimization

### Task Management API

The Task Management API is a modular backend service centered around tasks but built to reflect a real-world ecosystem where tasks belong to users and may be grouped by categories.

The system validates inputs gracefully, handles errors cleanly, and provides interactive API documentation via Swagger, thus, making it intuitive for both users and developers.

This version includes advanced database modeling with relational tables (User, Task, Category), filtering by users and categories, full-text–style search across multiple related fields, and functional indexing for performance.

This version goes beyond CRUD. It now includes:

- Full relational modeling (Users → Tasks, Categories → Tasks)
- Foreign key constraints
- Safe deletes with ON DELETE SET NULL
- Advanced filtering & sorting
- Full-text search across titles, descriptions, usernames & category names
- Query optimization using PostgreSQL indexes
- A functional index for case-insensitive searches
- Swagger documentation
- Request validation
- Clean error handling

It’s functional, optimized, and ready for scaling.

### Technologies & Tools

- **Node.js**: JavaScript runtime environment.
- **Express.js**: Web framework for Node.js. For routing, middleware handling, and HTTP utilities.
- **Prisma ORM**: For database modeling, migrations, and type-safe queries.
- **PostgreSQL**: Relational database used for storing users, tasks, and categories.
- **Joi**: Schema-based validation for requests.
- **Swagger JSDoc**: For generating the OpenAPI (Swagger) documentation automatically from the JSDoc comments in the code.
- **Swagger UI Express**: For displaying the generated documentation in an interactive web interface where the API endpoints can be viewed and tested.

### Database Entities

User

- id
- email
- name
- password
- createdAt
- updatedAt
- relations: `tasks`

Category

- id
- name
- createdAt
- relations: `tasks`

Task

- id
- title
- description
- status
- createdAt
- updatedAt
- userId (nullable)
- categoryId (nullable)
- relations: `user`, `category`

Relations

- A User can have many Tasks
- A Category can have many Tasks
- If a user or category is deleted → related tasks get userId/categoryId set to null

### Features

#### Tasks

1. Create a task
2. Retrieve all tasks

- Filter by status
- Filter by user
- Filter by category
- Search (title, description, username, category name; case-insensitive)
- Sort by creation date
- Pagination

3. Retrieve a single task
4. Update a task
5. Delete a task

#### Users

1. Create a user
2. Get all users
3. Get user by ID
4. Update user
5. Delete user (task userId becomes null)

#### Categories

1. Create a category
2. Get all categories
3. Get category by ID
4. Update category
5. Delete category (task categoryId becomes null)

### Query Optimization

To boost performance:

1. Standard Index

```
@@index([title])
```

Improves equality and prefix `LIKE 'something%'` searches.

2. Functional Index

```
CREATE INDEX task_title_lower_idx ON "Task"(LOWER(title));
```

Optimizes case-insensitive search:

```
WHERE LOWER(title) LIKE 'design%'
```

### Setup

Install dependencies and start the server:

    npm install
    npm start

### Testing

This project uses Jest, Supertest, and a sandboxed PostgreSQL test database to ensure every part of the system behaves correctly.
All tests run in full isolation using a dedicated `.env.test` environment.

#### Test Environment Setup

A centralized database lifecycle helper (setupTestDB) ensures each test suite starts with a clean slate:

- Connects to the test DB before running the suite
- Clears all tables before each test
- Disconnects Prisma after all tests
- Prevents data leakage between tests

Supporting utilities include:

- `clearDb()` — deletes all records in the correct dependency order
- `closeDb()` — safely disconnects Prisma
- `setup.js` — loads `.env.test` before Prisma initializes

#### Smoke Tests

Basic “is the system alive?” checks ensure:

- Server boots successfully
- `/api-docs` returns HTML + 200 status
- `/users`, `/tasks`, `/categories` routes are reachable
- Invalid JSON bodies return `400 Bad Request`
- Swagger documentation endpoint is functioning

#### CRUD Tests

Each resource is tested end-to-end using the real Express app and real database.

Users

- Create user
- Update user
- Delete user
- Verify database state using Prisma queries

Categories

- Create category
- Update category
- Delete category
- Validate DB state after deletion

Tasks

- Create task (with real user + category)
- Update task
- Delete task
- Fetch task with joined `user` and `category`
- Validate created/updated/deleted tasks using Prisma

#### Edge Case & Error Handling Tests

Robust input validation is tested across all entities.

Users

- Missing required fields
- Invalid email format
- Invalid ID in params (`/users/abc`)
- Updating/deleting non-existent user
- Sending invalid JSON

Categories

- Missing name on creation
- Invalid category ID
- Updating/deleting non-existent category
- Invalid JSON payload

Tasks

- Missing required fields
- Invalid task status
- Invalid `userId` format
- Updating non-existent task
- Deleting non-existent task
- Invalid task ID in params (`/tasks/abc`)
- Invalid JSON payload

#### Integration Tests

A full workflow is tested across Users → Categories → Tasks:

- Create user → create category → create task
- Retrieve task and verify linked user + category
- Update task fields together (title, description, status)
- Deleting a user sets `task.userId = null`
- Deleting a category sets `task.categoryId = null`

#### Relationship Tests

These tests confirm that relational behavior between Users, Categories, and Tasks works exactly as modeled in the database.
They verify that deleting a parent record never deletes tasks, but instead safely unlinks them using `ON DELETE SET NULL`.

- Deleting a user sets `task.userId = null`
- Deleting a category sets `task.categoryId = null`
- Tasks remain intact after the parent is removed
- Creating a task with an invalid `userId` or `categoryId` returns a clean `400 Bad Request`

#### Unique Constraint / Concurrency Tests

These tests ensure the system enforces uniqueness at both the API layer and the database layer, protecting the user table from duplicates even under fast or repeated requests.

- Duplicate email detection (`email` must be unique)
- First request succeeds with `201`
- Second request returns `400` or `409` depending on Prisma’s error
- Database contains exactly one record even after two identical create attempts

#### Security & Response Shape Tests

These tests ensure the API never leaks sensitive fields and always responds in a safe, predictable format.

- Passwords are never returned in API responses on user creation
- Returned user object includes only safe fields (`id`, `name`, `email`)
- Error responses strictly follow the { `message: string` } convention across all cases

#### Running the Test Suite

```
npm test
```

This command automatically loads `.env.test`, runs migrations, and executes all Jest suites in `tests/`.

### Testing the API Using Curl

#### Users

##### Get All Users

```
curl http://localhost:3000/users
```

##### Create a User

```
curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{ "email": "john@example.com", "password": "123456", "name": "John" }'
```

#### Categories

##### Get All Categories

```
curl http://localhost:3000/categories
```

##### Create a Category

```
curl -X POST http://localhost:3000/categories -H "Content-Type: application/json" -d '{ "name": "Design" }'
```

#### Tasks

##### Get All Tasks

```
curl http://localhost:3000/tasks
```

##### Get All Tasks With Filtering (status, userId, CategoryId)

```
curl "http://localhost:3000/tasks?status=pending&sort=desc&page=1&limit=1&userId=1&categoryId=2"
```

##### Get All Tasks With Search

```
curl "http://localhost:3000/tasks?search=design"
```

##### Get a Single Task

```
curl http://localhost:3000/tasks/{taskId}
```

##### Create a New Task

```
curl -X POST "http://localhost:3000/tasks" -H "Content-Type: application/json" -d '{
"title": "Write Swagger Docs",
"description": "Learn API documentation",
"status": "in-progress"
"userId": 1,
"categoryId": 2
}'
```

##### Update a Task

```
curl -X PUT "http://localhost:3000/tasks/{taskId}" -H "Content-Type: application/json" -d '{
"title": "Update Swagger Docs",
"status": "completed"
}'
```

##### Delete a Task

```
curl -X DELETE http://localhost:3000/tasks/{taskId}
```

### Using Swagger UI

#### 1. Start Your Server

    npm start

Once it's up, the API should be available at http://localhost:3000

#### 2. Open Swagger Documentation

Go to the swagger UI using this url: http://localhost:3000/api-docs

You’ll see an interactive API dashboard showing all the endpoints.

#### 3. Test Endpoints from Swagger

Click the **_Try it out_** button on any endpoint to enable testing mode, whether you're creating tasks, updating them, filtering, searching, or deleting.

### Database Optimization

This project includes query optimization techniques:

#### 1. Index on Title

```
@@index([title])
```

#### 2. Functional Index for Case-Insensitive Search

```
CREATE INDEX task_title_lower_idx ON "Task"(LOWER(title));
```

#### 3. Optimized Query Filtering

- Filter by user
- Filter by category
- Global search across multiple tables
