# Quizana Shop: In-Process Modular Monolith (Lab 2 Extension)

A full-stack modular monolith e-commerce system built with **Spring Boot 3**, **PostgreSQL (Supabase)**, and **React (Vite)** demonstrating advanced architectural patterns:
1. **In-Process Modular Monolith with Decoupled Event Streams**: Spring's `ApplicationEventPublisher` decouples the `shop` and `inventory` domains from the `notification` domain.
2. **Multi-Item Transactional Integrity & All-or-Nothing Rollback**: Pre-validation across line items guarantees atomic orders with zero partial reservations upon failure.
3. **Reversible Module Operations (Order Cancellation & Restock)**: Full restock propagation back to inventory with state transition verification.
4. **Architectural Encapsulation**: Strict package-private implementations (`InventoryServiceImpl`, `NotificationEventListener`) preventing direct cross-module leakage.

---
### Network tab evidence
# A multi-item order where all items succeed (CONFIRMED)
<img width="1910" height="989" alt="image" src="https://github.com/user-attachments/assets/5cb1f062-39bc-429d-b660-c9e95d491cec" />

# A multi-item order where one item fails and the whole order is REJECTED with no partial reservation
<img width="1915" height="984" alt="image" src="https://github.com/user-attachments/assets/a26eff25-9336-4f25-be54-3940ff3ded03" />

# A cancel with restock reflected in GET /api/inventory afterward
<img width="1913" height="988" alt="image" src="https://github.com/user-attachments/assets/c140ce9d-7784-401e-b67a-c3ecd93602e8" />
<img width="1918" height="992" alt="image" src="https://github.com/user-attachments/assets/92bd05fc-0ae8-4921-a3d0-b3ad6a7b5b69" />

# The notification feed showing a confirmed order, a rejected order, and a low-stock alert

<img width="1918" height="984" alt="image" src="https://github.com/user-attachments/assets/0b7c68f8-cdb0-4226-8b3f-4ca4cead1b5c" />

## 1. Modular Architecture & Package Structure

```
edu.cit.quizana
├── ShopMonolithApplication.java
│
├── inventory/                      # Inventory Module
│   ├── InventoryService.java       # Public API contract (reserve, restock, getItem, getAllItems)
│   ├── InventoryServiceImpl.java   # Package-private implementation (enforces encapsulation)
│   ├── InventoryItem.java          # JPA Entity
│   ├── InventoryRepository.java    # Spring Data JPA Repository
│   ├── DatabaseSeeder.java         # Baseline inventory seeder (P100, P200, P300)
│   ├── dto/                        # Inventory DTOs (InventoryItemDto, ReservationResult)
│   └── event/                      # Inventory Domain Events
│       └── LowStockEvent.java      # Fired when stock drops <= configured threshold (5)
│
├── shop/                           # Order Module
│   ├── OrderService.java           # Order orchestration, all-or-nothing validation, cancel logic
│   ├── OrderController.java        # REST Controller (/api/orders, /api/orders/{id}/cancel, /api/inventory)
│   ├── Order.java                  # Order Entity (OneToMany to OrderItem)
│   ├── OrderItem.java              # OrderItem Entity
│   ├── OrderStatus.java            # CONFIRMED, REJECTED, CANCELLED
│   ├── OrderRepository.java        # Spring Data JPA Repository
│   ├── config/                     # CorsConfig (CORS for localhost:5173)
│   ├── dto/                        # Order DTOs (OrderRequest, OrderResponse, OrderItemRequest, OrderItemOutcomeDto)
│   └── event/                      # Order Domain Events
│       ├── OrderPlacedEvent.java   # Published on successful multi-item order
│       ├── OrderRejectedEvent.java # Published on validation/reservation failure
│       └── OrderCancelledEvent.java# Published on order cancellation
│
└── notification/                   # Decoupled Notification Module
    ├── Notification.java           # Notification Entity (notifications table)
    ├── NotificationRepository.java # JPA Repository
    ├── NotificationEventListener.java # Package-private @EventListener (listens to domain events)
    └── NotificationController.java # REST Controller (/api/notifications)
```

### Architectural Decoupling Rules:
- **Notification Independence**: The `notification` module depends **only** on domain event classes (`OrderPlacedEvent`, `OrderRejectedEvent`, `OrderCancelledEvent`, `LowStockEvent`). It never imports or calls `InventoryService`, `InventoryRepository`, `OrderService`, or `OrderRepository`.
- **Zero Reverse Coupling**: Neither `shop` nor `inventory` import anything from `edu.cit.quizana.notification`.
- **Package-Private Implementations**: `InventoryServiceImpl` and `NotificationEventListener` are package-private, guaranteeing that callers outside the package interact exclusively through public service interfaces or domain events.

