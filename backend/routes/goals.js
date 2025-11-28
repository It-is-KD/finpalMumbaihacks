const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// Get all goals
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [goals] = await pool.query(
      'SELECT * FROM goals WHERE user_id = ? ORDER BY status ASC, target_date ASC',
      [req.user.userId]
    );
    res.json({ goals });
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ error: 'Failed to get goals' });
  }
});

// Get goal by id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [goals] = await pool.query(
      'SELECT * FROM goals WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (goals.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json({ goal: goals[0] });
  } catch (error) {
    console.error('Get goal error:', error);
    res.status(500).json({ error: 'Failed to get goal' });
  }
});

// Create goal
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, targetAmount, targetDate, priority } = req.body;
    const goalId = uuidv4();

    // Calculate monthly saving needed
    const today = new Date();
    const target = new Date(targetDate);
    const monthsRemaining = Math.max(1, Math.ceil((target - today) / (30 * 24 * 60 * 60 * 1000)));
    const monthlySavingNeeded = targetAmount / monthsRemaining;

    await pool.query(
      `INSERT INTO goals (id, user_id, name, description, target_amount, target_date, priority, monthly_saving_needed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [goalId, req.user.userId, name, description, targetAmount, targetDate, priority || 'medium', monthlySavingNeeded]
    );

    res.status(201).json({
      message: 'Goal created successfully',
      goal: {
        id: goalId,
        name,
        targetAmount,
        targetDate,
        monthlySavingNeeded
      }
    });
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// Update goal
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, targetAmount, targetDate, priority, currentAmount, status } = req.body;

    let monthlySavingNeeded = null;
    if (targetAmount && targetDate && currentAmount !== undefined) {
      const today = new Date();
      const target = new Date(targetDate);
      const monthsRemaining = Math.max(1, Math.ceil((target - today) / (30 * 24 * 60 * 60 * 1000)));
      monthlySavingNeeded = (targetAmount - (currentAmount || 0)) / monthsRemaining;
    }

    await pool.query(
      `UPDATE goals SET 
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        target_amount = COALESCE(?, target_amount),
        target_date = COALESCE(?, target_date),
        priority = COALESCE(?, priority),
        current_amount = COALESCE(?, current_amount),
        status = COALESCE(?, status),
        monthly_saving_needed = COALESCE(?, monthly_saving_needed)
       WHERE id = ? AND user_id = ?`,
      [name, description, targetAmount, targetDate, priority, currentAmount, status, monthlySavingNeeded, req.params.id, req.user.userId]
    );

    res.json({ message: 'Goal updated successfully' });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// Add to goal
router.post('/:id/contribute', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;

    const [goals] = await pool.query(
      'SELECT * FROM goals WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (goals.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const goal = goals[0];
    const newAmount = parseFloat(goal.current_amount) + parseFloat(amount);
    const status = newAmount >= goal.target_amount ? 'completed' : 'active';

    await pool.query(
      'UPDATE goals SET current_amount = ?, status = ? WHERE id = ?',
      [newAmount, status, req.params.id]
    );

    res.json({
      message: 'Contribution added successfully',
      currentAmount: newAmount,
      status,
      progress: (newAmount / goal.target_amount * 100).toFixed(2)
    });
  } catch (error) {
    console.error('Contribute to goal error:', error);
    res.status(500).json({ error: 'Failed to contribute to goal' });
  }
});

// Delete goal
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM goals WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

module.exports = router;
