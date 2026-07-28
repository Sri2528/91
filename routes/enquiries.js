const express = require('express');
const router = express.Router();
const db = require('../db');
const adminAuth = require('../middleware/adminAuth');
const { nanoid } = require('nanoid');

// POST /api/enquiries — public
router.post('/', (req, res) => {
  const { name, phone, email, message } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'name and phone are required' });

  const enquiry = {
    id: nanoid(10),
    name, phone,
    email: email || null,
    message: message || '',
    status: 'new',
    createdAt: new Date().toISOString()
  };

  db.prepare(
    'INSERT INTO enquiries (id, name, phone, email, message, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(enquiry.id, enquiry.name, enquiry.phone, enquiry.email, enquiry.message, enquiry.status, enquiry.createdAt);

  res.status(201).json({ success: true, enquiry });
});

// GET /api/enquiries — ADMIN ONLY
router.get('/', adminAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM enquiries').all());
});

// PUT /api/enquiries/:id — ADMIN ONLY
router.put('/:id', adminAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM enquiries WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Enquiry not found' });

  const status = req.body.status || 'read';
  db.prepare('UPDATE enquiries SET status = ? WHERE id = ?').run(status, req.params.id);

  res.json({ ...existing, status });
});

module.exports = router;