---

## 2. Event Execution Model: Synchronous vs. Asynchronous (`@Async`)

In this monolith implementation, domain event listeners in `NotificationEventListener` run **synchronously by default** within the dispatching thread and transaction boundary:

### Why Synchronous Execution was Chosen for Lab 2:
1. **Immediate Read-Your-Own-Writes Consistency**: When the React UI submits an order and immediately queries `GET /api/notifications` and `GET /api/orders`, synchronous event execution guarantees that the notification record is already persisted and returned in the same refresh cycle.
2. **Atomic Transactional Rollback**: If an unhandled fatal error occurs during the ordering pipeline, the entire transaction (order persistence, inventory reservation, and notification logging) rolls back cleanly.
3. **Simplicity & Zero Thread-Pool Overhead**: Avoids complex asynchronous thread pool configuration (`ThreadPoolTaskExecutor`), context-propagation challenges, and distributed trace tracking within a single JVM.

### When to Introduce `@Async` Event Listeners:
- **Slow External I/O**: If the Notification module sends external emails (SendGrid/SMTP), SMS (Twilio), or webhooks to third parties where network latency would degrade HTTP request latency.
- **Fault Isolation**: When a failure in non-critical notification delivery must not cause the primary business transaction (stock reservation and order placement) to fail.
- **High Concurrency Throughput**: When offloading heavy side-effects (e.g. PDF invoice generation, analytics ingestion) to a background worker pool to free the servlet request thread.

---

## 3. Database Schema (`schema.sql`)

The database schema supports Supabase (PostgreSQL) and in-memory H2 fallback:

```sql
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS inventory;

CREATE TABLE inventory (
    product_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    stock INT NOT NULL
);

CREATE TABLE orders (
    order_id VARCHAR(50) PRIMARY KEY,
    status VARCHAR(20) NOT NULL, -- CONFIRMED, REJECTED, CANCELLED
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE order_items (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    CONSTRAINT fk_order_items_orders FOREIGN KEY (order_id) REFERENCES orders (order_id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_inventory FOREIGN KEY (product_id) REFERENCES inventory (product_id)
);

CREATE TABLE notifications (
    notification_id VARCHAR(50) PRIMARY KEY,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Seed initial inventory data
INSERT INTO inventory (product_id, name, stock) VALUES
('P100', 'Wireless Mouse', 25),
('P200', 'Mechanical Keyboard', 10),
('P300', 'USB-C Hub', 0);
```

---

## 4. Network Tab Evidence & REST Scenarios

### Scenario 1: Multi-Item Order (All Items Succeed -> CONFIRMED)
- **Request**: `POST http://localhost:8080/api/orders`
  ```json
  {
    "items": [
      { "productId": "P100", "quantity": 3 },
      { "productId": "P200", "quantity": 2 }
    ]
  }
  ```
- **Response Headers**: `HTTP/1.1 200 OK`, `Content-Type: application/json`
- **Response Body**:
  ```json
  {
    "orderId": "ORD-5D70A79E",
    "status": "CONFIRMED",
    "reason": null,
    "items": [
      { "productId": "P100", "quantity": 3, "outcome": "RESERVED" },
      { "productId": "P200", "quantity": 2, "outcome": "RESERVED" }
    ],
    "inventory": { "P100": 22, "P200": 8 },
    "createdAt": "2026-09-17T18:23:33.401"
  }
  ```
- **Database / Event Side-Effects**:
  - `P100` stock decreases from 25 to 22; `P200` stock decreases from 10 to 8.
  - `OrderPlacedEvent` published -> Notification logged: `"Order ORD-5D70A79E confirmed (P100 x3, P200 x2)"`.

---

### Scenario 2: Multi-Item Order with All-or-Nothing Rollback (One Item Fails -> REJECTED)
- **Request**: `POST http://localhost:8080/api/orders`
  ```json
  {
    "items": [
      { "productId": "P100", "quantity": 5 },
      { "productId": "P200", "quantity": 15 }
    ]
  }
  ```
