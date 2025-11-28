/**
 * Savings Coach Agent
 * Provides personalized savings tips and behavioral nudges
 */

class SavingsCoach {
  constructor() {
    this.nudgeTemplates = {
      overspending: [
        "You've spent ₹{amount} on {category} this week - want to move ₹{suggested} to your savings goal?",
        "Heads up! Your {category} spending is {percent}% higher than last week.",
        "You're close to your {category} budget limit. Consider slowing down!",
      ],
      positive: [
        "Great job! You saved ₹{amount} compared to last week.",
        "You're on track to save ₹{projected} this month!",
        "Your {category} spending is down {percent}% - keep it up!",
      ],
      goalProgress: [
        "You're {percent}% towards your '{goal}' goal! Keep going!",
        "Just ₹{remaining} more to reach your '{goal}' goal!",
        "At this rate, you'll reach '{goal}' {time} ahead of schedule!",
      ]
    };
  }

  async generateTips(transactions, goals, user) {
    const tips = [];
    const expenses = transactions.filter(tx => tx.type === 'debit');
    const monthlyIncome = parseFloat(user.monthly_income) || 0;

    // Analyze spending patterns
    const categorySpending = this.getCategorySpending(expenses);
    const weeklySpending = this.getWeeklySpending(expenses);

    // Generate category-specific tips
    for (const [category, data] of Object.entries(categorySpending)) {
      const categoryTips = this.generateCategoryTips(category, data, monthlyIncome);
      tips.push(...categoryTips);
    }

    // Generate goal-based tips
    const goalTips = this.generateGoalTips(goals, monthlyIncome, weeklySpending);
    tips.push(...goalTips);

    // Generate general savings tips based on user profile
    const generalTips = this.generateGeneralTips(user, categorySpending, monthlyIncome);
    tips.push(...generalTips);

    return tips.slice(0, 10); // Return top 10 most relevant tips
  }

  getCategorySpending(expenses) {
    const spending = {};
    const now = new Date();
    
    for (const tx of expenses) {
      const category = tx.category || 'Other Expense';
      const txDate = new Date(tx.transaction_date);
      const daysAgo = Math.floor((now - txDate) / (24 * 60 * 60 * 1000));
      
      if (!spending[category]) {
        spending[category] = {
          thisWeek: 0,
          thisMonth: 0,
          lastMonth: 0,
          count: 0
        };
      }

      if (daysAgo <= 7) spending[category].thisWeek += parseFloat(tx.amount);
      if (daysAgo <= 30) spending[category].thisMonth += parseFloat(tx.amount);
      if (daysAgo > 30 && daysAgo <= 60) spending[category].lastMonth += parseFloat(tx.amount);
      spending[category].count++;
    }

    return spending;
  }

  getWeeklySpending(expenses) {
    const weekly = { thisWeek: 0, lastWeek: 0 };
    const now = new Date();
    
    for (const tx of expenses) {
      const daysAgo = Math.floor((now - new Date(tx.transaction_date)) / (24 * 60 * 60 * 1000));
      if (daysAgo <= 7) weekly.thisWeek += parseFloat(tx.amount);
      else if (daysAgo <= 14) weekly.lastWeek += parseFloat(tx.amount);
    }

    return weekly;
  }

  generateCategoryTips(category, data, monthlyIncome) {
    const tips = [];

    // High spending alert
    if (monthlyIncome > 0 && (data.thisMonth / monthlyIncome) > 0.25) {
      tips.push({
        type: 'warning',
        category,
        title: `High ${category} Spending`,
        message: `You've spent ₹${data.thisMonth.toFixed(0)} on ${category} this month, which is ${((data.thisMonth / monthlyIncome) * 100).toFixed(0)}% of your income.`,
        action: `Try to reduce ${category} spending by ₹${(data.thisMonth * 0.2).toFixed(0)} this month.`,
        priority: 'high'
      });
    }

    // Week over week increase
    if (data.thisWeek > data.thisMonth / 4 * 1.3) {
      tips.push({
        type: 'alert',
        category,
        title: `${category} Spending Spike`,
        message: `Your ${category} spending this week is higher than your weekly average.`,
        action: 'Consider pausing non-essential purchases in this category.',
        priority: 'medium'
      });
    }

    // Month over month comparison
    if (data.lastMonth > 0 && data.thisMonth > data.lastMonth * 1.2) {
      const increase = ((data.thisMonth - data.lastMonth) / data.lastMonth * 100).toFixed(0);
      tips.push({
        type: 'info',
        category,
        title: `${category} Up ${increase}%`,
        message: `Your ${category} spending is up ${increase}% compared to last month.`,
        action: 'Review your transactions to identify any unnecessary expenses.',
        priority: 'low'
      });
    }

    return tips;
  }

