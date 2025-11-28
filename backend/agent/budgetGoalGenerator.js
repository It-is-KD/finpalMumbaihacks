/**
 * Budget & Goal Generator Agent
 * Creates personalized budgets and financial goals based on user behavior
 */

class BudgetGoalGenerator {
  constructor() {
    this.categoryAllocationRules = {
      essential: ['Rent', 'Bills & Utilities', 'Groceries', 'Healthcare', 'Transportation', 'Insurance', 'EMI'],
      discretionary: ['Food & Dining', 'Shopping', 'Entertainment', 'Travel', 'Subscriptions'],
      growth: ['Investments', 'Education']
    };
    
    // 50-30-20 rule as baseline
    this.defaultAllocation = {
      essential: 0.50,
      discretionary: 0.30,
      savings: 0.20
    };
  }

  async generateBudget(user, transactions, goals) {
    const monthlyIncome = parseFloat(user.monthly_income) || this.estimateIncome(transactions);
    
    if (monthlyIncome === 0) {
      return {
        error: 'Unable to determine monthly income. Please update your profile.',
        budgets: []
      };
    }

    const result = {
      monthlyIncome,
      recommendedBudgets: [],
      savingsTarget: 0,
      goalContributions: [],
      insights: []
    };

    // Analyze current spending patterns
    const spendingPatterns = this.analyzeSpendingPatterns(transactions);
    
    // Calculate savings target based on goals
    const goalSavings = this.calculateGoalSavings(goals, monthlyIncome);
    result.goalContributions = goalSavings.contributions;
    result.savingsTarget = goalSavings.totalNeeded;

    // Generate category budgets
    const availableAfterSavings = monthlyIncome - result.savingsTarget;
    result.recommendedBudgets = this.allocateBudgets(spendingPatterns, availableAfterSavings, monthlyIncome);

    // Generate insights
    result.insights = this.generateInsights(spendingPatterns, result.recommendedBudgets, monthlyIncome);

    return result;
  }

  estimateIncome(transactions) {
    const credits = transactions.filter(tx => tx.type === 'credit');
    if (credits.length === 0) return 0;

    // Group by month and get average
    const monthlyIncome = {};
    for (const tx of credits) {
      const month = new Date(tx.transaction_date).toISOString().slice(0, 7);
      if (!monthlyIncome[month]) monthlyIncome[month] = 0;
      monthlyIncome[month] += parseFloat(tx.amount);
    }

    const months = Object.values(monthlyIncome);
    return months.length > 0 ? months.reduce((a, b) => a + b, 0) / months.length : 0;
  }

  analyzeSpendingPatterns(transactions) {
    const patterns = {};
    const expenses = transactions.filter(tx => tx.type === 'debit');
    
    for (const tx of expenses) {
      const category = tx.category || 'Other Expense';
      if (!patterns[category]) {
        patterns[category] = { total: 0, count: 0, average: 0 };
      }
      patterns[category].total += parseFloat(tx.amount);
      patterns[category].count++;
    }

    // Calculate monthly average
    const months = new Set(transactions.map(tx => 
      new Date(tx.transaction_date).toISOString().slice(0, 7)
    ));
    const monthCount = Math.max(1, months.size);

    for (const category of Object.keys(patterns)) {
      patterns[category].average = patterns[category].total / monthCount;
    }

    return patterns;
  }

  calculateGoalSavings(goals, monthlyIncome) {
    const contributions = [];
    let totalNeeded = 0;

    const activeGoals = goals.filter(g => g.status === 'active');
    
    for (const goal of activeGoals) {
      const remaining = parseFloat(goal.target_amount) - parseFloat(goal.current_amount || 0);
      const monthsLeft = Math.max(1, this.monthsBetween(new Date(), new Date(goal.target_date)));
      const monthlyNeeded = remaining / monthsLeft;
      
      contributions.push({
        goalId: goal.id,
        goalName: goal.name,
        targetAmount: goal.target_amount,
        currentAmount: goal.current_amount || 0,
        remaining,
        monthsLeft,
        monthlyNeeded: monthlyNeeded.toFixed(2),
        percentageOfIncome: ((monthlyNeeded / monthlyIncome) * 100).toFixed(2)
      });

      totalNeeded += monthlyNeeded;
    }

    // Cap savings at 40% of income
    const maxSavings = monthlyIncome * 0.4;
    if (totalNeeded > maxSavings) {
      const ratio = maxSavings / totalNeeded;
      for (const contrib of contributions) {
        contrib.adjustedMonthly = (parseFloat(contrib.monthlyNeeded) * ratio).toFixed(2);
        contrib.warning = 'Adjusted to fit income constraints';
      }
      totalNeeded = maxSavings;
    }

    return { contributions, totalNeeded };
  }

