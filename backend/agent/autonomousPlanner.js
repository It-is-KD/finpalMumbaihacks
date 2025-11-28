/**
 * Autonomous Planner Agent
 * Creates comprehensive monthly financial roadmaps and goal achievement plans
 */

class AutonomousPlanner {
  constructor() {
    this.planningRules = {
      minSavingsRate: 0.1, // 10% minimum
      maxSavingsRate: 0.4, // 40% maximum
      emergencyFundMonths: 6,
      bufferPercentage: 0.1 // 10% buffer for unexpected expenses
    };
  }

  async createMonthlyPlan(user, transactions, goals, budgets) {
    const monthlyIncome = parseFloat(user.monthly_income) || this.estimateIncome(transactions);
    const averageExpenses = this.calculateAverageExpenses(transactions);
    const upcomingBills = this.identifyUpcomingBills(transactions);
    
    const plan = {
      month: this.getCurrentMonth(),
      income: monthlyIncome,
      projectedExpenses: averageExpenses,
      allocations: [],
      weeklyTargets: [],
      actionItems: [],
      warnings: [],
      summary: ''
    };

    // Calculate available funds
    const availableFunds = monthlyIncome - (averageExpenses * (1 + this.planningRules.bufferPercentage));

    // Allocate to goals first
    const goalAllocations = this.allocateToGoals(goals, availableFunds);
    plan.allocations.push(...goalAllocations);

    // Remaining for savings/investments
    const remainingAfterGoals = availableFunds - goalAllocations.reduce((sum, g) => sum + g.amount, 0);
    
    if (remainingAfterGoals > 0) {
      plan.allocations.push({
        type: 'savings',
        name: 'General Savings',
        amount: remainingAfterGoals * 0.5,
        reason: 'Emergency fund and buffer'
      });
      plan.allocations.push({
        type: 'investment',
        name: 'Investments',
        amount: remainingAfterGoals * 0.5,
        reason: 'Wealth building'
      });
    }

    // Create weekly targets
    plan.weeklyTargets = this.createWeeklyTargets(averageExpenses, budgets);

    // Generate action items
    plan.actionItems = this.generateActionItems(user, transactions, goals, budgets);

    // Generate warnings
    plan.warnings = this.generateWarnings(user, transactions, goals);

    // Summary
    plan.summary = this.generatePlanSummary(plan, monthlyIncome);

    return plan;
  }

  async createSavingsRoadmap(goal, user, transactions) {
    const targetAmount = parseFloat(goal.target_amount);
    const currentAmount = parseFloat(goal.current_amount || 0);
    const remaining = targetAmount - currentAmount;
    const targetDate = new Date(goal.target_date);
    const monthsLeft = this.monthsBetween(new Date(), targetDate);
    const monthlyIncome = parseFloat(user.monthly_income) || this.estimateIncome(transactions);
    const averageExpenses = this.calculateAverageExpenses(transactions);

    const roadmap = {
      goal: {
        name: goal.name,
        targetAmount,
        currentAmount,
        remaining,
        targetDate: goal.target_date,
        monthsLeft,
        progress: ((currentAmount / targetAmount) * 100).toFixed(2)
      },
      feasibility: {},
      monthlyPlan: [],
      strategies: [],
      milestones: [],
      adjustments: []
    };

    // Check feasibility
    const requiredMonthly = remaining / Math.max(1, monthsLeft);
    const maxMonthlySaving = monthlyIncome * this.planningRules.maxSavingsRate;
    const recommendedMonthly = monthlyIncome * 0.2; // 20% of income

    roadmap.feasibility = {
      requiredMonthlySaving: requiredMonthly,
      maxPossibleSaving: maxMonthlySaving,
      isAchievable: requiredMonthly <= maxMonthlySaving,
      difficulty: requiredMonthly <= recommendedMonthly ? 'easy' : 
                  requiredMonthly <= maxMonthlySaving ? 'moderate' : 'challenging',
      percentageOfIncome: ((requiredMonthly / monthlyIncome) * 100).toFixed(2)
    };

    // Create monthly breakdown
    let runningTotal = currentAmount;
    for (let i = 0; i < Math.min(monthsLeft, 12); i++) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() + i);
      
