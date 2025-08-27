import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware for parsing request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const originalSend = res.send;
  
  res.send = function(data) {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
    return originalSend.call(this, data);
  };
  
  next();
});

// Serve static files from dist/public
const publicPath = path.join(__dirname, 'dist/public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
  console.log(`Serving static files from: ${publicPath}`);
} else {
  console.error(`Static files directory not found: ${publicPath}`);
}

// Basic API routes for demo/placeholder
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/config', (req, res) => {
  res.json({
    pocketbaseUrl: process.env.VITE_POCKETBASE_URL || 'https://your-app.pockethost.io',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Placeholder for other API routes
app.use('/api/*', (req, res) => {
  res.status(503).json({ 
    error: 'API endpoint not implemented',
    message: 'This is a placeholder Azure deployment. Implement your API routes here.',
    path: req.path
  });
});

// Fallback for client-side routing - serve index.html for non-API routes
app.get('*', (req, res) => {
  const indexPath = path.join(publicPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(503).send(`
      <html>
        <body>
          <h1>CashFlowIQ</h1>
          <p>Application temporarily unavailable - build files not found</p>
          <p>Static files path: ${publicPath}</p>
          <p>Index file exists: ${fs.existsSync(indexPath)}</p>
        </body>
      </html>
    `);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Application error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`CashFlowIQ server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Static files: ${publicPath}`);
  console.log(`Server ready at http://localhost:${port}`);
});