  allocateBudgets(spendingPatterns, available, monthlyIncome) {
    const budgets = [];
    const categories = Object.keys(spendingPatterns);

    // Determine category type
    for (const category of categories) {
      let type = 'discretionary';
      if (this.categoryAllocationRules.essential.includes(category)) {
        type = 'essential';
      } else if (this.categoryAllocationRules.growth.includes(category)) {
        type = 'growth';
      }

      const currentSpending = spendingPatterns[category].average;
      let recommendedLimit;

      if (type === 'essential') {
        // Allow essential spending with 10% buffer
        recommendedLimit = Math.max(currentSpending * 1.1, currentSpending);
      } else if (type === 'growth') {
        // Encourage investment spending
        recommendedLimit = Math.max(currentSpending, monthlyIncome * 0.1);
      } else {
        // Try to reduce discretionary spending by 10-20%
        recommendedLimit = currentSpending * 0.85;
      }

      budgets.push({
        category,
        type,
        currentAverageSpending: currentSpending.toFixed(2),
        recommendedLimit: recommendedLimit.toFixed(2),
        change: ((recommendedLimit - currentSpending) / currentSpending * 100).toFixed(2),
        changeDirection: recommendedLimit >= currentSpending ? 'increase' : 'decrease'
      });
    }

    return budgets.sort((a, b) => parseFloat(b.currentAverageSpending) - parseFloat(a.currentAverageSpending));
  }

  generateInsights(patterns, budgets, monthlyIncome) {
    const insights = [];
    const totalSpending = Object.values(patterns).reduce((sum, p) => sum + p.average, 0);
    const savingsRate = ((monthlyIncome - totalSpending) / monthlyIncome * 100);

    if (savingsRate < 10) {
      insights.push({
        type: 'warning',
        title: 'Low Savings Rate',
        message: `Your savings rate is ${savingsRate.toFixed(1)}%. Aim for at least 20% to build financial security.`
      });
    } else if (savingsRate > 30) {
      insights.push({
        type: 'success',
        title: 'Great Savings Rate!',
        message: `You're saving ${savingsRate.toFixed(1)}% of your income. Consider investing the surplus.`
      });
    }

    // Check for high spending categories
    for (const [category, data] of Object.entries(patterns)) {
      const percentage = (data.average / monthlyIncome) * 100;
      if (percentage > 25 && !this.categoryAllocationRules.essential.includes(category)) {
        insights.push({
          type: 'alert',
          title: `High ${category} Spending`,
          message: `${category} accounts for ${percentage.toFixed(1)}% of your income. Consider setting a stricter budget.`
        });
      }
    }

    return insights;
  }

  monthsBetween(date1, date2) {
    const months = (date2.getFullYear() - date1.getFullYear()) * 12 + 
                   (date2.getMonth() - date1.getMonth());
    return Math.max(0, months);
  }

  // Generate smart goal suggestions
  suggestGoals(user, transactions) {
    const suggestions = [];
    const monthlyIncome = parseFloat(user.monthly_income) || this.estimateIncome(transactions);
    
    // Emergency fund suggestion
    suggestions.push({
      name: 'Emergency Fund',
      description: '3-6 months of expenses for financial security',
      targetAmount: monthlyIncome * 6,
      priority: 'high',
      timeframe: '12 months',
      reason: 'Every financial plan should start with an emergency fund'
    });

    // Based on income, suggest appropriate goals
    if (monthlyIncome > 50000) {
      suggestions.push({
        name: 'Investment Portfolio',
        description: 'Start building a diversified investment portfolio',
        targetAmount: monthlyIncome * 12,
        priority: 'medium',
        timeframe: '24 months',
        reason: 'Your income level allows for significant wealth building'
      });
    }

    suggestions.push({
      name: 'Vacation Fund',
      description: 'Save for your next vacation',
      targetAmount: monthlyIncome * 2,
      priority: 'low',
      timeframe: '6 months',
      reason: 'Everyone needs a break - plan it financially'
    });

    return suggestions;
  }
}

module.exports = BudgetGoalGenerator;
