/**
 * Blockchain Service
 * Handles encrypted transaction storage on Ganache blockchain
 */

const { Web3 } = require('web3');
const CryptoJS = require('crypto-js');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
require('dotenv').config();

class BlockchainService {
  constructor() {
    this.web3 = new Web3(process.env.GANACHE_URL || 'http://127.0.0.1:8545');
    this.privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
    this.encryptionKey = process.env.ENCRYPTION_KEY;
  }

  async isConnected() {
    try {
      await this.web3.eth.getBlockNumber();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Encrypt transaction data
  encryptData(data) {
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, this.encryptionKey).toString();
  }

  // Decrypt transaction data
  decryptData(encryptedData) {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedString);
  }

  // Create hash of transaction data
  createHash(data) {
    return CryptoJS.SHA256(JSON.stringify(data)).toString();
  }

  // Store transaction on blockchain
  async storeTransaction(userId, transactionId, transactionData) {
    try {
      const connected = await this.isConnected();
      if (!connected) {
        throw new Error('Blockchain not connected');
      }

      // Encrypt the transaction data
      const encryptedData = this.encryptData(transactionData);
      
      // Create hash for on-chain storage
      const dataHash = this.createHash({
        userId,
        transactionId,
        timestamp: Date.now(),
        data: transactionData
      });

      // Get accounts
      const accounts = await this.web3.eth.getAccounts();
      const fromAccount = accounts[0];

      // Create transaction to store hash
      const tx = {
        from: fromAccount,
        to: fromAccount, // Self-transaction to store data
        value: '0',
        gas: 21000,
        data: this.web3.utils.utf8ToHex(dataHash)
      };

      // Send transaction
      const receipt = await this.web3.eth.sendTransaction(tx);

      // Store in database
      const blockchainTxId = uuidv4();
      await pool.query(
        `INSERT INTO blockchain_transactions 
         (id, user_id, transaction_id, tx_hash, encrypted_data, block_number, gas_used)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          blockchainTxId,
          userId,
          transactionId,
          receipt.transactionHash,
          encryptedData,
          receipt.blockNumber?.toString(),
          receipt.gasUsed?.toString()
        ]
      );

      return receipt.transactionHash;
    } catch (error) {
      console.error('Blockchain store error:', error);
      throw error;
    }
  }

  // Verify transaction on blockchain
  async verifyTransaction(txHash) {
    try {
      const receipt = await this.web3.eth.getTransactionReceipt(txHash);
      return receipt;
    } catch (error) {
      console.error('Blockchain verify error:', error);
      return null;
    }
  }

  // Get wallet balance
  async getBalance(address) {
    try {
      const balance = await this.web3.eth.getBalance(address);
      return this.web3.utils.fromWei(balance, 'ether');
    } catch (error) {
      console.error('Get balance error:', error);
      return '0';
    }
  }

  // Get all blockchain transactions for a user
  async getUserBlockchainTransactions(userId) {
    try {
      const [transactions] = await pool.query(
        `SELECT * FROM blockchain_transactions WHERE user_id = ? ORDER BY created_at DESC`,
        [userId]
      );

      return transactions.map(tx => ({
        ...tx,
        decryptedData: this.decryptData(tx.encrypted_data)
      }));
    } catch (error) {
      console.error('Get user blockchain transactions error:', error);
      return [];
    }
  }

  // Generate new wallet address (for demo purposes)
  async generateWallet() {
    const account = this.web3.eth.accounts.create();
    return {
      address: account.address,
      privateKey: account.privateKey
    };
  }

  // Get blockchain network info
  async getNetworkInfo() {
    try {
      const [blockNumber, gasPrice, chainId] = await Promise.all([
        this.web3.eth.getBlockNumber(),
        this.web3.eth.getGasPrice(),
        this.web3.eth.getChainId()
      ]);

      return {
        blockNumber: blockNumber.toString(),
        gasPrice: this.web3.utils.fromWei(gasPrice, 'gwei') + ' Gwei',
        chainId: chainId.toString(),
        network: 'Ganache Local'
      };
    } catch (error) {
      console.error('Get network info error:', error);
      return null;
    }
  }
}

module.exports = BlockchainService;
