<<<<<<< HEAD
const huggingface = require('./huggingface');

class SavingsCoach {
  constructor() {
    // Fallback templates when AI is unavailable
    this.nudgeTemplates = {
      overspending: [
        "You've spent ₹{amount} on {category} this week - want to move ₹{saveAmount} to your savings goal?",
        "Your {category} spending is {percent}% higher than usual. Consider saving the extra ₹{saveAmount}.",
        "Quick win: Skipping {suggestion} could save you ₹{saveAmount} this month!"
      ],
      positive: [
        "Great job! You saved ₹{amount} more than last month! 🎉",
        "You're on track to save ₹{projected} this month. Keep it up!",
        "Your savings rate improved by {percent}% this month!"
      ],
      goal: [
        "You're ₹{remaining} away from your {goalName} goal. Just {months} more months!",
        "Saving an extra ₹{extra} today gets you closer to {goalName}.",
        "At this rate, you'll reach {goalName} by {date}!"
      ]
    };
  }

  /**
   * Generate AI-powered nudge
   */
  async generateNudge(type, data, userProfile = {}) {
    // Try AI first
    try {
      const nudgeContext = {
        type,
        ...data
      };
      
      const aiNudges = await huggingface.generateNudges([nudgeContext], userProfile);
      
      if (aiNudges && aiNudges.length > 0) {
        const aiNudge = aiNudges[0];
        return {
          type,
          message: aiNudge.message,
          action: aiNudge.action,
          priority: aiNudge.priority || 'medium',
          timestamp: new Date(),
          data,
          method: 'ai'
        };
      }
    } catch (error) {
      console.error('AI nudge generation failed:', error.message);
    }

    // Fallback to templates
    return this.generateFallbackNudge(type, data);
  }

  /**
   * Fallback template-based nudge
   */
  generateFallbackNudge(type, data) {
    const templates = this.nudgeTemplates[type] || this.nudgeTemplates.positive;
    let template = templates[Math.floor(Math.random() * templates.length)];
    
    for (const [key, value] of Object.entries(data)) {
      template = template.replace(`{${key}}`, value);
    }
    
    return {
      type,
      message: template,
      timestamp: new Date(),
      data,
      method: 'template'
    };
  }

