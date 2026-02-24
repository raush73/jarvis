/**
 * JARVIS Backend Smoke Test
 * 
 * Usage: node scripts/smoke-test.js
 * 
 * Environment:
 *   BASE_URL - defaults to http://localhost:3000
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function smokeTest() {
  console.log(`\n=== JARVIS Smoke Test ===`);
  console.log(`Target: ${BASE_URL}\n`);

  let failures = 0;

  // Test 1: GET /healthz
  console.log('1) GET /healthz');
  try {
    const res = await fetch(`${BASE_URL}/healthz`);
    const body = await res.json();
    if (res.status === 200 && body.ok === true) {
      console.log(`   PASS: status=${res.status}, ok=${body.ok}, service=${body.service}`);
    } else {
      console.log(`   FAIL: expected status=200 and ok=true, got status=${res.status}, ok=${body.ok}`);
      failures++;
    }
  } catch (err) {
    console.log(`   FAIL: Server unreachable - ${err.message}`);
    console.log(`\n*** SMOKE TEST ABORTED: Server not running at ${BASE_URL} ***\n`);
    process.exit(1);
  }

  // Test 2: GET /readyz
  console.log('2) GET /readyz');
  try {
    const res = await fetch(`${BASE_URL}/readyz`);
    const body = await res.json();
    if (res.status === 200 && body.ok === true) {
      console.log(`   PASS: status=${res.status}, ok=${body.ok}`);
    } else {
      console.log(`   FAIL: expected status=200 and ok=true, got status=${res.status}, ok=${body.ok}`);
      failures++;
    }
  } catch (err) {
    console.log(`   FAIL: ${err.message}`);
    failures++;
  }

  // Test 3: POST /auth/login with empty body
  console.log('3) POST /auth/login (empty body)');
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (res.status !== 500) {
      console.log(`   PASS: status=${res.status} (not 500)`);
    } else {
      console.log(`   FAIL: expected non-500, got status=${res.status}`);
      failures++;
    }
  } catch (err) {
    console.log(`   FAIL: ${err.message}`);
    failures++;
  }

  // Summary
  console.log(`\n=== Summary ===`);
  if (failures === 0) {
    console.log('All smoke tests PASSED.\n');
    process.exit(0);
  } else {
    console.log(`${failures} test(s) FAILED.\n`);
    process.exit(1);
  }
}

smokeTest();

