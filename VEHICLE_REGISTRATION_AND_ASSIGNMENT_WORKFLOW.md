# Vehicle Registration and Assignment Workflow

## Overview

Complete workflow for vehicle management:

1. **Drivers** register vehicles with full details
2. **Admins** review and approve/reject registrations
3. **Admins** assign approved vehicles to customers based on cargo type

## Complete Workflow

```
Driver Registers Vehicle
         ↓
Vehicle Status = Pending
         ↓
Admin Reviews Vehicle
         ↓
    ┌────────┴────────┐
    ↓                 ↓
 Approve           Reject
    ↓                 ↓
Available       Send Reason
    ↓
Admin Gets Recommendations
    ↓
Admin Assigns to Customer
    ↓
Driver Delivers Item
```

---

## Step-by-Step Process

### 1️⃣ Driver Registers Vehicle

**Endpoint:** `POST /api/vehicles`  
**Role:** Driver

#### Required Fields:

```json
{
  "plateNumber": "ABC-123",
  "model": "Hino 500",
  "manufacturer": "Hino",
  "type": "truck",
  "capacity": {
    "weight": 5,
    "unit": "ton"
  },
  "year": 2020,
  "color": "White",
  "fuelType": "diesel",
  "insurance": {
    "expiryDate": "2025-12-31"
  }
}
```

#### Optional Fields:

- `insurance.company` - Insurance provider
- `insurance.policyNumber` - Policy number
- `insurance.document` - Document URL
- `registration.number` - Registration number
- `registration.expiryDate` - Registration expiry
- `registration.document` - Registration document URL
- `images` - Vehicle photos array
- `notes` - Additional information

#### Result:

- ✅ Vehicle saved with `approvalStatus: "pending"`
- 🔔 Admin notified: "A new vehicle registration request has been submitted for approval"

---

### 2️⃣ Admin Reviews Pending Registrations

**Endpoint:** `GET /api/vehicles/pending`  
**Role:** Admin

#### Response:

```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "vehicle_id",
      "plateNumber": "ABC-123",
      "model": "Hino 500",
      "manufacturer": "Hino",
      "type": "truck",
      "approvalStatus": "pending",
      "registeredBy": {
        "fullName": "John Driver",
        "phone": "+1234567890",
        "licenseNumber": "LIC-12345"
      }
    }
  ]
}
```

---

### 3️⃣ Admin Approves Vehicle

**Endpoint:** `PUT /api/vehicles/:id/approve`  
**Role:** Admin

#### Action:

- `approvalStatus` → `"approved"`
- `status` → `"available"`
- `approvedBy` → Admin ID
- `approvalDate` → Current timestamp

#### Notification to Driver:

🔔 "Your vehicle ABC-123 has been approved and is now available for assignments"

---

### 4️⃣ Admin Rejects Vehicle

**Endpoint:** `PUT /api/vehicles/:id/reject`  
**Role:** Admin

#### Request Body:

```json
{
  "reason": "Insurance document has expired"
}
```

#### Action:

- `approvalStatus` → `"rejected"`
- `status` → `"inactive"`
- `rejectionReason` → Provided reason

#### Notification to Driver:

🔔 "Your vehicle ABC-123 registration was rejected. Reason: Insurance document has expired"

---

### 5️⃣ Admin Gets Vehicle Recommendations

**Endpoint:** `GET /api/vehicles/recommendations`  
**Role:** Admin/Dispatcher

#### Query Parameters:

- `itemType` (required) - Type of cargo
- `weight` (optional) - Cargo weight
- `weightUnit` (optional) - "kg" or "ton"

#### Smart Matching Logic:

| Item Type                         | Recommended Vehicles |
| --------------------------------- | -------------------- |
| Documents, Envelopes, Letters     | Pickup, Van          |
| Furniture, Heavy Items, Machinery | Truck, Trailer       |
| Fragile Items, Electronics        | Van, Pickup          |
| Bulk, Construction Materials      | Truck, Trailer       |
| Other                             | Van, Pickup, Truck   |

#### Example Request:

```
GET /api/vehicles/recommendations?itemType=Heavy%20cargo&weight=3&weightUnit=ton
```

#### Example Response:

```json
{
  "success": true,
  "count": 3,
  "itemType": "Heavy cargo",
  "recommendedTypes": ["truck", "trailer"],
  "data": [
    {
      "_id": "vehicle_id",
      "plateNumber": "TRK-456",
      "model": "Hino 500",
      "type": "truck",
      "capacity": { "weight": 5, "unit": "ton" },
      "status": "available",
      "approvalStatus": "approved"
    }
  ]
}
```

---

### 6️⃣ Admin Assigns Vehicle to Customer