      runningTotal += requiredMonthly;
      
      roadmap.monthlyPlan.push({
        month: monthDate.toISOString().slice(0, 7),
        monthName: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        targetSaving: requiredMonthly.toFixed(2),
        projectedTotal: Math.min(runningTotal, targetAmount).toFixed(2),
        progressPercentage: ((Math.min(runningTotal, targetAmount) / targetAmount) * 100).toFixed(2)
      });
    }

    // Generate strategies based on spending patterns
    roadmap.strategies = this.generateSavingStrategies(transactions, requiredMonthly, averageExpenses);

    // Create milestones
    roadmap.milestones = [
      { percentage: 25, amount: targetAmount * 0.25, message: '🎯 Quarter way there!' },
      { percentage: 50, amount: targetAmount * 0.50, message: '🎉 Halfway to your goal!' },
      { percentage: 75, amount: targetAmount * 0.75, message: '💪 Final stretch!' },
      { percentage: 100, amount: targetAmount, message: '🏆 Goal achieved!' }
    ].map(m => ({
      ...m,
      reached: currentAmount >= m.amount,
      remainingToMilestone: Math.max(0, m.amount - currentAmount).toFixed(2)
    }));

    // Suggest adjustments if not feasible
    if (!roadmap.feasibility.isAchievable) {
      roadmap.adjustments = this.suggestAdjustments(goal, requiredMonthly, maxMonthlySaving, monthlyIncome);
    }

    return roadmap;
  }

  estimateIncome(transactions) {
    const credits = transactions.filter(tx => tx.type === 'credit');
    if (credits.length === 0) return 0;

    const monthlyIncome = {};
    for (const tx of credits) {
      const month = new Date(tx.transaction_date).toISOString().slice(0, 7);
      if (!monthlyIncome[month]) monthlyIncome[month] = 0;
      monthlyIncome[month] += parseFloat(tx.amount);
    }

    const months = Object.values(monthlyIncome);
    return months.length > 0 ? months.reduce((a, b) => a + b, 0) / months.length : 0;
  }

  calculateAverageExpenses(transactions) {
    const expenses = transactions.filter(tx => tx.type === 'debit');
    if (expenses.length === 0) return 0;

    const monthlyExpenses = {};
    for (const tx of expenses) {
      const month = new Date(tx.transaction_date).toISOString().slice(0, 7);
      if (!monthlyExpenses[month]) monthlyExpenses[month] = 0;
      monthlyExpenses[month] += parseFloat(tx.amount);
    }

    const months = Object.values(monthlyExpenses);
    return months.length > 0 ? months.reduce((a, b) => a + b, 0) / months.length : 0;
  }

  identifyUpcomingBills(transactions) {
    const bills = [];
    const recurring = {};
    
    for (const tx of transactions) {
      if (tx.type === 'debit' && tx.is_recurring) {
        const key = `${tx.merchant_name || tx.category}_${tx.amount}`;
        if (!recurring[key]) {
          recurring[key] = {
            name: tx.merchant_name || tx.category,
            amount: parseFloat(tx.amount),
            dates: []
          };
        }
        recurring[key].dates.push(new Date(tx.transaction_date).getDate());
      }
    }

    for (const [, bill] of Object.entries(recurring)) {
      if (bill.dates.length >= 2) {
        const avgDate = Math.round(bill.dates.reduce((a, b) => a + b, 0) / bill.dates.length);
        bills.push({
          ...bill,
          expectedDate: avgDate,
          category: 'recurring'
        });
      }
    }

    return bills;
  }

  allocateToGoals(goals, availableFunds) {
    const allocations = [];
    const activeGoals = goals.filter(g => g.status === 'active')
                              .sort((a, b) => new Date(a.target_date) - new Date(b.target_date));

    let remaining = availableFunds;

    for (const goal of activeGoals) {
      const monthsLeft = this.monthsBetween(new Date(), new Date(goal.target_date));
      const requiredMonthly = (parseFloat(goal.target_amount) - parseFloat(goal.current_amount || 0)) / Math.max(1, monthsLeft);
      
      const allocation = Math.min(requiredMonthly, remaining * 0.5); // Max 50% of remaining to one goal
      
      if (allocation > 0) {
        allocations.push({
          type: 'goal',
          goalId: goal.id,
          name: goal.name,
          amount: allocation,
          requiredMonthly,
          isFullAmount: allocation >= requiredMonthly,
          reason: `Progress towards "${goal.name}" (${monthsLeft} months left)`
        });
        remaining -= allocation;
      }
    }

    return allocations;
  }

  createWeeklyTargets(monthlyExpenses, budgets) {
    const weeklyBudget = monthlyExpenses / 4;
    const targets = [];

    for (let week = 1; week <= 4; week++) {
      const weekTarget = {
        week,
        label: `Week ${week}`,
        totalBudget: weeklyBudget.toFixed(2),
        categoryTargets: []
      };

      // Split by major categories
      const majorCategories = ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment'];
      for (const cat of majorCategories) {
        const budget = budgets.find(b => b.category === cat);
        const weeklyLimit = budget ? parseFloat(budget.monthly_limit) / 4 : weeklyBudget * 0.2;
        weekTarget.categoryTargets.push({
          category: cat,
          limit: weeklyLimit.toFixed(2)
        });
      }

      targets.push(weekTarget);
    }

    return targets;
  }

  generateActionItems(user, transactions, goals, budgets) {
    const actions = [];
    const expenses = transactions.filter(tx => tx.type === 'debit');
    const categorySpending = this.getCategorySpending(expenses);

    // Check for categories without budgets
    const budgetCategories = budgets.map(b => b.category);
    for (const [category, spending] of Object.entries(categorySpending)) {
      if (!budgetCategories.includes(category) && spending > 1000) {
        actions.push({
          priority: 'high',
          action: `Set a budget for ${category}`,
          reason: `You've spent ₹${spending.toFixed(0)} on ${category} without a budget`,
          type: 'budget'
        });
      }
    }

    // Check goal progress
    for (const goal of goals.filter(g => g.status === 'active')) {
      const progress = (parseFloat(goal.current_amount) / parseFloat(goal.target_amount)) * 100;
      const monthsLeft = this.monthsBetween(new Date(), new Date(goal.target_date));
      const expectedProgress = ((12 - monthsLeft) / 12) * 100;

      if (progress < expectedProgress - 10) {
        actions.push({
          priority: 'high',
          action: `Increase savings for "${goal.name}"`,
          reason: `Goal is ${(expectedProgress - progress).toFixed(0)}% behind schedule`,
          type: 'goal'
        });
      }
    }

    // Review subscriptions
    if (categorySpending['Subscriptions'] > 1500) {
      actions.push({
        priority: 'medium',
        action: 'Review active subscriptions',
        reason: 'Monthly subscription spending is high',
        type: 'expense'
      });
    }

    return actions.slice(0, 5);
  }

  generateWarnings(user, transactions, goals) {
    const warnings = [];
    const monthlyIncome = parseFloat(user.monthly_income) || 0;
    const expenses = this.calculateAverageExpenses(transactions);

    // Low savings rate
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - expenses) / monthlyIncome) * 100 : 0;
    if (savingsRate < 10) {
      warnings.push({
        type: 'savings',
        message: `Your savings rate is only ${savingsRate.toFixed(0)}%. Aim for at least 20%.`,
        severity: 'high'
      });
    }

    // Goal deadlines
    for (const goal of goals.filter(g => g.status === 'active')) {
      const monthsLeft = this.monthsBetween(new Date(), new Date(goal.target_date));
      if (monthsLeft <= 2) {
        warnings.push({
          type: 'goal',
          message: `"${goal.name}" deadline is in ${monthsLeft} months!`,
          severity: 'high'
        });
      }
    }

    // Irregular income warning
    if (user.income_type === 'irregular' || user.income_type === 'freelance') {
      warnings.push({
        type: 'income',
        message: 'Remember to save extra during high-income periods.',
        severity: 'medium'
      });
    }

    return warnings;
  }

  generatePlanSummary(plan, monthlyIncome) {
    const totalAllocated = plan.allocations.reduce((sum, a) => sum + a.amount, 0);
    const savingsPercentage = ((totalAllocated / monthlyIncome) * 100).toFixed(0);
    
    return `This month, aim to save ₹${totalAllocated.toFixed(0)} (${savingsPercentage}% of income). ` +
           `${plan.actionItems.length} action items need attention. ` +
           `${plan.warnings.length} warnings to consider.`;
  }

  generateSavingStrategies(transactions, requiredMonthly, averageExpenses) {
    const strategies = [];
    const categorySpending = this.getCategorySpending(transactions.filter(tx => tx.type === 'debit'));

    // Identify reduction opportunities
    const reducibleCategories = ['Food & Dining', 'Shopping', 'Entertainment', 'Subscriptions'];
    
    for (const cat of reducibleCategories) {
      const spending = categorySpending[cat] || 0;
      if (spending > 0) {
        const reduction = spending * 0.2;
        strategies.push({
          category: cat,
          currentSpending: spending.toFixed(2),
          suggestedReduction: reduction.toFixed(2),
          tip: this.getReductionTip(cat),
          impact: ((reduction / requiredMonthly) * 100).toFixed(0)
        });
      }
    }

    // Sort by impact
    return strategies.sort((a, b) => parseFloat(b.impact) - parseFloat(a.impact)).slice(0, 5);
  }

  getReductionTip(category) {
    const tips = {
      'Food & Dining': 'Cook at home more, use meal planning, carry lunch to work',
      'Shopping': 'Use wishlist wait method, compare prices, avoid impulse buys',
      'Entertainment': 'Look for free alternatives, share subscriptions, use library',
      'Subscriptions': 'Cancel unused services, switch to annual plans, share family plans'
    };
    return tips[category] || 'Review and cut unnecessary expenses';
  }

  suggestAdjustments(goal, requiredMonthly, maxMonthlySaving, monthlyIncome) {
    const adjustments = [];
    const shortfall = requiredMonthly - maxMonthlySaving;

    // Extend timeline
    const remaining = parseFloat(goal.target_amount) - parseFloat(goal.current_amount || 0);
    const newMonths = Math.ceil(remaining / maxMonthlySaving);
    const newDate = new Date();
    newDate.setMonth(newDate.getMonth() + newMonths);

    adjustments.push({
      type: 'extend_timeline',
      description: `Extend goal to ${newDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      newMonthlySaving: maxMonthlySaving.toFixed(2),
      feasible: true
    });

    // Reduce target
    const achievableAmount = parseFloat(goal.current_amount || 0) + 
                            (maxMonthlySaving * this.monthsBetween(new Date(), new Date(goal.target_date)));
    adjustments.push({
      type: 'reduce_target',
      description: `Reduce target to ₹${achievableAmount.toFixed(0)}`,
      newTarget: achievableAmount.toFixed(2),
      reduction: (parseFloat(goal.target_amount) - achievableAmount).toFixed(2),
      feasible: true
    });

    // Increase income
    adjustments.push({
      type: 'increase_income',
      description: 'Find additional income sources',
      additionalIncomeNeeded: (shortfall / 0.4).toFixed(2),
      suggestions: ['Freelance work', 'Part-time job', 'Sell unused items']
    });

    return adjustments;
  }

  getCategorySpending(expenses) {
    const spending = {};
    for (const tx of expenses) {
      const category = tx.category || 'Other Expense';
      if (!spending[category]) spending[category] = 0;
      spending[category] += parseFloat(tx.amount);
    }
    return spending;
  }

  getCurrentMonth() {
    return new Date().toISOString().slice(0, 7);
  }

  monthsBetween(date1, date2) {
    return Math.max(0, (date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth()));
  }
}

module.exports = AutonomousPlanner;
