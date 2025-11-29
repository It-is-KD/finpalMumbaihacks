<<<<<<< HEAD
const huggingface = require('./huggingface');

class ExpenseAnalyzer {
  constructor() {
    this.overspendingThreshold = 0.8;
    this.warningThreshold = 0.6;
  }

  /**
   * Analyze expenses with AI-enhanced insights
   */
  async analyzeExpenses(transactions, budgets, userProfile = {}, timeframe = 'month') {
    const analysis = {
      totalSpent: 0,
      totalIncome: 0,
      categoryBreakdown: {},
      overspendingCategories: [],
      warningCategories: [],
      insights: [],
      savingsRate: 0
    };

    // Calculate totals (local computation for accuracy)
    for (const transaction of transactions) {
      if (transaction.type === 'debit') {
        analysis.totalSpent += parseFloat(transaction.amount);
        const category = transaction.category || 'Other';
        if (!analysis.categoryBreakdown[category]) {
          analysis.categoryBreakdown[category] = { total: 0, count: 0, transactions: [] };
        }
        analysis.categoryBreakdown[category].total += parseFloat(transaction.amount);
        analysis.categoryBreakdown[category].count += 1;
        analysis.categoryBreakdown[category].transactions.push(transaction);
      } else {
        analysis.totalIncome += parseFloat(transaction.amount);
      }
    }

    // Calculate savings rate
    if (analysis.totalIncome > 0) {
      analysis.savingsRate = ((analysis.totalIncome - analysis.totalSpent) / analysis.totalIncome * 100).toFixed(2);
    }

    // Check against budgets (deterministic logic)
    for (const budget of budgets) {
      const categorySpent = analysis.categoryBreakdown[budget.category]?.total || 0;
      const budgetUsage = categorySpent / budget.monthly_limit;

      if (budgetUsage >= this.overspendingThreshold) {
        analysis.overspendingCategories.push({
          category: budget.category,
          spent: categorySpent,
          limit: budget.monthly_limit,
          usage: (budgetUsage * 100).toFixed(1),
          overAmount: Math.max(0, categorySpent - budget.monthly_limit)
        });
      } else if (budgetUsage >= this.warningThreshold) {
        analysis.warningCategories.push({
          category: budget.category,
          spent: categorySpent,
          limit: budget.monthly_limit,
          usage: (budgetUsage * 100).toFixed(1)
        });
      }
    }

    // Generate AI-powered insights
    console.log('🤖 Generating AI expense insights...');
    analysis.insights = await this.generateAIInsights(analysis, userProfile);

    return analysis;
  }

  /**
   * Generate insights using AI with fallback
   */
  async generateAIInsights(analysis, userProfile) {
    try {
      const aiInsights = await huggingface.generateExpenseInsights(analysis, userProfile);
      
      if (aiInsights && aiInsights.length > 0) {
        console.log(`✅ Generated ${aiInsights.length} AI insights`);
        
        // Ensure all insights have required fields
        return aiInsights.map(insight => ({
          type: insight.type || 'tip',
          title: insight.title || 'Financial Insight',
          description: insight.description || '',
          priority: insight.priority || 'medium',
          actionable: true,
          action: insight.action || ''
        }));
      }
    } catch (error) {
      console.error('AI insight generation failed:', error.message);
    }

    // Fallback to rule-based insights
    console.log('⚙️ Using fallback rule-based insights');
    return this.generateFallbackInsights(analysis);
  }

  /**
   * Fallback rule-based insights
   */
  generateFallbackInsights(analysis) {
    const insights = [];

    const sortedCategories = Object.entries(analysis.categoryBreakdown)
      .sort((a, b) => b[1].total - a[1].total);

    if (sortedCategories.length > 0) {
      const topCategory = sortedCategories[0];
      insights.push({
        type: 'top_spending',
        title: 'Highest Spending Category',
        description: `You spent ₹${topCategory[1].total.toFixed(2)} on ${topCategory[0]} this month.`,
        priority: 'medium',
        actionable: true,
        action: `Review your ${topCategory[0]} expenses for potential savings.`
      });
    }

    for (const category of analysis.overspendingCategories) {
      insights.push({
        type: 'overspending',
        title: `Overspending on ${category.category}`,
        description: `You've spent ₹${category.spent.toFixed(2)} of your ₹${category.limit} budget (${category.usage}%).`,
        priority: 'high',
        actionable: true,
        action: `Reduce ${category.category} spending by ₹${category.overAmount.toFixed(2)} to stay within budget.`
      });
    }

    if (analysis.savingsRate < 10) {
      insights.push({
        type: 'savings_alert',
        title: 'Low Savings Rate',
        description: `Your savings rate is only ${analysis.savingsRate}%. Aim for at least 20%.`,
        priority: 'high',
        actionable: true,
        action: 'Consider reducing discretionary spending in Entertainment and Dining.'
      });
    } else if (analysis.savingsRate >= 30) {
      insights.push({
        type: 'savings_positive',
        title: 'Great Savings Rate!',
        description: `You're saving ${analysis.savingsRate}% of your income. Excellent financial discipline!`,
        priority: 'low',
        actionable: true,
        action: 'Consider investing your surplus in mutual funds or FDs.'
      });
    }

    return insights;
  }

