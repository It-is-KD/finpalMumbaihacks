const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');

// Get all bank accounts
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const [accounts] = await pool.query(
      'SELECT * FROM bank_accounts WHERE user_id = ? ORDER BY is_primary DESC, created_at DESC',
      [userId]
    );
    res.json(accounts);
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Add bank account
router.post('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bank_name, account_number, account_type, balance, is_primary } = req.body;

    const accountId = uuidv4();

    // If this is primary, unset other primary accounts
    if (is_primary) {
      await pool.query(
        'UPDATE bank_accounts SET is_primary = FALSE WHERE user_id = ?',
        [userId]
      );
    }

    await pool.query(
      `INSERT INTO bank_accounts (id, user_id, bank_name, account_number, account_type, balance, is_primary)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [accountId, userId, bank_name, account_number, account_type || 'savings', balance || 0, is_primary || false]
    );

    res.status(201).json({
      message: 'Bank account added successfully',
      account: {
        id: accountId,
        bank_name,
        account_number,
        account_type,
        balance,
        is_primary
      }
    });
  } catch (error) {
    console.error('Add account error:', error);
    res.status(500).json({ error: 'Failed to add account' });
  }
});

// Update bank account balance
router.put('/:id/balance', async (req, res) => {
  try {
    const { id } = req.params;
    const { balance } = req.body;
    const userId = req.user.userId;

    await pool.query(
      'UPDATE bank_accounts SET balance = ? WHERE id = ? AND user_id = ?',
      [balance, id, userId]
    );

    res.json({ message: 'Balance updated', balance });
  } catch (error) {
    console.error('Update balance error:', error);
    res.status(500).json({ error: 'Failed to update balance' });
  }
});

// Delete bank account
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    await pool.query(
      'DELETE FROM bank_accounts WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({ message: 'Bank account deleted' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Get total balance across all accounts
router.get('/total-balance', async (req, res) => {
  try {
    const userId = req.user.userId;
    const [result] = await pool.query(
      'SELECT SUM(balance) as total FROM bank_accounts WHERE user_id = ?',
      [userId]
    );

    res.json({ totalBalance: parseFloat(result[0].total) || 0 });
  } catch (error) {
    console.error('Total balance error:', error);
    res.status(500).json({ error: 'Failed to fetch total balance' });
  }
});

module.exports = router;
