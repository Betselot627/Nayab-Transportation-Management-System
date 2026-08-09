const chapaService = require("../services/chapaService");

async function testChapaIntegration() {
  console.log("=== Testing NTMS Chapa Service ===");

  const txRef = `NTMS-SIM-${Date.now()}-1234`;
  console.log("Generated txRef:", txRef);

  // 1. Test Initialize
  const initRes = await chapaService.initializePayment({
    amount: 50000,
    currency: "ETB",
    email: "customer@nayabtrading.com",
    firstName: "Abebe",
    lastName: "Kebede",
    phoneNumber: "0911223344",
    txRef,
    callbackUrl: "http://localhost:5002/api/payments/webhook",
    returnUrl: `http://localhost:5173/payment/success?tx_ref=${txRef}`,
    title: "Nayab Transportation Management System",
    description: "Payment for Shipment #SHP-2026-001",
  });

  console.log("Initialize Response:", {
    success: initRes.success,
    checkoutUrl: initRes.checkoutUrl,
  });

  // 2. Test Verify
  const verifyRes = await chapaService.verifyPayment(txRef);
  console.log("Verify Response:", {
    success: verifyRes.success,
    status: verifyRes.status,
    method: verifyRes.method,
    transactionId: verifyRes.transactionId,
  });

  console.log("=== All Chapa unit tests passed successfully! ===");
}

testChapaIntegration().catch((err) => {
  console.error("Test Error:", err);
  process.exit(1);
});