  /**
   * Detect impulsive spending patterns
   */
  detectImpulsiveSpending(transactions) {
    const impulsivePatterns = [];
    const recentTransactions = transactions.slice(-30);
    
    const grouped = {};
    for (const t of recentTransactions) {
      const date = new Date(t.transaction_date).toDateString();
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(t);
    }

    for (const [date, dayTransactions] of Object.entries(grouped)) {
      if (dayTransactions.length > 5) {
        const total = dayTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        impulsivePatterns.push({
          type: 'multiple_transactions',
          date,
          count: dayTransactions.length,
          total,
          suggestion: `You made ${dayTransactions.length} transactions on ${date}. Consider consolidating purchases.`
        });
      }
    }

    for (const t of recentTransactions) {
      const hour = new Date(t.transaction_date).getHours();
      if (hour >= 23 || hour <= 4) {
        if (parseFloat(t.amount) > 500) {
          impulsivePatterns.push({
            type: 'late_night',
            transaction: t,
            suggestion: 'Late night purchases are often impulsive. Consider waiting until morning.'
          });
        }
      }
    }

    return impulsivePatterns;
  }

  /**
   * Get AI-powered savings suggestions
   */
  async getSavingsSuggestions(analysis, userProfile = {}) {
    console.log('🤖 Generating AI savings suggestions...');
    
    try {
      const aiSuggestions = await huggingface.generateSavingsSuggestions(analysis, userProfile);
      
      if (aiSuggestions && aiSuggestions.length > 0) {
        console.log(`✅ Generated ${aiSuggestions.length} AI savings suggestions`);
        return aiSuggestions;
      }
    } catch (error) {
      console.error('AI savings suggestions failed:', error.message);
    }

    // Fallback to rule-based suggestions
    console.log('⚙️ Using fallback savings suggestions');
    return this.getFallbackSavingsSuggestions(analysis);
  }

  /**
   * Fallback rule-based savings suggestions
   */
  getFallbackSavingsSuggestions(analysis) {
    const suggestions = [];

    if (analysis.categoryBreakdown['Subscriptions']?.total > 500) {
      suggestions.push({
        category: 'Subscriptions',
        currentSpend: analysis.categoryBreakdown['Subscriptions'].total,
        suggestion: 'Review your subscriptions. Cancel unused services to save up to 30%.',
        potentialSavings: analysis.categoryBreakdown['Subscriptions'].total * 0.3
      });
    }

    if (analysis.categoryBreakdown['Food & Dining']?.total > 3000) {
      suggestions.push({
        category: 'Food & Dining',
        currentSpend: analysis.categoryBreakdown['Food & Dining'].total,
        suggestion: 'Cook at home more often. Meal prep can save 40-50% on food expenses.',
        potentialSavings: analysis.categoryBreakdown['Food & Dining'].total * 0.4
      });
    }

    if (analysis.categoryBreakdown['Shopping']?.total > 5000) {
      suggestions.push({
        category: 'Shopping',
        currentSpend: analysis.categoryBreakdown['Shopping'].total,
        suggestion: 'Apply the 24-hour rule: Wait before making purchases over ₹1000.',
        potentialSavings: analysis.categoryBreakdown['Shopping'].total * 0.25
      });
    }

    if (analysis.categoryBreakdown['Transportation']?.total > 3000) {
      suggestions.push({
        category: 'Transportation',
        currentSpend: analysis.categoryBreakdown['Transportation'].total,
        suggestion: 'Consider carpooling or using public transport for routine commutes.',
        potentialSavings: analysis.categoryBreakdown['Transportation'].total * 0.35
      });
    }

    return suggestions;
  }
}

