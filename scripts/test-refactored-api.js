const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Simuler un token Firebase (pour les tests)
const MOCK_FIREBASE_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJodHRwczovL2lkZW50aXR5dG9vbGtpdC5nb29nbGUuY29tL2dvb2dsZS5pZC90b2tlbiIsImlhdCI6MTczNDU2NzIwMCwiZXhwIjoxNzM0NTcwODAwLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20iLCJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJ1aWQiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0.test';

async function testAPI() {
  console.log('🧪 Testing Refactored APIs...\n');

  const headers = {
    'Authorization': `Bearer ${MOCK_FIREBASE_TOKEN}`,
    'Content-Type': 'application/json'
  };

  try {
    // Test 1: GET /api/entitlements (avec auth)
    console.log('1️⃣ Testing GET /api/entitlements...');
    try {
      const entitlementsRes = await axios.get(`${BASE_URL}/api/entitlements`, { headers });
      console.log('✅ Entitlements API:', entitlementsRes.data);
    } catch (error) {
      console.log('❌ Entitlements API failed:', error.response?.data || error.message);
    }

    // Test 2: POST /api/paydunya/checkout (avec auth)
    console.log('\n2️⃣ Testing POST /api/paydunya/checkout...');
    try {
      const checkoutRes = await axios.post(`${BASE_URL}/api/paydunya/checkout`, {
        planId: 'BOOK_PART_2'
      }, { headers });
      console.log('✅ Checkout API:', checkoutRes.data);
    } catch (error) {
      console.log('❌ Checkout API failed:', error.response?.data || error.message);
    }

    // Test 3: GET /api/paydunya/status (sans auth)
    console.log('\n3️⃣ Testing GET /api/paydunya/status...');
    try {
      const statusRes = await axios.get(`${BASE_URL}/api/paydunya/status?token=test-token`);
      console.log('✅ Status API:', statusRes.data);
    } catch (error) {
      console.log('❌ Status API failed:', error.response?.data || error.message);
    }

    // Test 4: Test sans auth (devrait retourner 401)
    console.log('\n4️⃣ Testing without auth (should return 401)...');
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

testAPI(); 