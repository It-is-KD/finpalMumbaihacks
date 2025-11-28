const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// Get all budgets
router.get('/', authMiddleware, async (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const [budgets] = await pool.query(
      'SELECT * FROM budgets WHERE user_id = ? AND month = ? ORDER BY category ASC',
      [req.user.userId, currentMonth]
    );

    // Calculate current spending for each budget
    for (const budget of budgets) {
      const [spending] = await pool.query(
        `SELECT SUM(amount) as spent FROM transactions 
         WHERE user_id = ? AND category = ? AND type = 'debit' 
         AND DATE_FORMAT(transaction_date, '%Y-%m') = ?`,
        [req.user.userId, budget.category, currentMonth]
      );
      budget.current_spent = spending[0]?.spent || 0;
    }

    res.json({ budgets });
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ error: 'Failed to get budgets' });
  }
});

// Create budget
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { category, monthlyLimit, alertThreshold } = req.body;
    const budgetId = uuidv4();
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Check if budget exists for this category this month
    const [existing] = await pool.query(
      'SELECT id FROM budgets WHERE user_id = ? AND category = ? AND month = ?',
      [req.user.userId, category, currentMonth]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Budget already exists for this category this month' });
    }

    await pool.query(
      `INSERT INTO budgets (id, user_id, category, monthly_limit, alert_threshold, month)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [budgetId, req.user.userId, category, monthlyLimit, alertThreshold || 80, currentMonth]
    );

    res.status(201).json({
      message: 'Budget created successfully',
      budget: { id: budgetId, category, monthlyLimit }
    });
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({ error: 'Failed to create budget' });
  }
});

// Update budget
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { monthlyLimit, alertThreshold } = req.body;

    await pool.query(
      `UPDATE budgets SET 
        monthly_limit = COALESCE(?, monthly_limit),
        alert_threshold = COALESCE(?, alert_threshold)
       WHERE id = ? AND user_id = ?`,
      [monthlyLimit, alertThreshold, req.params.id, req.user.userId]
    );

    res.json({ message: 'Budget updated successfully' });
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({ error: 'Failed to update budget' });
  }
});

// Delete budget
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM budgets WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});

// Get budget alerts
router.get('/alerts', authMiddleware, async (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const [budgets] = await pool.query(
      'SELECT * FROM budgets WHERE user_id = ? AND month = ?',
      [req.user.userId, currentMonth]
    );

    const alerts = [];

    for (const budget of budgets) {
      const [spending] = await pool.query(
        `SELECT SUM(amount) as spent FROM transactions 
         WHERE user_id = ? AND category = ? AND type = 'debit' 
         AND DATE_FORMAT(transaction_date, '%Y-%m') = ?`,
        [req.user.userId, budget.category, currentMonth]
      );

      const spent = spending[0]?.spent || 0;
      const percentage = (spent / budget.monthly_limit) * 100;

      if (percentage >= budget.alert_threshold) {
        alerts.push({
          category: budget.category,
          limit: budget.monthly_limit,
          spent,
          percentage: percentage.toFixed(2),
          exceeded: percentage >= 100
        });
      }
    }

    res.json({ alerts });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Failed to get budget alerts' });
  }
});

module.exports = router;