  /**
   * Analyze spending and generate AI nudges
   */
  async analyzeAndNudge(userTransactions, userGoals, userBudgets, userProfile = {}) {
    const nudges = [];
    const nudgeContexts = [];
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - 7));
    
    // Analyze this week's spending
    const weeklySpending = {};
    for (const t of userTransactions) {
      const tDate = new Date(t.transaction_date);
      if (tDate >= weekStart && t.type === 'debit') {
        const category = t.category || 'Other';
        if (!weeklySpending[category]) weeklySpending[category] = 0;
        weeklySpending[category] += parseFloat(t.amount);
      }
    }

    // Build nudge contexts for overspending
    for (const [category, amount] of Object.entries(weeklySpending)) {
      const budget = userBudgets.find(b => b.category === category);
      if (budget) {
        const weeklyBudget = budget.monthly_limit / 4;
        if (amount > weeklyBudget) {
          const percentOver = Math.round((amount / weeklyBudget - 1) * 100);
          nudgeContexts.push({
            type: 'overspending',
            category,
            amount: Math.round(amount),
            budget: Math.round(weeklyBudget),
            percentOver,
            saveAmount: Math.round((amount - weeklyBudget) * 0.5)
          });
        }
      }
    }

    // Build nudge contexts for goals
    for (const goal of userGoals) {
      if (goal.status === 'active') {
        const remaining = goal.target_amount - goal.current_amount;
        const targetDate = new Date(goal.target_date);
        const monthsRemaining = Math.max(1,
          (targetDate.getFullYear() - new Date().getFullYear()) * 12 +
          (targetDate.getMonth() - new Date().getMonth())
        );
        
        nudgeContexts.push({
          type: 'goal',
          goalName: goal.name,
          remaining: Math.round(remaining),
          months: monthsRemaining,
          progress: Math.round((goal.current_amount / goal.target_amount) * 100)
        });
      }
    }

    // Generate AI nudges if we have contexts
    if (nudgeContexts.length > 0) {
      console.log(`🤖 Generating ${nudgeContexts.length} AI nudges...`);
      
      try {
        const aiNudges = await huggingface.generateNudges(nudgeContexts, userProfile);
        
        if (aiNudges && aiNudges.length > 0) {
          console.log(`✅ Generated ${aiNudges.length} AI nudges`);
          
          for (let i = 0; i < aiNudges.length; i++) {
            nudges.push({
              type: nudgeContexts[i].type,
              message: aiNudges[i].message,
              action: aiNudges[i].action,
              priority: aiNudges[i].priority,
              timestamp: new Date(),
              data: nudgeContexts[i],
              method: 'ai'
            });
          }
          return nudges;
        }
      } catch (error) {
        console.error('AI nudge batch generation failed:', error.message);
      }
    }

    // Fallback to template-based nudges
    console.log('⚙️ Using fallback template nudges');
    for (const ctx of nudgeContexts) {
      nudges.push(this.generateFallbackNudge(ctx.type, ctx));
    }

    return nudges;
  }

  getSuggestionForCategory(category) {
    const suggestions = {
      'Food & Dining': 'one restaurant meal',
      'Entertainment': 'a movie outing',
      'Shopping': 'that impulse purchase',
      'Transportation': 'a few cab rides',
      'Subscriptions': 'an unused subscription'
    };
    return suggestions[category] || 'some expenses';
  }

  async generateWeeklyReport(transactions, goals, budgets, previousWeek, userProfile = {}) {
    const report = {
      weekStart: new Date(new Date().setDate(new Date().getDate() - 7)),
      weekEnd: new Date(),
      totalSpent: 0,
      totalSaved: 0,
      categoryBreakdown: {},
      topInsight: '',
      actionItems: [],
      goalProgress: [],
      comparisonWithLastWeek: null,
      aiSummary: null
    };

    // Calculate weekly spending (local computation)
    for (const t of transactions) {
      const tDate = new Date(t.transaction_date);
      if (tDate >= report.weekStart && tDate <= report.weekEnd) {
        if (t.type === 'debit') {
          report.totalSpent += parseFloat(t.amount);
          const category = t.category || 'Other';
          if (!report.categoryBreakdown[category]) {
            report.categoryBreakdown[category] = 0;
          }
          report.categoryBreakdown[category] += parseFloat(t.amount);
        } else {
          report.totalSaved += parseFloat(t.amount);
        }
      }
    }

    // Compare with previous week
    if (previousWeek) {
      const diff = report.totalSpent - previousWeek.totalSpent;
      report.comparisonWithLastWeek = {
        difference: Math.abs(diff),
        direction: diff > 0 ? 'more' : 'less',
        percentage: ((Math.abs(diff) / previousWeek.totalSpent) * 100).toFixed(1)
      };
    }

    // Top insight
    const topCategory = Object.entries(report.categoryBreakdown)
      .sort((a, b) => b[1] - a[1])[0];
    
    if (topCategory) {
      report.topInsight = `Your biggest expense was ${topCategory[0]} at ₹${Math.round(topCategory[1])}.`;
    }

    // Action items
    for (const [category, amount] of Object.entries(report.categoryBreakdown)) {
      const budget = budgets.find(b => b.category === category);
      if (budget && amount > budget.monthly_limit / 4) {
        report.actionItems.push({
          category,
          action: `Reduce ${category} spending next week`,
          reason: `You spent ₹${Math.round(amount)} but weekly budget is ₹${Math.round(budget.monthly_limit / 4)}`
        });
      }
    }

    // Goal progress
    for (const goal of goals) {
      if (goal.status === 'active') {
        const progress = (goal.current_amount / goal.target_amount) * 100;
        report.goalProgress.push({
          name: goal.name,
          progress: progress.toFixed(1),
          remaining: goal.target_amount - goal.current_amount,
          onTrack: progress >= this.calculateExpectedProgress(goal)
        });
      }
    }

    return report;
  }

  calculateExpectedProgress(goal) {
    const startDate = new Date(goal.created_at);
    const endDate = new Date(goal.target_date);
    const now = new Date();
    
    const totalDuration = endDate - startDate;
    const elapsed = now - startDate;
    
    return (elapsed / totalDuration) * 100;
  }

  async getMotivationalMessage(userProfile, recentProgress) {
    const messages = [];
    
    if (recentProgress.savingsIncreased) {
      messages.push({
        type: 'celebration',
        message: `🎉 Amazing! You saved ${recentProgress.savingsPercent}% more this month!`,
        emoji: '🎉'
      });
    }
    
    if (recentProgress.goalReached) {
      messages.push({
        type: 'achievement',
        message: `🏆 Congratulations! You reached your "${recentProgress.goalName}" goal!`,
        emoji: '🏆'
      });
    }
    
    if (recentProgress.streakDays > 0) {
      messages.push({
        type: 'streak',
        message: `🔥 ${recentProgress.streakDays} days of staying under budget! Keep the streak going!`,
        emoji: '🔥'
      });
    }
    
    if (messages.length === 0) {
      messages.push({
        type: 'encouragement',
        message: "Every small step counts. Let's make today a great financial day! 💪",
        emoji: '💪'
      });
    }
    
    return messages;
  }
}

module.exports = new SavingsCoach();
=======
const huggingface = require('./huggingface');

