const pool = require('./database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function seedDatabase() {
  console.log('🌱 Seeding database with test data...\n');

  try {
    // Create test users
    const hashedPassword = await bcrypt.hash('Test@123', 10);
    const userId1 = uuidv4();
    const userId2 = uuidv4();
    
    // Test User 1 - Free Plan
    await pool.execute(
      `INSERT INTO users (id, name, email, password, phone, subscription_plan, monthly_income, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [userId1, 'Rahul Sharma', 'rahul@test.com', hashedPassword, '9876543210', 'free', 75000]
    );
    
    // Test User 2 - Premium Plan
    await pool.execute(
      `INSERT INTO users (id, name, email, password, phone, subscription_plan, monthly_income, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [userId2, 'Priya Patel', 'priya@test.com', hashedPassword, '9876543211', 'paid', 120000]
    );

    console.log('✅ Created test users:');
    console.log('   📧 rahul@test.com (Free Plan) - Password: Test@123');
    console.log('   📧 priya@test.com (Premium Plan) - Password: Test@123\n');

    // Create bank accounts for user 1
    const bankId1 = uuidv4();
    const bankId2 = uuidv4();
    
    await pool.execute(
      `INSERT INTO bank_accounts (id, user_id, bank_name, account_number, account_type, balance, is_primary, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE balance = VALUES(balance)`,
      [bankId1, userId1, 'HDFC Bank', '1234567890123456', 'savings', 85000, true]
    );

    await pool.execute(
      `INSERT INTO bank_accounts (id, user_id, bank_name, account_number, account_type, balance, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE balance = VALUES(balance)`,
      [bankId2, userId1, 'ICICI Bank', '9876543210123456', 'savings', 42000]
    );

    console.log('✅ Created bank accounts for rahul@test.com\n');

    // Create transactions for the past 3 months
    const transactions = [
      // November 2025 Transactions
      { date: '2025-11-28', description: 'Salary Credit - TechCorp Ltd', amount: 75000, type: 'credit', category: 'Salary' },
      { date: '2025-11-27', description: 'Netflix Subscription', amount: 649, type: 'debit', category: 'Subscriptions' },
      { date: '2025-11-26', description: 'Swiggy Order - Dominos Pizza', amount: 856, type: 'debit', category: 'Food & Dining' },
      { date: '2025-11-25', description: 'Amazon - Electronics', amount: 15999, type: 'debit', category: 'Shopping' },
      { date: '2025-11-24', description: 'BigBasket Groceries', amount: 3450, type: 'debit', category: 'Groceries' },
      { date: '2025-11-23', description: 'Uber Ride to Airport', amount: 1250, type: 'debit', category: 'Transportation' },
      { date: '2025-11-22', description: 'Spotify Premium', amount: 119, type: 'debit', category: 'Subscriptions' },
      { date: '2025-11-21', description: 'PVR Cinemas - Movie Tickets', amount: 850, type: 'debit', category: 'Entertainment' },
      { date: '2025-11-20', description: 'Electricity Bill - BESCOM', amount: 2340, type: 'debit', category: 'Bills & Utilities' },
      { date: '2025-11-19', description: 'HDFC Car Loan EMI', amount: 12500, type: 'debit', category: 'EMI' },
      { date: '2025-11-18', description: 'Zerodha - Mutual Fund SIP', amount: 5000, type: 'debit', category: 'Investments' },
      { date: '2025-11-17', description: 'Apollo Pharmacy', amount: 780, type: 'debit', category: 'Healthcare' },
      { date: '2025-11-16', description: 'Zomato Gold Membership', amount: 600, type: 'debit', category: 'Subscriptions' },
      { date: '2025-11-15', description: 'Petrol - HP Fuel Station', amount: 2500, type: 'debit', category: 'Transportation' },
      { date: '2025-11-14', description: 'Interest Credit - Savings Account', amount: 1250, type: 'credit', category: 'Interest Received' },
      { date: '2025-11-13', description: 'DMart Weekly Shopping', amount: 4200, type: 'debit', category: 'Groceries' },
      { date: '2025-11-12', description: 'Starbucks Coffee', amount: 520, type: 'debit', category: 'Food & Dining' },
      { date: '2025-11-10', description: 'Myntra - Clothing', amount: 3599, type: 'debit', category: 'Shopping' },
      { date: '2025-11-08', description: 'Mobile Recharge - Jio', amount: 666, type: 'debit', category: 'Bills & Utilities' },
      { date: '2025-11-05', description: 'Freelance Payment Received', amount: 15000, type: 'credit', category: 'Freelance Income' },

      // October 2025 Transactions
      { date: '2025-10-28', description: 'Salary Credit - TechCorp Ltd', amount: 75000, type: 'credit', category: 'Salary' },
      { date: '2025-10-27', description: 'Netflix Subscription', amount: 649, type: 'debit', category: 'Subscriptions' },
      { date: '2025-10-25', description: 'Flipkart Sale - Laptop Bag', amount: 1299, type: 'debit', category: 'Shopping' },
      { date: '2025-10-24', description: 'Swiggy - Multiple Orders', amount: 2450, type: 'debit', category: 'Food & Dining' },
      { date: '2025-10-22', description: 'BigBasket Groceries', amount: 3800, type: 'debit', category: 'Groceries' },
      { date: '2025-10-20', description: 'Ola Ride', amount: 450, type: 'debit', category: 'Transportation' },
      { date: '2025-10-19', description: 'HDFC Car Loan EMI', amount: 12500, type: 'debit', category: 'EMI' },
      { date: '2025-10-18', description: 'Zerodha - Mutual Fund SIP', amount: 5000, type: 'debit', category: 'Investments' },
      { date: '2025-10-17', description: 'Amazon Prime Renewal', amount: 1499, type: 'debit', category: 'Subscriptions' },
      { date: '2025-10-15', description: 'Electricity Bill - BESCOM', amount: 1980, type: 'debit', category: 'Bills & Utilities' },
      { date: '2025-10-14', description: 'Interest Credit - FD Maturity', amount: 8500, type: 'credit', category: 'Interest Received' },
      { date: '2025-10-12', description: 'BookMyShow - Concert Tickets', amount: 3500, type: 'debit', category: 'Entertainment' },
      { date: '2025-10-10', description: 'Reliance Fresh', amount: 2100, type: 'debit', category: 'Groceries' },
      { date: '2025-10-08', description: 'Petrol - Indian Oil', amount: 3000, type: 'debit', category: 'Transportation' },
      { date: '2025-10-05', description: 'Gym Membership - Cult Fit', amount: 2000, type: 'debit', category: 'Healthcare' },
      { date: '2025-10-03', description: 'Zara - Shopping', amount: 5999, type: 'debit', category: 'Shopping' },

      // September 2025 Transactions
      { date: '2025-09-28', description: 'Salary Credit - TechCorp Ltd', amount: 75000, type: 'credit', category: 'Salary' },
      { date: '2025-09-26', description: 'Netflix Subscription', amount: 649, type: 'debit', category: 'Subscriptions' },
      { date: '2025-09-25', description: 'Amazon - Kitchen Appliances', amount: 8999, type: 'debit', category: 'Shopping' },
      { date: '2025-09-23', description: 'Swiggy Orders', amount: 1850, type: 'debit', category: 'Food & Dining' },
      { date: '2025-09-22', description: 'DMart Monthly Groceries', amount: 5500, type: 'debit', category: 'Groceries' },
      { date: '2025-09-20', description: 'Rapido Bike Taxi', amount: 180, type: 'debit', category: 'Transportation' },
      { date: '2025-09-19', description: 'HDFC Car Loan EMI', amount: 12500, type: 'debit', category: 'EMI' },
      { date: '2025-09-18', description: 'Zerodha - Mutual Fund SIP', amount: 5000, type: 'debit', category: 'Investments' },
      { date: '2025-09-17', description: 'Dividend Credit - HDFC Bank', amount: 2500, type: 'credit', category: 'Interest Received' },
      { date: '2025-09-15', description: 'Electricity Bill - BESCOM', amount: 2150, type: 'debit', category: 'Bills & Utilities' },
      { date: '2025-09-14', description: 'Doctor Visit - Apollo', amount: 1500, type: 'debit', category: 'Healthcare' },
      { date: '2025-09-12', description: 'Gaming - Steam Purchase', amount: 1200, type: 'debit', category: 'Entertainment' },
      { date: '2025-09-10', description: 'Petrol - BP', amount: 2800, type: 'debit', category: 'Transportation' },
      { date: '2025-09-08', description: 'More Supermarket', amount: 1800, type: 'debit', category: 'Groceries' },
      { date: '2025-09-05', description: 'Gift Received - Birthday', amount: 10000, type: 'credit', category: 'Income' },
      { date: '2025-09-03', description: 'H&M Shopping', amount: 4500, type: 'debit', category: 'Shopping' },
    ];

    // Insert transactions
    for (const txn of transactions) {
      await pool.execute(
        `INSERT INTO transactions (id, user_id, bank_account_id, description, amount, type, category, transaction_date, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [uuidv4(), userId1, bankId1, txn.description, txn.amount, txn.type, txn.category, txn.date]
      );
    }

    console.log(`✅ Created ${transactions.length} transactions for testing\n`);

    // Create Goals
    await pool.execute(
      `INSERT INTO goals (id, user_id, name, target_amount, current_amount, target_date, priority, category, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [uuidv4(), userId1, 'Emergency Fund', 300000, 85000, '2026-06-30', 'high', 'savings', 'active']
    );

    await pool.execute(
      `INSERT INTO goals (id, user_id, name, target_amount, current_amount, target_date, priority, category, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [uuidv4(), userId1, 'Vacation to Europe', 150000, 35000, '2026-03-15', 'medium', 'travel', 'active']
    );

    await pool.execute(
      `INSERT INTO goals (id, user_id, name, target_amount, current_amount, target_date, priority, category, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [uuidv4(), userId1, 'New Laptop', 100000, 100000, '2025-10-01', 'low', 'purchase', 'completed']
    );

    console.log('✅ Created financial goals\n');

    // Create Budgets
    const currentMonthYear = new Date().toISOString().slice(0, 7); // YYYY-MM
    const budgets = [
      { category: 'Groceries', limit: 10000 },
      { category: 'Food & Dining', limit: 5000 },
      { category: 'Shopping', limit: 8000 },
      { category: 'Transportation', limit: 5000 },
      { category: 'Entertainment', limit: 3000 },
      { category: 'Bills & Utilities', limit: 5000 },
      { category: 'Subscriptions', limit: 2000 },
      { category: 'Healthcare', limit: 3000 },
    ];

    for (const budget of budgets) {
      await pool.execute(
        `INSERT INTO budgets (id, user_id, category, monthly_limit, month_year, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [uuidv4(), userId1, budget.category, budget.limit, currentMonthYear]
      );
    }

    console.log('✅ Created budget limits\n');

    // Create some AI insights
    const insights = [
      {
        type: 'overspending',
        title: 'Shopping Alert',
        description: 'You\'ve spent ₹25,896 on shopping this month, which is 223% over your budget of ₹8,000.',
        priority: 'high'
      },
      {
        type: 'savings_alert',
        title: 'Savings Opportunity',
        description: 'Your subscription expenses total ₹2,917 monthly. Consider reviewing unused subscriptions.',
        priority: 'medium'
      },
      {
        type: 'goal',
        title: 'Goal Progress',
        description: 'You\'re 28% towards your Emergency Fund goal. Keep saving ₹35,800/month to reach it by June 2026.',
        priority: 'low'
      },
      {
        type: 'investment',
        title: 'Investment Insight',
        description: 'Based on your income and savings rate, you could invest an additional ₹10,000/month in mutual funds.',
        priority: 'medium'
      }
    ];

    for (const insight of insights) {
      await pool.execute(
        `INSERT INTO ai_insights (id, user_id, insight_type, title, description, priority, is_read, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [uuidv4(), userId1, insight.type, insight.title, insight.description, insight.priority, false]
      );
    }

    console.log('✅ Created AI insights\n');

    console.log('========================================');
    console.log('🎉 Database seeding completed!');
    console.log('========================================\n');
    console.log('Test Credentials:');
    console.log('─────────────────────────────────────');
    console.log('📧 Email:    rahul@test.com');
    console.log('🔑 Password: Test@123');
    console.log('📋 Plan:     Free');
    console.log('─────────────────────────────────────');
    console.log('📧 Email:    priya@test.com');
    console.log('🔑 Password: Test@123');
    console.log('📋 Plan:     Premium');
    console.log('─────────────────────────────────────\n');
    console.log('Test Data Includes:');
    console.log('• 2 Bank Accounts (HDFC, ICICI)');
    console.log('• 52 Transactions (3 months history)');
    console.log('• 3 Financial Goals');
    console.log('• 8 Budget Categories');
    console.log('• 4 AI Insights\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
