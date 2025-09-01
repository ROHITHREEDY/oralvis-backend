const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) return res.status(400).json({ message: 'All fields required' });
    if (!['technician', 'dentist'].includes(role)) return res.status(400).json({ message: 'Role must be technician or dentist' });
    const existing = await User.findByEmail(email);
    if (existing) return res.status(400).json({ message: 'User already exists' });
    const user = await User.create(email, password, role);
    res.status(201).json({ message: 'User created', user });
  } catch (error) {
    res.status(500).json({ message: 'Registration error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    const user = await User.findByEmail(email);
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    if (!User.verifyPassword(password, user.password)) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role
    }, 'oralvis_secret_key_2025', { expiresIn: '24h' });
    res.json({ message: 'Login successful', token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Login error' });
  }
});

// Token verification middleware
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token provided.' });
  try {
    const decoded = jwt.verify(token, 'oralvis_secret_key_2025');
    req.user = decoded;
    next();
  } catch {
    res.status(400).json({ message: 'Invalid token' });
  }
};

router.get('/profile', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = { router, verifyToken };