class SavingsCoach {
  constructor() {
    // Fallback templates when AI is unavailable
    this.nudgeTemplates = {
      overspending: [
        "You've spent ₹{amount} on {category} this week - want to move ₹{saveAmount} to your savings goal?",
        "Your {category} spending is {percent}% higher than usual. Consider saving the extra ₹{saveAmount}.",
        "Quick win: Skipping {suggestion} could save you ₹{saveAmount} this month!"
      ],
      positive: [
        "Great job! You saved ₹{amount} more than last month! 🎉",
        "You're on track to save ₹{projected} this month. Keep it up!",
        "Your savings rate improved by {percent}% this month!"
      ],
      goal: [
        "You're ₹{remaining} away from your {goalName} goal. Just {months} more months!",
        "Saving an extra ₹{extra} today gets you closer to {goalName}.",
        "At this rate, you'll reach {goalName} by {date}!"
      ]
    };
  }

  /**
   * Generate AI-powered nudge
   */
  async generateNudge(type, data, userProfile = {}) {
    // Try AI first
    try {
      const nudgeContext = {
        type,
        ...data
      };
      
      const aiNudges = await huggingface.generateNudges([nudgeContext], userProfile);
      
      if (aiNudges && aiNudges.length > 0) {
        const aiNudge = aiNudges[0];
        return {
          type,
          message: aiNudge.message,
          action: aiNudge.action,
          priority: aiNudge.priority || 'medium',
          timestamp: new Date(),
          data,
          method: 'ai'
        };
      }
    } catch (error) {
      console.error('AI nudge generation failed:', error.message);
    }

    // Fallback to templates
    return this.generateFallbackNudge(type, data);
  }

  /**
   * Fallback template-based nudge
   */
  generateFallbackNudge(type, data) {
    const templates = this.nudgeTemplates[type] || this.nudgeTemplates.positive;
    let template = templates[Math.floor(Math.random() * templates.length)];
    
    for (const [key, value] of Object.entries(data)) {
      template = template.replace(`{${key}}`, value);
    }
    
    return {
      type,
      message: template,
      timestamp: new Date(),
      data,
      method: 'template'
    };
  }

