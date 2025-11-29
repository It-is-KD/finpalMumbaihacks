<<<<<<< HEAD
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const finpalAgent = require('../agent');
const blockchain = require('../blockchain');

// Get all transactions
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 50, offset = 0, category, type, startDate, endDate } = req.query;

    let query = 'SELECT * FROM transactions WHERE user_id = ?';
    const params = [userId];

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
    
    // Get total count
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM transactions WHERE user_id = ?',
      [userId]
    );

    res.json({
      transactions,
      total: countResult[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Add transaction
router.post('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      bank_account_id,
      type,
      amount,
      description,
      merchant_name,
      transaction_date,
      upi_id,
      reference_id
    } = req.body;

    const transactionId = uuidv4();

    // Auto-categorize transaction
    const categorization = await finpalAgent.categorizeTransactions([{
      description,
      merchant_name,
      amount,
      type
    }]);
    
    const category = categorization[0]?.category || 'Other';

    await pool.query(
      `INSERT INTO transactions 
       (id, user_id, bank_account_id, type, amount, category, description, merchant_name, transaction_date, upi_id, reference_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [transactionId, userId, bank_account_id, type, amount, category, description, merchant_name, transaction_date || new Date(), upi_id, reference_id]
    );

    // Check if paid user - add to blockchain
    const [users] = await pool.query('SELECT subscription_plan FROM users WHERE id = ?', [userId]);
    if (users[0]?.subscription_plan === 'paid') {
      // Get previous block
      const [blocks] = await pool.query(
        'SELECT * FROM blockchain_ledger WHERE user_id = ? ORDER BY timestamp DESC LIMIT 1',
        [userId]
      );

      let previousBlock;
      if (blocks.length === 0) {
        // Create genesis block
        previousBlock = blockchain.createGenesisBlock(userId);
        await pool.query(
          `INSERT INTO blockchain_ledger (id, user_id, block_hash, previous_hash, data_hash, timestamp, nonce)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [previousBlock.id, userId, previousBlock.hash, previousBlock.previousHash, previousBlock.dataHash, previousBlock.timestamp, previousBlock.nonce]
        );
      } else {
        previousBlock = {
          hash: blocks[0].block_hash,
          index: blocks.length
        };
      }

      // Create new block for transaction
      const newBlock = blockchain.createBlock(userId, transactionId, { amount, type, merchant_name, description }, previousBlock);
      
      await pool.query(
        `INSERT INTO blockchain_ledger (id, user_id, transaction_id, block_hash, previous_hash, data_hash, encrypted_data, timestamp, nonce)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newBlock.id, userId, transactionId, newBlock.hash, newBlock.previousHash, newBlock.dataHash, newBlock.encryptedData, newBlock.timestamp, newBlock.nonce]
      );
    }

    res.status(201).json({
      message: 'Transaction added successfully',
      transaction: {
        id: transactionId,
        type,
        amount,
        category,
        description,
        merchant_name,
        method: categorization[0]?.method || 'rule'
      },
      category,
      method: categorization[0]?.method || 'rule',
      confidence: categorization[0]?.confidence || 0.8,
      reasoning: categorization[0]?.reasoning || 'Auto-categorized'
    });
  } catch (error) {
    console.error('Add transaction error:', error);
    res.status(500).json({ error: 'Failed to add transaction' });
  }
});

// Bulk add transactions
router.post('/bulk', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { transactions } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: 'Transactions array required' });
    }

    const results = [];
    for (const t of transactions) {
      const transactionId = uuidv4();
      
      // Auto-categorize
      const categorization = await finpalAgent.categorizeTransactions([{
        description: t.description,
        merchant_name: t.merchant_name,
        amount: t.amount,
        type: t.type
      }]);
      
      const category = categorization[0]?.category || 'Other';

      await pool.query(
        `INSERT INTO transactions 
         (id, user_id, bank_account_id, type, amount, category, description, merchant_name, transaction_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [transactionId, userId, t.bank_account_id, t.type, t.amount, category, t.description, t.merchant_name, t.transaction_date || new Date()]
      );

      results.push({ id: transactionId, category });
    }

    res.status(201).json({
      message: `${results.length} transactions added successfully`,
      results
    });
  } catch (error) {
    console.error('Bulk add error:', error);
    res.status(500).json({ error: 'Failed to add transactions' });
  }
});

