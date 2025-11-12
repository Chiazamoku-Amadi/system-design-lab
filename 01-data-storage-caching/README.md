# System Design Lab

## 1. Data Storage & Caching

### Messages API

Messages API is a simple backend service that can create a new message, retrieve all messages (with an optional limit query parameter), retrieve a single message, delete a single message, and delete all messages.

It also has an in-memory cache that helps improve response time by serving responses from the cache, if available. It has cache invalidation implemented to help prevent serving stale data to users.

### Technologies

- Node.js: JavaScript runtime environment.
- Express.js: Web framework for Node.js. Used this because it makes handling routing and middlewares easy. It also has provisions for convenient methods for sending different HTTP responses.
- NodeCache: For implementation of in-memory caching.

### Features

1. Create a new message.
2. Retrieve all messages (with an optional limit query parameter).
3. Retrieve a single message.
4. Delete a single message.
5. Delete all messages.

### Setup

    npm start

### Testing Using Curl

#### Get All Messages

```
curl http://localhost:3000/messages
```

#### Get All Messages With Limit

```
curl http://localhost:3000/messages?limit=10
```

#### Get a Single Message

```
curl http://localhost:3000/messages/{messageId}
```

#### Add a New Message

```
curl -X POST http://localhost:3000/messages
```

#### Delete a Message

```
curl -X DELETE http://localhost:3000/messages/{messageId}
```

#### Delete all Messages

```
curl -X DELETE http://localhost:3000/messages
```

### Testing Cached and Uncached Response Times

When you make a GET request to get all messages, it takes 3 secs to get a response. When you make a call within the next 60s, you'll get an instant response (straight from the in-memory cache).

All data in the cache gets invalidated, that is, the cache is reset and all data is wiped. This happens:

- 60s after your last GET request, whether it's to the "/messages" endpoint or the "/messages/:messageId" endpoint.
- when you make a POST request to add a new message.
- when you change the limit query parameter of the GET "/messages" endpoint.

Use the commands below in the following order to test the response times of both the cached and uncached responses in order to see caching in action:

- Get all messages
- Get all messages
- Add new message
- Get all messages

##### OR

- Get all messages with limit
- Get all messages with CURRENT limit
- Add new message (or Get all messages with NEW limit)
- Get all messages with CURRENT limit

#### Get All Messages

```
curl -s -w "\nTIME: %{time_total}s\n" http://localhost:3000/messages -o /dev/null
```

#### Get All Messages With Limit

```
curl -s -w "\nTIME: %{time_total}s\n" "http://localhost:3000/messages?limit=10" -o /dev/null
```

#### Add a New Message

```
curl -s -X POST -H "Content-Type: application/json" -d '{"text":"Hello"}' http://localhost:3000/messages -o /dev/null
```
