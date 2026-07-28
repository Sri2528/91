// server.js — entry point.
// Run with: npm start
// This wires together the three route groups (centres, bookings, enquiries)
// under one Express app, so the frontend only ever talks to one server
// on one port, at different URL paths.

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const centresRoutes = require('./routes/centres');
const bookingsRoutes = require('./routes/bookings');
const enquiriesRoutes = require('./routes/enquiries');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());            // allows the React frontend (different port/origin) to call this API
app.use(express.json());    // parses incoming JSON request bodies into req.body

// Health check — useful to confirm the server is alive
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/centres', centresRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/enquiries', enquiriesRoutes);

// Bookings routes also expose /api/bookings/slots — mounted above already.

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`91Sporting backend running at http://localhost:${PORT}`);
  console.log(`Try: http://localhost:${PORT}/api/centres`);
});
