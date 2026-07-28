const express = require('express');
const router = express.Router();
const db = require('../db');
const adminAuth = require('../middleware/adminAuth');
const { nanoid } = require('nanoid');

// GET /api/bookings/slots?centreId=&date= — public, check availability
router.get('/slots', (req, res) => {
  const { centreId, date } = req.query;
  let query = 'SELECT * FROM slots WHERE 1=1';
  const params = [];

  if (centreId) { query += ' AND centreId = ?'; params.push(centreId); }
  if (date) { query += ' AND date = ?'; params.push(date); }

  const slots = db.prepare(query).all(...params);
  res.json(slots);
});

// POST /api/bookings — public, create a booking for a slot
router.post('/', (req, res) => {
  const { slotId, customerName, customerPhone } = req.body;
  if (!slotId || !customerName || !customerPhone) {
    return res.status(400).json({ error: 'slotId, customerName and customerPhone are required' });
  }

  const slot = db.prepare('SELECT * FROM slots WHERE id = ?').get(slotId);
  if (!slot) return res.status(404).json({ error: 'Slot not found' });
  if (slot.isBooked) return res.status(409).json({ error: 'This slot is already booked' });

  // Teaching note: this is still "check, then write" in two steps, same as
  // before. A real production system under heavy concurrent load would wrap
  // this in a SQL transaction with a UNIQUE constraint on slotId in the
  // bookings table, so the database itself rejects a double-write even if
  // two requests arrive at the exact same millisecond. For a single-server
  // demo like this, the risk window is negligible, but it's worth knowing
  // this is the next hardening step.
  db.prepare('UPDATE slots SET isBooked = 1 WHERE id = ?').run(slotId);

  const booking = {
    id: nanoid(10),
    slotId,
    centreId: slot.centreId,
    date: slot.date,
    hour: slot.hour,
    customerName,
    customerPhone,
    status: 'confirmed',
    createdAt: new Date().toISOString()
  };

  db.prepare(
    `INSERT INTO bookings (id, slotId, centreId, date, hour, customerName, customerPhone, status, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(booking.id, booking.slotId, booking.centreId, booking.date, booking.hour,
        booking.customerName, booking.customerPhone, booking.status, booking.createdAt);

  res.status(201).json(booking);
});

// GET /api/bookings — ADMIN ONLY
router.get('/', adminAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM bookings').all());
});

// DELETE /api/bookings/:id — ADMIN ONLY, cancel + free the slot
router.delete('/:id', adminAuth, (req, res) => {
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  db.prepare('UPDATE slots SET isBooked = 0 WHERE id = ?').run(booking.slotId);
  db.prepare('DELETE FROM bookings WHERE id = ?').run(req.params.id);

  res.json({ success: true });
});

module.exports = router;
