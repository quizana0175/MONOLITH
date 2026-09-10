# Quizana Shop: In-Process Modular Monolith with Supabase & React

A full-stack e-commerce ordering system built with **Spring Boot 3**, **PostgreSQL (Supabase)**, and **React (Vite)** demonstrating three core architectural integration styles:
1. **Module-to-Module In-Process Integration** with strict package encapsulation.
2. **Service-to-Database Integration** via Spring Data JPA and Supabase PostgreSQL.
3. **External Client Integration via REST** with CORS enabled for the React SPA.

---

## 1. Supabase Setup Steps

1. **Create a Supabase Project**:
   - Log into [supabase.com](https://supabase.com/) and create a project in your preferred region (e.g., `ap-south-1`).
2. **Locate Connection Parameters**:
   - Navigate to **Project Settings** ➔ **Database** ➔ **Connection Pooling / Connection String**.
   - Note the pooler host: `aws-0-<region>.pooler.supabase.com`, port `6543` (transaction mode) or `5432` (session mode), and user `postgres.<project-ref>`.
3. **Configure Local Environment** (Kept out of Git):
   - Create `backend/application-local.properties` (or `backend/.env`):
     ```properties
     spring.datasource.url=jdbc:postgresql://aws-0-<region>.pooler.supabase.com:6543/postgres?sslmode=require
     spring.datasource.username=postgres.<your-project-ref>
     spring.datasource.password=YOUR_DATABASE_PASSWORD
     spring.datasource.hikari.maximum-pool-size=3
     spring.jpa.hibernate.ddl-auto=update
     ```
4. **Database Initialization & Seeding**:
   - Upon running the application, Hibernate automatically generates the `inventory` and `orders` tables.
   - The Spring Boot `DatabaseSeeder` component automatically seeds the baseline stock:
     - `P100` Wireless Mouse (25)
     - `P200` Mechanical Keyboard (10)
     - `P300` USB-C Hub (0)

---

## 2. Network Tab Evidence (Confirmed + Rejected Orders)

### A. Confirmed Order Path (Stock Available)
<img width="1917" height="1028" alt="image" src="https://github.com/user-attachments/assets/c0defe4d-6527-4305-b222-24ce623fb2f2" />

- **Request**: `POST http://localhost:8080/api/orders`
  ```json
  {
    "productId": "P100",
    "quantity": 2
  }
  ```
- **Response Headers**: `HTTP/1.1 200 OK`, `Content-Type: application/json`
- **Response Body**:
  ```json
  {
    "orderId": "ORD-B5DFA973",
    "productId": "P100",
    "quantity": 2,
    "status": "CONFIRMED",
    "reason": null,
    "inventory": 23,
    "createdAt": "2026-09-10T19:41:40.0013299"
  }
  ```
- **Database Effect**: `P100` stock decreases from 25 to 23 in Supabase `inventory` table.

---

### B. Rejected Order Path (Insufficient Stock)
<img width="1917" height="1030" alt="image" src="https://github.com/user-attachments/assets/11c20910-9b53-4fba-8681-2d239f0734e4" />

- **Request**: `POST http://localhost:8080/api/orders`
  ```json
  {
    "productId": "P200",
    "quantity": 15
  }
  ```
- **Response Headers**: `HTTP/1.1 200 OK`, `Content-Type: application/json`
- **Response Body**:
  ```json
  {
    "orderId": "ORD-5242EB25",
    "productId": "P200",
    "quantity": 15,
    "status": "REJECTED",
    "reason": "Insufficient stock for Mechanical Keyboard (P200): requested 15, available 10",
    "inventory": 10,
    "createdAt": "2026-09-10T18:56:54.3862412"
  }
  ```
- **Database Effect**: `P200` stock remains unchanged at 10; order recorded as `REJECTED` in `orders` table.

---

### C. Rejected Order Path (Out of Stock Item)
- **Request**: `POST http://localhost:8080/api/orders`
  ```json
  {
    "productId": "P300",
    "quantity": 1
  }
  ```
- **Response Headers**: `HTTP/1.1 200 OK`, `Content-Type: application/json`
- **Response Body**:
  ```json
  {
    "orderId": "ORD-965AD2E6",
    "productId": "P300",
    "quantity": 1,
    "status": "REJECTED",
    "reason": "Insufficient stock for USB-C Hub (P300): requested 1, available 0",
    "inventory": 0,
    "createdAt": "2026-09-10T18:57:00.8831646"
  }
  ```

---

## 3. Architectural Reflection
1. In-Process Integration vs. Network-Separated Microservices

Integrating the Order and Inventory modules in-process within a modular monolith provides several important capabilities without requiring additional infrastructure. First, ACID transactions allow a single database transaction boundary, such as one managed by @Transactional, to cover both stock reservation and order creation. This guarantees that both operations are committed atomically, without the overhead of distributed locking. In addition, in-process communication provides sub-millisecond latency and high throughput because method invocations occur directly within the JVM's memory space, avoiding network latency, serialization and deserialization costs, and connection-pooling bottlenecks. It also eliminates partial failure scenarios that can occur over a network, such as timeouts, DNS failures, or dropped packets during an order transaction.

If the Order and Inventory modules were instead separated into independent microservices communicating through HTTP or gRPC, several additional mechanisms would be required. Distributed consistency patterns, such as the Saga pattern, would need to be implemented using either orchestration or choreography, along with compensating transactions to reverse a stock reservation if order placement fails downstream. Network resilience would also become important, requiring mechanisms such as circuit breakers, exponential backoff retries, and dead-letter queues. Furthermore, asynchronous messaging through systems such as RabbitMQ or Kafka could be necessary to support eventual consistency, while distributed tracing through tools such as OpenTelemetry and API gateway routing would help monitor and manage communication between the services. Therefore, while microservices provide greater independence and scalability, they also introduce significant distributed-system complexity that is avoided when the modules remain integrated within the same application process.

2. Importance of Package-Private Visibility on InventoryServiceImpl

Declaring InventoryServiceImpl as package-private, as in class InventoryServiceImpl implements InventoryService, establishes a strict compile-time architectural boundary. This ensures that other modules can interact with the Inventory functionality only through the InventoryService interface rather than directly accessing its concrete implementation. If InventoryServiceImpl were made public, developers working in packages such as edu.cit.quizana.shop could directly instantiate or inject the concrete class, creating tighter coupling between the Order module and the internal implementation details of Inventory. This could expose details such as direct repository queries, internal helper methods, or implementation-specific state that should remain encapsulated within the Inventory module.

Making the implementation public could also lead to broken encapsulation because callers might bypass business invariants and validation rules that are intended to be enforced through the service interface. It would also make future refactoring more difficult. For example, if the inventory implementation were changed from JPA to Redis caching or eventually replaced with a remote REST client, classes that directly depended on InventoryServiceImpl could break across the codebase. By keeping the implementation package-private, the system ensures that other modules depend only on the stable contract defined by InventoryService, making the architecture more maintainable and resistant to implementation changes.

3. When to Extract Inventory into a Microservice and Required Code Changes

The Inventory module should be considered for extraction into a separate microservice when there is a clear architectural or operational reason to do so. One such reason is independent scaling. For example, inventory-related operations such as high-traffic catalog lookups, warehouse barcode scanning, or synchronization with third-party marketplaces may generate significantly more traffic than order placement. In this situation, separating Inventory would allow it to have its own scaling and deployment policies. Another reason is the establishment of organizational boundaries, particularly when separate engineering teams are responsible for the Inventory and Order domains and need to develop, deploy, and maintain them independently.

If Inventory were extracted into a microservice, the core business logic of OrderService would require little or no modification because it already depends on the InventoryService interface rather than the concrete InventoryServiceImpl. Instead, a new implementation, such as an InventoryClient, could implement InventoryService and use Spring's RestClient or WebClient to communicate with the remote Inventory service through HTTP or REST. The database would also need to be decoupled so that the Order and Inventory services no longer share the same database. This could involve using separate schemas or distinct PostgreSQL databases, such as order_db and inventory_db. Finally, the local edu.cit.quizana.inventory module would be removed from the monolithic build artifact, with its functionality being provided by the newly deployed Inventory microservice. This approach demonstrates the advantage of designing the monolith with clear module boundaries: because OrderService depends on an interface rather than an implementation, the Inventory module can be extracted with significantly less impact on the existing Order business logic.

## 4. How to Run

1. **Start Backend**:
   ```powershell
   cd backend
   .\mvnw.cmd spring-boot:run
   ```
2. **Start Frontend**:
   ```powershell
   cd frontend
   npm run dev
   ```
   Open `http://localhost:5173`.
#
