const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { prepare } = require('../config/database');
// Register
router.post('/register', (req, res) => {
  const { username, email, password, phone } = req.body;

  if (!username || !email || !password || !phone) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);

    const user = db.prepare(`
      INSERT INTO users (username, email, password, phone)
      VALUES (?, ?, ?, ?)
    `).run(username, email, hashedPassword, phone);

    // Create wallet for new user
    db.prepare(`
      INSERT INTO wallets (user_id, balance)
      VALUES (?, 0)
    `).run(user.lastInsertRowid);

    const token = jwt.sign(
      { id: user.lastInsertRowid, username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.lastInsertRowid,
        username,
        email,
        phone,
        elo: 1200
      }
    });

  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        elo: user.elo,
        wins: user.wins,
        losses: user.losses
      }
    });

  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare('SELECT id, username, email, phone, elo, wins, losses FROM users WHERE id = ?').get(decoded.id);
    res.json(user);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;