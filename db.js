// db.js
// REAL relational database using SQLite (via Node's built-in node:sqlite).
//
// Why this is a genuine upgrade from the JSON file:
// - Data lives in proper TABLES with defined COLUMNS and TYPES, not a loose
//   JS object tree — this is what "relational database" means.
// - Relationships between tables (a slot belongs to a centre, a booking
//   belongs to a slot) are enforced with FOREIGN KEYs, not just matching IDs
//   by convention.
// - Queries use SQL, the same language Postgres/MySQL use. When you later
//   move to hosted Postgres, the SQL you write here barely changes — you're
//   mainly swapping the driver/connection, not re-learning a new language.
// - Concurrent writes (two people booking at the same second) are handled
//   safely by the database engine itself, not by us hoping nothing collides.

const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'data.sqlite'));

// --- Schema: define the shape of every table up front ---
db.exec(`
  CREATE TABLE IF NOT EXISTS centres (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    sport TEXT NOT NULL,
    address TEXT,
    pricePerHour INTEGER DEFAULT 0,
    photo TEXT
  );

  CREATE TABLE IF NOT EXISTS slots (
    id TEXT PRIMARY KEY,
    centreId TEXT NOT NULL,
    date TEXT NOT NULL,
    hour INTEGER NOT NULL,
    isBooked INTEGER DEFAULT 0,
    FOREIGN KEY (centreId) REFERENCES centres(id)
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    slotId TEXT NOT NULL,
    centreId TEXT NOT NULL,
    date TEXT NOT NULL,
    hour INTEGER NOT NULL,
    customerName TEXT NOT NULL,
    customerPhone TEXT NOT NULL,
    status TEXT DEFAULT 'confirmed',
    createdAt TEXT NOT NULL,
    FOREIGN KEY (slotId) REFERENCES slots(id)
  );

  CREATE TABLE IF NOT EXISTS enquiries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    message TEXT,
    status TEXT DEFAULT 'new',
    createdAt TEXT NOT NULL
  );
`);

// --- Seed centres, only if the table is empty (don't re-seed on every restart) ---
const { nanoid } = require('nanoid');

function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM centres').get().c;
  if (count > 0) return;

  const centres = [
    ['ullal', 'Ullal', 'Bengaluru', 'Football', '15th Cross, Ullal Main Rd, Muneshwaranagar, Jnana Ganga Nagar, Bengaluru, Karnataka 560056', 1200],
    ['club-polaris', 'Club Polaris', 'Bengaluru', 'Multi-sport', 'String Estate, Siddeshwara Apartment, Soundarya Layout, Sidedahalli, Karnataka 560073', 900],
    ['rt-nagar', 'RT Nagar', 'Bengaluru', 'Multi-sport', 'S 28, V NagenaHalli Main Road, near Church, Kanaka Nagar, RT Nagar, Bengaluru, Karnataka 560045', 800],
    ['pendelton-park', 'Pendelton Park', 'Bengaluru', 'Football', 'Pendleton Park, Rammana Layout, Byrathi, Karnataka 560077', 1000],
    ['svce-stadium', 'SVCE Stadium', 'Bengaluru', 'Athletics', 'SVCE Campus, Kempegowda Intl Airport Road, Vidya Nagar, Bengaluru, Karnataka 562157', 1500],
    ['turf-klub', 'Turf Klub, RR Nagar', 'Bengaluru', 'Football', 'Dr Arunachalam Rd, 3rd Block, 5th Stage, Rajarajeshwari Nagar, Bengaluru, Karnataka 560098', 1100],
    ['skk-sports-academy', 'SKK Sports Academy', 'Palakkad, Kerala', 'Academy / Multi-sport', 'Pulachithara, Vaniamkulam, Ottapalam Taluk, Palakkad District, Kerala 679522', 700],
    ['sahakarnagar', 'Sahakarnagar', 'Bengaluru', 'Cricket', 'Thindlu Main Road, Virupakshapura, Kodigehalli, Bengaluru, Karnataka 560097', 950]
  ];

  const insertCentre = db.prepare(
    'INSERT INTO centres (id, name, city, sport, address, pricePerHour) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertSlot = db.prepare(
    'INSERT INTO slots (id, centreId, date, hour, isBooked) VALUES (?, ?, ?, ?, 0)'
  );

  const today = new Date();

  for (const c of centres) {
    insertCentre.run(...c);
    const centreId = c[0];

    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() + d);
      const dateStr = date.toISOString().split('T')[0];

      for (let hour = 6; hour <= 21; hour++) {
        insertSlot.run(nanoid(10), centreId, dateStr, hour);
      }
    }
  }
}

seedIfEmpty();

module.exports = db;
