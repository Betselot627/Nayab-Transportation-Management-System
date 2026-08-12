const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const Shipment = require('../models/Shipment');
const Trip = require('../models/Trip');
const Customer = require('../models/Customer');
const Notification = require('../models/Notification');

const vehicleController = require('../controllers/vehicleController');
const shipmentController = require('../controllers/shipmentController');
const tripController = require('../controllers/tripController');

function createMockReqRes(user, body = {}, params = {}, query = {}) {
  let resStatus = 200;
  let resJson = null;

  const req = {
    user,
    body,
    params,
    query,
  };

  const res = {
    status(s) {
      resStatus = s;
      return this;
    },
    json(data) {
      resJson = data;
      return this;
    },
  };

  return {
    req,
    res,
    getResponse: () => ({ status: resStatus, data: resJson }),
  };
}

async function runVerification() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ntms';
    console.log('Connecting to MongoDB at:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully.');

    // 1. Setup Test Users
    console.log('\n--- Step 1: Setting up Test Entities ---');
    const timestamp = Date.now();

    // Admin User
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Admin Verifier',
        email: `admin_${timestamp}@test.com`,
        password: 'password123',
        role: 'admin',
        phone: '0911000000',
      });
    }

    // Driver A
    let userDriverA = await User.create({
      name: `Driver Alpha ${timestamp}`,
      email: `driverA_${timestamp}@test.com`,
      password: 'password123',
      role: 'driver',
      phone: '0911111111',
    });
    let driverA = await Driver.create({
      userId: userDriverA._id,
      fullName: userDriverA.name,
      phone: userDriverA.phone,
      licenseNumber: `DL-A-${timestamp}`,
      licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      experience: 5,
      status: 'available',
    });

    // Driver B
    let userDriverB = await User.create({
      name: `Driver Beta ${timestamp}`,
      email: `driverB_${timestamp}@test.com`,
      password: 'password123',
      role: 'driver',
      phone: '0922222222',
    });
    let driverB = await Driver.create({
      userId: userDriverB._id,
      fullName: userDriverB.name,
      phone: userDriverB.phone,
      licenseNumber: `DL-B-${timestamp}`,
      licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      experience: 7,
      status: 'available',
    });

    // Customer
    let userCustomer = await User.create({
      name: `Customer Alpha ${timestamp}`,
      email: `customer_${timestamp}@test.com`,
      password: 'password123',
      role: 'customer',
      phone: '0933333333',
    });
    let customer = await Customer.create({
      userId: userCustomer._id,
      companyName: 'Alpha Trading PLC',
      phone: userCustomer.phone,
    });

    console.log(`Created Driver A: ${driverA.fullName} (${driverA._id})`);
    console.log(`Created Driver B: ${driverB.fullName} (${driverB._id})`);
    console.log(`Created Customer: ${customer.companyName} (${customer._id})`);

    // 2. Test Vehicle Registration & Isolation
    console.log('\n--- Step 2: Testing Driver Vehicle Isolation & Registration ---');

    // Driver A registers Vehicle A
    const reqResA = createMockReqRes({ id: userDriverA._id, role: 'driver' }, {
      plateNumber: `ET-A-${timestamp}`,
      type: 'truck',
      color: 'White',
      capacity: { weight: 5000, unit: 'kg' },
      manufacturer: 'Isuzu',
      model: 'NPR',
      year: 2022,
    });
    await vehicleController.createVehicle(reqResA.req, reqResA.res);
    const vehicleARes = reqResA.getResponse();
    const vehicleAId = vehicleARes.data?.data?._id;
    console.log(`Driver A registered Vehicle A: Plate ${vehicleARes.data?.data?.plateNumber}, Approval: ${vehicleARes.data?.data?.approvalStatus}`);
    if (vehicleARes.data?.data?.approvalStatus !== 'pending') {
      throw new Error(`Expected vehicle approvalStatus to be 'pending', got ${vehicleARes.data?.data?.approvalStatus}`);
    }

    // Driver B registers Vehicle B
    const reqResB = createMockReqRes({ id: userDriverB._id, role: 'driver' }, {
      plateNumber: `ET-B-${timestamp}`,
      type: 'van',
      color: 'Silver',
      capacity: { weight: 8000, unit: 'kg' },
      manufacturer: 'Volvo',
      model: 'FL',
      year: 2023,
    });
    await vehicleController.createVehicle(reqResB.req, reqResB.res);
    const vehicleBRes = reqResB.getResponse();
    const vehicleBId = vehicleBRes.data?.data?._id;
    console.log(`Driver B registered Vehicle B: Plate ${vehicleBRes.data?.data?.plateNumber}, Approval: ${vehicleBRes.data?.data?.approvalStatus}`);

    // Query vehicles as Driver A
    const listResA = createMockReqRes({ id: userDriverA._id, role: 'driver' });
    await vehicleController.getAllVehicles(listResA.req, listResA.res);
    const driverAList = listResA.getResponse().data?.data || [];
    console.log(`Driver A vehicle list count: ${driverAList.length}`);
    const driverAHasVehicleB = driverAList.some(v => String(v._id) === String(vehicleBId));
    if (driverAHasVehicleB) {
      throw new Error('FAILED ISOLATION: Driver A can see Driver B\'s vehicle in getAllVehicles!');
    }
    console.log('✅ Driver A only sees their own vehicle (Vehicle A). Vehicle B is NOT visible.');

    // Driver A attempts to view Vehicle B by ID directly
    const directResA = createMockReqRes({ id: userDriverA._id, role: 'driver' }, {}, { id: vehicleBId });
    await vehicleController.getVehicleById(directResA.req, directResA.res);
    const getBResponse = directResA.getResponse();
    console.log(`Driver A direct fetch of Vehicle B: HTTP ${getBResponse.status}`);
    if (getBResponse.status !== 403) {
      throw new Error(`Expected HTTP 403 Forbidden when Driver A accesses Vehicle B, got ${getBResponse.status}`);
    }
    console.log('✅ Driver A direct access to Driver B\'s vehicle was correctly FORBIDDEN (403).');

    // 3. Test Admin Vehicle Approval
    console.log('\n--- Step 3: Testing Admin Vehicle Approval ---');
    const approveRes = createMockReqRes({ id: adminUser._id, role: 'admin' }, {}, { id: vehicleAId });
    await vehicleController.approveVehicle(approveRes.req, approveRes.res);
    const approvedVehicle = await Vehicle.findById(vehicleAId);
    console.log(`Vehicle A approvalStatus after Admin approval: ${approvedVehicle.approvalStatus}, status: ${approvedVehicle.status}`);
    if (approvedVehicle.approvalStatus !== 'approved' || approvedVehicle.status !== 'available') {
      throw new Error('Vehicle A was not properly approved to available state!');
    }
    console.log('✅ Admin approval successfully activated Vehicle A.');

    // 4. Test Shipment Creation and Driver Assignment
    console.log('\n--- Step 4: Testing Shipment Creation and Assignment ---');
    const shipment = await Shipment.create({
      shipmentNumber: `SHP-TEST-${timestamp}`,
      customerId: customer._id,
      pickupLocation: { address: 'Bole Hub, Addis Ababa', city: 'Addis Ababa' },
      destination: { address: 'Industrial Park, Hawassa', city: 'Hawassa' },
      cargoDetails: { type: 'General Merchandise', weight: 3000, unit: 'kg' },
      scheduledPickupDate: new Date(),
      pricing: { basePrice: 15000, totalAmount: 18000 },
      finalPrice: 18000,
      paymentStatus: 'PAID',
      status: 'pending',
    });

    // Admin assigns Driver A and Vehicle A
    const assignRes = createMockReqRes({ id: adminUser._id, role: 'admin' }, {
      driverId: driverA._id.toString(),
      vehicleId: vehicleAId.toString(),
    }, { id: shipment._id.toString() });
    await shipmentController.assignShipment(assignRes.req, assignRes.res);
    const updatedShipment = await Shipment.findById(shipment._id);
    console.log(`Shipment status after assignment: ${updatedShipment.status}`);

    const trip = await Trip.findOne({ shipmentId: shipment._id });
    console.log(`Trip created: ID ${trip._id}, Status: ${trip.status}`);

    // 5. Test Strict 5-Stage Workflow & Skipping Prevention
    console.log('\n--- Step 5: Testing Strict 5-Stage Transitions & Skipping Prevention ---');

    // Attempt 5.1: Driver A tries to jump directly from 'assigned' to 'delivered'
    console.log('Attempting invalid transition: assigned -> delivered (skip step test)...');
    const skipRes = createMockReqRes({ id: userDriverA._id, role: 'driver' }, {
      status: 'delivered',
    }, { id: trip._id.toString() });
    await tripController.updateTripStatus(skipRes.req, skipRes.res);
    const skipResponse = skipRes.getResponse();
    console.log(`Invalid skip response: HTTP ${skipResponse.status}, Message: "${skipResponse.data?.message}"`);
    if (skipResponse.status !== 400) {
      throw new Error(`Expected HTTP 400 on step skip, got ${skipResponse.status}`);
    }
    console.log('✅ Backend successfully BLOCKED step skipping with 400 Bad Request.');

    // Step 1: Picked Up
    console.log('\nExecuting valid Step 1: assigned -> picked_up...');
    const step1Res = createMockReqRes({ id: userDriverA._id, role: 'driver' }, {
      status: 'picked_up',
    }, { id: trip._id.toString() });
    await tripController.updateTripStatus(step1Res.req, step1Res.res);
    const tripStep1 = await Trip.findById(trip._id);
    const shpStep1 = await Shipment.findById(shipment._id);
    console.log(`Trip Status: ${tripStep1.status}, Shipment Status: ${shpStep1.status}`);
    if (tripStep1.status !== 'picked_up' || shpStep1.status !== 'picked_up') {
      throw new Error('Step 1 failed to update to picked_up!');
    }
    console.log('✅ Step 1 (Picked Up) completed successfully and synchronized.');

    // Step 2: In Transit
    console.log('\nExecuting valid Step 2: picked_up -> in_transit...');
    const step2Res = createMockReqRes({ id: userDriverA._id, role: 'driver' }, {
      status: 'in_transit',
    }, { id: trip._id.toString() });
    await tripController.updateTripStatus(step2Res.req, step2Res.res);
    const tripStep2 = await Trip.findById(trip._id);
    const shpStep2 = await Shipment.findById(shipment._id);
    console.log(`Trip Status: ${tripStep2.status}, Shipment Status: ${shpStep2.status}`);
    if (tripStep2.status !== 'in_transit' || shpStep2.status !== 'in_transit') {
      throw new Error('Step 2 failed to update to in_transit!');
    }
    console.log('✅ Step 2 (In Transit) completed successfully and synchronized.');

    // Step 3: Arrived
    console.log('\nExecuting valid Step 3: in_transit -> arrived...');
    const step3Res = createMockReqRes({ id: userDriverA._id, role: 'driver' }, {
      status: 'arrived',
    }, { id: trip._id.toString() });
    await tripController.updateTripStatus(step3Res.req, step3Res.res);
    const tripStep3 = await Trip.findById(trip._id);
    const shpStep3 = await Shipment.findById(shipment._id);
    console.log(`Trip Status: ${tripStep3.status}, Shipment Status: ${shpStep3.status}`);
    if (tripStep3.status !== 'arrived' || shpStep3.status !== 'arrived') {
      throw new Error('Step 3 failed to update to arrived!');
    }
    console.log('✅ Step 3 (Arrived) completed successfully and synchronized.');

    // Step 4: Delivered
    console.log('\nExecuting valid Step 4: arrived -> completed (delivered)...');
    const step4Res = createMockReqRes({ id: userDriverA._id, role: 'driver' }, {
      status: 'completed',
    }, { id: trip._id.toString() });
    await tripController.updateTripStatus(step4Res.req, step4Res.res);
    const tripStep4 = await Trip.findById(trip._id);
    const shpStep4 = await Shipment.findById(shipment._id);
    console.log(`Trip Status: ${tripStep4.status}, Shipment Status: ${shpStep4.status}`);
    if (tripStep4.status !== 'completed' || (shpStep4.status !== 'delivered' && shpStep4.status !== 'completed')) {
      throw new Error('Step 4 failed to complete delivery!');
    }
    console.log('✅ Step 4 (Delivered) completed successfully and synchronized.');

    // 6. Verify Notifications
    console.log('\n--- Step 6: Verifying Multi-Recipient Notifications ---');
    const customerNotifications = await Notification.find({ userId: userCustomer._id }).sort({ createdAt: -1 });
    const adminNotifications = await Notification.find({ userId: adminUser._id }).sort({ createdAt: -1 });
    console.log(`Customer received ${customerNotifications.length} notifications.`);
    console.log(`Admin received ${adminNotifications.length} notifications.`);

    if (customerNotifications.length === 0) {
      throw new Error('Customer did not receive milestone notifications!');
    }

    const latestCustNotif = customerNotifications[0];
    console.log(`Latest Customer Notification: "${latestCustNotif.title}" - ${latestCustNotif.message}`);
    console.log(`Customer Action URL: ${latestCustNotif.actionUrl}`);

    console.log('\n======================================================');
    console.log('🎉 ALL NTMS WORKFLOW AND ISOLATION TESTS PASSED 100%! 🎉');
    console.log('======================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ VERIFICATION FAILED:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

runVerification();
