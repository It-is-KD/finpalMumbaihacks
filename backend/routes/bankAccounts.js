const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// Get all bank accounts for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [accounts] = await pool.query(
      'SELECT * FROM bank_accounts WHERE user_id = ? ORDER BY is_primary DESC, created_at DESC',
      [req.user.userId]
    );
    res.json({ accounts });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Failed to get bank accounts' });
  }
});

// Add bank account
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { bankName, accountNumber, accountType, balance, isPrimary } = req.body;
    const accountId = uuidv4();

    // If setting as primary, unset other primary accounts
    if (isPrimary) {
      await pool.query(
        'UPDATE bank_accounts SET is_primary = FALSE WHERE user_id = ?',
        [req.user.userId]
      );
    }

    await pool.query(
      `INSERT INTO bank_accounts (id, user_id, bank_name, account_number, account_type, balance, is_primary)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [accountId, req.user.userId, bankName, accountNumber, accountType || 'savings', balance || 0, isPrimary || false]
    );

    res.status(201).json({
      message: 'Bank account added successfully',
      account: { id: accountId, bankName, accountNumber, accountType, balance, isPrimary }
    });
  } catch (error) {
    console.error('Add account error:', error);
    res.status(500).json({ error: 'Failed to add bank account' });
  }
});

// Update bank account
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { bankName, accountType, balance, isPrimary } = req.body;

    if (isPrimary) {
      await pool.query(
        'UPDATE bank_accounts SET is_primary = FALSE WHERE user_id = ?',
        [req.user.userId]
      );
    }

    await pool.query(
      `UPDATE bank_accounts SET 
        bank_name = COALESCE(?, bank_name),
        account_type = COALESCE(?, account_type),
        balance = COALESCE(?, balance),
        is_primary = COALESCE(?, is_primary)
       WHERE id = ? AND user_id = ?`,
      [bankName, accountType, balance, isPrimary, req.params.id, req.user.userId]
    );

    res.json({ message: 'Bank account updated successfully' });
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ error: 'Failed to update bank account' });
  }
});

// Delete bank account
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM bank_accounts WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );
    res.json({ message: 'Bank account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete bank account' });
  }
});

module.exports = router;
