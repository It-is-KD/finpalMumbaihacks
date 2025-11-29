<<<<<<< HEAD
const CryptoJS = require('crypto-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

class BlockchainSimulation {
  constructor() {
    this.encryptionKey = process.env.BLOCKCHAIN_ENCRYPTION_KEY || 'finpal_blockchain_key_32chars!';
    this.difficulty = 2; // Number of leading zeros required
  }

  // Create a genesis block for a user
  createGenesisBlock(userId) {
    const block = {
      id: uuidv4(),
      userId,
      transactionId: null,
      index: 0,
      timestamp: Date.now(),
      data: 'Genesis Block',
      dataHash: this.hash('Genesis Block'),
      previousHash: '0',
      nonce: 0,
      hash: ''
    };
    
    block.hash = this.mineBlock(block);
    return block;
  }

  // Create a new block for a transaction
  createBlock(userId, transactionId, transactionData, previousBlock) {
    // Encrypt the transaction data
    const encryptedData = this.encryptData(JSON.stringify(transactionData));
    const dataHash = this.hash(JSON.stringify(transactionData));

    const block = {
      id: uuidv4(),
      userId,
      transactionId,
      index: previousBlock.index + 1,
      timestamp: Date.now(),
      dataHash,
      encryptedData,
      previousHash: previousBlock.hash,
      nonce: 0,
      hash: ''
    };

    block.hash = this.mineBlock(block);
    return block;
  }

  // Simple proof of work
  mineBlock(block) {
    let hash = '';
    const target = '0'.repeat(this.difficulty);
    
    while (!hash.startsWith(target)) {
      block.nonce++;
      hash = this.calculateHash(block);
    }
    
    return hash;
  }

  // Calculate block hash
  calculateHash(block) {
    const data = `${block.index}${block.timestamp}${block.dataHash}${block.previousHash}${block.nonce}`;
    return CryptoJS.SHA256(data).toString();
  }

  // Simple hash function
  hash(data) {
    return CryptoJS.SHA256(data).toString();
  }

  // Encrypt data using AES
  encryptData(data) {
    return CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
  }

  // Decrypt data
  decryptData(encryptedData) {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  // Verify blockchain integrity
  verifyChain(blocks) {
    if (blocks.length === 0) return { valid: true, message: 'Empty chain' };

    for (let i = 1; i < blocks.length; i++) {
      const currentBlock = blocks[i];
      const previousBlock = blocks[i - 1];

      // Check if previous hash matches
      if (currentBlock.previousHash !== previousBlock.hash) {
        return {
          valid: false,
          message: `Invalid previous hash at block ${i}`,
          invalidBlock: currentBlock.id
        };
      }

      // Recalculate and verify hash
      const recalculatedHash = this.calculateHash({
        index: currentBlock.index,
        timestamp: currentBlock.timestamp,
        dataHash: currentBlock.dataHash,
        previousHash: currentBlock.previousHash,
        nonce: currentBlock.nonce
      });

      if (recalculatedHash !== currentBlock.hash) {
        return {
          valid: false,
          message: `Invalid hash at block ${i}`,
          invalidBlock: currentBlock.id
        };
      }
    }

    return { valid: true, message: 'Chain is valid' };
  }

  // Get transaction receipt
  getTransactionReceipt(block) {
    return {
      transactionId: block.transactionId,
      blockHash: block.hash,
      blockIndex: block.index,
      timestamp: block.timestamp,
      dataHash: block.dataHash,
      verified: true
    };
  }

  // Verify a specific transaction exists in blockchain
  verifyTransaction(transactionId, blocks) {
    const block = blocks.find(b => b.transactionId === transactionId);
    if (!block) {
      return { verified: false, message: 'Transaction not found in blockchain' };
    }

    return {
      verified: true,
      receipt: this.getTransactionReceipt(block)
    };
  }
}

module.exports = new BlockchainSimulation();
=======
const CryptoJS = require('crypto-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

class BlockchainSimulation {
  constructor() {
    this.encryptionKey = process.env.BLOCKCHAIN_ENCRYPTION_KEY || 'finpal_blockchain_key_32chars!';
    this.difficulty = 2; // Number of leading zeros required
  }

  // Create a genesis block for a user
  createGenesisBlock(userId) {
    const block = {
      id: uuidv4(),
      userId,
      transactionId: null,
      index: 0,
      timestamp: Date.now(),
      data: 'Genesis Block',
      dataHash: this.hash('Genesis Block'),
      previousHash: '0',
      nonce: 0,
      hash: ''
    };
    
    block.hash = this.mineBlock(block);
    return block;
  }

  // Create a new block for a transaction
  createBlock(userId, transactionId, transactionData, previousBlock) {
    // Encrypt the transaction data
    const encryptedData = this.encryptData(JSON.stringify(transactionData));
    const dataHash = this.hash(JSON.stringify(transactionData));

    const block = {
      id: uuidv4(),
      userId,
      transactionId,
      index: previousBlock.index + 1,
      timestamp: Date.now(),
      dataHash,
      encryptedData,
      previousHash: previousBlock.hash,
      nonce: 0,
      hash: ''
    };

    block.hash = this.mineBlock(block);
    return block;
  }

  // Simple proof of work
  mineBlock(block) {
    let hash = '';
    const target = '0'.repeat(this.difficulty);
    
    while (!hash.startsWith(target)) {
      block.nonce++;
      hash = this.calculateHash(block);
    }
    
    return hash;
  }

  // Calculate block hash
  calculateHash(block) {
    const data = `${block.index}${block.timestamp}${block.dataHash}${block.previousHash}${block.nonce}`;
    return CryptoJS.SHA256(data).toString();
  }

  // Simple hash function
  hash(data) {
    return CryptoJS.SHA256(data).toString();
  }

  // Encrypt data using AES
  encryptData(data) {
    return CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
  }

  // Decrypt data
  decryptData(encryptedData) {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  // Verify blockchain integrity
  verifyChain(blocks) {
    if (blocks.length === 0) return { valid: true, message: 'Empty chain' };

    for (let i = 1; i < blocks.length; i++) {
      const currentBlock = blocks[i];
      const previousBlock = blocks[i - 1];

      // Check if previous hash matches
      if (currentBlock.previousHash !== previousBlock.hash) {
        return {
          valid: false,
          message: `Invalid previous hash at block ${i}`,
          invalidBlock: currentBlock.id
        };
      }

      // Recalculate and verify hash
      const recalculatedHash = this.calculateHash({
        index: currentBlock.index,
        timestamp: currentBlock.timestamp,
        dataHash: currentBlock.dataHash,
        previousHash: currentBlock.previousHash,
        nonce: currentBlock.nonce
      });

      if (recalculatedHash !== currentBlock.hash) {
        return {
          valid: false,
          message: `Invalid hash at block ${i}`,
          invalidBlock: currentBlock.id
        };
      }
    }

    return { valid: true, message: 'Chain is valid' };
  }

  // Get transaction receipt
  getTransactionReceipt(block) {
    return {
      transactionId: block.transactionId,
      blockHash: block.hash,
      blockIndex: block.index,
      timestamp: block.timestamp,
      dataHash: block.dataHash,
      verified: true
    };
  }

  // Verify a specific transaction exists in blockchain
  verifyTransaction(transactionId, blocks) {
    const block = blocks.find(b => b.transactionId === transactionId);
    if (!block) {
      return { verified: false, message: 'Transaction not found in blockchain' };
    }

    return {
      verified: true,
      receipt: this.getTransactionReceipt(block)
    };
  }
}

module.exports = new BlockchainSimulation();
>>>>>>> 2c5691fad8196faad9092c0293bb4957adef9391
