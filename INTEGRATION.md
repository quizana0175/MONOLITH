# LegacySupply Integration Contract Discovery (Lab 3)

**Partner / Student ID**: `23-5396-310`  
**API Endpoint**: `https://legacysupply.onrender.com/api/v1`  
**Data Format**: `application/xml` (UTF-8)

---

## 1. Product Mapping Table

This table maps our internal inventory products to LegacySupply's specific supplier catalog items retrieved via `GET /api/v1/catalog`:

| Internal Product ID | Internal Name | Supplier SKU | LegacySupply Description | PackSize (UOM = CS) | Unit Cost |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **`P100`** | Wireless Mouse | **`QBN-4549`** | WIRELESS MOUSE 2.4GHZ | 10 | PHP 450.00 |
| **`P200`** | Mechanical Keyboard | **`QBN-3220`** | KEYBOARD MECH TKL | 10 | PHP 1,899.00 |
| **`P300`** | USB-C Hub | **`QBN-2379`** | USB HUB 4-PORT | 10 | PHP 399.00 |

*Additional available catalog items for our account:*
- `QBN-7441`: USB-C CABLE 1M BRAIDED (PackSize: 10, PHP 89.00)
- `QBN-7812`: SSD EXT 1TB (PackSize: 20, PHP 3,299.00)
- `QBN-7651`: HEADSET W/ MIC (PackSize: 10, PHP 999.00)
- `QBN-5609`: WEBCAM 1080P (PackSize: 12, PHP 1,499.00)
- `QBN-1018`: MOUSE PAD XL (PackSize: 6, PHP 250.00)
- `QBN-5612`: CHARGER GAN 65W (PackSize: 10, PHP 1,599.00)
- `QBN-2535`: FLASH DRIVE 64GB (PackSize: 10, PHP 349.00)

---

## 2. Session Lifetime Measurement

- **How Sessions Work**:
  - A session is requested via `POST /api/v1/auth/token` with an XML payload containing `ClientId` and `ApiKey`.
  - The returned `SessionToken` must be passed in the `X-LS-Session` header on all subsequent requests.
- **Measured Lifetime**:
  - Measured session duration is approximately **60 seconds (1 minute)**.
- **Adapter Strategy**:
  - The Anti-Corruption Layer caches the session token in memory.
  - When an outbound request encounters `401 Unauthorized` or an expired session, the adapter immediately catches the exception, transparently calls `renewSession()` to acquire a fresh token, and replays the request once without bubbling failure up to the business domains.

---

## 3. Error Codes Encountered & Root Causes

| Error Code | HTTP Status | Error Message / Description | Actual Cause Observed |
| :--- | :---: | :--- | :--- |
| **`E-AUTH-01`** | 401 | Credentials rejected | Incorrect Student ID or API Key sent in `AuthRequest`. |
| **`E-AUTH-02`** | 401 | Session header missing | Omitted `X-LS-Session` header on protected endpoints (`/catalog`, `/purchase-orders`). |
| **`E-AUTH-03`** | 401 | Session not recognized | Passing an invalid or expired token string. |
| **`E-FMT-01`** | 415 | Unsupported media | Sent `Content-Type: application/json` instead of `application/xml`. |
| **`E-FMT-02`** | 400 | Malformed document | Sent malformed XML syntax or missing closing tags. |
| **`E-REF-05`** | 400 | BuyerRef invalid | Sent empty `BuyerRef` or `BuyerRef` exceeding 40 characters. |
| **`E-SKU-02`** | 422 | Item not recognized | Sent a SKU not belonging to partner catalog (e.g. `P100-SKU` instead of `QBN-4549`). |
| **`E-QTY-11`** | 422 | Quantity invalid | Sent a quantity outside the range of 1 to 99 (e.g., 0 or 120). |
| **`E-IDEM-04`** | 409 | Request id reused with different content | Re-sent the same `X-Request-Id` with altered SKU, Qty, or BuyerRef. |
| **`E-RATE-03`** | 429 | Request quota exceeded | Triggered when polling too fast or bombarding the partner interface without pauses. |

---

## 4. Qty and UoM (Unit of Measure) Explained

### In Our Own Words
- **`UoM` (Unit of Measure)**: LegacySupply packages items in **Cases (`CS`)** or packs, never as loose individual units.
- **`Qty`**: The number of **Cases (`CS`)** being ordered, **not** the number of individual units.
- **`PackSize`**: How many loose retail units are packaged inside one single case (`CS`).

### Worked Example:
1. **Inventory Need**: Our inventory drops below safety threshold for **Wireless Mouse (`P100`)**, and we need **22 units** to replenish.
2. **Catalog Lookup**: `P100` maps to Supplier SKU `QBN-4549`, which has `PackSize = 10` (10 mice per case `CS`).
3. **Case Calculation (Rounding UP)**:
   $$\text{Cases to Order} = \left\lceil \frac{22 \text{ unitsNeeded}}{10 \text{ PackSize}} \right\rceil = \lceil 2.2 \rceil = 3 \text{ cases}$$
4. **Order Dispatched to LegacySupply**:
   ```xml
   <PurchaseOrder>
     <SupplierSku>QBN-4549</SupplierSku>
     <Qty>3</Qty>
     <BuyerRef>RO-SO-10001</BuyerRef>
   </PurchaseOrder>
   ```
5. **Restock on Delivery**:
   When LegacySupply reports `StatusCode 40` (Delivered), the inventory is restocked by:
   $$\text{Units Restocked} = 3 \text{ cases} \times 10 \text{ PackSize} = 30 \text{ units}$$
   Inventory increases by 30 units, satisfying our need of 22 with an 8-unit buffer.

---

## 5. Unrecognized / Chaos Status Handling

If LegacySupply returns an unexpected status code (e.g., during simulated carrier failure or chaos injection):
- Codes `10` (Accepted), `20` (Picking), `30` (Shipped) keep the order active in tracking.
- Code `40` (Delivered) transitions the local order to `DELIVERED` and emits `SupplierOrderDeliveredEvent` to trigger inventory restocking.
- Any unmapped error code (or `50`, `99`) is logged as a warning, flagged as `UNKNOWN` or `CANCELLED`, and kept from triggering erroneous restocks.
