// test-cors.js - A script to verify CORS is working
const fetch = require('node-fetch');

// Colors for console output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';
const YELLOW = '\x1b[33m';

async function testCORS() {
  console.log(`${YELLOW}Testing CORS configuration...${RESET}\n`);
  
  try {
    // Test the CORS test endpoint
    console.log(`Testing endpoint: http://localhost:3000/test-cors`);
    const response = await fetch('http://localhost:3000/test-cors', {
      headers: {
        'Origin': 'http://localhost:5173' // Simulate request from frontend
      }
    });
    
    if (!response.ok) {
      console.log(`${RED}Error: Server responded with status ${response.status}${RESET}`);
      return;
    }
    
    const data = await response.json();
    console.log(`\n${GREEN}Server response:${RESET}`, JSON.stringify(data, null, 2));
    
    // Check response headers
    const corsHeader = response.headers.get('access-control-allow-origin');
    if (corsHeader) {
      console.log(`\n${GREEN}✓ CORS headers are present:${RESET}`);
      console.log(`  Access-Control-Allow-Origin: ${corsHeader}`);
    } else {
      console.log(`\n${RED}✗ CORS headers are missing!${RESET}`);
    }
    
    // Test the API endpoint
    console.log(`\n${YELLOW}Testing API endpoint: http://localhost:3000/api/services${RESET}`);
    const apiResponse = await fetch('http://localhost:3000/api/services', {
      headers: {
        'Origin': 'http://localhost:5173' // Simulate request from frontend
      }
    });
    
    const apiCorsHeader = apiResponse.headers.get('access-control-allow-origin');
    if (apiCorsHeader) {
      console.log(`${GREEN}✓ API endpoint has CORS headers:${RESET}`);
      console.log(`  Access-Control-Allow-Origin: ${apiCorsHeader}`);
      
      if (apiResponse.ok) {
        console.log(`${GREEN}✓ API endpoint returned status ${apiResponse.status}${RESET}`);
      } else {
        console.log(`${YELLOW}⚠ API endpoint returned status ${apiResponse.status}${RESET}`);
        console.log(`  This could be a different issue than CORS`);
      }
    } else {
      console.log(`${RED}✗ API endpoint is missing CORS headers!${RESET}`);
    }
    
    console.log(`\n${YELLOW}CORS Test Complete!${RESET}`);
    
  } catch (error) {
    console.log(`${RED}Error testing CORS: ${error.message}${RESET}`);
    console.log(`\nMake sure your server is running on port 3000`);
  }
}

testCORS();