**Endpoint:** `PUT /api/vehicles/:id/assign-customer`  
**Role:** Admin

#### Request Body:

```json
{
  "customerId": "customer_123",
  "itemType": "Heavy machinery",
  "shipmentId": "SHP-202501-001" // optional
}
```

#### Validation Checks:

✅ Vehicle must be approved  
✅ Vehicle must be available  
✅ Customer must exist

#### Action:

- `assignedCustomer` → Customer ID
- `assignedItemType` → "Heavy machinery"
- `assignedAt` → Current timestamp
- `status` → `"in_use"`

#### Notification to Driver:

🔔 "Your vehicle TRK-456 has been assigned to deliver Heavy machinery for shipment #SHP-202501-001"

---

### 7️⃣ Admin Unassigns Vehicle

**Endpoint:** `PUT /api/vehicles/:id/unassign`  
**Role:** Admin

#### Action:

- Clears `assignedCustomer`, `assignedItemType`, `assignedAt`
- `status` → `"available"`

---

## API Reference Summary

### Driver Endpoints

| Method | Endpoint            | Description          |
| ------ | ------------------- | -------------------- |
| POST   | `/api/vehicles`     | Register new vehicle |
| GET    | `/api/vehicles`     | View own vehicles    |
| GET    | `/api/vehicles/:id` | View vehicle details |

### Admin Endpoints

| Method | Endpoint                            | Description                 |
| ------ | ----------------------------------- | --------------------------- |
| GET    | `/api/vehicles`                     | View all vehicles           |
| GET    | `/api/vehicles/pending`             | View pending registrations  |
| GET    | `/api/vehicles/recommendations`     | Get vehicle recommendations |
| GET    | `/api/vehicles/stats`               | Get fleet statistics        |
| PUT    | `/api/vehicles/:id/approve`         | Approve vehicle             |
| PUT    | `/api/vehicles/:id/reject`          | Reject vehicle              |
| PUT    | `/api/vehicles/:id/assign-customer` | Assign to customer          |
| PUT    | `/api/vehicles/:id/unassign`        | Unassign from customer      |
| PUT    | `/api/vehicles/:id/status`          | Update status               |
| PUT    | `/api/vehicles/:id`                 | Update vehicle details      |
| DELETE | `/api/vehicles/:id`                 | Delete vehicle              |

---

## Vehicle Data Fields

### Registration Fields (Driver Input)

- `plateNumber` ⚠️ Required, Unique
- `model` ⚠️ Required
- `manufacturer` ⚠️ Required
- `type` ⚠️ Required (truck/van/pickup/trailer/other)
- `capacity.weight` ⚠️ Required
- `capacity.unit` ⚠️ Required (kg/ton)
- `year` ⚠️ Required (1990 - current)
- `color` ⚠️ Required
- `fuelType` ⚠️ Required (petrol/diesel/cng/electric/hybrid)
- `insurance.expiryDate` ⚠️ Required

### Approval Fields (System Managed)

- `registeredBy` - Driver who registered
- `approvalStatus` - pending/approved/rejected
- `approvedBy` - Admin who approved
- `approvalDate` - When approved
- `rejectionReason` - Reason if rejected

### Assignment Fields (Admin Managed)

- `assignedCustomer` - Customer ID
- `assignedItemType` - Cargo type
- `assignedAt` - Assignment timestamp

### Status Fields

- `status` - available/in_use/maintenance/inactive
- `currentDriver` - Current driver reference

---

## Notification Flow

| Event                     | Recipient | Message                                                                    |
| ------------------------- | --------- | -------------------------------------------------------------------------- |
| Driver registers vehicle  | Admin     | "A new vehicle registration request has been submitted for approval"       |
| Admin approves            | Driver    | "Your vehicle {plateNumber} has been approved and is ready for assignment" |
| Admin rejects             | Driver    | "Your vehicle {plateNumber} registration was rejected. Reason: {reason}"   |
| Admin assigns to customer | Driver    | "Your vehicle {plateNumber} has been assigned to deliver {itemType}"       |

---

## Vehicle Status Flow

```
pending → approved → available → in_use → available
   ↓
rejected → inactive
```

## Best Practices

1. **For Drivers:**
   - Provide accurate vehicle information
   - Upload clear photos and documents
   - Keep insurance and registration current

2. **For Admins:**
   - Review all documents before approval
   - Use recommendation system for optimal assignments
   - Consider cargo type and weight when assigning
   - Provide clear rejection reasons

3. **Vehicle Type Selection Guide:**
   - **Pickup**: Light cargo, documents, small packages
   - **Van**: Medium cargo, fragile items, electronics
   - **Truck**: Heavy cargo, furniture, bulk items
   - **Trailer**: Extra heavy, construction materials, machinery
