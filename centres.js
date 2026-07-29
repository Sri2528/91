const express = require('express');
const router = express.Router();
const db = require('../db');
const adminAuth = require('../middleware/adminAuth');
const { nanoid } = require('nanoid');

// GET /api/centres — public, list all centres (with optional filters)
router.get('/', (req, res) => {
  const { city, sport } = req.query;

  let query = 'SELECT * FROM centres WHERE 1=1';
  const params = [];

  if (city) { query += ' AND city LIKE ?'; params.push(`%${city}%`); }
  if (sport) { query += ' AND sport LIKE ?'; params.push(`%${sport}%`); }

  const centres = db.prepare(query).all(...params);
  res.json(centres);
});

// GET /api/centres/:id — public, single centre + its slots
router.get('/:id', (req, res) => {
  const centre = db.prepare('SELECT * FROM centres WHERE id = ?').get(req.params.id);
  if (!centre) return res.status(404).json({ error: 'Centre not found' });

  const slots = db.prepare('SELECT * FROM slots WHERE centreId = ?').all(req.params.id);
  res.json({ ...centre, slots });
});

// POST /api/centres — ADMIN ONLY
router.post('/', adminAuth, (req, res) => {
  const { name, city, sport, address, pricePerHour } = req.body;
  if (!name || !city) return res.status(400).json({ error: 'name and city are required' });

  const id = nanoid(8);
  db.prepare(
    'INSERT INTO centres (id, name, city, sport, address, pricePerHour) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, name, city, sport || 'Multi-sport', address || '', pricePerHour || 0);

  res.status(201).json({ id, name, city, sport, address, pricePerHour });
});

// PUT /api/centres/:id — ADMIN ONLY
router.put('/:id', adminAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM centres WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Centre not found' });

  const updated = { ...existing, ...req.body };
  db.prepare(
    'UPDATE centres SET name=?, city=?, sport=?, address=?, pricePerHour=? WHERE id=?'
  ).run(updated.name, updated.city, updated.sport, updated.address, updated.pricePerHour, req.params.id);

  res.json(updated);
});

// DELETE /api/centres/:id — ADMIN ONLY
router.delete('/:id', adminAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM centres WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Centre not found' });

  db.prepare('DELETE FROM slots WHERE centreId = ?').run(req.params.id);
  db.prepare('DELETE FROM centres WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
