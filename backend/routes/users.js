const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// Get current user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, email, name, phone, subscription_plan, wallet_address, monthly_income, income_type, risk_tolerance, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone, monthlyIncome, incomeType, riskTolerance } = req.body;

    await pool.query(
      `UPDATE users SET 
        name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        monthly_income = COALESCE(?, monthly_income),
        income_type = COALESCE(?, income_type),
        risk_tolerance = COALESCE(?, risk_tolerance)
       WHERE id = ?`,
      [name, phone, monthlyIncome, incomeType, riskTolerance, req.user.userId]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Upgrade to paid plan
router.post('/upgrade', authMiddleware, async (req, res) => {
  try {
    const { walletAddress } = req.body;

    await pool.query(
      'UPDATE users SET subscription_plan = ?, wallet_address = ? WHERE id = ?',
      ['paid', walletAddress, req.user.userId]
    );

    res.json({ message: 'Upgraded to paid plan successfully' });
  } catch (error) {
    console.error('Upgrade error:', error);
    res.status(500).json({ error: 'Failed to upgrade' });
  }
});

// Get user dashboard summary
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get total balance across all accounts
    const [balanceResult] = await pool.query(
      'SELECT SUM(balance) as total_balance FROM bank_accounts WHERE user_id = ?',
      [userId]
    );

    // Get this month's income and expenses
    const currentMonth = new Date().toISOString().slice(0, 7);
    const [monthlyStats] = await pool.query(
      `SELECT 
        SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) as expenses
       FROM transactions 
       WHERE user_id = ? AND DATE_FORMAT(transaction_date, '%Y-%m') = ?`,
      [userId, currentMonth]
    );

    // Get recent transactions
    const [recentTransactions] = await pool.query(
      `SELECT * FROM transactions 
       WHERE user_id = ? 
       ORDER BY transaction_date DESC 
       LIMIT 5`,
      [userId]
    );

    // Get active goals
    const [goals] = await pool.query(
      'SELECT * FROM goals WHERE user_id = ? AND status = ? ORDER BY target_date ASC LIMIT 3',
      [userId, 'active']
    );

    // Get unread insights
    const [insights] = await pool.query(
      'SELECT * FROM ai_insights WHERE user_id = ? AND is_read = FALSE ORDER BY created_at DESC LIMIT 5',
      [userId]
    );

    // Get spending by category this month
    const [categorySpending] = await pool.query(
      `SELECT category, SUM(amount) as total
       FROM transactions 
       WHERE user_id = ? AND type = 'debit' AND DATE_FORMAT(transaction_date, '%Y-%m') = ?
       GROUP BY category
       ORDER BY total DESC
       LIMIT 5`,
      [userId, currentMonth]
    );

    res.json({
      totalBalance: balanceResult[0]?.total_balance || 0,
      monthlyIncome: monthlyStats[0]?.income || 0,
      monthlyExpenses: monthlyStats[0]?.expenses || 0,
      recentTransactions,
      goals,
      insights,
      categorySpending
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

module.exports = router;
