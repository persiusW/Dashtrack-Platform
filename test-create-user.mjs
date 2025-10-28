
import http from 'http';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/create-test-user',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('🚀 Calling API endpoint to create test user...\n');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
    
    try {
      const json = JSON.parse(data);
      if (json.success) {
        console.log('\n🎉 SUCCESS!\n');
        console.log('═══════════════════════════════════════');
        console.log('📧 Email:          ', json.email);
        console.log('🔑 Password:       ', 'password123');
        console.log('👤 User ID:        ', json.userId);
        console.log('🏢 Organization ID:', json.organizationId);
        console.log('═══════════════════════════════════════');
        console.log('\n✨ You can now sign in at: http://localhost:3000\n');
      } else {
        console.log('\n❌ Failed:', json.error);
        if (json.details) {
          console.log('Details:', json.details);
        }
      }
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
  console.log('\nMake sure the Next.js server is running on port 3000');
});

req.end();