  generateGoalTips(goals, monthlyIncome, weeklySpending) {
    const tips = [];
    const activeGoals = goals.filter(g => g.status === 'active');

    for (const goal of activeGoals) {
      const progress = (parseFloat(goal.current_amount) / parseFloat(goal.target_amount)) * 100;
      const remaining = parseFloat(goal.target_amount) - parseFloat(goal.current_amount);
      const monthsLeft = Math.max(1, this.monthsBetween(new Date(), new Date(goal.target_date)));
      const onTrack = remaining / monthsLeft <= monthlyIncome * 0.2;

      if (progress >= 75) {
        tips.push({
          type: 'success',
          category: 'Goals',
          title: 'Almost There!',
          message: `You're ${progress.toFixed(0)}% towards "${goal.name}"! Just ₹${remaining.toFixed(0)} to go.`,
          action: 'Consider a final push to complete this goal!',
          priority: 'high'
        });
      } else if (!onTrack) {
        tips.push({
          type: 'warning',
          category: 'Goals',
          title: 'Goal Needs Attention',
          message: `"${goal.name}" requires ₹${(remaining / monthsLeft).toFixed(0)}/month to complete on time.`,
          action: 'Look for areas to cut spending or extend your timeline.',
          priority: 'high'
        });
      }
    }

    // Suggest moving excess to goals
    if (weeklySpending.lastWeek > weeklySpending.thisWeek && activeGoals.length > 0) {
      const saved = weeklySpending.lastWeek - weeklySpending.thisWeek;
      tips.push({
        type: 'opportunity',
        category: 'Savings',
        title: 'Savings Opportunity',
        message: `You spent ₹${saved.toFixed(0)} less this week than last week.`,
        action: `Move ₹${(saved * 0.5).toFixed(0)} to your "${activeGoals[0].name}" goal?`,
        priority: 'medium'
      });
    }

    return tips;
  }

  generateGeneralTips(user, categorySpending, monthlyIncome) {
    const tips = [];

    // Subscription review
    if (categorySpending['Subscriptions']?.thisMonth > 1000) {
      tips.push({
        type: 'tip',
        category: 'Subscriptions',
        title: 'Subscription Audit',
        message: 'You spend over ₹1000/month on subscriptions.',
        action: 'Review and cancel subscriptions you don\'t use regularly. Consider sharing family plans.',
        priority: 'medium'
      });
    }

    // Income type specific tips
    if (user.income_type === 'irregular' || user.income_type === 'freelance' || user.income_type === 'gig') {
      tips.push({
        type: 'tip',
        category: 'Income',
        title: 'Irregular Income Strategy',
        message: 'As a freelancer/gig worker, income stability is key.',
        action: 'Build a buffer of 2-3 months expenses and save 30% during high-income months.',
        priority: 'high'
      });
    }

    // Emergency fund check
    const totalBalance = monthlyIncome * 3; // Assumption
    if (totalBalance < monthlyIncome * 6) {
      tips.push({
        type: 'tip',
        category: 'Emergency Fund',
        title: 'Build Your Safety Net',
        message: 'An emergency fund of 6 months expenses is essential.',
        action: 'Aim to save at least 10% of income towards emergency fund.',
        priority: 'high'
      });
    }

    return tips;
  }

  async generateNudges(transactions, goals) {
    const nudges = [];
    const expenses = transactions.filter(tx => tx.type === 'debit');
    const categorySpending = this.getCategorySpending(expenses);
    const weeklySpending = this.getWeeklySpending(expenses);

    // Spending nudge
    for (const [category, data] of Object.entries(categorySpending)) {
      if (data.thisWeek > 500 && data.thisWeek > (data.thisMonth - data.thisWeek) / 3) {
        const suggestedMove = Math.min(200, data.thisWeek * 0.25);
        nudges.push({
          type: 'spending',
          message: `You've spent ₹${data.thisWeek.toFixed(0)} on ${category} this week - want to move ₹${suggestedMove.toFixed(0)} to your savings?`,
          category,
          amount: data.thisWeek,
          suggestedAction: {
            type: 'transfer_to_savings',
            amount: suggestedMove
          }
        });
      }
    }

    // Goal progress nudge
    for (const goal of goals) {
      const progress = (parseFloat(goal.current_amount) / parseFloat(goal.target_amount)) * 100;
      if (progress > 50 && progress < 90) {
        const remaining = parseFloat(goal.target_amount) - parseFloat(goal.current_amount);
        nudges.push({
          type: 'goal',
          message: `You're ${progress.toFixed(0)}% towards "${goal.name}"! Just ₹${remaining.toFixed(0)} more to go!`,
          goalId: goal.id,
          progress
        });
      }
    }

    // Positive reinforcement
    if (weeklySpending.thisWeek < weeklySpending.lastWeek) {
      const saved = weeklySpending.lastWeek - weeklySpending.thisWeek;
      nudges.push({
        type: 'positive',
        message: `Great job! You spent ₹${saved.toFixed(0)} less this week than last week! 🎉`,
        amount: saved
      });
    }

    return nudges;
  }

  monthsBetween(date1, date2) {
    return Math.max(0, (date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth()));
  }
}

module.exports = SavingsCoach;
