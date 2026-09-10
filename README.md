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

### 1. In-Process Integration vs. Network-Separated Microservices
Integrating `Order` and `Inventory` in-process within a modular monolith gives you several critical capabilities **for free**:
- **ACID Transactions**: A single database transaction boundary (`@Transactional`) spans both stock reservation and order creation, guaranteeing atomic commits with zero distributed locking overhead.
- **Sub-Millisecond Latency & High Throughput**: Method invocations occur within the JVM memory space without network latency, serialization/deserialization penalties, or connection pooling bottlenecks.
- **Zero Partial Failure Modes**: There is no risk of network timeouts, DNS resolution failures, or dropped packets midway through an order.

If split into separate microservices over HTTP/gRPC, you would need to add back:
- **Distributed Consistency Patterns**: Implementing the **Saga pattern** (orchestrated or choreographed) with compensating transactions to undo reserved stock if order placement fails downstream.
- **Network Resilience**: Circuit breakers (e.g. Resilience4j), exponential backoff retries, and dead-letter queues.
- **Asynchronous Messaging**: Message brokers (RabbitMQ/Kafka) for eventual consistency, alongside distributed tracing (OpenTelemetry) and API gateway routing.

---

### 2. Importance of Package-Private Visibility on `InventoryServiceImpl`
Declaring `InventoryServiceImpl` as package-private (`class InventoryServiceImpl implements InventoryService`) enforces a strict compile-time boundary. 

If `InventoryServiceImpl` were made `public`:
- **Architectural Erosion**: Developers working in `edu.cit.quizana.shop` could directly inject or instantiate the concrete class instead of the interface, coupling the Order module to internal implementation details (such as direct repository queries or internal helper state).
- **Broken Encapsulation**: Callers could bypass business invariants and validation rules exposed only by interface methods.
- **Refactoring Resistance**: Modifying or replacing the inventory implementation (e.g. swapping JPA for Redis caching or a remote REST client) would break dependent classes across the codebase. Package-private visibility prevents this by allowing access strictly through the contract defined by `InventoryService`.

---

### 3. When to Extract Inventory into a Microservice & Required Code Changes
**When to Extract**:
- **Independent Scaling**: If inventory reads (e.g. high-traffic catalog lookups, warehouse barcode scanners, third-party marketplace syncs) drastically outpace order placements and require distinct auto-scaling policies.
- **Organizational Boundaries**: When separate engineering teams own and deploy the inventory domain independently of the checkout/ordering domain.

**Required Code Changes**:
1. **Zero Changes to `OrderService` Core Logic**: Because `OrderService` depends exclusively on the `InventoryService` interface, its business logic remains untouched.
2. **Implement an HTTP Client**: Create a new `InventoryClient` implementing `InventoryService` that uses Spring's `RestClient` / `WebClient` to invoke the remote Inventory microservice endpoint over HTTP/REST.
3. **Database Decoupling**: Separate the shared database into dedicated schemas or distinct PostgreSQL databases (`order_db` and `inventory_db`).
4. **Remove Local Module**: Remove `edu.cit.quizana.inventory` from the monolith build artifact.

---

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
