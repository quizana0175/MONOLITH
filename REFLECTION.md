# Lab 3 Reflection: Supplier Anti-Corruption Layer

**Student ID**: `23-5396-310`  
**Submission**: Lab 3 Final Integration

---

### Question 1: LegacySupply never tells you how long a session lasts. Measure your session lifetime from your own logs, state the number, and explain how your adapter decides when to sign in again.

From our active polling tests and log measurements, LegacySupply session tokens expire after approximately **60 seconds (1 minute)**. Rather than relying on fragile hardcoded client-side countdown timers that could drift out of sync with the remote server's clock, our `LegacySupplyHttpClient` uses an opportunistic caching strategy with reactive session re-authentication. The client caches the `SessionToken` and attaches it to outbound request headers (`X-LS-Session`). If LegacySupply rejects a call with an HTTP `401 Unauthorized` or error codes `E-AUTH-03` / `E-AUTH-07`, the adapter intercepts the response via `executeWithSessionRetry()`, invokes `renewSession()` to issue a fresh `POST /auth/token` request, and transparently replays the original operation once.

---

### Question 2: The catalog reports PackSize and orders report Uom "CS". Using one of your own orders, show the arithmetic from "units your Inventory needed" to the Qty you sent, and to the units your Inventory received on delivery.

In our recorded order `PO-100045`, our inventory triggered a low-stock reorder rule for Wireless Mouse (`P100`) because stock dropped below the threshold of 5, requiring **20 units** for replenishment. The adapter looked up `P100` in `SupplierProductCatalog`, mapping it to `SupplierSku` `QBN-4549` with a `PackSize` of **10 units per case (`CS`)**. The adapter computed the required cases by rounding up:
$$\text{Qty} = \left\lceil \frac{20 \text{ units needed}}{10 \text{ PackSize}} \right\rceil = 2 \text{ cases}$$
The purchase order was submitted with `Qty = 2`. When the background poller detects that the order reaches status `40` (Delivered), the restock calculation computes $2 \text{ cases} \times 10 = 20 \text{ units}$, restoring exactly 20 retail units into `inventory` via `SupplierOrderDeliveredEvent`.

---

### Question 3: Suppose LegacySupply is replaced next semester by a supplier with a JSON API and different status codes. List every class in your project that would have to change, and explain why your Order and Inventory modules are not on that list (or why they are).

If LegacySupply is replaced by a JSON-based supplier, the only classes that would change are strictly contained within the `edu.cit.quizana.supplier` package:
1. `XmlModels.java` (replaced with JSON DTOs or records).
2. `LegacySupplyHttpClient.java` (media type changes to `application/json` and endpoints/auth structure adapt to the new supplier API).
3. `SupplierProductCatalog.java` (re-mapped to the new supplier's SKUs and pack sizes).
4. `SupplierOrderPoller.java` (maps the new supplier's specific status codes to our internal `SupplierOrderStatus` enum).

Crucially, **`Order` and `Inventory` modules are NOT on that list**. Because of the Anti-Corruption Layer (ACL), our internal business modules only communicate through the clean, domain-centric `SupplierGateway` interface and domain events (`LowStockEvent`, `SupplierOrderDeliveredEvent`). They never import supplier XML classes, supplier SKUs, vendor pack sizes, or remote HTTP clients, leaving the core monolith completely immune to external API changes.