- **Response Headers**: `HTTP/1.1 200 OK`, `Content-Type: application/json`
- **Response Body**:
  ```json
  {
    "orderId": "ORD-67453C5D",
    "status": "REJECTED",
    "reason": "Insufficient stock for Mechanical Keyboard (P200): requested 15, available 10",
    "items": [
      { "productId": "P100", "quantity": 5, "outcome": "REJECTED: Order rolled back" },
      { "productId": "P200", "quantity": 15, "outcome": "FAILED: Insufficient stock (available: 10)" }
    ],
    "inventory": { "P100": 25, "P200": 10 },
    "createdAt": "2026-09-17T18:23:34.230"
  }
  ```
- **Database / Event Side-Effects**:
  - **Zero Partial Reservation**: `P100` stock remains untouched at 25 despite individually having sufficient stock.
  - `P200` stock remains untouched at 10.
  - `OrderRejectedEvent` published -> Notification logged: `"Order ORD-67453C5D rejected: Insufficient stock for Mechanical Keyboard (P200): requested 15, available 10"`.

---

### Scenario 3: Order Cancellation & Inventory Restock
1. **Order Cancellation Request**: `POST http://localhost:8080/api/orders/ORD-B3F53637/cancel`
- **Response Headers**: `HTTP/1.1 200 OK`, `Content-Type: application/json`
- **Response Body**:
  ```json
  {
    "orderId": "ORD-B3F53637",
    "status": "CANCELLED",
    "reason": "Order cancelled by user. Stock returned to inventory.",
    "items": [
      { "productId": "P100", "quantity": 5, "outcome": "RESTOCKED" },
      { "productId": "P200", "quantity": 3, "outcome": "RESTOCKED" }
    ],
    "inventory": { "P100": 25, "P200": 10 },
    "createdAt": "2026-09-17T18:23:33.430"
  }
  ```

2. **Inventory Query Request**: `GET http://localhost:8080/api/inventory`
- **Response Headers**: `HTTP/1.1 200 OK`, `Content-Type: application/json`
- **Response Body**:
  ```json
  [
    { "productId": "P100", "name": "Wireless Mouse", "stock": 25 },
    { "productId": "P200", "name": "Mechanical Keyboard", "stock": 10 },
    { "productId": "P300", "name": "USB-C Hub", "stock": 0 }
  ]
  ```
- **Error Safeguards**:
  - `POST /api/orders/ORD-NONEXISTENT/cancel` -> returns `404 Not Found`.
  - Duplicate cancel on already cancelled order -> returns `409 Conflict`.

---

### Scenario 4: Low-Stock Auto-Reorder Alert & Activity Feed
- **Action**: Place order reserving 21 units of `P100` (initial stock 25 -> remaining stock drops to 4 <= threshold of 5).
- **Domain Event**: `InventoryServiceImpl` fires `LowStockEvent("P100", "Wireless Mouse", 4, 5, timestamp)`.
- **Query Notifications Request**: `GET http://localhost:8080/api/notifications`
- **Response Headers**: `HTTP/1.1 200 OK`, `Content-Type: application/json`
- **Response Body**:
  ```json
  [
    {
      "notificationId": "NOTIF-79E4A102",
      "message": "Product P100 (Wireless Mouse) is low on stock (4 remaining, threshold: 5) - reorder needed",
      "createdAt": "2026-09-17T18:23:34.191"
    },
    {
      "notificationId": "NOTIF-31D93B58",
      "message": "Order ORD-6587BF23 confirmed (P100 x21)",
      "createdAt": "2026-09-17T18:23:34.193"
    },
    {
      "notificationId": "NOTIF-A0C16E84",
      "message": "Order ORD-67453C5D rejected: Insufficient stock for Mechanical Keyboard (P200): requested 15, available 10",
      "createdAt": "2026-09-17T18:23:34.236"
    }
  ]
  ```

---

## 5. Supabase Setup

> These steps are carried over from Lab 1 and remain unchanged for Lab 2.

