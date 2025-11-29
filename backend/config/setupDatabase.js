<<<<<<< HEAD
const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
  // Connect without database first to create it
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306
  });

  console.log('Connected to MySQL server');

  // Create database
  await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'finpal_db'}`);
  console.log('Database created/verified');

  await connection.query(`USE ${process.env.DB_NAME || 'finpal_db'}`);

  // Create Users table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      subscription_plan ENUM('free', 'paid') DEFAULT 'free',
      risk_tolerance ENUM('low', 'medium', 'high') DEFAULT 'medium',
      income_type ENUM('salaried', 'freelancer', 'gig', 'business', 'other') DEFAULT 'salaried',
      monthly_income DECIMAL(15, 2) DEFAULT 0,
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
      account_number VARCHAR(50) NOT NULL,
      account_type ENUM('savings', 'current', 'salary') DEFAULT 'savings',
      balance DECIMAL(15, 2) DEFAULT 0,
      is_primary BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
      category VARCHAR(100),
      subcategory VARCHAR(100),
      description TEXT,
      merchant_name VARCHAR(255),
      transaction_date TIMESTAMP NOT NULL,
      upi_id VARCHAR(255),
      reference_id VARCHAR(255),
      is_recurring BOOLEAN DEFAULT FALSE,
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
      icon VARCHAR(50),
      color VARCHAR(20),
      is_system BOOLEAN DEFAULT TRUE,
      parent_category_id VARCHAR(36),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Categories table created');

  // Create Goals table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS goals (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      target_amount DECIMAL(15, 2) NOT NULL,
      current_amount DECIMAL(15, 2) DEFAULT 0,
      target_date DATE NOT NULL,
      priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
      category VARCHAR(100),
      status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
      monthly_contribution DECIMAL(15, 2) DEFAULT 0,
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
      month_year VARCHAR(7) NOT NULL,
      alert_threshold DECIMAL(5, 2) DEFAULT 80,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('Budgets table created');

  // Create AI Insights table
  // Create AI Insights table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS ai_insights (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      insight_type VARCHAR(100) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      data JSON,
      priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
      is_read BOOLEAN DEFAULT FALSE,
      is_actionable BOOLEAN DEFAULT TRUE,
      action_taken BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NULL DEFAULT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('AI Insights table created');

  // Create Investment Recommendations table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS investment_recommendations (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      investment_type ENUM('fd', 'bonds', 'mutual_funds', 'stocks', 'gold', 'ppf', 'nps') NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      expected_returns DECIMAL(5, 2),
      risk_level ENUM('low', 'medium', 'high') NOT NULL,
      minimum_investment DECIMAL(15, 2),
      recommended_amount DECIMAL(15, 2),
      tenure_months INT,
      reasoning TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('Investment Recommendations table created');

  // Create Blockchain Ledger table (for paid users)
  await connection.query(`
    CREATE TABLE IF NOT EXISTS blockchain_ledger (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      transaction_id VARCHAR(36),
      block_hash VARCHAR(255) NOT NULL,
      previous_hash VARCHAR(255) NOT NULL,
      data_hash VARCHAR(255) NOT NULL,
      encrypted_data TEXT,
      timestamp BIGINT NOT NULL,
      nonce INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('Blockchain Ledger table created');

  // Create User Behavior Patterns table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS user_behavior_patterns (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      pattern_type VARCHAR(100) NOT NULL,
      pattern_data JSON,
      confidence_score DECIMAL(5, 2),
      detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT TRUE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('User Behavior Patterns table created');

  // Create Chat History table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS chat_history (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      role ENUM('user', 'assistant') NOT NULL,
      message TEXT NOT NULL,
      context JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('Chat History table created');

  // Insert default categories
  const defaultCategories = [
    { name: 'Groceries', icon: 'cart', color: '#4CAF50' },
    { name: 'Shopping', icon: 'shopping-bag', color: '#E91E63' },
    { name: 'Food & Dining', icon: 'food', color: '#FF9800' },
    { name: 'Transportation', icon: 'car', color: '#2196F3' },
    { name: 'Entertainment', icon: 'movie', color: '#9C27B0' },
    { name: 'Bills & Utilities', icon: 'file-document', color: '#607D8B' },
    { name: 'Subscriptions', icon: 'refresh', color: '#00BCD4' },
    { name: 'EMI', icon: 'bank', color: '#795548' },
    { name: 'Healthcare', icon: 'hospital', color: '#F44336' },
    { name: 'Education', icon: 'school', color: '#3F51B5' },
    { name: 'Investments', icon: 'trending-up', color: '#1d8973' },
    { name: 'Income', icon: 'cash-plus', color: '#4CAF50' },
    { name: 'Interest Received', icon: 'percent', color: '#8BC34A' },
    { name: 'Salary', icon: 'briefcase', color: '#009688' },
    { name: 'Freelance Income', icon: 'laptop', color: '#00ACC1' },
    { name: 'Rent', icon: 'home', color: '#FF5722' },
    { name: 'Travel', icon: 'airplane', color: '#673AB7' },
    { name: 'Personal Care', icon: 'spa', color: '#E91E63' },
    { name: 'Gifts & Donations', icon: 'gift', color: '#FF4081' },
    { name: 'Other', icon: 'dots-horizontal', color: '#9E9E9E' }
  ];

  for (const category of defaultCategories) {
    const { v4: uuidv4 } = require('uuid');
    await connection.query(`
      INSERT IGNORE INTO categories (id, name, icon, color, is_system)
      VALUES (?, ?, ?, ?, TRUE)
    `, [uuidv4(), category.name, category.icon, category.color]);
  }
  console.log('Default categories inserted');

  await connection.end();
  console.log('\n✅ Database setup completed successfully!');
  console.log('You can now start the server with: npm run dev');
}

