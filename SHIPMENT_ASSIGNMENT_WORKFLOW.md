# Shipment Assignment Workflow - Auto Vehicle Selection

## Overview

When admin assigns a shipment to a driver, the system **automatically selects** the best vehicle from the driver's registered vehicles based on the cargo type and weight.

## Complete Workflow

```
Customer Creates Shipment
         ↓
Admin Reviews Shipment
         ↓
Admin Selects ONLY Driver
         ↓
System Auto-Selects Best Vehicle
   (from driver's approved vehicles)
         ↓
Driver Receives Assignment
   (with assigned vehicle details)
         ↓
Driver Delivers Shipment
```

---

## Step-by-Step Process

### 1️⃣ Customer Creates Shipment

**Endpoint:** `POST /api/shipments`  
**Role:** Customer

**Required Information:**

- Pickup location
- Destination
- Cargo details:
  - Type (e.g., "Heavy machinery", "Documents", "Fragile electronics")
  - Weight & unit (kg or ton)
  - Description
  - Quantity

**Result:**

- Shipment created with status: `pending`
- Customer stats updated

---

### 2️⃣ Admin Assigns Shipment to Driver

**Endpoint:** `PUT /api/shipments/:id/assign`  
**Role:** Admin/Dispatcher

**Request Body:**

```json
{
  "driverId": "driver_id"
}
```

**Note:** ⚠️ Admin ONLY selects driver - NO vehicle selection needed!

---

### 3️⃣ System Auto-Selects Vehicle

#### Validation Checks:

1. ✅ Driver exists
2. ✅ Driver has approved vehicles
3. ✅ Driver has available vehicles

#### Smart Vehicle Selection Algorithm:

**Step 1: Filter by Cargo Type**

| Cargo Type Keywords         | Recommended Vehicles |
| --------------------------- | -------------------- |
| document, envelope, letter  | Pickup, Van          |
| furniture, heavy, machinery | Truck, Trailer       |
| fragile, electronics        | Van, Pickup          |
| bulk, construction          | Truck, Trailer       |
| Other                       | All vehicle types    |

**Step 2: Filter by Capacity**

- Convert cargo weight to kg
- Convert vehicle capacity to kg
- Find smallest vehicle that meets capacity requirement

**Step 3: Fallback**

- If no vehicle matches type: use all driver vehicles
- If no vehicle meets capacity: use largest available vehicle

---

### 4️⃣ System Updates

#### Shipment Updates:

- `driverId` → Selected driver ID
- `vehicleId` → Auto-selected vehicle ID
- `status` → `"assigned"`
- `statusHistory` → Add assignment record with vehicle plate number

#### Vehicle Updates:

- `status` → `"in_use"`
- `assignedCustomer` → Customer ID
- `assignedItemType` → Cargo type
- `assignedAt` → Current timestamp

#### Driver Updates:

- `status` → `"on_trip"`

#### Trip Creation:

- New trip record created
- Links shipment, driver, and vehicle

---

### 5️⃣ Notification Sent to Driver

**Notification Details:**

- Title: "New Trip Assigned"
- Message: "You have been assigned to shipment {shipmentNumber} with vehicle {plateNumber}"
- Type: "trip"
- Includes shipment link

---

## API Response

```json
{
  "success": true,
  "message": "Shipment assigned successfully",
  "data": {
    "shipment": {
      "_id": "shipment_id",
      "shipmentNumber": "SHP-202501-001",
      "driverId": "driver_id",
      "vehicleId": "vehicle_id",
      "status": "assigned"
    },
    "trip": {
      "_id": "trip_id",
      "shipmentId": "shipment_id",
      "driverId": "driver_id",
      "vehicleId": "vehicle_id"
    },
    "selectedVehicle": {
      "_id": "vehicle_id",
      "plateNumber": "ABC-123",
      "type": "truck",
      "model": "Hino 500"
    }
  }
}
```

---

## Example Scenarios

