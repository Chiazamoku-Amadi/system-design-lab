# System Design Lab - by Chiazamoku Amadi

Welcome to my **System Design Lab**. This is a guided journey into the inner workings of scalable, reliable, and performant systems.  
This repository captures my hands-on exploration of **backend architecture and system design**, one challenge at a time.

Each challenge focuses on a core concept of system design and ends with a tangible project - a living artifact that embodies what I’ve learned.  
I’m building these projects using **Node.js**, combining both **theory and implementation** to strengthen my engineering intuition.

---

## Vision

My goal is to grow from a strong frontend developer into a **world-class fullstack engineer**, one who can:

- Architect systems that scale elegantly under load.
- Make informed trade-offs grounded in data and design principles.
- Build backend services that are both **robust and maintainable**.
- Approach engineering decisions with confidence, clarity, and curiosity.

This lab is where I practice those principles through structured, progressive challenges.

---

## The Journey Map

### **Phase 1: Foundations (Weeks 1–3)**

Understanding how systems store, access, and expose data efficiently.

1. **Data Storage & Caching**  
   → Learn how data is stored, accessed, and optimized with caching for performance.  
   _(Involves: in-memory caching, cache invalidation, performance measurement.)_

2. **API Design & REST Principles**  
   → Learn to design clean, well-structured REST APIs that follow best practices and standard conventions.  
   _(Involves: routes, controllers, validation, pagination, filtering, error handling.)_

3. **Database Modeling & Query Optimization**  
   → Learn how to model data, design normalized relational schemas, and connect backend services to a PostgreSQL database with clarity, security, and performance in mind.  
   _(Involves: database setup, roles & permissions, environment configuration with .env, establishing connections, entity-relationship modeling, schema design, migrations, connecting Node.js to PostgreSQL using an ORM like Prisma, filtering, search queries, indexing basics, querying data, and testing database-backed API endpoints.)_

### **Phase 2: System Design Core (Weeks 4–7)**

Designing systems that don’t just work — but keep working beautifully as traffic grows.

4. **Scalability & Load Balancing**  
   → Learn how to evolve a single-instance backend into a distributed system that can handle real-world traffic without breaking a sweat.  
   _(Involves: running multiple API instances, horizontal scaling, configuring NGINX as a load balancer, Redis caching for high-read endpoints, ensuring stateless service design, and performance testing to observe how the system behaves under concurrent load.)_

5. **Queues & Asynchronous Processing**  
   → Learn how to decouple work from the main request lifecycle, enabling background processing, retries, and resilient event-driven flows.  
   _(Involves: setting up RabbitMQ as a message broker, producing events from the API, building worker processes to consume events, implementing retry logic and dead-letter queues, ensuring idempotent processing, validating event payloads with a schema, tracking processed messages in PostgreSQL using Prisma, and scaling workers horizontally.)_
