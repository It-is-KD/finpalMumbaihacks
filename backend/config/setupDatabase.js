const mysql = require('mysql2/promise');
require('dotenv').config();

const setupDatabase = async () => {
  // First, connect without database to create it
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  console.log('Connected to MySQL server');

  // Create database if not exists
  await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'finpal'}`);
  console.log('Database created or already exists');

  // Use the database
  await connection.query(`USE ${process.env.DB_NAME || 'finpal'}`);

  // Create Users table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      subscription_plan ENUM('free', 'paid') DEFAULT 'free',
      wallet_address VARCHAR(255),
      monthly_income DECIMAL(15, 2) DEFAULT 0,
      income_type ENUM('regular', 'irregular', 'freelance', 'gig') DEFAULT 'regular',
      risk_tolerance ENUM('low', 'medium', 'high') DEFAULT 'medium',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('Users table created');

  // Create Bank Accounts table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS bank_accounts (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      bank_name VARCHAR(255) NOT NULL,
      account_number VARCHAR(255) NOT NULL,
      account_type ENUM('savings', 'current', 'salary') DEFAULT 'savings',
      balance DECIMAL(15, 2) DEFAULT 0,
      is_primary BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('Bank Accounts table created');

  // Create Transactions table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      bank_account_id VARCHAR(36) NOT NULL,
      type ENUM('credit', 'debit') NOT NULL,
      amount DECIMAL(15, 2) NOT NULL,
      description TEXT,
      merchant_name VARCHAR(255),
      category VARCHAR(100),
      sub_category VARCHAR(100),
      transaction_date TIMESTAMP NOT NULL,
      upi_id VARCHAR(255),
      reference_number VARCHAR(255),
      is_recurring BOOLEAN DEFAULT FALSE,
      blockchain_hash VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE CASCADE
    )
  `);
  console.log('Transactions table created');

  // Create Categories table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      type ENUM('income', 'expense') NOT NULL,
      icon VARCHAR(50),
      color VARCHAR(20),
      is_system BOOLEAN DEFAULT TRUE
    )
  `);
  console.log('Categories table created');

  // Create Goals table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS goals (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      target_amount DECIMAL(15, 2) NOT NULL,
      current_amount DECIMAL(15, 2) DEFAULT 0,
      target_date DATE NOT NULL,
      priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
      status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
      monthly_saving_needed DECIMAL(15, 2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('Goals table created');

  // Create Budgets table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS budgets (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      category VARCHAR(100) NOT NULL,
      monthly_limit DECIMAL(15, 2) NOT NULL,
      current_spent DECIMAL(15, 2) DEFAULT 0,
      month VARCHAR(7) NOT NULL,
      alert_threshold DECIMAL(5, 2) DEFAULT 80,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('Budgets table created');

  // Create AI Insights table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS ai_insights (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      type ENUM('saving_tip', 'spending_alert', 'investment_suggestion', 'goal_progress', 'behavioral_nudge', 'income_prediction') NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
      is_read BOOLEAN DEFAULT FALSE,
      action_taken BOOLEAN DEFAULT FALSE,
      metadata JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('AI Insights table created');

  // Create User Behavior Patterns table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS user_behavior_patterns (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      pattern_type VARCHAR(100) NOT NULL,
      pattern_data JSON NOT NULL,
      confidence_score DECIMAL(5, 2),
      detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('User Behavior Patterns table created');

  // Create Investment Recommendations table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS investment_recommendations (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      type ENUM('fd', 'bonds', 'mutual_funds', 'stocks', 'gold', 'crypto') NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      expected_return DECIMAL(5, 2),
      risk_level ENUM('low', 'medium', 'high') NOT NULL,
      min_investment DECIMAL(15, 2),
      recommended_amount DECIMAL(15, 2),
      duration_months INT,
      reason TEXT,
      is_acted_upon BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('Investment Recommendations table created');

  // Create Chat History table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS chat_history (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      role ENUM('user', 'assistant') NOT NULL,
      message TEXT NOT NULL,
      metadata JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('Chat History table created');

  // Create Blockchain Transactions table (for paid users)
  await connection.query(`
    CREATE TABLE IF NOT EXISTS blockchain_transactions (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      transaction_id VARCHAR(36) NOT NULL,
      tx_hash VARCHAR(255) NOT NULL,
      encrypted_data TEXT NOT NULL,
      block_number BIGINT,
      gas_used BIGINT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
    )
  `);
  console.log('Blockchain Transactions table created');

  // Insert default categories
  const categories = [
    ['cat-1', 'Salary', 'income', 'cash', '#4CAF50'],
    ['cat-2', 'Freelance', 'income', 'briefcase', '#8BC34A'],
    ['cat-3', 'Investment Returns', 'income', 'trending-up', '#00BCD4'],
    ['cat-4', 'Interest', 'income', 'percent', '#009688'],
    ['cat-5', 'Other Income', 'income', 'plus-circle', '#607D8B'],
    ['cat-6', 'Food & Dining', 'expense', 'restaurant', '#FF5722'],
    ['cat-7', 'Shopping', 'expense', 'shopping-bag', '#E91E63'],
    ['cat-8', 'Groceries', 'expense', 'cart', '#9C27B0'],
    ['cat-9', 'Transportation', 'expense', 'car', '#673AB7'],
    ['cat-10', 'Subscriptions', 'expense', 'repeat', '#3F51B5'],
    ['cat-11', 'Entertainment', 'expense', 'film', '#2196F3'],
    ['cat-12', 'Healthcare', 'expense', 'heart', '#F44336'],
    ['cat-13', 'Education', 'expense', 'book', '#795548'],
    ['cat-14', 'Bills & Utilities', 'expense', 'file-text', '#FF9800'],
    ['cat-15', 'EMI', 'expense', 'credit-card', '#FFC107'],
    ['cat-16', 'Investments', 'expense', 'pie-chart', '#4CAF50'],
    ['cat-17', 'Insurance', 'expense', 'shield', '#00BCD4'],
    ['cat-18', 'Rent', 'expense', 'home', '#9E9E9E'],
    ['cat-19', 'Travel', 'expense', 'airplane', '#03A9F4'],
    ['cat-20', 'Other Expense', 'expense', 'more-horizontal', '#607D8B']
  ];

  for (const cat of categories) {
    await connection.query(
      'INSERT IGNORE INTO categories (id, name, type, icon, color) VALUES (?, ?, ?, ?, ?)',
      cat
    );
  }
  console.log('Default categories inserted');

  await connection.end();
  console.log('Database setup completed successfully!');
};

setupDatabase().catch(console.error);
