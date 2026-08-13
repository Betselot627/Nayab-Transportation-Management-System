// Use native global fetch in Node 18+
async function testHttp() {
  const baseUrl = "http://127.0.0.1:5002/api";

  console.log("Attempting to login as admin...");
  let token = "";
  
  // Try login with Admin@123456 first, then Admin@123
  const passwords = ["Admin@123456", "Admin@123", "Password@123"];
  for (const password of passwords) {
    try {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@ntms.com", password })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        token = data.token;
        console.log(`✓ Logged in successfully with password: ${password}`);
        break;
      } else {
        console.log(`Failed login with password: ${password} (${data.message})`);
      }
    } catch (e) {
      console.log(`Error during login attempt: ${password}`, e.message);
    }
  }

  if (!token) {
    console.error("❌ Failed to obtain admin authentication token!");
    return;
  }

  const headers = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };

  // 1. Get Shipments
  console.log("\n1. Requesting GET /api/shipments?limit=100...");
  try {
    const res = await fetch(`${baseUrl}/shipments?limit=100`, { headers });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Success: ${data.success}`);
    if (!res.ok) {
      console.log(`Error Response:`, data);
    } else {
      console.log(`Count:`, data.data?.length || 0);
    }
  } catch (e) {
    console.error(`❌ Request failed:`, e.message);
  }

  // 2. Get Available Drivers
  console.log("\n2. Requesting GET /api/drivers/available...");
  try {
    const res = await fetch(`${baseUrl}/drivers/available`, { headers });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Success: ${data.success}`);
    if (!res.ok) {
      console.log(`Error Response:`, data);
    } else {
      console.log(`Count:`, data.data?.length || 0);
    }
  } catch (e) {
    console.error(`❌ Request failed:`, e.message);
  }

  // 3. Get Vehicles
  console.log("\n3. Requesting GET /api/vehicles?available=true&limit=100...");
  try {
    const res = await fetch(`${baseUrl}/vehicles?available=true&limit=100`, { headers });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Success: ${data.success}`);
    if (!res.ok) {
      console.log(`Error Response:`, data);
    } else {
      console.log(`Count:`, data.data?.length || 0);
    }
  } catch (e) {
    console.error(`❌ Request failed:`, e.message);
  }
}

testHttp().catch(console.error);