// Get transaction summary
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { period = 'month' } = req.query;

    console.log('Fetching summary for user:', userId, 'period:', period);

    // First, get the most recent transaction date to use as reference
    const [latestTxn] = await pool.query(
      'SELECT MAX(transaction_date) as latest FROM transactions WHERE user_id = ?',
      [userId]
    );
    
    const latestDate = latestTxn[0]?.latest;
    console.log('Latest transaction date:', latestDate);

    // Use the latest transaction date as reference point instead of NOW()
    // This ensures we get data even if transactions are in the future or past
    let dateFilter = '';
    if (latestDate) {
      if (period === 'week') {
        dateFilter = 'AND transaction_date >= DATE_SUB(?, INTERVAL 1 WEEK)';
      } else if (period === 'month') {
        dateFilter = 'AND transaction_date >= DATE_SUB(?, INTERVAL 1 MONTH)';
      } else if (period === 'year') {
        dateFilter = 'AND transaction_date >= DATE_SUB(?, INTERVAL 1 YEAR)';
      }
    }

    // Get totals
    const totalsQuery = latestDate && dateFilter
      ? `SELECT type, SUM(amount) as total, COUNT(*) as count FROM transactions WHERE user_id = ? ${dateFilter} GROUP BY type`
      : 'SELECT type, SUM(amount) as total, COUNT(*) as count FROM transactions WHERE user_id = ? GROUP BY type';
    
    const totalsParams = latestDate && dateFilter ? [userId, latestDate] : [userId];
    const [totals] = await pool.query(totalsQuery, totalsParams);
    console.log('Totals result:', totals);

    // Get category breakdown
    const categoriesQuery = latestDate && dateFilter
      ? `SELECT category, SUM(amount) as total, COUNT(*) as count FROM transactions WHERE user_id = ? AND type = 'debit' ${dateFilter} GROUP BY category ORDER BY total DESC`
      : `SELECT category, SUM(amount) as total, COUNT(*) as count FROM transactions WHERE user_id = ? AND type = 'debit' GROUP BY category ORDER BY total DESC`;
    
    const categoriesParams = latestDate && dateFilter ? [userId, latestDate] : [userId];
    const [categories] = await pool.query(categoriesQuery, categoriesParams);
    console.log('Categories result:', categories);

    const income = totals.find(t => t.type === 'credit')?.total || 0;
    const expenses = totals.find(t => t.type === 'debit')?.total || 0;

    const response = {
      period,
      income: parseFloat(income),
      expenses: parseFloat(expenses),
      savings: parseFloat(income) - parseFloat(expenses),
      savingsRate: income > 0 ? (((income - expenses) / income) * 100).toFixed(1) : 0,
      categories: categories.map(c => ({
        name: c.category,
        amount: parseFloat(c.total),
        count: c.count
      })),
      transactionCount: totals.reduce((sum, t) => sum + t.count, 0)
    };

    console.log('Summary response:', response);
    res.json(response);
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// Recategorize transaction
router.put('/:id/categorize', async (req, res) => {
  try {
    const { id } = req.params;
    const { category } = req.body;
    const userId = req.user.userId;

    await pool.query(
      'UPDATE transactions SET category = ? WHERE id = ? AND user_id = ?',
      [category, id, userId]
    );

    res.json({ message: 'Transaction categorized', category });
  } catch (error) {
    console.error('Categorize error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

module.exports = router;
=======
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const finpalAgent = require('../agent');
const blockchain = require('../blockchain');

// Get all transactions
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 50, offset = 0, category, type, startDate, endDate } = req.query;

    let query = 'SELECT * FROM transactions WHERE user_id = ?';
    const params = [userId];

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
    
    // Get total count
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM transactions WHERE user_id = ?',
      [userId]
    );

    res.json({
      transactions,
      total: countResult[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Add transaction
router.post('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      bank_account_id,
      type,
      amount,
      description,
      merchant_name,
      transaction_date,
      upi_id,
      reference_id
    } = req.body;

    const transactionId = uuidv4();

    // Auto-categorize transaction
    const categorization = await finpalAgent.categorizeTransactions([{
      description,
      merchant_name,
      amount,
      type
    }]);
    
    const category = categorization[0]?.category || 'Other';

    await pool.query(
      `INSERT INTO transactions 
       (id, user_id, bank_account_id, type, amount, category, description, merchant_name, transaction_date, upi_id, reference_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [transactionId, userId, bank_account_id, type, amount, category, description, merchant_name, transaction_date || new Date(), upi_id, reference_id]
    );

    // Check if paid user - add to blockchain
    const [users] = await pool.query('SELECT subscription_plan FROM users WHERE id = ?', [userId]);
    if (users[0]?.subscription_plan === 'paid') {
      // Get previous block
      const [blocks] = await pool.query(
        'SELECT * FROM blockchain_ledger WHERE user_id = ? ORDER BY timestamp DESC LIMIT 1',
        [userId]
      );

      let previousBlock;
      if (blocks.length === 0) {
        // Create genesis block
        previousBlock = blockchain.createGenesisBlock(userId);
        await pool.query(
          `INSERT INTO blockchain_ledger (id, user_id, block_hash, previous_hash, data_hash, timestamp, nonce)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [previousBlock.id, userId, previousBlock.hash, previousBlock.previousHash, previousBlock.dataHash, previousBlock.timestamp, previousBlock.nonce]
        );
      } else {
        previousBlock = {
          hash: blocks[0].block_hash,
          index: blocks.length
        };
      }

      // Create new block for transaction
      const newBlock = blockchain.createBlock(userId, transactionId, { amount, type, merchant_name, description }, previousBlock);
      
      await pool.query(
        `INSERT INTO blockchain_ledger (id, user_id, transaction_id, block_hash, previous_hash, data_hash, encrypted_data, timestamp, nonce)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newBlock.id, userId, transactionId, newBlock.hash, newBlock.previousHash, newBlock.dataHash, newBlock.encryptedData, newBlock.timestamp, newBlock.nonce]
      );
    }

    res.status(201).json({
      message: 'Transaction added successfully',
      transaction: {
        id: transactionId,
        type,
        amount,
        category,
        description,
        merchant_name,
        method: categorization[0]?.method || 'rule'
      },
      category,
      method: categorization[0]?.method || 'rule',
      confidence: categorization[0]?.confidence || 0.8,
      reasoning: categorization[0]?.reasoning || 'Auto-categorized'
    });
  } catch (error) {
    console.error('Add transaction error:', error);
    res.status(500).json({ error: 'Failed to add transaction' });
  }
});

// Bulk add transactions
router.post('/bulk', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { transactions } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: 'Transactions array required' });
    }

    const results = [];
    for (const t of transactions) {
      const transactionId = uuidv4();
      
      // Auto-categorize
      const categorization = await finpalAgent.categorizeTransactions([{
        description: t.description,
        merchant_name: t.merchant_name,
        amount: t.amount,
        type: t.type
      }]);
      
      const category = categorization[0]?.category || 'Other';

      await pool.query(
        `INSERT INTO transactions 
         (id, user_id, bank_account_id, type, amount, category, description, merchant_name, transaction_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [transactionId, userId, t.bank_account_id, t.type, t.amount, category, t.description, t.merchant_name, t.transaction_date || new Date()]
      );

      results.push({ id: transactionId, category });
    }

    res.status(201).json({
      message: `${results.length} transactions added successfully`,
      results
    });
  } catch (error) {
    console.error('Bulk add error:', error);
    res.status(500).json({ error: 'Failed to add transactions' });
  }
});

// Get transaction summary
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { period = 'month' } = req.query;

    console.log('Fetching summary for user:', userId, 'period:', period);

    // First, get the most recent transaction date to use as reference
    const [latestTxn] = await pool.query(
      'SELECT MAX(transaction_date) as latest FROM transactions WHERE user_id = ?',
      [userId]
    );
    
    const latestDate = latestTxn[0]?.latest;
    console.log('Latest transaction date:', latestDate);

    // Use the latest transaction date as reference point instead of NOW()
    // This ensures we get data even if transactions are in the future or past
    let dateFilter = '';
    if (latestDate) {
      if (period === 'week') {
        dateFilter = 'AND transaction_date >= DATE_SUB(?, INTERVAL 1 WEEK)';
      } else if (period === 'month') {
        dateFilter = 'AND transaction_date >= DATE_SUB(?, INTERVAL 1 MONTH)';
      } else if (period === 'year') {
        dateFilter = 'AND transaction_date >= DATE_SUB(?, INTERVAL 1 YEAR)';
      }
    }

    // Get totals
    const totalsQuery = latestDate && dateFilter
      ? `SELECT type, SUM(amount) as total, COUNT(*) as count FROM transactions WHERE user_id = ? ${dateFilter} GROUP BY type`
      : 'SELECT type, SUM(amount) as total, COUNT(*) as count FROM transactions WHERE user_id = ? GROUP BY type';
    
    const totalsParams = latestDate && dateFilter ? [userId, latestDate] : [userId];
    const [totals] = await pool.query(totalsQuery, totalsParams);
    console.log('Totals result:', totals);

    // Get category breakdown
    const categoriesQuery = latestDate && dateFilter
      ? `SELECT category, SUM(amount) as total, COUNT(*) as count FROM transactions WHERE user_id = ? AND type = 'debit' ${dateFilter} GROUP BY category ORDER BY total DESC`
      : `SELECT category, SUM(amount) as total, COUNT(*) as count FROM transactions WHERE user_id = ? AND type = 'debit' GROUP BY category ORDER BY total DESC`;
    
    const categoriesParams = latestDate && dateFilter ? [userId, latestDate] : [userId];
    const [categories] = await pool.query(categoriesQuery, categoriesParams);
    console.log('Categories result:', categories);

    const income = totals.find(t => t.type === 'credit')?.total || 0;
    const expenses = totals.find(t => t.type === 'debit')?.total || 0;

    const response = {
      period,
      income: parseFloat(income),
      expenses: parseFloat(expenses),
      savings: parseFloat(income) - parseFloat(expenses),
      savingsRate: income > 0 ? (((income - expenses) / income) * 100).toFixed(1) : 0,
      categories: categories.map(c => ({
        name: c.category,
        amount: parseFloat(c.total),
        count: c.count
      })),
      transactionCount: totals.reduce((sum, t) => sum + t.count, 0)
    };

    console.log('Summary response:', response);
    res.json(response);
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// Recategorize transaction
router.put('/:id/categorize', async (req, res) => {
  try {
    const { id } = req.params;
    const { category } = req.body;
    const userId = req.user.userId;

    await pool.query(
      'UPDATE transactions SET category = ? WHERE id = ? AND user_id = ?',
      [category, id, userId]
    );

    res.json({ message: 'Transaction categorized', category });
  } catch (error) {
    console.error('Categorize error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

module.exports = router;
>>>>>>> 2c5691fad8196faad9092c0293bb4957adef9391
