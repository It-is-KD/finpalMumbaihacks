/**
 * Transaction Categorizer Agent
 * Automatically categorizes transactions based on description, merchant, and amount
 */

const categories = {
  income: {
    'Salary': ['salary', 'payroll', 'wage', 'stipend', 'compensation'],
    'Freelance': ['freelance', 'consulting', 'contract', 'project payment', 'client payment'],
    'Investment Returns': ['dividend', 'capital gain', 'returns', 'profit', 'maturity'],
    'Interest': ['interest', 'fd interest', 'savings interest', 'deposit interest'],
    'Other Income': ['refund', 'cashback', 'bonus', 'reimbursement', 'gift']
  },
  expense: {
    'Food & Dining': ['swiggy', 'zomato', 'restaurant', 'cafe', 'food', 'pizza', 'burger', 'dining', 'eat', 'meal', 'uber eats', 'dominos', 'mcdonalds', 'kfc', 'starbucks'],
    'Shopping': ['amazon', 'flipkart', 'myntra', 'ajio', 'shopping', 'mall', 'store', 'retail', 'meesho', 'nykaa', 'snapdeal'],
    'Groceries': ['grocery', 'bigbasket', 'grofers', 'blinkit', 'zepto', 'dmart', 'reliance fresh', 'vegetables', 'fruits', 'supermarket', 'jiomart'],
    'Transportation': ['uber', 'ola', 'rapido', 'metro', 'bus', 'train', 'petrol', 'diesel', 'fuel', 'parking', 'toll', 'irctc', 'cab', 'auto'],
    'Subscriptions': ['netflix', 'spotify', 'prime', 'hotstar', 'youtube', 'subscription', 'membership', 'recurring', 'disney', 'zee5', 'gaana', 'apple music'],
    'Entertainment': ['movie', 'cinema', 'pvr', 'inox', 'concert', 'event', 'game', 'bookmyshow', 'ticket', 'amusement'],
    'Healthcare': ['hospital', 'doctor', 'pharmacy', 'medical', 'medicine', 'apollo', 'medplus', 'netmeds', 'pharmeasy', 'clinic', 'health'],
    'Education': ['course', 'udemy', 'coursera', 'school', 'college', 'tuition', 'book', 'education', 'upgrad', 'byju', 'unacademy'],
    'Bills & Utilities': ['electricity', 'water', 'gas', 'internet', 'broadband', 'phone', 'mobile', 'bill', 'recharge', 'postpaid', 'prepaid', 'airtel', 'jio', 'vi'],
    'EMI': ['emi', 'loan', 'installment', 'credit card', 'repayment', 'mortgage', 'bajaj', 'hdfc loan'],
    'Investments': ['mutual fund', 'stock', 'share', 'sip', 'zerodha', 'groww', 'upstox', 'investment', 'trading', 'nps', 'ppf'],
    'Insurance': ['insurance', 'premium', 'lic', 'policy', 'term plan', 'health insurance', 'car insurance'],
    'Rent': ['rent', 'house rent', 'pg', 'hostel', 'accommodation', 'lease'],
    'Travel': ['flight', 'hotel', 'booking', 'makemytrip', 'goibibo', 'oyo', 'airbnb', 'travel', 'trip', 'vacation', 'cleartrip'],
    'Other Expense': []
  }
};

class TransactionCategorizer {
  constructor() {
    this.categories = categories;
  }

  async categorize(transaction) {
    const { description = '', merchantName = '', type } = transaction;
    const searchText = `${description} ${merchantName}`.toLowerCase();

    const categoryType = type === 'credit' ? 'income' : 'expense';
    const categoryMap = this.categories[categoryType];

    for (const [category, keywords] of Object.entries(categoryMap)) {
      for (const keyword of keywords) {
        if (searchText.includes(keyword.toLowerCase())) {
          return category;
        }
      }
    }

    // Default category if no match
    return categoryType === 'income' ? 'Other Income' : 'Other Expense';
  }

  async categorizeMultiple(transactions) {
    const results = [];
    for (const tx of transactions) {
      const category = await this.categorize(tx);
      results.push({ ...tx, category });
    }
    return results;
  }

  // Get category statistics
  getCategoryStats(transactions) {
    const stats = {};
    
    for (const tx of transactions) {
      const category = tx.category || 'Uncategorized';
      if (!stats[category]) {
        stats[category] = {
          count: 0,
          total: 0,
          transactions: []
        };
      }
      stats[category].count++;
      stats[category].total += parseFloat(tx.amount);
      stats[category].transactions.push(tx);
    }

    return stats;
  }

  // Identify recurring transactions (subscriptions)
  identifyRecurring(transactions) {
    const merchantCounts = {};
    
    for (const tx of transactions) {
      if (tx.type === 'debit' && tx.merchant_name) {
        const key = `${tx.merchant_name}_${tx.amount}`;
        if (!merchantCounts[key]) {
          merchantCounts[key] = {
            merchant: tx.merchant_name,
            amount: tx.amount,
            count: 0,
            dates: []
          };
        }
        merchantCounts[key].count++;
        merchantCounts[key].dates.push(tx.transaction_date);
      }
    }

    // Filter for recurring (appears 2+ times with similar amounts)
    return Object.values(merchantCounts).filter(m => m.count >= 2);
  }
}

module.exports = TransactionCategorizer;
