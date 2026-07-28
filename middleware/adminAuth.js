// adminAuth.js
// A DEMO-LEVEL admin check: the request must send a header
//   x-admin-key: <the secret key>
// matching ADMIN_KEY in .env.
//
// This is fine for a local demo. Before going live, replace this with:
//   - Proper login (email/password, hashed with bcrypt)
//   - Sessions or JWT tokens issued after login
//   - Rate limiting on the login route
// Teaching note: an API key in a header is "something you have" auth —
// simple, but anyone who gets the key has full admin access. Real user
// logins add "something you know" (password) and can be revoked per-user.

require('dotenv').config();

function adminAuth(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (!key || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized. Missing or invalid admin key.' });
  }
  next();
}

module.exports = adminAuth;
