const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone, income_type, monthly_income, risk_tolerance } = req.body;

    // Check if user exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await pool.query(
      `INSERT INTO users (id, email, password, name, phone, income_type, monthly_income, risk_tolerance)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, email, hashedPassword, name, phone, income_type || 'salaried', monthly_income || 0, risk_tolerance || 'medium']
    );

    const token = jwt.sign({ userId, email }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: userId, email, name, phone }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt for:', req.body.email);
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    console.log('Querying database for user...');
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    console.log('Query result:', users.length, 'users found');
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    console.log('Comparing passwords...');
    const isValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isValid);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    console.log('Login successful for:', email);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        subscription_plan: user.subscription_plan,
        risk_tolerance: user.risk_tolerance,
        income_type: user.income_type,
        monthly_income: user.monthly_income
      }
    });
  } catch (error) {
    console.error('Login error details:', error.message);
    console.error('Login error stack:', error.stack);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.userId;
    const [users] = await pool.query(
      'SELECT id, email, name, phone, subscription_plan, risk_tolerance, income_type, monthly_income, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, phone, risk_tolerance, income_type, monthly_income } = req.body;

    await pool.query(
      `UPDATE users SET name = ?, phone = ?, risk_tolerance = ?, income_type = ?, monthly_income = ?, updated_at = NOW()
       WHERE id = ?`,
      [name, phone, risk_tolerance, income_type, monthly_income, userId]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Upgrade to paid plan
router.post('/upgrade', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    await pool.query(
      'UPDATE users SET subscription_plan = ? WHERE id = ?',
      ['paid', userId]
    );

    res.json({ message: 'Upgraded to paid plan successfully', plan: 'paid' });
  } catch (error) {
    console.error('Upgrade error:', error);
    res.status(500).json({ error: 'Failed to upgrade' });
  }
});

module.exports = router;
