const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const TransactionCategorizer = require('../agent/transactionCategorizer');
const BlockchainService = require('../services/blockchainService');

// Get all transactions
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { category, type, startDate, endDate, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM transactions WHERE user_id = ?';
    const params = [req.user.userId];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    if (startDate) {
      query += ' AND transaction_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND transaction_date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY transaction_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [transactions] = await pool.query(query, params);
    res.json({ transactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// Get transaction statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const userId = req.user.userId;

    let dateFilter;
    if (period === 'week') {
      dateFilter = 'DATE_SUB(NOW(), INTERVAL 7 DAY)';
    } else if (period === 'month') {
      dateFilter = 'DATE_SUB(NOW(), INTERVAL 30 DAY)';
    } else if (period === 'year') {
      dateFilter = 'DATE_SUB(NOW(), INTERVAL 365 DAY)';
    } else {
      dateFilter = 'DATE_SUB(NOW(), INTERVAL 30 DAY)';
    }

    // Category breakdown
    const [categoryBreakdown] = await pool.query(
      `SELECT category, SUM(amount) as total, COUNT(*) as count
       FROM transactions 
       WHERE user_id = ? AND type = 'debit' AND transaction_date >= ${dateFilter}
       GROUP BY category
       ORDER BY total DESC`,
      [userId]
    );

    // Daily spending trend
    const [dailyTrend] = await pool.query(
      `SELECT DATE(transaction_date) as date, 
              SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) as income,
              SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) as expense
       FROM transactions 
       WHERE user_id = ? AND transaction_date >= ${dateFilter}
       GROUP BY DATE(transaction_date)
       ORDER BY date ASC`,
      [userId]
    );

    // Monthly comparison
    const [monthlyComparison] = await pool.query(
      `SELECT DATE_FORMAT(transaction_date, '%Y-%m') as month,
              SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) as income,
              SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) as expense
       FROM transactions 
       WHERE user_id = ? AND transaction_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
       ORDER BY month ASC`,
      [userId]
    );

    // Top merchants
    const [topMerchants] = await pool.query(
      `SELECT merchant_name, SUM(amount) as total, COUNT(*) as count
       FROM transactions 
       WHERE user_id = ? AND type = 'debit' AND merchant_name IS NOT NULL AND transaction_date >= ${dateFilter}
       GROUP BY merchant_name
       ORDER BY total DESC
       LIMIT 10`,
      [userId]
    );

    res.json({
      categoryBreakdown,
      dailyTrend,
      monthlyComparison,
      topMerchants
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// Add transaction
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { 
      bankAccountId, type, amount, description, merchantName, 
      transactionDate, upiId, referenceNumber, category 
    } = req.body;

    const transactionId = uuidv4();
    
    // Auto-categorize if category not provided
    let finalCategory = category;
    if (!finalCategory) {
      const categorizer = new TransactionCategorizer();
      finalCategory = await categorizer.categorize({
        description,
        merchantName,
        amount,
        type
      });
    }

    await pool.query(
      `INSERT INTO transactions 
       (id, user_id, bank_account_id, type, amount, description, merchant_name, category, transaction_date, upi_id, reference_number)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [transactionId, req.user.userId, bankAccountId, type, amount, description, merchantName, finalCategory, transactionDate || new Date(), upiId, referenceNumber]
    );

    // Update bank account balance
    const balanceChange = type === 'credit' ? amount : -amount;
    await pool.query(
      'UPDATE bank_accounts SET balance = balance + ? WHERE id = ?',
      [balanceChange, bankAccountId]
    );

    // Check if user is on paid plan for blockchain storage
    const [users] = await pool.query('SELECT subscription_plan, wallet_address FROM users WHERE id = ?', [req.user.userId]);
    
    if (users[0]?.subscription_plan === 'paid' && users[0]?.wallet_address) {
      try {
        const blockchainService = new BlockchainService();
        const txHash = await blockchainService.storeTransaction(req.user.userId, transactionId, {
          amount, type, category: finalCategory, date: transactionDate
        });
        
        await pool.query(
          'UPDATE transactions SET blockchain_hash = ? WHERE id = ?',
          [txHash, transactionId]
        );
      } catch (blockchainError) {
        console.error('Blockchain storage failed:', blockchainError);
      }
    }

    res.status(201).json({
      message: 'Transaction added successfully',
      transaction: { 
        id: transactionId, 
        category: finalCategory,
        type,
        amount,
        description
      }
    });
  } catch (error) {
    console.error('Add transaction error:', error);
    res.status(500).json({ error: 'Failed to add transaction' });
  }
});

// Bulk import transactions
router.post('/bulk', authMiddleware, async (req, res) => {
  try {
    const { transactions } = req.body;
    const categorizer = new TransactionCategorizer();
    const results = [];

    for (const tx of transactions) {
      const transactionId = uuidv4();
      const category = await categorizer.categorize({
        description: tx.description,
        merchantName: tx.merchantName,
        amount: tx.amount,
        type: tx.type
      });

      await pool.query(
        `INSERT INTO transactions 
         (id, user_id, bank_account_id, type, amount, description, merchant_name, category, transaction_date, upi_id, reference_number)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [transactionId, req.user.userId, tx.bankAccountId, tx.type, tx.amount, tx.description, tx.merchantName, category, tx.transactionDate, tx.upiId, tx.referenceNumber]
      );

      results.push({ id: transactionId, category });
    }

    res.status(201).json({
      message: `${results.length} transactions imported successfully`,
      results
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ error: 'Failed to import transactions' });
  }
});

// Re-categorize transactions
router.post('/recategorize', authMiddleware, async (req, res) => {
  try {
    const categorizer = new TransactionCategorizer();
    
    const [transactions] = await pool.query(
      'SELECT id, description, merchant_name, amount, type FROM transactions WHERE user_id = ?',
      [req.user.userId]
    );

    let updated = 0;
    for (const tx of transactions) {
      const category = await categorizer.categorize({
        description: tx.description,
        merchantName: tx.merchant_name,
        amount: tx.amount,
        type: tx.type
      });

      await pool.query(
        'UPDATE transactions SET category = ? WHERE id = ?',
        [category, tx.id]
      );
      updated++;
    }

    res.json({ message: `${updated} transactions recategorized` });
  } catch (error) {
    console.error('Recategorize error:', error);
    res.status(500).json({ error: 'Failed to recategorize transactions' });
  }
});

// Update transaction
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { category, description, merchantName } = req.body;

    await pool.query(
      `UPDATE transactions SET 
        category = COALESCE(?, category),
        description = COALESCE(?, description),
        merchant_name = COALESCE(?, merchant_name)
       WHERE id = ? AND user_id = ?`,
      [category, description, merchantName, req.params.id, req.user.userId]
    );

    res.json({ message: 'Transaction updated successfully' });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// Delete transaction
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Get transaction to reverse balance
    const [transactions] = await pool.query(
      'SELECT bank_account_id, type, amount FROM transactions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (transactions.length > 0) {
      const tx = transactions[0];
      const balanceChange = tx.type === 'credit' ? -tx.amount : tx.amount;
      await pool.query(
        'UPDATE bank_accounts SET balance = balance + ? WHERE id = ?',
        [balanceChange, tx.bank_account_id]
      );
    }

    await pool.query(
      'DELETE FROM transactions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

module.exports = router;