### Prerequisites
- A [Supabase](https://supabase.com) account and project.
- The project's **connection string** (Transaction Pooler, port `6543`) from **Project Settings → Database → Connection String**.

### Steps

1. **Create a Supabase project** at [app.supabase.com](https://app.supabase.com). Note your project reference ID, region, and database password.

2. **Run the schema** — open the **SQL Editor** in the Supabase dashboard and paste the full contents of `backend/src/main/resources/schema.sql`, then click **Run**. This creates the `inventory`, `orders`, `order_items`, and `notifications` tables and seeds initial stock data.

3. **Configure `application-local.properties`** — in the `backend/` directory, create (or update) `application-local.properties` with your Supabase credentials:
   ```properties
   spring.datasource.url=jdbc:postgresql://aws-0-<region>.pooler.supabase.com:6543/<db-name>?prepareThreshold=0
   spring.datasource.username=postgres.<project-ref>
   spring.datasource.password=<your-db-password>
   spring.datasource.hikari.data-source-properties.prepareThreshold=0
   spring.datasource.hikari.data-source-properties.preparedStatementCacheQueries=0
   spring.datasource.hikari.data-source-properties.preparedStatementCacheSqlLimit=0
   spring.jpa.hibernate.ddl-auto=update
   ```
   > **Important**: Use the **Transaction Pooler** URL (port `6543`). The `prepareThreshold=0` parameters are required because Supabase's PgBouncer runs in transaction-pooling mode and does not support server-side named prepared statements. Without them, Hibernate throws `PSQLException: prepared statement "S_1" already exists` on startup.

4. **Activate the profile** — pass `-Dspring-boot.run.profiles=local` when starting the backend.

5. **Start the backend**:
   ```powershell
   cd backend
   .\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=local
   ```

6. **Start the frontend**:
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```
   Open `http://localhost:5173`.

7. **Run the full automated test suite** (uses in-memory H2 — no Supabase required):
   ```powershell
   cd backend
   .\mvnw.cmd test
   ```

---

## 6. Architectural Reflection

### Atomicity in Multi-Item Orders

Multi-item orders now call `InventoryService.reserve()` once per line item inside a single `OrderService.placeOrder()` method annotated with `@Transactional`. Because every `reserve()` call executes within the same JVM-local JDBC transaction managed by Spring, any failure — whether a pre-validation check before the loop or a database write inside it — causes the entire unit of work to roll back atomically. No partial reservations survive an exception; the database either records all stock deductions or none. This guarantee is straightforward in a monolith because all modules share one `DataSource` and one transaction context.

If `Order` and `Inventory` were split across a network as separate microservices, a single JDBC transaction would no longer span both — each service owns its own database. To preserve all-or-nothing semantics we would need the **Saga pattern**. In the choreography variant, `OrderService` publishes an `OrderPlaced` event; `InventoryService` listens, attempts each reservation, and on failure fires a `ReservationFailed` event that triggers a **compensating transaction** in `OrderService` (marking the order `REJECTED` and emitting `ReleaseStock` commands for any already-reserved items). Each step must be idempotent because message brokers deliver at least once, and the saga must handle partial failures mid-flight — significantly more complex than a single `@Transactional` boundary.

### Event Publishing vs. Direct Call — Coupling and Microservice Extraction

Currently, `OrderService` never imports or references anything in the `notification` package. It simply calls `applicationEventPublisher.publishEvent(new OrderPlacedEvent(...))` and returns; the Spring container dispatches the event synchronously to `NotificationEventListener`. This is **temporal decoupling within the process**: `OrderService` does not know whether any listener exists, what it does, or how long it takes. Adding, removing, or replacing `NotificationEventListener` requires zero changes to `OrderService`.

Had we used a direct call (`notificationService.notify(...)`), `OrderService` would import `NotificationService`, creating a compile-time dependency. A future rename, refactor, or deletion of `NotificationService` would break `OrderService`, and the notification module could never be deployed or tested independently. Extracting `Notification` to a separate microservice would require replacing `applicationEventPublisher.publishEvent()` with a broker publish — e.g., `kafkaTemplate.send("order-events", event)` — while the notification service consumes from that topic. We would also need to handle broker unavailability (circuit breakers, retries), message ordering guarantees, at-least-once delivery, and idempotent consumers to avoid duplicate notifications on retry.

### Which Module to Extract First — and Why

Of the three modules (`inventory`, `shop`, `notification`), **`notification` is the right choice to extract first** because it is already the most architecturally isolated. It holds zero references to `OrderService`, `InventoryService`, or any repository outside its own package. Its only external dependency is the set of domain event classes, which would simply become message payloads on a broker topic.

The concrete code changes to do this: (1) move `Notification`, `NotificationRepository`, and `NotificationController` to a new Spring Boot application with its own database; (2) replace the `@EventListener` methods in `NotificationEventListener` with a Kafka/RabbitMQ `@KafkaListener` or `@RabbitListener`; (3) in the monolith, replace `applicationEventPublisher.publishEvent()` calls in `OrderService` and `InventoryServiceImpl` with `kafkaTemplate.send()` targeting the same topic. Critically, the core business logic in `OrderService` — the all-or-nothing pre-validation and `@Transactional` reservation loop — remains completely untouched. This is precisely why decoupled event publishing pays off: the extraction boundary is clean, the blast radius is small, and neither the `shop` nor `inventory` modules need to change their internal logic.
