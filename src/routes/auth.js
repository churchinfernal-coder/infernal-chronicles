const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const { appendAuditLog } = require('../middleware/security');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Healthcheck endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  const requestId = req.headers['x-request-id'] || Date.now().toString();
  try {
    const hash = await bcrypt.hash(password, 12);
    const user = new User({ username, password: hash, role });
    await user.save();
    appendAuditLog('register', { username, role }, requestId);
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    appendAuditLog('register_error', { error: err.message }, requestId);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const requestId = req.headers['x-request-id'] || Date.now().toString();
  try {
    const user = await User.findOne({ username });
    if (!user) throw new Error('User not found');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error('Invalid password');
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    appendAuditLog('login', { username, role: user.role }, requestId);
    res.json({ token });
  } catch (err) {
    appendAuditLog('login_error', { error: err.message }, requestId);
    res.status(401).json({ error: 'Login failed' });
  }
});

// Role-based access test
router.get('/me', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const requestId = req.headers['x-request-id'] || Date.now().toString();
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    appendAuditLog('me', { user: user.username, role: user.role }, requestId);
    res.json({ username: user.username, role: user.role });
  } catch (err) {
    appendAuditLog('me_error', { error: err.message }, requestId);
    res.status(401).json({ error: 'Unauthorized' });
  }
});

module.exports = router;
