const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const pool = require('../config/database');

// Import agent modules
const TransactionCategorizer = require('../agent/transactionCategorizer');
const ExpenseAnalyzer = require('../agent/expenseAnalyzer');
const BudgetGoalGenerator = require('../agent/budgetGoalGenerator');
const SavingsCoach = require('../agent/savingsCoach');
const InvestmentAdvisor = require('../agent/investmentAdvisor');
const AutonomousPlanner = require('../agent/autonomousPlanner');
const BehaviorPatternLearner = require('../agent/behaviorPatternLearner');

// Run full analysis
router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user data
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = users[0];

    // Get transactions
    const [transactions] = await pool.query(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC LIMIT 100',
      [userId]
    );

    // Get goals
    const [goals] = await pool.query(
      'SELECT * FROM goals WHERE user_id = ? AND status = ?',
      [userId, 'active']
    );

    // Get budgets
    const currentMonth = new Date().toISOString().slice(0, 7);
    const [budgets] = await pool.query(
      'SELECT * FROM budgets WHERE user_id = ? AND month = ?',
      [userId, currentMonth]
    );

    // Run analysis modules
    const expenseAnalyzer = new ExpenseAnalyzer();
    const savingsCoach = new SavingsCoach();
    const investmentAdvisor = new InvestmentAdvisor();
    const behaviorLearner = new BehaviorPatternLearner();

    const [expenseAnalysis, savingsTips, investmentRecs, behaviorPatterns] = await Promise.all([
      expenseAnalyzer.analyze(transactions, budgets),
      savingsCoach.generateTips(transactions, goals, user),
      investmentAdvisor.recommend(user, transactions, goals),
      behaviorLearner.detectPatterns(transactions, user)
    ]);

    res.json({
      expenseAnalysis,
      savingsTips,
      investmentRecommendations: investmentRecs,
      behaviorPatterns
    });
  } catch (error) {
    console.error('Agent analysis error:', error);
    res.status(500).json({ error: 'Failed to run analysis' });
  }
});

// Get spending insights
router.get('/spending-insights', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [transactions] = await pool.query(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC LIMIT 100',
      [userId]
    );

    const expenseAnalyzer = new ExpenseAnalyzer();
    const insights = await expenseAnalyzer.analyze(transactions, []);

    res.json({ insights });
  } catch (error) {
    console.error('Spending insights error:', error);
    res.status(500).json({ error: 'Failed to get spending insights' });
  }
});

// Generate budget suggestions
router.get('/budget-suggestions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const [transactions] = await pool.query(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC LIMIT 100',
      [userId]
    );
    const [goals] = await pool.query(
      'SELECT * FROM goals WHERE user_id = ? AND status = ?',
      [userId, 'active']
    );

    const budgetGenerator = new BudgetGoalGenerator();
    const suggestions = await budgetGenerator.generateBudget(users[0], transactions, goals);

    res.json({ suggestions });
  } catch (error) {
    console.error('Budget suggestions error:', error);
    res.status(500).json({ error: 'Failed to generate budget suggestions' });
  }
});

// Get savings roadmap for goal
router.get('/savings-roadmap/:goalId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [goals] = await pool.query(
      'SELECT * FROM goals WHERE id = ? AND user_id = ?',
      [req.params.goalId, userId]
    );

    if (goals.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const [transactions] = await pool.query(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC LIMIT 100',
      [userId]
    );

    const planner = new AutonomousPlanner();
    const roadmap = await planner.createSavingsRoadmap(goals[0], users[0], transactions);

    res.json({ roadmap });
  } catch (error) {
    console.error('Savings roadmap error:', error);
    res.status(500).json({ error: 'Failed to generate savings roadmap' });
  }
});

// Get investment recommendations
router.get('/investment-recommendations', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const [transactions] = await pool.query(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC LIMIT 100',
      [userId]
    );
    const [goals] = await pool.query(
      'SELECT * FROM goals WHERE user_id = ? AND status = ?',
      [userId, 'active']
    );

    const investmentAdvisor = new InvestmentAdvisor();
    const recommendations = await investmentAdvisor.recommend(users[0], transactions, goals);

    res.json({ recommendations });
  } catch (error) {
    console.error('Investment recommendations error:', error);
    res.status(500).json({ error: 'Failed to get investment recommendations' });
  }
});

// Get monthly financial plan
router.get('/monthly-plan', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const [transactions] = await pool.query(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC LIMIT 100',
      [userId]
    );
    const [goals] = await pool.query(
      'SELECT * FROM goals WHERE user_id = ? AND status = ?',
      [userId, 'active']
    );
    const [budgets] = await pool.query(
      'SELECT * FROM budgets WHERE user_id = ?',
      [userId]
    );

    const planner = new AutonomousPlanner();
    const plan = await planner.createMonthlyPlan(users[0], transactions, goals, budgets);

    res.json({ plan });
  } catch (error) {
    console.error('Monthly plan error:', error);
    res.status(500).json({ error: 'Failed to generate monthly plan' });
  }
});

// Predict income for irregular earners
router.get('/income-prediction', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const [transactions] = await pool.query(
      `SELECT * FROM transactions 
       WHERE user_id = ? AND type = 'credit' 
       ORDER BY transaction_date DESC 
       LIMIT 50`,
      [userId]
    );

    const behaviorLearner = new BehaviorPatternLearner();
    const prediction = await behaviorLearner.predictIncome(users[0], transactions);

    res.json({ prediction });
  } catch (error) {
    console.error('Income prediction error:', error);
    res.status(500).json({ error: 'Failed to predict income' });
  }
});

// Get behavioral nudges
router.get('/nudges', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [transactions] = await pool.query(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC LIMIT 50',
      [userId]
    );
    const [goals] = await pool.query(
      'SELECT * FROM goals WHERE user_id = ? AND status = ?',
      [userId, 'active']
    );

    const savingsCoach = new SavingsCoach();
    const nudges = await savingsCoach.generateNudges(transactions, goals);

    res.json({ nudges });
  } catch (error) {
    console.error('Nudges error:', error);
    res.status(500).json({ error: 'Failed to get nudges' });
  }
});

module.exports = router;