  /**
   * Analyze spending and generate AI nudges
   */
  async analyzeAndNudge(userTransactions, userGoals, userBudgets, userProfile = {}) {
    const nudges = [];
    const nudgeContexts = [];
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - 7));
    
    // Analyze this week's spending
    const weeklySpending = {};
    for (const t of userTransactions) {
      const tDate = new Date(t.transaction_date);
      if (tDate >= weekStart && t.type === 'debit') {
        const category = t.category || 'Other';
        if (!weeklySpending[category]) weeklySpending[category] = 0;
        weeklySpending[category] += parseFloat(t.amount);
      }
    }

    // Build nudge contexts for overspending
    for (const [category, amount] of Object.entries(weeklySpending)) {
      const budget = userBudgets.find(b => b.category === category);
      if (budget) {
        const weeklyBudget = budget.monthly_limit / 4;
        if (amount > weeklyBudget) {
          const percentOver = Math.round((amount / weeklyBudget - 1) * 100);
          nudgeContexts.push({
            type: 'overspending',
            category,
            amount: Math.round(amount),
            budget: Math.round(weeklyBudget),
            percentOver,
            saveAmount: Math.round((amount - weeklyBudget) * 0.5)
          });
        }
      }
    }

    // Build nudge contexts for goals
    for (const goal of userGoals) {
      if (goal.status === 'active') {
        const remaining = goal.target_amount - goal.current_amount;
        const targetDate = new Date(goal.target_date);
        const monthsRemaining = Math.max(1,
          (targetDate.getFullYear() - new Date().getFullYear()) * 12 +
          (targetDate.getMonth() - new Date().getMonth())
        );
        
        nudgeContexts.push({
          type: 'goal',
          goalName: goal.name,
          remaining: Math.round(remaining),
          months: monthsRemaining,
          progress: Math.round((goal.current_amount / goal.target_amount) * 100)
        });
      }
    }

    // Generate AI nudges if we have contexts
    if (nudgeContexts.length > 0) {
      console.log(`🤖 Generating ${nudgeContexts.length} AI nudges...`);
      
      try {
        const aiNudges = await huggingface.generateNudges(nudgeContexts, userProfile);
        
        if (aiNudges && aiNudges.length > 0) {
          console.log(`✅ Generated ${aiNudges.length} AI nudges`);
          
          for (let i = 0; i < aiNudges.length; i++) {
            nudges.push({
              type: nudgeContexts[i].type,
              message: aiNudges[i].message,
              action: aiNudges[i].action,
              priority: aiNudges[i].priority,
              timestamp: new Date(),
              data: nudgeContexts[i],
              method: 'ai'
            });
          }
          return nudges;
        }
      } catch (error) {
        console.error('AI nudge batch generation failed:', error.message);
      }
    }

    // Fallback to template-based nudges
    console.log('⚙️ Using fallback template nudges');
    for (const ctx of nudgeContexts) {
      nudges.push(this.generateFallbackNudge(ctx.type, ctx));
    }

    return nudges;
  }

  getSuggestionForCategory(category) {
    const suggestions = {
      'Food & Dining': 'one restaurant meal',
      'Entertainment': 'a movie outing',
      'Shopping': 'that impulse purchase',
      'Transportation': 'a few cab rides',
      'Subscriptions': 'an unused subscription'
    };
    return suggestions[category] || 'some expenses';
  }

  async generateWeeklyReport(transactions, goals, budgets, previousWeek, userProfile = {}) {
    const report = {
      weekStart: new Date(new Date().setDate(new Date().getDate() - 7)),
      weekEnd: new Date(),
      totalSpent: 0,
      totalSaved: 0,
      categoryBreakdown: {},
      topInsight: '',
      actionItems: [],
      goalProgress: [],
      comparisonWithLastWeek: null,
      aiSummary: null
    };

    // Calculate weekly spending (local computation)
    for (const t of transactions) {
      const tDate = new Date(t.transaction_date);
      if (tDate >= report.weekStart && tDate <= report.weekEnd) {
        if (t.type === 'debit') {
          report.totalSpent += parseFloat(t.amount);
          const category = t.category || 'Other';
          if (!report.categoryBreakdown[category]) {
            report.categoryBreakdown[category] = 0;
          }
          report.categoryBreakdown[category] += parseFloat(t.amount);
        } else {
          report.totalSaved += parseFloat(t.amount);
        }
      }
    }

    // Compare with previous week
    if (previousWeek) {
      const diff = report.totalSpent - previousWeek.totalSpent;
      report.comparisonWithLastWeek = {
        difference: Math.abs(diff),
        direction: diff > 0 ? 'more' : 'less',
        percentage: ((Math.abs(diff) / previousWeek.totalSpent) * 100).toFixed(1)
      };
    }

    // Top insight
    const topCategory = Object.entries(report.categoryBreakdown)
      .sort((a, b) => b[1] - a[1])[0];
    
    if (topCategory) {
      report.topInsight = `Your biggest expense was ${topCategory[0]} at ₹${Math.round(topCategory[1])}.`;
    }

    // Action items
    for (const [category, amount] of Object.entries(report.categoryBreakdown)) {
      const budget = budgets.find(b => b.category === category);
      if (budget && amount > budget.monthly_limit / 4) {
        report.actionItems.push({
          category,
          action: `Reduce ${category} spending next week`,
          reason: `You spent ₹${Math.round(amount)} but weekly budget is ₹${Math.round(budget.monthly_limit / 4)}`
        });
      }
    }

    // Goal progress
    for (const goal of goals) {
      if (goal.status === 'active') {
        const progress = (goal.current_amount / goal.target_amount) * 100;
        report.goalProgress.push({
          name: goal.name,
          progress: progress.toFixed(1),
          remaining: goal.target_amount - goal.current_amount,
          onTrack: progress >= this.calculateExpectedProgress(goal)
        });
      }
    }

    return report;
  }

  calculateExpectedProgress(goal) {
    const startDate = new Date(goal.created_at);
    const endDate = new Date(goal.target_date);
    const now = new Date();
    
    const totalDuration = endDate - startDate;
    const elapsed = now - startDate;
    
    return (elapsed / totalDuration) * 100;
  }

  async getMotivationalMessage(userProfile, recentProgress) {
    const messages = [];
    
    if (recentProgress.savingsIncreased) {
      messages.push({
        type: 'celebration',
        message: `🎉 Amazing! You saved ${recentProgress.savingsPercent}% more this month!`,
        emoji: '🎉'
      });
    }
    
    if (recentProgress.goalReached) {
      messages.push({
        type: 'achievement',
        message: `🏆 Congratulations! You reached your "${recentProgress.goalName}" goal!`,
        emoji: '🏆'
      });
    }
    
    if (recentProgress.streakDays > 0) {
      messages.push({
        type: 'streak',
        message: `🔥 ${recentProgress.streakDays} days of staying under budget! Keep the streak going!`,
        emoji: '🔥'
      });
    }
    
    if (messages.length === 0) {
      messages.push({
        type: 'encouragement',
        message: "Every small step counts. Let's make today a great financial day! 💪",
        emoji: '💪'
      });
    }
    
    return messages;
  }
}

module.exports = new SavingsCoach();
>>>>>>> 2c5691fad8196faad9092c0293bb4957adef9391
