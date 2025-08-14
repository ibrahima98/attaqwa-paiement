const axios = require("axios");

const BASE_URL = "http://localhost:3000";

async function testEndpoints() {
  console.log("🧪 Test des endpoints API...\n");

  try {
    // Test 1: Endpoint entitlements (sans base de données)
    console.log("1️⃣ Test GET /api/entitlements");
    try {
      const response = await axios.get(`${BASE_URL}/api/entitlements?userId=test123`);
      console.log("✅ Succès:", response.data);
    } catch (error) {
      console.log("❌ Erreur (attendu sans DB):", error.response?.data || error.message);
    }

    // Test 2: Test PayDunya (sans base de données)
    console.log("\n2️⃣ Test POST /api/test-paydunya");
    try {
      const response = await axios.post(`${BASE_URL}/api/test-paydunya`, {
        userId: "test123",
        planId: "BOOK_PART_2"
      });
      console.log("✅ Succès PayDunya:", response.data);
      
      if (response.data.invoice_url) {
        console.log("🔗 URL de facture:", response.data.invoice_url);
      }
    } catch (error) {
      console.log("❌ Erreur PayDunya:", error.response?.data || error.message);
    }

    // Test 3: Test CORS
    console.log("\n3️⃣ Test CORS");
    try {
      const response = await axios.options(`${BASE_URL}/api/entitlements`);
      console.log("✅ CORS headers:", {
        "access-control-allow-origin": response.headers["access-control-allow-origin"],
        "access-control-allow-methods": response.headers["access-control-allow-methods"]
      });
    } catch (error) {
      console.log("❌ Erreur CORS:", error.message);
    }

    console.log("\n🎉 Tests terminés !");

  } catch (error) {
    console.error("❌ Erreur générale:", error.message);
  }
}

testEndpoints();
