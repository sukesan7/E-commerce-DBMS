import "dotenv/config";

import express from 'express';
import cookieSession from "cookie-session";
import path from 'path';

import db from "./database/oracelConnector.js";
import apiRoutes from './routes/index.js';

const app = express();
const port = 8000;

// Configure cookie session
app.use(cookieSession({
  keys: ["DemoSecret"],
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
}));

// Different body types
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public folder
app.use(express.static(path.join(process.cwd(), 'public')));

// Start the server
db.then((dbConn) => {
  if (!dbConn) {
    throw 'Database connection failed';
  }

  app.use((req, res, next) => {
    req.db = dbConn;
    next();
  });

  // API routes
  app.use('/api', apiRoutes);

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}).catch(err => {
  throw err;
});