setupDatabase().catch(err => {
  console.error('Database setup failed:', err);
  process.exit(1);
});
=======
const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
  // Connect without database first to create it
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306
  });

  console.log('Connected to MySQL server');

  // Create database
  await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'finpal_db'}`);
  console.log('Database created/verified');

  await connection.query(`USE ${process.env.DB_NAME || 'finpal_db'}`);

  // Create Users table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      subscription_plan ENUM('free', 'paid') DEFAULT 'free',
      risk_tolerance ENUM('low', 'medium', 'high') DEFAULT 'medium',
      income_type ENUM('salaried', 'freelancer', 'gig', 'business', 'other') DEFAULT 'salaried',
      monthly_income DECIMAL(15, 2) DEFAULT 0,
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
      account_number VARCHAR(50) NOT NULL,
      account_type ENUM('savings', 'current', 'salary') DEFAULT 'savings',
      balance DECIMAL(15, 2) DEFAULT 0,
      is_primary BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
      category VARCHAR(100),
      subcategory VARCHAR(100),
      description TEXT,
      merchant_name VARCHAR(255),
      transaction_date TIMESTAMP NOT NULL,
      upi_id VARCHAR(255),
      reference_id VARCHAR(255),
      is_recurring BOOLEAN DEFAULT FALSE,
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
      icon VARCHAR(50),
      color VARCHAR(20),
      is_system BOOLEAN DEFAULT TRUE,
      parent_category_id VARCHAR(36),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Categories table created');

  // Create Goals table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS goals (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      target_amount DECIMAL(15, 2) NOT NULL,
      current_amount DECIMAL(15, 2) DEFAULT 0,
      target_date DATE NOT NULL,
      priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
      category VARCHAR(100),
      status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
      monthly_contribution DECIMAL(15, 2) DEFAULT 0,
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
      month_year VARCHAR(7) NOT NULL,
      alert_threshold DECIMAL(5, 2) DEFAULT 80,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('Budgets table created');

  // Create AI Insights table
  // Create AI Insights table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS ai_insights (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      insight_type VARCHAR(100) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      data JSON,
      priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
      is_read BOOLEAN DEFAULT FALSE,
      is_actionable BOOLEAN DEFAULT TRUE,
      action_taken BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NULL DEFAULT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('AI Insights table created');

  // Create Investment Recommendations table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS investment_recommendations (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      investment_type ENUM('fd', 'bonds', 'mutual_funds', 'stocks', 'gold', 'ppf', 'nps') NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      expected_returns DECIMAL(5, 2),
      risk_level ENUM('low', 'medium', 'high') NOT NULL,
      minimum_investment DECIMAL(15, 2),
      recommended_amount DECIMAL(15, 2),
      tenure_months INT,
      reasoning TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('Investment Recommendations table created');

  // Create Blockchain Ledger table (for paid users)
  await connection.query(`
    CREATE TABLE IF NOT EXISTS blockchain_ledger (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      transaction_id VARCHAR(36),
      block_hash VARCHAR(255) NOT NULL,
      previous_hash VARCHAR(255) NOT NULL,
      data_hash VARCHAR(255) NOT NULL,
      encrypted_data TEXT,
      timestamp BIGINT NOT NULL,
      nonce INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('Blockchain Ledger table created');

  // Create User Behavior Patterns table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS user_behavior_patterns (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      pattern_type VARCHAR(100) NOT NULL,
      pattern_data JSON,
      confidence_score DECIMAL(5, 2),
      detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT TRUE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('User Behavior Patterns table created');

  // Create Chat History table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS chat_history (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      role ENUM('user', 'assistant') NOT NULL,
      message TEXT NOT NULL,
      context JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('Chat History table created');

  // Insert default categories
  const defaultCategories = [
    { name: 'Groceries', icon: 'cart', color: '#4CAF50' },
    { name: 'Shopping', icon: 'shopping-bag', color: '#E91E63' },
    { name: 'Food & Dining', icon: 'food', color: '#FF9800' },
    { name: 'Transportation', icon: 'car', color: '#2196F3' },
    { name: 'Entertainment', icon: 'movie', color: '#9C27B0' },
    { name: 'Bills & Utilities', icon: 'file-document', color: '#607D8B' },
    { name: 'Subscriptions', icon: 'refresh', color: '#00BCD4' },
    { name: 'EMI', icon: 'bank', color: '#795548' },
    { name: 'Healthcare', icon: 'hospital', color: '#F44336' },
    { name: 'Education', icon: 'school', color: '#3F51B5' },
    { name: 'Investments', icon: 'trending-up', color: '#1d8973' },
    { name: 'Income', icon: 'cash-plus', color: '#4CAF50' },
    { name: 'Interest Received', icon: 'percent', color: '#8BC34A' },
    { name: 'Salary', icon: 'briefcase', color: '#009688' },
    { name: 'Freelance Income', icon: 'laptop', color: '#00ACC1' },
    { name: 'Rent', icon: 'home', color: '#FF5722' },
    { name: 'Travel', icon: 'airplane', color: '#673AB7' },
    { name: 'Personal Care', icon: 'spa', color: '#E91E63' },
    { name: 'Gifts & Donations', icon: 'gift', color: '#FF4081' },
    { name: 'Other', icon: 'dots-horizontal', color: '#9E9E9E' }
  ];

  for (const category of defaultCategories) {
    const { v4: uuidv4 } = require('uuid');
    await connection.query(`
      INSERT IGNORE INTO categories (id, name, icon, color, is_system)
      VALUES (?, ?, ?, ?, TRUE)
    `, [uuidv4(), category.name, category.icon, category.color]);
  }
  console.log('Default categories inserted');

  await connection.end();
  console.log('\n✅ Database setup completed successfully!');
  console.log('You can now start the server with: npm run dev');
}

setupDatabase().catch(err => {
  console.error('Database setup failed:', err);
  process.exit(1);
});
>>>>>>> 2c5691fad8196faad9092c0293bb4957adef9391
