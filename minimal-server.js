// Minimal test server for debugging Railway deployment
import http from 'http';

const port = process.env.PORT || 5000; // Default to 5000 as Railway might expect this

console.log('Starting minimal server...');
console.log('PORT env var:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('All PORT-related env vars:', Object.keys(process.env).filter(k => k.includes('PORT')));

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  
  if (req.url === '/health') {
    res.end(JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      port: port,
      env: process.env.NODE_ENV 
    }));
  } else {
    res.end(JSON.stringify({ 
      message: 'Minimal server is working!', 
      timestamp: new Date().toISOString(),
      port: port
    }));
  }
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

server.listen(port, () => {
  console.log(`✅ Minimal server started successfully on port ${port}`);
});

// Keep process alive
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});