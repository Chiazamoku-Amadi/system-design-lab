# System Design Lab

## 2. API Design & REST Principles

### Task Management API

Task Management API is a simple backend service for managing tasks. Users can create a new task, retrieve all tasks, retrieve a single task, update an existing task, and delete a task.

It has input validation implemented. This helps prevent invalid input data from causing avoidable errors. In addition, any errors are handled gracefully, thus, giving good user and developer experience.

Task Management API is documented using Swagger.

### Technologies & Tools

- **Node.js**: JavaScript runtime environment.
- **Express.js**: Web framework for Node.js. Used this because it makes handling routing and middlewares easy. It also has provisions for convenient methods for sending different HTTP responses.
- **Joi**: For input validation.
- **Swagger JSDoc**: For generating the OpenAPI (Swagger) documentation automatically from the JSDoc comments in the code.
- **Swagger UI Express**: For displaying the generated documentation in an interactive web interface where the API endpoints can be viewed and tested.

### Features

1. Create a new task (with a title, description, and optional status).
2. Retrieve all tasks (with optional filtering, sorting, and pagination).
3. Retrieve a single task by its ID.
4. Update an existing task by its ID.
5. Delete a task by its ID.

### Setup

    npm start

### Testing the API Using Curl

#### Get All Tasks

```
curl http://localhost:3000/tasks
```

#### Get All Tasks With Parameters

```
curl "http://localhost:3000/tasks?status=pending&sort=desc&page=1&limit=10"
```

#### Get a Single Task

```
curl http://localhost:3000/tasks/{taskId}
```

#### Create a New Task

```
curl -X POST "http://localhost:3000/tasks" -H "Content-Type: application/json" -d '{
"title": "Write Swagger Docs",
"description": "Learn how to document APIs",
"status": "in-progress"
}'
```

#### Update a Task

```
curl -X PUT "http://localhost:3000/tasks/{taskId}" -H "Content-Type: application/json" -d '{
"title": "Update Swagger Docs",
"status": "completed"
}'
```

#### Delete a Task

```
curl -X DELETE http://localhost:3000/tasks/{taskId}
```

### Testing the API with Swagger UI

#### Step 1: Start Your Server

    npm start

Once it's up, the API should be available at http://localhost:3000

#### Step 2: Open Swagger UI

Go to the swagger UI using this url: http://localhost:3000/api-docs

You’ll see an interactive API dashboard showing all the endpoints (/tasks, /tasks/{taskId}, etc.) along with request and response details.

#### Step 3: Test an Endpoint

Click the **_Try it out_** button on any endpoint to enable testing mode.

**Example 1: Create a new task (POST /tasks)**

1. Expand the POST /tasks section.
2. Click **Try it out**.
3. Fill in the request body:

```
{
  "title": "Build Task API",
  "description": "Understand how to create RESTful APIs",
  "status": "pending"
}
```

4. Click **Execute**.
5. Scroll down to view the response body, status code, and response headers.

**Example 2: Get all tasks (GET /tasks)**

1. Expand the GET /tasks section.
2. Click **Try it out**.
3. Optionally, add query parameters:
   - `status`: `pending`
   - `sort`: `desc`
   - `page`: `1`
   - `limit`: `10`
4. Click **Execute**.
5. Swagger will display a list of tasks with pagination info.

**Example 3: Update a task (PUT /tasks/{taskId})**

1. Copy an existing task’s ID from the GET response.
2. Expand the PUT /tasks/{taskId} section.
3. Click **Try it out**.
4. Enter the task ID in the taskId field.
5. Fill in the body:

```
{
  "status": "completed"
}
```

6. Click **Execute** to update the task.

**Example 4: Delete a task (DELETE /tasks/{taskId})**

1. Expand the DELETE /tasks/{taskId} section.
2. Click **Try it out**.
3. Enter the ID of the task you want to delete.
4. Click **Execute**.
5. You should receive a success message confirming deletion.