module.exports = new ExpenseAnalyzer();
=======
const huggingface = require('./huggingface');

class ExpenseAnalyzer {
  constructor() {
    this.overspendingThreshold = 0.8;
    this.warningThreshold = 0.6;
  }

  /**
   * Analyze expenses with AI-enhanced insights
   */
  async analyzeExpenses(transactions, budgets, userProfile = {}, timeframe = 'month') {
    const analysis = {
      totalSpent: 0,
      totalIncome: 0,
      categoryBreakdown: {},
      overspendingCategories: [],
      warningCategories: [],
      insights: [],
      savingsRate: 0
    };

    // Calculate totals (local computation for accuracy)
    for (const transaction of transactions) {
      if (transaction.type === 'debit') {
        analysis.totalSpent += parseFloat(transaction.amount);
        const category = transaction.category || 'Other';
        if (!analysis.categoryBreakdown[category]) {
          analysis.categoryBreakdown[category] = { total: 0, count: 0, transactions: [] };
        }
        analysis.categoryBreakdown[category].total += parseFloat(transaction.amount);
        analysis.categoryBreakdown[category].count += 1;
        analysis.categoryBreakdown[category].transactions.push(transaction);
      } else {
        analysis.totalIncome += parseFloat(transaction.amount);
      }
    }

    // Calculate savings rate
    if (analysis.totalIncome > 0) {
      analysis.savingsRate = ((analysis.totalIncome - analysis.totalSpent) / analysis.totalIncome * 100).toFixed(2);
    }

    // Check against budgets (deterministic logic)
    for (const budget of budgets) {
      const categorySpent = analysis.categoryBreakdown[budget.category]?.total || 0;
      const budgetUsage = categorySpent / budget.monthly_limit;

      if (budgetUsage >= this.overspendingThreshold) {
        analysis.overspendingCategories.push({
          category: budget.category,
          spent: categorySpent,
          limit: budget.monthly_limit,
          usage: (budgetUsage * 100).toFixed(1),
          overAmount: Math.max(0, categorySpent - budget.monthly_limit)
        });
      } else if (budgetUsage >= this.warningThreshold) {
        analysis.warningCategories.push({
          category: budget.category,
          spent: categorySpent,
          limit: budget.monthly_limit,
          usage: (budgetUsage * 100).toFixed(1)
        });
      }
    }

    // Generate AI-powered insights
    console.log('🤖 Generating AI expense insights...');
    analysis.insights = await this.generateAIInsights(analysis, userProfile);

    return analysis;
  }

  /**
   * Generate insights using AI with fallback
   */
  async generateAIInsights(analysis, userProfile) {
    try {
      const aiInsights = await huggingface.generateExpenseInsights(analysis, userProfile);
      
      if (aiInsights && aiInsights.length > 0) {
        console.log(`✅ Generated ${aiInsights.length} AI insights`);
        
        // Ensure all insights have required fields
        return aiInsights.map(insight => ({
          type: insight.type || 'tip',
          title: insight.title || 'Financial Insight',
          description: insight.description || '',
          priority: insight.priority || 'medium',
          actionable: true,
          action: insight.action || ''
        }));
      }
    } catch (error) {
      console.error('AI insight generation failed:', error.message);
    }

    // Fallback to rule-based insights
    console.log('⚙️ Using fallback rule-based insights');
    return this.generateFallbackInsights(analysis);
  }

  /**
   * Fallback rule-based insights
   */
  generateFallbackInsights(analysis) {
    const insights = [];

    const sortedCategories = Object.entries(analysis.categoryBreakdown)
      .sort((a, b) => b[1].total - a[1].total);

    if (sortedCategories.length > 0) {
      const topCategory = sortedCategories[0];
      insights.push({
        type: 'top_spending',
        title: 'Highest Spending Category',
        description: `You spent ₹${topCategory[1].total.toFixed(2)} on ${topCategory[0]} this month.`,
        priority: 'medium',
        actionable: true,
        action: `Review your ${topCategory[0]} expenses for potential savings.`
      });
    }

    for (const category of analysis.overspendingCategories) {
      insights.push({
        type: 'overspending',
        title: `Overspending on ${category.category}`,
        description: `You've spent ₹${category.spent.toFixed(2)} of your ₹${category.limit} budget (${category.usage}%).`,
        priority: 'high',
        actionable: true,
        action: `Reduce ${category.category} spending by ₹${category.overAmount.toFixed(2)} to stay within budget.`
      });
    }

    if (analysis.savingsRate < 10) {
      insights.push({
        type: 'savings_alert',
        title: 'Low Savings Rate',
        description: `Your savings rate is only ${analysis.savingsRate}%. Aim for at least 20%.`,
        priority: 'high',
        actionable: true,
        action: 'Consider reducing discretionary spending in Entertainment and Dining.'
      });
    } else if (analysis.savingsRate >= 30) {
      insights.push({
        type: 'savings_positive',
        title: 'Great Savings Rate!',
        description: `You're saving ${analysis.savingsRate}% of your income. Excellent financial discipline!`,
        priority: 'low',
        actionable: true,
        action: 'Consider investing your surplus in mutual funds or FDs.'
      });
    }

    return insights;
  }

