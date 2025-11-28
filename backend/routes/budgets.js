const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const finpalAgent = require('../agent');

// Get all budgets
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    let { month_year } = req.query;
    
    // If no month specified, find the most recent month with transactions
    if (!month_year) {
      const [latestTxn] = await pool.query(
        'SELECT DATE_FORMAT(MAX(transaction_date), "%Y-%m") as latest_month FROM transactions WHERE user_id = ?',
        [userId]
      );
      month_year = latestTxn[0]?.latest_month || new Date().toISOString().slice(0, 7);
    }
    
    console.log('Using month_year:', month_year);
    
    // First try to get budgets for the transaction month
    let [budgets] = await pool.query(
      'SELECT * FROM budgets WHERE user_id = ?',
      [userId]
    );

    // If no budgets exist, return empty with a note
    if (budgets.length === 0) {
      return res.json([]);
    }

    // Get the start and end of the month for transaction queries
    const [year, month] = month_year.split('-');
    const startDate = `${month_year}-01`;
    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().slice(0, 10);

    console.log('Fetching spending for date range:', startDate, 'to', endDate);

    // Get spending per category for the month
    const [spending] = await pool.query(
      `SELECT category, SUM(amount) as total_spent 
       FROM transactions 
       WHERE user_id = ? AND type = 'debit' 
       AND transaction_date >= ? AND transaction_date <= ?
       GROUP BY category`,
      [userId, startDate, endDate]
    );

    console.log('Spending by category:', spending);

    // Create a map of category -> spent amount
    const spendingMap = {};
    spending.forEach(s => {
      spendingMap[s.category] = parseFloat(s.total_spent) || 0;
    });

    // Merge spending data with budgets
    const budgetsWithSpending = budgets.map(budget => ({
      ...budget,
      current_spent: spendingMap[budget.category] || 0,
      monthly_limit: parseFloat(budget.monthly_limit) || 0
    }));

    console.log('Budgets with spending:', budgetsWithSpending);
    res.json(budgetsWithSpending);
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

// Create/Update budget
router.post('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { category, monthly_limit, alert_threshold } = req.body;
    
    const month_year = new Date().toISOString().slice(0, 7);
    
    // Check if budget exists
    const [existing] = await pool.query(
      'SELECT id FROM budgets WHERE user_id = ? AND category = ? AND month_year = ?',
      [userId, category, month_year]
    );

    if (existing.length > 0) {
      await pool.query(
        'UPDATE budgets SET monthly_limit = ?, alert_threshold = ? WHERE id = ?',
        [monthly_limit, alert_threshold || 80, existing[0].id]
      );
      return res.json({ message: 'Budget updated', id: existing[0].id });
    }

    const budgetId = uuidv4();
    await pool.query(
      `INSERT INTO budgets (id, user_id, category, monthly_limit, month_year, alert_threshold)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [budgetId, userId, category, monthly_limit, month_year, alert_threshold || 80]
    );

    res.status(201).json({
      message: 'Budget created successfully',
      budget: { id: budgetId, category, monthly_limit, month_year }
    });
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({ error: 'Failed to create budget' });
  }
});

// Generate smart budgets
router.post('/generate', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const [transactions] = await pool.query(
      'SELECT * FROM transactions WHERE user_id = ? AND transaction_date >= DATE_SUB(NOW(), INTERVAL 3 MONTH)',
      [userId]
    );

    const smartBudgets = await finpalAgent.generateBudgets(users[0], transactions);
    
    // Save generated budgets
    const month_year = new Date().toISOString().slice(0, 7);
    
    for (const budget of smartBudgets.budgets) {
      const [existing] = await pool.query(
        'SELECT id FROM budgets WHERE user_id = ? AND category = ? AND month_year = ?',
        [userId, budget.category, month_year]
      );

      if (existing.length === 0) {
        await pool.query(
          `INSERT INTO budgets (id, user_id, category, monthly_limit, month_year)
           VALUES (?, ?, ?, ?, ?)`,
          [uuidv4(), userId, budget.category, budget.monthly_limit, month_year]
        );
      }
    }

    res.json({
      message: 'Smart budgets generated',
      budgets: smartBudgets
    });
  } catch (error) {
    console.error('Generate budgets error:', error);
    res.status(500).json({ error: 'Failed to generate budgets' });
  }
});

// Update budget spending (called when transactions are added)
router.put('/:category/spend', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { category } = req.params;
    const { amount } = req.body;
    
    const month_year = new Date().toISOString().slice(0, 7);

    await pool.query(
      'UPDATE budgets SET current_spent = current_spent + ? WHERE user_id = ? AND category = ? AND month_year = ?',
      [amount, userId, category, month_year]
    );

    // Check if over budget
    const [budgets] = await pool.query(
      'SELECT * FROM budgets WHERE user_id = ? AND category = ? AND month_year = ?',
      [userId, category, month_year]
    );

    if (budgets.length > 0) {
      const budget = budgets[0];
      const usage = (budget.current_spent / budget.monthly_limit) * 100;
      
      if (usage >= 100) {
        return res.json({
          message: 'Budget exceeded',
          alert: true,
          usage: usage.toFixed(1),
          budget
        });
      } else if (usage >= budget.alert_threshold) {
        return res.json({
          message: 'Approaching budget limit',
          alert: true,
          usage: usage.toFixed(1),
          budget
        });
      }
    }

    res.json({ message: 'Spending recorded' });
  } catch (error) {
    console.error('Update spending error:', error);
    res.status(500).json({ error: 'Failed to update spending' });
  }
});

// Delete budget
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    await pool.query('DELETE FROM budgets WHERE id = ? AND user_id = ?', [id, userId]);
    res.json({ message: 'Budget deleted' });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});

module.exports = router;
