# 91Sporting Backend (Demo API)

A working Node.js + Express API for venue bookings, enquiries, and admin
management — built to pair with the homepage mockup.

## What this is (and isn't)

**This is:** a fully working, tested backend with a **real relational
database** (SQLite, via Node's built-in `node:sqlite`). Centres, slots,
bookings, and enquiries live in proper SQL tables with foreign key
relationships — the same relational model Postgres/MySQL use.

**Requires Node.js 22.5 or newer** (for built-in SQLite support).

**This is not:** production-ready yet. Before real customers use this:
- **Move from SQLite to hosted Postgres** for production — with concurrent
  users across multiple server instances, a single local SQLite file
  becomes a bottleneck. The SQL you've already written barely changes;
  mainly the connection setup changes (e.g. using the `pg` package or an
  ORM like Prisma pointed at a Postgres connection string).
- Real admin login (email + hashed password) instead of a shared secret key
- Payment integration (Razorpay/Stripe) for actual bookings
- Input validation/rate limiting to prevent abuse
- HTTPS + proper hosting (Render, Railway, AWS, etc.)

## Setup

```bash
npm install
npm start
```

Server runs at `http://localhost:4000`. Change the port in `.env` if needed.
On first run, `data.sqlite` is created automatically and seeded with your
8 real centres + a week of hourly slots for each.

**Admin key:** set in `.env` as `ADMIN_KEY`. Change this before sharing the
project with anyone. Admin routes require this header:
```
x-admin-key: your-key-here
```

## Database schema

```
centres    (id, name, city, sport, address, pricePerHour, photo)
slots      (id, centreId → centres.id, date, hour, isBooked)
bookings   (id, slotId → slots.id, centreId, date, hour,
            customerName, customerPhone, status, createdAt)
enquiries  (id, name, phone, email, message, status, createdAt)
```

Inspect it directly anytime with any SQLite viewer, or:
```bash
node -e "
const {DatabaseSync} = require('node:sqlite');
const db = new DatabaseSync('./data.sqlite');
console.log(db.prepare('SELECT * FROM centres').all());
"
```

## API Reference

### Public routes (no auth needed)

| Method | Route | What it does |
|---|---|---|
| GET | `/api/health` | Check server is running |
| GET | `/api/centres` | List all centres. Supports `?city=` and `?sport=` filters |
| GET | `/api/centres/:id` | Get one centre + its slots |
| GET | `/api/bookings/slots?centreId=&date=` | Check slot availability |
| POST | `/api/bookings` | Book a slot — body: `{ slotId, customerName, customerPhone }` |
| POST | `/api/enquiries` | Submit contact/partner form — body: `{ name, phone, email, message }` |

### Admin routes (require `x-admin-key` header)

| Method | Route | What it does |
|---|---|---|
| POST | `/api/centres` | Add a new centre |
| PUT | `/api/centres/:id` | Edit a centre |
| DELETE | `/api/centres/:id` | Remove a centre |
| GET | `/api/bookings` | View all bookings |
| DELETE | `/api/bookings/:id` | Cancel a booking, free the slot |
| GET | `/api/enquiries` | View all enquiries |
| PUT | `/api/enquiries/:id` | Mark enquiry as read/resolved |

## Example: booking a slot

```bash
# 1. Find an available slot
curl "http://localhost:4000/api/bookings/slots?centreId=ullal"

# 2. Book it (use a real slotId from the response above)
curl -X POST http://localhost:4000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"slotId":"SLOT_ID_HERE","customerName":"Your Name","customerPhone":"9876543210"}'

# 3. Try booking the SAME slot again — it will correctly reject with
#    "This slot is already booked"
```

## Connecting your frontend

The homepage mockup (`91sporting-homepage-mockup.html`) already points at
`http://localhost:4000` by default. Just run this backend and open the
HTML file — centres load live, and the callback form submits real
enquiries.

To connect from a React app instead:
```javascript
const res = await fetch('http://localhost:4000/api/centres');
const centres = await res.json();
```

CORS is already enabled, so your frontend (even on a different port,
like localhost:3000) can call this API directly.

## Resetting data

Delete `data.sqlite` and restart the server — it'll recreate all tables
and reseed the original 8 centres and their weekly slots.

