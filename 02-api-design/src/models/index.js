let tasks = [
  {
    id: "1",
    title: "Task One",
    description: "This is my first task",
    status: "completed",
    createdAt: Date.now() - 10000,
    updatedAt: Date.now() - 10000,
  },
  {
    id: "2",
    title: "Task Two",
    description: "This is my second task",
    status: "completed",
    createdAt: Date.now() - 5000,
    updatedAt: Date.now() - 5000,
  },
  {
    id: "3",
    title: "Task Three",
    description: "This is my third task",
    status: "pending",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export default { tasks };
