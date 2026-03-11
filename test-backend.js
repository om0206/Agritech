// Simple test to check if backend is running
const http = require('http');

console.log("Testing backend connection...");

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/farmers/1',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`✅ Backend is running! Status: ${res.statusCode}`);
  console.log('Headers:', res.headers);
  res.on('data', (d) => {
    console.log('Response:', d.toString().substring(0, 200));
  });
  res.on('end', () => {
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error(`❌ Cannot connect to backend:`, error.message);
  console.error('Make sure the backend is running on port 5000');
  process.exit(1);
});

req.end();

setTimeout(() => {
  console.error('❌ Request timeout');
  process.exit(1);
}, 5000);