### Scenario 1: Light Documents

**Cargo:** "Office documents", 5 kg  
**Driver Vehicles:**

- Van (500 kg capacity) ✅
- Truck (5 ton capacity)

**Selected:** Van (appropriate type, sufficient capacity)

---

### Scenario 2: Heavy Machinery

**Cargo:** "Construction machinery", 3 ton  
**Driver Vehicles:**

- Pickup (800 kg capacity) ❌
- Truck (5 ton capacity) ✅

**Selected:** Truck (appropriate type, sufficient capacity)

---

### Scenario 3: Fragile Electronics

**Cargo:** "Fragile electronics", 50 kg  
**Driver Vehicles:**

- Van (500 kg capacity) ✅
- Truck (3 ton capacity)

**Selected:** Van (appropriate for fragile, sufficient capacity)

---

### Scenario 4: Multiple Vehicles, No Type Match

**Cargo:** "General goods", 1 ton  
**Driver Vehicles:**

- Pickup (500 kg capacity) ❌
- Van (800 kg capacity) ❌
- Truck (2 ton capacity) ✅

**Selected:** Truck (smallest vehicle with sufficient capacity)

---

## Error Handling

### No Approved Vehicles

```json
{
  "success": false,
  "message": "Driver has no approved and available vehicles"
}
```

**Solution:** Admin must approve driver's vehicle registration first

---

### Driver Not Found

```json
{
  "success": false,
  "message": "Driver not found"
}
```

**Solution:** Verify driver ID is correct

---

### All Vehicles In Use

```json
{
  "success": false,
  "message": "Driver has no approved and available vehicles"
}
```

**Solution:** Select a different driver or wait for vehicle availability

---

## Benefits of Auto-Selection

✅ **Faster Assignment** - Admin only selects driver  
✅ **Smart Matching** - Algorithm matches cargo to appropriate vehicle  
✅ **Capacity Checking** - Ensures vehicle can handle the load  
✅ **Optimal Resource Use** - Selects smallest suitable vehicle  
✅ **Automatic Updates** - Vehicle and driver status updated  
✅ **Clear Notifications** - Driver knows which vehicle to use  
✅ **Audit Trail** - Assignment history includes vehicle details

---

## Admin UI Considerations

When building the admin shipment assignment interface:

1. **Driver Selection**
   - Show list of available drivers
   - Display driver info: name, license, current status
   - Show number of approved vehicles per driver

2. **Optional: Preview Selected Vehicle**
   - After selecting driver, show which vehicle will be auto-assigned
   - Display: plate number, type, model, capacity
   - Give option to "Confirm Assignment"

3. **Assignment Confirmation**
   - Show summary: Driver + Auto-selected Vehicle
   - Display match reasoning (e.g., "Selected Truck due to heavy cargo")
   - Confirm button to execute assignment

---

## Technical Notes

- Vehicle selection happens server-side for security
- Algorithm prioritizes cargo safety (type match) over efficiency
- Capacity check prevents overloading
- All updates are atomic (rollback on failure)
- Notifications sent asynchronously
- Vehicle availability checked in real-time

---

## Future Enhancements

1. **Driver Location** - Factor in driver proximity to pickup
2. **Vehicle Condition** - Consider maintenance status
3. **Route Optimization** - Select vehicle based on destination
4. **Cost Optimization** - Factor in fuel type and efficiency
5. **Manual Override** - Allow admin to manually select vehicle if needed
6. **Multi-Vehicle** - Support for shipments requiring multiple vehicles

---

## Summary

✅ **Simplified Workflow**: Admin selects driver only  
✅ **Smart Automation**: System picks best vehicle automatically  
✅ **Type-Based Matching**: Cargo type determines vehicle type  
✅ **Capacity Validation**: Ensures safe load limits  
✅ **Real-Time Updates**: All entities updated automatically  
✅ **Clear Communication**: Driver notified with complete details

**The shipment assignment process is now fully automated and intelligent!**
