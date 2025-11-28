/**
 * Expense Analyzer Agent
 * Detects overspending, analyzes expense patterns, and provides insights
 */

class ExpenseAnalyzer {
  constructor() {
    this.overspendingThreshold = 1.2; // 20% over average
    this.categories = [
      'Food & Dining', 'Shopping', 'Groceries', 'Transportation',
      'Subscriptions', 'Entertainment', 'Healthcare', 'Education',
      'Bills & Utilities', 'EMI', 'Investments', 'Insurance', 'Rent', 'Travel'
    ];
  }

  async analyze(transactions, budgets) {
    const insights = {
      overspending: [],
      categoryBreakdown: {},
      weeklyTrend: [],
      monthlyComparison: {},
      topExpenseCategories: [],
      unusualSpending: [],
      savingOpportunities: []
    };

    if (!transactions || transactions.length === 0) {
      return insights;
    }

    // Filter expense transactions
    const expenses = transactions.filter(tx => tx.type === 'debit');

    // Category breakdown
    insights.categoryBreakdown = this.getCategoryBreakdown(expenses);
    
    // Detect overspending
    insights.overspending = this.detectOverspending(expenses, budgets);
    
    // Weekly trend analysis
    insights.weeklyTrend = this.getWeeklyTrend(expenses);
    
    // Monthly comparison
    insights.monthlyComparison = this.getMonthlyComparison(expenses);
    
    // Top expense categories
    insights.topExpenseCategories = this.getTopCategories(insights.categoryBreakdown);
    
    // Detect unusual spending
    insights.unusualSpending = this.detectUnusualSpending(expenses);
    
    // Find saving opportunities
    insights.savingOpportunities = this.findSavingOpportunities(insights);

    return insights;
  }

  getCategoryBreakdown(expenses) {
    const breakdown = {};
    let total = 0;

    for (const tx of expenses) {
      const category = tx.category || 'Other Expense';
      if (!breakdown[category]) {
        breakdown[category] = { amount: 0, count: 0, transactions: [] };
      }
      breakdown[category].amount += parseFloat(tx.amount);
      breakdown[category].count++;
      breakdown[category].transactions.push(tx);
      total += parseFloat(tx.amount);
    }

    // Add percentage
    for (const category of Object.keys(breakdown)) {
      breakdown[category].percentage = ((breakdown[category].amount / total) * 100).toFixed(2);
    }

    return breakdown;
  }

  detectOverspending(expenses, budgets) {
    const overspending = [];
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    // Group expenses by category for current month
    const monthlyExpenses = {};
    for (const tx of expenses) {
      const txMonth = new Date(tx.transaction_date).toISOString().slice(0, 7);
      if (txMonth === currentMonth) {
        const category = tx.category || 'Other Expense';
        if (!monthlyExpenses[category]) {
          monthlyExpenses[category] = 0;
        }
        monthlyExpenses[category] += parseFloat(tx.amount);
      }
    }

    // Check against budgets
    for (const budget of budgets) {
      const spent = monthlyExpenses[budget.category] || 0;
      const percentage = (spent / budget.monthly_limit) * 100;
      
      if (percentage >= 80) {
        overspending.push({
          category: budget.category,
          limit: budget.monthly_limit,
          spent,
          percentage: percentage.toFixed(2),
          exceeded: percentage >= 100,
          message: percentage >= 100 
            ? `You've exceeded your ${budget.category} budget by ₹${(spent - budget.monthly_limit).toFixed(2)}`
            : `You've used ${percentage.toFixed(0)}% of your ${budget.category} budget`
        });
      }
    }

    return overspending;
  }

  getWeeklyTrend(expenses) {
    const weeks = {};
    const now = new Date();
    
    for (const tx of expenses) {
      const txDate = new Date(tx.transaction_date);
      const diffDays = Math.floor((now - txDate) / (24 * 60 * 60 * 1000));
      const weekNumber = Math.floor(diffDays / 7);
      
      if (weekNumber < 4) { // Last 4 weeks
        if (!weeks[weekNumber]) {
          weeks[weekNumber] = { total: 0, count: 0 };
        }
        weeks[weekNumber].total += parseFloat(tx.amount);
        weeks[weekNumber].count++;
      }
    }

    return Object.entries(weeks).map(([week, data]) => ({
      week: parseInt(week),
      weekLabel: week === '0' ? 'This week' : `${week} week(s) ago`,
      ...data
    }));
  }

