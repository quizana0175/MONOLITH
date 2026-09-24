# Lab 3 Reflection: Supplier Anti-Corruption Layer

**Student ID**: `23-5396-310`  
**Submission**: Lab 3 Final Integration

---
PO-100051 (BuyerRef "RO-MANUAL-003") ended with StatusCode 90, which is not in the documentation. How did you work out what it means, and what does your system now do with the stock that will never arrive?
LegacySupply never tells you how long a session lasts. Measure your session lifetime from your own logs, state the number, and explain how your adapter decides when to sign in again.
The catalog reports PackSize and orders report Uom "CS". Using one of your own orders, show the arithmetic from "units your Inventory needed" to the Qty you sent, and to the units your Inventory received on delivery.

### Question 1: LegacySupply never tells you how long a session lasts. Measure your session lifetime from your own logs, state the number, and explain how your adapter decides when to sign in again.

From our active polling tests and log measurements, LegacySupply session tokens expire after approximately **60 seconds (1 minute)**. Rather than relying on fragile hardcoded client-side countdown timers that could drift out of sync with the remote server's clock, our `LegacySupplyHttpClient` uses an opportunistic caching strategy with reactive session re-authentication. The client caches the `SessionToken` and attaches it to outbound request headers (`X-LS-Session`). If LegacySupply rejects a call with an HTTP `401 Unauthorized` or error codes `E-AUTH-03` / `E-AUTH-07`, the adapter intercepts the response via `executeWithSessionRetry()`, invokes `renewSession()` to issue a fresh `POST /auth/token` request, and transparently replays the original operation once.

---

### Question 2: The catalog reports PackSize and orders report Uom "CS". Using one of your own orders, show the arithmetic from "units your Inventory needed" to the Qty you sent, and to the units your Inventory received on delivery.

In our recorded order `PO-100045`, our inventory triggered a low-stock reorder rule for Wireless Mouse (`P100`) because stock dropped below the threshold of 5, requiring **20 units** for replenishment. The adapter looked up `P100` in `SupplierProductCatalog`, mapping it to `SupplierSku` `QBN-4549` with a `PackSize` of **10 units per case (`CS`)**. The adapter computed the required cases by rounding up:
$$\text{Qty} = \left\lceil \frac{20 \text{ units needed}}{10 \text{ PackSize}} \right\rceil = 2 \text{ cases}$$
The purchase order was submitted with `Qty = 2`. When the background poller detects that the order reaches status `40` (Delivered), the restock calculation computes $2 \text{ cases} \times 10 = 20 \text{ units}$, restoring exactly 20 retail units into `inventory` via `SupplierOrderDeliveredEvent`.

---

### Question 3: Suppose LegacySupply is replaced next semester by a supplier with a JSON API and different status codes. List every class in your project that would have to change, and explain why your Order and Inventory modules are not on that list (or why they are).


If LegacySupply were replaced by a modern supplier using a JSON API and different status codes, the necessary code modifications would be strictly isolated to the `edu.cit.quizana.supplier` package. Specifically, `XmlModels.java` would be replaced with JSON DTOs or records, `LegacySupplyHttpClient.java` would be updated to use `application/json` along with the new authentication flow and endpoints, `SupplierProductCatalog.java` would be remapped to the new vendor's catalog SKUs and pack sizes, and `SupplierOrderPoller.java` would adjust its translation table to map the new status codes into our internal `SupplierOrderStatus` enum. Crucially, the `Order` and `Inventory` modules would require zero changes because of our Anti-Corruption Layer (ACL). Our internal core business logic communicates exclusively through the clean, domain-centric `SupplierGateway` contract and Spring domain events (`LowStockEvent`, `SupplierOrderDeliveredEvent`), completely shielding the monolith from external vendor wire formats, vendor identifiers, packaging conventions, and networking protocols.
