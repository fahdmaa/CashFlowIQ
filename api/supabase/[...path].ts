import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { registerSupabaseRoutes } from '../../server/supabase-routes';

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize routes (this will happen once)
let initialized = false;
const initPromise = (async () => {
  if (!initialized) {
    await registerSupabaseRoutes(app);
    initialized = true;
  }
})();

// Vercel serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Wait for initialization
  await initPromise;
  
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Pass the request to Express
  return new Promise((resolve) => {
    app(req as any, res as any, () => {
      resolve(undefined);
    });
  });
}