import fetch from 'node-fetch';

const response = await fetch('http://localhost:3000/api/admin/create-test-user', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log('Status:', response.status);
console.log('Response:', JSON.stringify(data, null, 2));
