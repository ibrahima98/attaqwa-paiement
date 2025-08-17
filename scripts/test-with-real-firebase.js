const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Pour tester, vous devez obtenir un vrai token Firebase depuis l'app mobile
// ou utiliser Firebase Admin pour en créer un
const REAL_FIREBASE_TOKEN = process.env.TEST_FIREBASE_TOKEN || 'test-token';

async function testWithRealFirebase() {
  console.log('🧪 Testing with Firebase Authentication...\n');

  const headers = {
    'Authorization': `Bearer ${REAL_FIREBASE_TOKEN}`,
    'Content-Type': 'application/json'
  };

  try {
    // Test 1: GET /api/entitlements (avec auth Firebase)
    console.log('1️⃣ Testing GET /api/entitlements with Firebase token...');
    try {
      const entitlementsRes = await axios.get(`${BASE_URL}/api/entitlements`, { headers });
      console.log('✅ Entitlements API:', entitlementsRes.data);
    } catch (error) {
      console.log('❌ Entitlements API failed:', error.response?.data || error.message);
    }

    // Test 2: POST /api/paydunya/checkout (avec auth Firebase)
    console.log('\n2️⃣ Testing POST /api/paydunya/checkout with Firebase token...');
    try {
      const checkoutRes = await axios.post(`${BASE_URL}/api/paydunya/checkout`, {
        planId: 'BOOK_PART_2'
      }, { headers });
      console.log('✅ Checkout API:', checkoutRes.data);
    } catch (error) {
      console.log('❌ Checkout API failed:', error.response?.data || error.message);
    }

    // Test 3: Test sans auth (devrait retourner 401)
    console.log('\n3️⃣ Testing without auth (should return 401)...');
    try {
      const noAuthRes = await axios.get(`${BASE_URL}/api/entitlements`);
      console.log('❌ Should have failed without auth:', noAuthRes.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly returned 401 for unauthorized request');
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testWithRealFirebase(); 