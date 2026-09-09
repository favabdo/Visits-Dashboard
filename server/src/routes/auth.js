const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

/**
 * POST /api/auth/login
 * Body: { username, password }
 * Returns: { accessToken }
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not set');
    return res.status(500).json({ error: 'Server auth is not configured' });
  }
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('Username', sql.NVarChar, username)
      .query(`
        SELECT Id, PasswordHash, Status, DatabaseName
        FROM dbo.Dashboard_Users
        WHERE [User] = @Username
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const row = result.recordset[0];
    const match = await bcrypt.compare(password, row.PasswordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (row.Status !== 1) {
      return res.status(403).json({ error: 'Account inactive' });
    }

    const payload = {
      sub: row.Id,
      role: row.Status === 1 ? 'user' : 'admin',
      databaseName: (row.DatabaseName || process.env.DB_DATABASE || '').trim(),
    };
    const signOptions = {};
    if (JWT_EXPIRES_IN) {
      signOptions.expiresIn = JWT_EXPIRES_IN;
    }
    const token = jwt.sign(payload, JWT_SECRET, signOptions);

    res.json({ accessToken: token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Optional: refresh token endpoint
 * For simplicity, we can issue a new token using a refresh token stored in HttpOnly cookie.
 * Here we just re-authenticate with username/password again (client can store credentials securely? not ideal).
 * We'll skip refresh token for now; client can re-login when token expires.
 */

module.exports = router;