  /**
   * Detect impulsive spending patterns
   */
  detectImpulsiveSpending(transactions) {
    const impulsivePatterns = [];
    const recentTransactions = transactions.slice(-30);
    
    const grouped = {};
    for (const t of recentTransactions) {
      const date = new Date(t.transaction_date).toDateString();
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(t);
    }

    for (const [date, dayTransactions] of Object.entries(grouped)) {
      if (dayTransactions.length > 5) {
        const total = dayTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        impulsivePatterns.push({
          type: 'multiple_transactions',
          date,
          count: dayTransactions.length,
          total,
          suggestion: `You made ${dayTransactions.length} transactions on ${date}. Consider consolidating purchases.`
        });
      }
    }

    for (const t of recentTransactions) {
      const hour = new Date(t.transaction_date).getHours();
      if (hour >= 23 || hour <= 4) {
        if (parseFloat(t.amount) > 500) {
          impulsivePatterns.push({
            type: 'late_night',
            transaction: t,
            suggestion: 'Late night purchases are often impulsive. Consider waiting until morning.'
          });
        }
      }
    }

    return impulsivePatterns;
  }

  /**
   * Get AI-powered savings suggestions
   */
  async getSavingsSuggestions(analysis, userProfile = {}) {
    console.log('🤖 Generating AI savings suggestions...');
    
    try {
      const aiSuggestions = await huggingface.generateSavingsSuggestions(analysis, userProfile);
      
      if (aiSuggestions && aiSuggestions.length > 0) {
        console.log(`✅ Generated ${aiSuggestions.length} AI savings suggestions`);
        return aiSuggestions;
      }
    } catch (error) {
      console.error('AI savings suggestions failed:', error.message);
    }

    // Fallback to rule-based suggestions
    console.log('⚙️ Using fallback savings suggestions');
    return this.getFallbackSavingsSuggestions(analysis);
  }

  /**
   * Fallback rule-based savings suggestions
   */
  getFallbackSavingsSuggestions(analysis) {
    const suggestions = [];

    if (analysis.categoryBreakdown['Subscriptions']?.total > 500) {
      suggestions.push({
        category: 'Subscriptions',
        currentSpend: analysis.categoryBreakdown['Subscriptions'].total,
        suggestion: 'Review your subscriptions. Cancel unused services to save up to 30%.',
        potentialSavings: analysis.categoryBreakdown['Subscriptions'].total * 0.3
      });
    }

    if (analysis.categoryBreakdown['Food & Dining']?.total > 3000) {
      suggestions.push({
        category: 'Food & Dining',
        currentSpend: analysis.categoryBreakdown['Food & Dining'].total,
        suggestion: 'Cook at home more often. Meal prep can save 40-50% on food expenses.',
        potentialSavings: analysis.categoryBreakdown['Food & Dining'].total * 0.4
      });
    }

    if (analysis.categoryBreakdown['Shopping']?.total > 5000) {
      suggestions.push({
        category: 'Shopping',
        currentSpend: analysis.categoryBreakdown['Shopping'].total,
        suggestion: 'Apply the 24-hour rule: Wait before making purchases over ₹1000.',
        potentialSavings: analysis.categoryBreakdown['Shopping'].total * 0.25
      });
    }

    if (analysis.categoryBreakdown['Transportation']?.total > 3000) {
      suggestions.push({
        category: 'Transportation',
        currentSpend: analysis.categoryBreakdown['Transportation'].total,
        suggestion: 'Consider carpooling or using public transport for routine commutes.',
        potentialSavings: analysis.categoryBreakdown['Transportation'].total * 0.35
      });
    }

    return suggestions;
  }
}

module.exports = new ExpenseAnalyzer();
>>>>>>> 2c5691fad8196faad9092c0293bb4957adef9391
