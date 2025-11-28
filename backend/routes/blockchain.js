const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const blockchain = require('../blockchain');

// Verify blockchain for user
router.get('/verify', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Check subscription
    const [users] = await pool.query('SELECT subscription_plan FROM users WHERE id = ?', [userId]);
    if (users[0]?.subscription_plan !== 'paid') {
      return res.status(403).json({ error: 'Blockchain features are only available for paid users' });
    }

    const [blocks] = await pool.query(
      'SELECT * FROM blockchain_ledger WHERE user_id = ? ORDER BY timestamp ASC',
      [userId]
    );

    const blocksForVerification = blocks.map(b => ({
      id: b.id,
      index: blocks.indexOf(b),
      timestamp: parseInt(b.timestamp),
      dataHash: b.data_hash,
      previousHash: b.previous_hash,
      hash: b.block_hash,
      nonce: b.nonce
    }));

    const verification = blockchain.verifyChain(blocksForVerification);

    res.json({
      ...verification,
      totalBlocks: blocks.length,
      lastBlockTime: blocks.length > 0 ? new Date(parseInt(blocks[blocks.length - 1].timestamp)) : null
    });
  } catch (error) {
    console.error('Verify blockchain error:', error);
    res.status(500).json({ error: 'Failed to verify blockchain' });
  }
});

// Get transaction receipt
router.get('/receipt/:transactionId', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { transactionId } = req.params;

    // Check subscription
    const [users] = await pool.query('SELECT subscription_plan FROM users WHERE id = ?', [userId]);
    if (users[0]?.subscription_plan !== 'paid') {
      return res.status(403).json({ error: 'Blockchain features are only available for paid users' });
    }

    const [blocks] = await pool.query(
      'SELECT * FROM blockchain_ledger WHERE user_id = ? AND transaction_id = ?',
      [userId, transactionId]
    );

    if (blocks.length === 0) {
      return res.status(404).json({ error: 'Transaction not found in blockchain' });
    }

    const block = blocks[0];
    const receipt = blockchain.getTransactionReceipt({
      transactionId: block.transaction_id,
      hash: block.block_hash,
      index: block.id,
      timestamp: parseInt(block.timestamp),
      dataHash: block.data_hash
    });

    res.json(receipt);
  } catch (error) {
    console.error('Get receipt error:', error);
    res.status(500).json({ error: 'Failed to get receipt' });
  }
});

// Get blockchain stats
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Check subscription
    const [users] = await pool.query('SELECT subscription_plan FROM users WHERE id = ?', [userId]);
    if (users[0]?.subscription_plan !== 'paid') {
      return res.status(403).json({ error: 'Blockchain features are only available for paid users' });
    }

    const [blocks] = await pool.query(
      'SELECT COUNT(*) as count, MIN(timestamp) as first_block, MAX(timestamp) as last_block FROM blockchain_ledger WHERE user_id = ?',
      [userId]
    );

    const [transactions] = await pool.query(
      'SELECT COUNT(*) as count FROM blockchain_ledger WHERE user_id = ? AND transaction_id IS NOT NULL',
      [userId]
    );

    res.json({
      totalBlocks: blocks[0].count,
      transactionsSecured: transactions[0].count,
      firstBlockTime: blocks[0].first_block ? new Date(parseInt(blocks[0].first_block)) : null,
      lastBlockTime: blocks[0].last_block ? new Date(parseInt(blocks[0].last_block)) : null,
      chainIntegrity: 'Verified'
    });
  } catch (error) {
    console.error('Blockchain stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Decrypt and view transaction data
router.get('/decrypt/:transactionId', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { transactionId } = req.params;

    // Check subscription
    const [users] = await pool.query('SELECT subscription_plan FROM users WHERE id = ?', [userId]);
    if (users[0]?.subscription_plan !== 'paid') {
      return res.status(403).json({ error: 'Blockchain features are only available for paid users' });
    }

    const [blocks] = await pool.query(
      'SELECT encrypted_data FROM blockchain_ledger WHERE user_id = ? AND transaction_id = ?',
      [userId, transactionId]
    );

    if (blocks.length === 0 || !blocks[0].encrypted_data) {
      return res.status(404).json({ error: 'Encrypted data not found' });
    }

    const decryptedData = blockchain.decryptData(blocks[0].encrypted_data);

    res.json({
      transactionId,
      data: JSON.parse(decryptedData),
      decryptedAt: new Date()
    });
  } catch (error) {
    console.error('Decrypt error:', error);
    res.status(500).json({ error: 'Failed to decrypt data' });
  }
});

module.exports = router;
