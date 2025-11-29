<<<<<<< HEAD
const huggingface = require('./huggingface');

// Fallback keyword mapping (used when AI is unavailable)
const categoryKeywords = {
  'Groceries': ['grocery', 'supermarket', 'vegetables', 'fruits', 'bigbasket', 'grofers', 'blinkit', 'zepto', 'instamart', 'dmart', 'reliance fresh', 'more', 'spencers'],
  'Shopping': ['amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'nykaa', 'shopping', 'mall', 'store', 'retail', 'fashion', 'clothes', 'electronics'],
  'Food & Dining': ['swiggy', 'zomato', 'restaurant', 'cafe', 'food', 'dining', 'pizza', 'burger', 'dominos', 'mcdonalds', 'kfc', 'starbucks', 'chaayos', 'hotel'],
  'Transportation': ['uber', 'ola', 'rapido', 'metro', 'bus', 'train', 'irctc', 'petrol', 'diesel', 'fuel', 'parking', 'toll', 'fastag'],
  'Entertainment': ['netflix', 'prime video', 'hotstar', 'spotify', 'gaana', 'movie', 'pvr', 'inox', 'game', 'playstation', 'xbox', 'concert', 'event'],
  'Bills & Utilities': ['electricity', 'water', 'gas', 'internet', 'broadband', 'jio', 'airtel', 'vi', 'bsnl', 'maintenance', 'society'],
  'Subscriptions': ['subscription', 'premium', 'membership', 'annual', 'monthly plan', 'renewal'],
  'EMI': ['emi', 'loan', 'installment', 'bajaj', 'hdfc loan', 'icici loan', 'sbi loan'],
  'Healthcare': ['hospital', 'clinic', 'doctor', 'medicine', 'pharmacy', 'apollo', 'medplus', '1mg', 'pharmeasy', 'netmeds', 'health', 'medical'],
  'Education': ['school', 'college', 'university', 'course', 'udemy', 'coursera', 'unacademy', 'byjus', 'vedantu', 'tuition', 'books', 'stationery'],
  'Investments': ['mutual fund', 'zerodha', 'groww', 'upstox', 'sip', 'stock', 'nifty', 'sensex', 'investment', 'trading', 'mf'],
  'Income': ['salary', 'credited', 'received', 'payment received', 'income'],
  'Interest Received': ['interest credit', 'interest received', 'fd interest', 'rd interest', 'savings interest'],
  'Salary': ['salary', 'payroll', 'wages', 'monthly salary'],
  'Freelance Income': ['freelance', 'consulting', 'project payment', 'client payment', 'gig'],
  'Rent': ['rent', 'rental', 'housing', 'pg', 'hostel'],
  'Travel': ['makemytrip', 'goibibo', 'cleartrip', 'yatra', 'flight', 'hotel booking', 'airbnb', 'oyo', 'travel'],
  'Personal Care': ['salon', 'spa', 'gym', 'fitness', 'urban company', 'beauty', 'grooming'],
  'Gifts & Donations': ['gift', 'donation', 'charity', 'ngo', 'temple', 'church', 'mosque'],
  'Other': []
};

class TransactionCategorizer {
  constructor() {
    this.categories = Object.keys(categoryKeywords);
    this.categorizationCache = new Map(); // Cache for same-session deduplication
  }

  /**
   * AI-first categorization with intelligent fallback
   */
  async categorizeTransaction(transaction, recentTransactions = []) {
    const { description, merchant_name, amount, type } = transaction;
    const searchText = `${description || ''} ${merchant_name || ''}`.toLowerCase().trim();

    // Check cache first (same description in same session)
    const cacheKey = `${searchText}-${amount}-${type}`;
    if (this.categorizationCache.has(cacheKey)) {
      const cached = this.categorizationCache.get(cacheKey);
      return { ...cached, method: 'cached' };
    }

    // Try AI categorization first
    console.log(`🤖 AI categorizing: "${searchText}"`);
    
    try {
      const aiResult = await huggingface.categorizeTransaction(
        transaction,
        this.categories,
        recentTransactions
      );

      if (aiResult && aiResult.confidence >= 0.6) {
        console.log(`✅ AI categorized as: ${aiResult.category} (${(aiResult.confidence * 100).toFixed(0)}%)`);
        
        // Cache the result
        this.categorizationCache.set(cacheKey, aiResult);
        
        // Limit cache size
        if (this.categorizationCache.size > 500) {
          const firstKey = this.categorizationCache.keys().next().value;
          this.categorizationCache.delete(firstKey);
        }

        return aiResult;
      }
    } catch (error) {
      console.error('AI categorization failed:', error.message);
    }

    // Fallback to keyword matching
    console.log(`⚙️ Using keyword fallback for: "${searchText}"`);
    const keywordResult = this.keywordCategorize(searchText);
    
    // Cache fallback result too
    this.categorizationCache.set(cacheKey, keywordResult);
    
    return keywordResult;
  }

  /**
   * Keyword-based categorization fallback
   */
  keywordCategorize(searchText) {
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (searchText.includes(keyword.toLowerCase())) {
          return {
            category,
            confidence: 0.85,
            reasoning: `Matched keyword: "${keyword}"`,
            method: 'keyword'
          };
        }
      }
    }

    return {
      category: 'Other',
      confidence: 0.5,
      reasoning: 'No keyword match found',
      method: 'default'
    };
  }

  /**
   * Batch categorize multiple transactions
   */
  async categorizeMultipleTransactions(transactions, existingCategorized = []) {
    const results = [];
    
    // Process in batches of 5 to avoid overwhelming the API
    const batchSize = 5;
    
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      
      // Process batch in parallel
      const batchPromises = batch.map(async (transaction) => {
        const result = await this.categorizeTransaction(
          transaction,
          existingCategorized.slice(-10) // Last 10 categorized for context
        );
        return {
          transactionId: transaction.id,
          ...result
        };
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add successfully categorized to context for next batch
      for (const result of batchResults) {
        if (result.method === 'ai' && result.confidence >= 0.7) {
          const txn = batch.find(t => t.id === result.transactionId);
          if (txn) {
            existingCategorized.push({
              description: txn.description,
              category: result.category
            });
          }
        }
      }

      // Small delay between batches to be nice to the API
      if (i + batchSize < transactions.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return results;
  }

  /**
   * Detect recurring transactions (kept local for performance)
   */
  detectRecurringTransaction(transactions) {
    const merchantCounts = {};
    const merchantAmounts = {};

    for (const transaction of transactions) {
      const key = transaction.merchant_name || transaction.description;
      if (key) {
        merchantCounts[key] = (merchantCounts[key] || 0) + 1;
        if (!merchantAmounts[key]) {
          merchantAmounts[key] = [];
        }
        merchantAmounts[key].push(transaction.amount);
      }
    }

    const recurring = [];
    for (const [merchant, count] of Object.entries(merchantCounts)) {
      if (count >= 2) {
        const amounts = merchantAmounts[merchant];
        const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - avgAmount, 2), 0) / amounts.length;
        
        // Low variance indicates recurring transaction
        if (variance < avgAmount * 0.1) {
          recurring.push({
            merchant,
            count,
            averageAmount: avgAmount,
            isRecurring: true
          });
        }
      }
    }

    return recurring;
  }

  /**
   * Clear categorization cache
   */
  clearCache() {
    this.categorizationCache.clear();
  }
}

