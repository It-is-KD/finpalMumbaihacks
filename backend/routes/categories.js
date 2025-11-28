const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all categories
router.get('/', async (req, res) => {
  try {
    const [categories] = await pool.query(
      'SELECT * FROM categories ORDER BY is_system DESC, name ASC'
    );
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;
