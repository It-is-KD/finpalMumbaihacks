const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const BlockchainService = require('../services/blockchainService');
const pool = require('../config/database');

// Get blockchain status
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const blockchainService = new BlockchainService();
    const isConnected = await blockchainService.isConnected();
    
    res.json({
      connected: isConnected,
      network: 'Ganache Local',
      chainId: 1337
    });
  } catch (error) {
    console.error('Blockchain status error:', error);
    res.json({ connected: false });
  }
});

// Register wallet
router.post('/register-wallet', authMiddleware, async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    await pool.query(
      'UPDATE users SET wallet_address = ?, subscription_plan = ? WHERE id = ?',
      [walletAddress, 'paid', req.user.userId]
    );

    res.json({
      message: 'Wallet registered successfully',
      walletAddress
    });
  } catch (error) {
    console.error('Register wallet error:', error);
    res.status(500).json({ error: 'Failed to register wallet' });
  }
});

// Get blockchain transactions
router.get('/transactions', authMiddleware, async (req, res) => {
  try {
    const [transactions] = await pool.query(
      `SELECT bt.*, t.amount, t.type, t.category, t.transaction_date
       FROM blockchain_transactions bt
       JOIN transactions t ON bt.transaction_id = t.id
       WHERE bt.user_id = ?
       ORDER BY bt.created_at DESC`,
      [req.user.userId]
    );

    res.json({ transactions });
  } catch (error) {
    console.error('Get blockchain transactions error:', error);
    res.status(500).json({ error: 'Failed to get blockchain transactions' });
  }
});

// Verify transaction on chain
router.get('/verify/:txHash', authMiddleware, async (req, res) => {
  try {
    const blockchainService = new BlockchainService();
    const receipt = await blockchainService.verifyTransaction(req.params.txHash);

    if (receipt) {
      res.json({
        verified: true,
        receipt: {
          blockNumber: receipt.blockNumber,
          transactionHash: receipt.transactionHash,
          gasUsed: receipt.gasUsed?.toString()
        }
      });
    } else {
      res.json({ verified: false });
    }
  } catch (error) {
    console.error('Verify transaction error:', error);
    res.status(500).json({ error: 'Failed to verify transaction' });
  }
});

// Get account balance
router.get('/balance', authMiddleware, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT wallet_address FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (!users[0]?.wallet_address) {
      return res.status(400).json({ error: 'No wallet registered' });
    }

    const blockchainService = new BlockchainService();
    const balance = await blockchainService.getBalance(users[0].wallet_address);

    res.json({ balance });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: 'Failed to get balance' });
  }
});

module.exports = router;