module.exports = new TransactionCategorizer();
=======
const huggingface = require('./huggingface');

// Fallback keyword mapping (used when AI is unavailable)
const categoryKeywords = {
  'Groceries': ['grocery', 'supermarket', 'vegetables', 'fruits', 'bigbasket', 'grofers', 'blinkit', 'zepto', 'instamart', 'dmart', 'reliance fresh', 'more', 'spencers'],
  'Shopping': ['amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'nykaa', 'shopping', 'mall', 'store', 'retail', 'fashion', 'clothes', 'electronics'],
  'Food & Dining': ['swiggy', 'zomato', 'restaurant', 'cafe', 'food', 'dining', 'pizza', 'burger', 'dominos', 'mcdonalds', 'kfc', 'starbucks', 'chaayos', 'hotel'],
  'Transportation': ['uber', 'ola', 'rapido', 'metro', 'bus', 'train', 'irctc', 'petrol', 'diesel', 'fuel', 'parking', 'toll', 'fastag'],
  'Entertainment': ['netflix', 'prime video', 'hotstar', 'spotify', 'gaana', 'movie', 'pvr', 'inox', 'game', 'playstation', 'xbox', 'concert', 'event'],
  'Bills & Utilities': ['electricity', 'water', 'gas', 'internet', 'broadband', 'jio', 'airtel', 'vi', 'bsnl', 'maintenance', 'society'],
  'Subscriptions': ['subscription', 'premium', 'membership', 'annual', 'monthly plan', 'renewal'],
  'EMI': ['emi', 'loan', 'installment', 'bajaj', 'hdfc loan', 'icici loan', 'sbi loan'],
  'Healthcare': ['hospital', 'clinic', 'doctor', 'medicine', 'pharmacy', 'apollo', 'medplus', '1mg', 'pharmeasy', 'netmeds', 'health', 'medical'],
  'Education': ['school', 'college', 'university', 'course', 'udemy', 'coursera', 'unacademy', 'byjus', 'vedantu', 'tuition', 'books', 'stationery'],
  'Investments': ['mutual fund', 'zerodha', 'groww', 'upstox', 'sip', 'stock', 'nifty', 'sensex', 'investment', 'trading', 'mf'],
  'Income': ['salary', 'credited', 'received', 'payment received', 'income'],
  'Interest Received': ['interest credit', 'interest received', 'fd interest', 'rd interest', 'savings interest'],
  'Salary': ['salary', 'payroll', 'wages', 'monthly salary'],
  'Freelance Income': ['freelance', 'consulting', 'project payment', 'client payment', 'gig'],
  'Rent': ['rent', 'rental', 'housing', 'pg', 'hostel'],
  'Travel': ['makemytrip', 'goibibo', 'cleartrip', 'yatra', 'flight', 'hotel booking', 'airbnb', 'oyo', 'travel'],
  'Personal Care': ['salon', 'spa', 'gym', 'fitness', 'urban company', 'beauty', 'grooming'],
  'Gifts & Donations': ['gift', 'donation', 'charity', 'ngo', 'temple', 'church', 'mosque'],
  'Other': []
};

class TransactionCategorizer {
  constructor() {
    this.categories = Object.keys(categoryKeywords);
    this.categorizationCache = new Map(); // Cache for same-session deduplication
  }

  /**
   * AI-first categorization with intelligent fallback
   */
  async categorizeTransaction(transaction, recentTransactions = []) {
    const { description, merchant_name, amount, type } = transaction;
    const searchText = `${description || ''} ${merchant_name || ''}`.toLowerCase().trim();

    // Check cache first (same description in same session)
    const cacheKey = `${searchText}-${amount}-${type}`;
    if (this.categorizationCache.has(cacheKey)) {
      const cached = this.categorizationCache.get(cacheKey);
      return { ...cached, method: 'cached' };
    }

    // Try AI categorization first
    console.log(`🤖 AI categorizing: "${searchText}"`);
    
    try {
      const aiResult = await huggingface.categorizeTransaction(
        transaction,
        this.categories,
        recentTransactions
      );

      if (aiResult && aiResult.confidence >= 0.6) {
        console.log(`✅ AI categorized as: ${aiResult.category} (${(aiResult.confidence * 100).toFixed(0)}%)`);
        
        // Cache the result
        this.categorizationCache.set(cacheKey, aiResult);
        
        // Limit cache size
        if (this.categorizationCache.size > 500) {
          const firstKey = this.categorizationCache.keys().next().value;
          this.categorizationCache.delete(firstKey);
        }

        return aiResult;
      }
    } catch (error) {
      console.error('AI categorization failed:', error.message);
    }

    // Fallback to keyword matching
    console.log(`⚙️ Using keyword fallback for: "${searchText}"`);
    const keywordResult = this.keywordCategorize(searchText);
    
    // Cache fallback result too
    this.categorizationCache.set(cacheKey, keywordResult);
    
    return keywordResult;
  }

  /**
   * Keyword-based categorization fallback
   */
  keywordCategorize(searchText) {
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (searchText.includes(keyword.toLowerCase())) {
          return {
            category,
            confidence: 0.85,
            reasoning: `Matched keyword: "${keyword}"`,
            method: 'keyword'
          };
        }
      }
    }

    return {
      category: 'Other',
      confidence: 0.5,
      reasoning: 'No keyword match found',
      method: 'default'
    };
  }

  /**
   * Batch categorize multiple transactions
   */
  async categorizeMultipleTransactions(transactions, existingCategorized = []) {
    const results = [];
    
    // Process in batches of 5 to avoid overwhelming the API
    const batchSize = 5;
    
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      
      // Process batch in parallel
      const batchPromises = batch.map(async (transaction) => {
        const result = await this.categorizeTransaction(
          transaction,
          existingCategorized.slice(-10) // Last 10 categorized for context
        );
        return {
          transactionId: transaction.id,
          ...result
        };
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add successfully categorized to context for next batch
      for (const result of batchResults) {
        if (result.method === 'ai' && result.confidence >= 0.7) {
          const txn = batch.find(t => t.id === result.transactionId);
          if (txn) {
            existingCategorized.push({
              description: txn.description,
              category: result.category
            });
          }
        }
      }

      // Small delay between batches to be nice to the API
      if (i + batchSize < transactions.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return results;
  }

  /**
   * Detect recurring transactions (kept local for performance)
   */
  detectRecurringTransaction(transactions) {
    const merchantCounts = {};
    const merchantAmounts = {};

    for (const transaction of transactions) {
      const key = transaction.merchant_name || transaction.description;
      if (key) {
        merchantCounts[key] = (merchantCounts[key] || 0) + 1;
        if (!merchantAmounts[key]) {
          merchantAmounts[key] = [];
        }
        merchantAmounts[key].push(transaction.amount);
      }
    }

    const recurring = [];
    for (const [merchant, count] of Object.entries(merchantCounts)) {
      if (count >= 2) {
        const amounts = merchantAmounts[merchant];
        const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - avgAmount, 2), 0) / amounts.length;
        
        // Low variance indicates recurring transaction
        if (variance < avgAmount * 0.1) {
          recurring.push({
            merchant,
            count,
            averageAmount: avgAmount,
            isRecurring: true
          });
        }
      }
    }

    return recurring;
  }

  /**
   * Clear categorization cache
   */
  clearCache() {
    this.categorizationCache.clear();
  }
}

module.exports = new TransactionCategorizer();
>>>>>>> 2c5691fad8196faad9092c0293bb4957adef9391
