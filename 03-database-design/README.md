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
