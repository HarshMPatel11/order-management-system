import express from "express";
import { createServer } from "http";

// Import your routes
const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Temporary placeholder for routes - will need to adapt from server/routes.ts
app.get('/api/*', (req, res) => {
  res.json({ message: 'API endpoint', path: req.path });
});

// Export for Vercel
export default app;
