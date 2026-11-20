# KICK BUNK — POS & Kitchen KOT Integration Architecture

---

## 1. Overview & Data Flow
When a customer confirms an order via the Web or Mobile application, the order is persisted into the central PostgreSQL database and an outbox event is created atomically within the same transaction.

```
Customer Web / Mobile App
         |
         v
POST /api/v1/orders
         |
         v
+---------------------------------------+
|  DATABASE TRANSACTION                 |
|  1. Recalculate all item prices       |
|  2. Compute 5% GST (2.5% CGST/SGST)   |
|  3. Validate Alcohol 21+ eligibility  |
|  4. Insert into `orders`              |
|  5. Insert into `order_items`         |
|  6. Insert into `pos_outbox_events`   |
+---------------------------------------+
         |
         v
+-------------------------------------------------------+
|  POS / KITCHEN ADAPTER LAYER                          |
|  GET /api/v1/pos/outbox/pending?outlet_id=...         |
+-------------------------------------------------------+
         |
         +----------------------------------+
         |                                  |
         v                                  v
[ Kitchen Station Printers ]    [ KDS Bump Terminals ]
- Tandoor Section                - Starters Bump Bar
- Chinese Section                - Curry Station
- Resto-Bar Drink Counter        - Bar Counter
```

---

## 2. Event Catalog
The system emits the following events into `pos_outbox_events`:

| Event Name | Trigger Condition |
| :--- | :--- |
| `customer.order.created` | Customer submits new order |
| `customer.order.accepted` | Floor staff or POS operator confirms order |
| `customer.order.preparing` | Kitchen bumps order to cooking stage |
| `customer.order.ready` | Chef plates dish / mixologist finishes cocktail |
| `customer.order.served` | Server delivers order to table |
| `customer.payment.completed` | UPI / Card / Counter settlement verified |

---

## 3. POS Synchronization Endpoints

### 1. Fetch Pending Events
`GET /api/v1/pos/outbox/pending?outlet_id={outlet_id}&limit=20`

### 2. Acknowledge Event Ingestion
`POST /api/v1/pos/outbox/{event_id}/ack`

### 3. Kitchen KDS Bump Status
`POST /api/v1/pos/kds/bump`
```json
{
  "order_id": "uuid",
  "status": "PREPARING",
  "notes": "Ticket bumped on Tandoor Display"
}
```
This instantly broadcasts a WebSocket notification to the customer's phone!
