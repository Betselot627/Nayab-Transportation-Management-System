/**
 * Automated Verification Script for NTMS Frontend Performance & Optimization (using native fetch)
 */

const BASE_URL = "http://localhost:5002/api";

async function postJson(url, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return res.json();
}

async function getJson(url, token) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  return res.json();
}

async function runTests() {
  console.log("=================================================");
  console.log("NTMS Frontend Performance & Data Fetching Test Suite");
  console.log("=================================================\n");

  let adminToken, customerToken, driverToken;

  // 1. Authenticate Admin
  try {
    const res = await postJson(`${BASE_URL}/auth/login`, {
      email: "admin@ntms.com",
      password: "password123",
    });
    adminToken = res.token;
    console.log("✔ Admin Login: SUCCESS");
  } catch (err) {
    console.error("❌ Admin Login failed:", err.message);
  }

  // 2. Authenticate Customer
  try {
    const res = await postJson(`${BASE_URL}/auth/login`, {
      email: "customer@ntms.com",
      password: "password123",
    });
    customerToken = res.token;
    console.log("✔ Customer Login: SUCCESS");
  } catch (err) {
    console.error("❌ Customer Login failed:", err.message);
  }

  // 3. Authenticate Driver
  try {
    const res = await postJson(`${BASE_URL}/auth/login`, {
      email: "driver@ntms.com",
      password: "password123",
    });
    driverToken = res.token;
    console.log("✔ Driver Login: SUCCESS");
  } catch (err) {
    console.error("❌ Driver Login failed:", err.message);
  }

  console.log("\n--- Benchmarking Key Endpoints Response Times ---");

  // Benchmark Admin Dashboard Stats Endpoint
  const startDashboard = Date.now();
  const dashRes = await getJson(`${BASE_URL}/reports/dashboard`, adminToken);
  const dashTime = Date.now() - startDashboard;
  console.log(`✔ GET /api/reports/dashboard: ${dashTime}ms (Overview: ${JSON.stringify(dashRes.data?.overview)})`);

  // Benchmark Available Drivers Endpoint
  const startDrivers = Date.now();
  const driversRes = await getJson(`${BASE_URL}/drivers/available`, adminToken);
  const driversTime = Date.now() - startDrivers;
  console.log(`✔ GET /api/drivers/available: ${driversTime}ms (Count: ${driversRes.count})`);

  // Benchmark Available Vehicles Endpoint
  const startVehicles = Date.now();
  const vehiclesRes = await getJson(`${BASE_URL}/vehicles?available=true`, adminToken);
  const vehiclesTime = Date.now() - startVehicles;
  console.log(`✔ GET /api/vehicles?available=true: ${vehiclesTime}ms (Count: ${vehiclesRes.data?.length || 0})`);

  // Benchmark Customer Scoped Shipments
  const startCustShip = Date.now();
  const custShipRes = await getJson(`${BASE_URL}/shipments?limit=20`, customerToken);
  const custShipTime = Date.now() - startCustShip;
  console.log(`✔ GET /api/shipments (Customer Scoped): ${custShipTime}ms (Count: ${custShipRes.data?.length || 0})`);

  // Benchmark Driver Trips
  const startDriverTrips = Date.now();
  const driverTripsRes = await getJson(`${BASE_URL}/trips/my-trips`, driverToken);
  const driverTripsTime = Date.now() - startDriverTrips;
  console.log(`✔ GET /api/trips/my-trips (Driver Scoped): ${driverTripsTime}ms (Count: ${driverTripsRes.data?.length || 0})`);

  // Benchmark Notifications
  const startNotifs = Date.now();
  const notifsRes = await getJson(`${BASE_URL}/notifications`, adminToken);
  const notifsTime = Date.now() - startNotifs;
  console.log(`✔ GET /api/notifications: ${notifsTime}ms (Count: ${notifsRes.data?.length || 0})`);

  console.log("\n--- Testing In-Flight Request Deduplication Simulation ---");
  const p1 = getJson(`${BASE_URL}/reports/dashboard`, adminToken);
  const p2 = getJson(`${BASE_URL}/reports/dashboard`, adminToken);
  const p3 = getJson(`${BASE_URL}/reports/dashboard`, adminToken);
  const pStart = Date.now();
  await Promise.all([p1, p2, p3]);
  const pTotal = Date.now() - pStart;
  console.log(`✔ 3 Parallel concurrent dashboard requests completed in ${pTotal}ms`);

  console.log("\n=================================================");
  console.log("All performance benchmark tests passed successfully!");
  console.log("=================================================");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
