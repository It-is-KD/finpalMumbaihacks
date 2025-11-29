<<<<<<< HEAD
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const finpalAgent = require('../agent');

// Get all goals
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const [goals] = await pool.query(
      'SELECT * FROM goals WHERE user_id = ? ORDER BY priority DESC, target_date ASC',
      [userId]
    );
    res.json(goals);
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// Create goal
router.post('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, target_amount, target_date, priority, category } = req.body;

    const goalId = uuidv4();

    // Get user profile for goal plan generation
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const userProfile = users[0];

    // Generate goal plan
    const goalPlan = await finpalAgent.createGoalPlan(
      { name, target_amount, target_date },
      userProfile,
      0
    );

    await pool.query(
      `INSERT INTO goals (id, user_id, name, target_amount, target_date, priority, category, monthly_contribution)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [goalId, userId, name, target_amount, target_date, priority || 'medium', category, goalPlan.requiredMonthlyContribution]
    );

    res.status(201).json({
      message: 'Goal created successfully',
      goal: {
        id: goalId,
        name,
        target_amount,
        target_date,
        priority,
        category,
        monthly_contribution: goalPlan.requiredMonthlyContribution
      },
      plan: goalPlan
    });
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// Update goal progress
router.put('/:id/progress', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const userId = req.user.userId;

    const [goals] = await pool.query('SELECT * FROM goals WHERE id = ? AND user_id = ?', [id, userId]);
    if (goals.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const goal = goals[0];
    const newAmount = parseFloat(goal.current_amount) + parseFloat(amount);
    
    let status = 'active';
    if (newAmount >= goal.target_amount) {
      status = 'completed';
    }

    await pool.query(
      'UPDATE goals SET current_amount = ?, status = ?, updated_at = NOW() WHERE id = ?',
      [newAmount, status, id]
    );

    res.json({
      message: status === 'completed' ? 'Congratulations! Goal completed!' : 'Progress updated',
      current_amount: newAmount,
      status,
      progress: ((newAmount / goal.target_amount) * 100).toFixed(1)
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Get goal suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const [transactions] = await pool.query('SELECT * FROM transactions WHERE user_id = ?', [userId]);
    const [existingGoals] = await pool.query('SELECT * FROM goals WHERE user_id = ?', [userId]);

    const suggestions = await finpalAgent.modules.budgetGoalGenerator.suggestGoals(
      users[0],
      transactions,
      existingGoals
    );

    res.json(suggestions);
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// Delete goal
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    await pool.query('DELETE FROM goals WHERE id = ? AND user_id = ?', [id, userId]);
    res.json({ message: 'Goal deleted' });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

module.exports = router;
=======
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const finpalAgent = require('../agent');

// Get all goals
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const [goals] = await pool.query(
      'SELECT * FROM goals WHERE user_id = ? ORDER BY priority DESC, target_date ASC',
      [userId]
    );
    res.json(goals);
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// Create goal
router.post('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, target_amount, target_date, priority, category } = req.body;

    const goalId = uuidv4();

    // Get user profile for goal plan generation
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const userProfile = users[0];

    // Generate goal plan
    const goalPlan = await finpalAgent.createGoalPlan(
      { name, target_amount, target_date },
      userProfile,
      0
    );

    await pool.query(
      `INSERT INTO goals (id, user_id, name, target_amount, target_date, priority, category, monthly_contribution)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [goalId, userId, name, target_amount, target_date, priority || 'medium', category, goalPlan.requiredMonthlyContribution]
    );

    res.status(201).json({
      message: 'Goal created successfully',
      goal: {
        id: goalId,
        name,
        target_amount,
        target_date,
        priority,
        category,
        monthly_contribution: goalPlan.requiredMonthlyContribution
      },
      plan: goalPlan
    });
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// Update goal progress
router.put('/:id/progress', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const userId = req.user.userId;

    const [goals] = await pool.query('SELECT * FROM goals WHERE id = ? AND user_id = ?', [id, userId]);
    if (goals.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const goal = goals[0];
    const newAmount = parseFloat(goal.current_amount) + parseFloat(amount);
    
    let status = 'active';
    if (newAmount >= goal.target_amount) {
      status = 'completed';
    }

    await pool.query(
      'UPDATE goals SET current_amount = ?, status = ?, updated_at = NOW() WHERE id = ?',
      [newAmount, status, id]
    );

    res.json({
      message: status === 'completed' ? 'Congratulations! Goal completed!' : 'Progress updated',
      current_amount: newAmount,
      status,
      progress: ((newAmount / goal.target_amount) * 100).toFixed(1)
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Get goal suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const [transactions] = await pool.query('SELECT * FROM transactions WHERE user_id = ?', [userId]);
    const [existingGoals] = await pool.query('SELECT * FROM goals WHERE user_id = ?', [userId]);

    const suggestions = await finpalAgent.modules.budgetGoalGenerator.suggestGoals(
      users[0],
      transactions,
      existingGoals
    );

    res.json(suggestions);
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// Delete goal
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    await pool.query('DELETE FROM goals WHERE id = ? AND user_id = ?', [id, userId]);
    res.json({ message: 'Goal deleted' });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

module.exports = router;
>>>>>>> 2c5691fad8196faad9092c0293bb4957adef9391