  getMonthlyComparison(expenses) {
    const months = {};
    
    for (const tx of expenses) {
      const month = new Date(tx.transaction_date).toISOString().slice(0, 7);
      if (!months[month]) {
        months[month] = { total: 0, count: 0 };
      }
      months[month].total += parseFloat(tx.amount);
      months[month].count++;
    }

    const sortedMonths = Object.keys(months).sort().slice(-3);
    const comparison = {};
    
    for (const month of sortedMonths) {
      comparison[month] = months[month];
    }

    // Calculate trend
    if (sortedMonths.length >= 2) {
      const current = months[sortedMonths[sortedMonths.length - 1]]?.total || 0;
      const previous = months[sortedMonths[sortedMonths.length - 2]]?.total || 0;
      comparison.trend = {
        change: current - previous,
        percentage: previous > 0 ? (((current - previous) / previous) * 100).toFixed(2) : 0,
        direction: current > previous ? 'up' : current < previous ? 'down' : 'stable'
      };
    }

    return comparison;
  }

  getTopCategories(categoryBreakdown) {
    return Object.entries(categoryBreakdown)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }

  detectUnusualSpending(expenses) {
    const unusual = [];
    const categoryAverages = {};
    
    // Calculate average per category
    for (const tx of expenses) {
      const category = tx.category || 'Other Expense';
      if (!categoryAverages[category]) {
        categoryAverages[category] = { total: 0, count: 0, transactions: [] };
      }
      categoryAverages[category].total += parseFloat(tx.amount);
      categoryAverages[category].count++;
      categoryAverages[category].transactions.push(tx);
    }

    // Find unusual transactions (significantly above average)
    for (const [category, data] of Object.entries(categoryAverages)) {
      const average = data.total / data.count;
      for (const tx of data.transactions) {
        if (parseFloat(tx.amount) > average * 2 && parseFloat(tx.amount) > 500) {
          unusual.push({
            transaction: tx,
            category,
            averageForCategory: average.toFixed(2),
            deviation: ((parseFloat(tx.amount) / average) * 100 - 100).toFixed(0)
          });
        }
      }
    }

    return unusual.slice(0, 5);
  }

  findSavingOpportunities(insights) {
    const opportunities = [];

    // Check subscription spending
    if (insights.categoryBreakdown['Subscriptions']?.amount > 500) {
      opportunities.push({
        category: 'Subscriptions',
        amount: insights.categoryBreakdown['Subscriptions'].amount,
        suggestion: 'Review your subscriptions. Consider cancelling unused services or switching to annual plans for discounts.',
        potentialSaving: (insights.categoryBreakdown['Subscriptions'].amount * 0.3).toFixed(2)
      });
    }

    // Check food spending
    if (insights.categoryBreakdown['Food & Dining']?.percentage > 25) {
      opportunities.push({
        category: 'Food & Dining',
        amount: insights.categoryBreakdown['Food & Dining'].amount,
        suggestion: 'Food spending is high. Try cooking at home more often or using meal planning to reduce dining out costs.',
        potentialSaving: (insights.categoryBreakdown['Food & Dining'].amount * 0.25).toFixed(2)
      });
    }

    // Check entertainment spending
    if (insights.categoryBreakdown['Entertainment']?.percentage > 15) {
      opportunities.push({
        category: 'Entertainment',
        amount: insights.categoryBreakdown['Entertainment'].amount,
        suggestion: 'Entertainment spending is significant. Look for free or discounted alternatives.',
        potentialSaving: (insights.categoryBreakdown['Entertainment'].amount * 0.4).toFixed(2)
      });
    }

    // Check shopping spending
    if (insights.categoryBreakdown['Shopping']?.percentage > 20) {
      opportunities.push({
        category: 'Shopping',
        amount: insights.categoryBreakdown['Shopping'].amount,
        suggestion: 'Shopping expenses are high. Try the 24-hour rule before purchases and use wishlists to avoid impulse buying.',
        potentialSaving: (insights.categoryBreakdown['Shopping'].amount * 0.35).toFixed(2)
      });
    }

    return opportunities;
  }
}

module.exports = ExpenseAnalyzer;
