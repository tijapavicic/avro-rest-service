#!/bin/bash

# Mock Backend Server for Testing
# This creates a simple mock server that responds to the simulation API

echo "🚀 Starting Mock Backend Server..."
echo ""
echo "Server: https://localhost:8082"
echo "Endpoint: POST /api/simulations"
echo ""

# Create a temporary mock response
cat > /tmp/mock-response.json <<EOF
{
  "jobId": "test-job-$(date +%s)",
  "status": "SUBMITTED",
  "systemId": "TEST-001",
  "parameters": {
    "p1": 10.5,
    "q1": 25.0,
    "r1": 3.14
  },
  "submittedAt": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")",
  "message": "Simulation job successfully submitted to the queue"
}
EOF

echo "📋 Mock Response:"
cat /tmp/mock-response.json
echo ""
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    echo "   brew install node"
    exit 1
fi

# Check if json-server is installed
if ! command -v json-server &> /dev/null; then
    echo "📦 Installing json-server..."
    npm install -g json-server
fi

# Create a simple Express server for better control
cat > /tmp/mock-server.js <<'EOF'
const express = require('express');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8082;

// Enable CORS for all origins (testing only)
app.use(cors());
app.use(express.json());

// Mock POST endpoint
app.post('/api/simulations', (req, res) => {
  console.log('📥 Received simulation request:');
  console.log(JSON.stringify(req.body, null, 2));

  const response = {
    jobId: `job-${Date.now()}`,
    status: 'SUBMITTED',
    systemId: req.body.systemId || 'SYS-001',
    parameters: req.body.parameters || {},
    submittedAt: new Date().toISOString(),
    message: 'Simulation job successfully submitted'
  };

  console.log('📤 Sending response:');
  console.log(JSON.stringify(response, null, 2));
  console.log('');

  // Simulate some processing delay
  setTimeout(() => {
    res.json(response);
  }, 500);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Try to use HTTPS with self-signed cert, fallback to HTTP
const startServer = () => {
  try {
    // Try to load HTTPS certs (mkcert or self-signed)
    const certPath = process.env.HOME + '/.localhost-ssl';
    const httpsOptions = {
      key: fs.readFileSync(path.join(certPath, 'localhost-key.pem')),
      cert: fs.readFileSync(path.join(certPath, 'localhost-cert.pem'))
    };

    https.createServer(httpsOptions, app).listen(PORT, () => {
      console.log('✅ Mock HTTPS server running at https://localhost:' + PORT);
      console.log('📡 Ready to receive requests at POST /api/simulations');
      console.log('');
      console.log('Press Ctrl+C to stop');
    });
  } catch (err) {
    console.log('⚠️  HTTPS certs not found, starting HTTP server instead');
    app.listen(PORT, () => {
      console.log('✅ Mock HTTP server running at http://localhost:' + PORT);
      console.log('📡 Ready to receive requests at POST /api/simulations');
      console.log('');
      console.log('⚠️  Note: Frontend expects HTTPS. Either:');
      console.log('   1. Set up mkcert: brew install mkcert && mkcert localhost');
      console.log('   2. Update frontend to use http://localhost:8082');
      console.log('');
      console.log('Press Ctrl+C to stop');
    });
  }
};

startServer();
EOF

# Check if express is installed globally
if ! node -e "require('express')" 2>/dev/null; then
    echo "📦 Installing express and cors..."
    npm install -g express cors
fi

# Run the mock server
node /tmp/mock-server.js

