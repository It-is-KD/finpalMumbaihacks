<<<<<<< HEAD
const huggingface = require('./huggingface');

class BudgetGoalGenerator {
  constructor() {
    this.defaultCategories = [
      'Groceries', 'Shopping', 'Food & Dining', 'Transportation',
      'Entertainment', 'Bills & Utilities', 'Subscriptions', 'Healthcare'
    ];
  }

  /**
   * Generate AI-enhanced smart budgets
   */
  async generateSmartBudget(userProfile, transactionHistory) {
    const monthlyIncome = parseFloat(userProfile.monthly_income) || 0;
    const incomeType = userProfile.income_type || 'salaried';
    
    // Calculate category averages (local computation)
    const categoryAverages = this.calculateCategoryAverages(transactionHistory);
    
    // Apply 50/30/20 rule as baseline
    const needsBudget = monthlyIncome * 0.5;
    const wantsBudget = monthlyIncome * 0.3;
    const savingsBudget = monthlyIncome * 0.2;

    let adjustmentFactor = 1;
    if (incomeType === 'freelancer' || incomeType === 'gig') {
      adjustmentFactor = 0.8;
    }

    // Try AI-enhanced budget generation
    console.log('🤖 Generating AI-enhanced budget recommendations...');
    
    try {
      const aiResult = await huggingface.generateBudgetRecommendations(
        userProfile,
        categoryAverages,
        []
      );
      
      if (aiResult && aiResult.budgets && aiResult.budgets.length > 0) {
        console.log(`✅ Generated ${aiResult.budgets.length} AI budget recommendations`);
        
        return {
          totalMonthlyBudget: monthlyIncome * adjustmentFactor,
          needsAllocation: aiResult.needs_allocation || needsBudget * adjustmentFactor,
          wantsAllocation: aiResult.wants_allocation || wantsBudget * adjustmentFactor,
          savingsTarget: aiResult.savingsTarget || savingsBudget * adjustmentFactor,
          budgets: aiResult.budgets.map(b => ({
            category: b.category,
            type: b.type || 'wants',
            monthly_limit: Math.round(b.monthly_limit),
            historical_average: Math.round(categoryAverages[b.category] || 0),
            reasoning: b.reasoning || 'AI-generated recommendation',
            method: 'ai'
          })),
          adjustmentNote: aiResult.adjustmentNote || (adjustmentFactor < 1 
            ? 'Budget adjusted for variable income.'
            : null),
          method: 'ai'
        };
      }
    } catch (error) {
      console.error('AI budget generation failed:', error.message);
    }

    // Fallback to rule-based budget generation
    console.log('⚙️ Using fallback rule-based budget generation');
    return this.generateFallbackBudget(userProfile, categoryAverages, adjustmentFactor);
  }

  /**
   * Fallback rule-based budget generation
   */
  generateFallbackBudget(userProfile, categoryAverages, adjustmentFactor) {
    const monthlyIncome = parseFloat(userProfile.monthly_income) || 0;
    const needsBudget = monthlyIncome * 0.5 * adjustmentFactor;
    const wantsBudget = monthlyIncome * 0.3 * adjustmentFactor;
    const savingsBudget = monthlyIncome * 0.2 * adjustmentFactor;

    const budgets = [];
    const needsCategories = ['Groceries', 'Transportation', 'Bills & Utilities', 'Healthcare', 'Rent', 'EMI'];
    const wantsCategories = ['Shopping', 'Food & Dining', 'Entertainment', 'Subscriptions', 'Travel', 'Personal Care'];

    const needsPerCategory = needsBudget / needsCategories.length;
    for (const category of needsCategories) {
      const historicalSpend = categoryAverages[category] || 0;
      const suggestedLimit = Math.max(historicalSpend * 0.9, needsPerCategory);
      
      budgets.push({
        category,
        type: 'needs',
        monthly_limit: Math.round(suggestedLimit),
        historical_average: Math.round(historicalSpend),
        reasoning: historicalSpend > 0 
          ? `Based on your average spending of ₹${Math.round(historicalSpend)}`
          : 'Suggested based on 50/30/20 rule',
        method: 'rule'
      });
    }

    const wantsPerCategory = wantsBudget / wantsCategories.length;
    for (const category of wantsCategories) {
      const historicalSpend = categoryAverages[category] || 0;
      const suggestedLimit = historicalSpend > 0 
        ? Math.min(historicalSpend * 0.85, wantsPerCategory * 1.2)
        : wantsPerCategory;
      
      budgets.push({
        category,
        type: 'wants',
        monthly_limit: Math.round(suggestedLimit),
        historical_average: Math.round(historicalSpend),
        reasoning: historicalSpend > 0 
          ? `15% reduction from your average of ₹${Math.round(historicalSpend)}`
          : 'Suggested based on 50/30/20 rule',
        method: 'rule'
      });
    }

    return {
      totalMonthlyBudget: monthlyIncome * adjustmentFactor,
      needsAllocation: needsBudget,
      wantsAllocation: wantsBudget,
      savingsTarget: savingsBudget,
      budgets,
      adjustmentNote: adjustmentFactor < 1 
        ? 'Budget adjusted for variable income. Building emergency fund is recommended.'
        : null,
      method: 'rule'
    };
  }

  calculateCategoryAverages(transactions) {
    const monthlyData = {};
    
    for (const t of transactions) {
      if (t.type === 'debit' && t.category) {
        const month = new Date(t.transaction_date).toISOString().slice(0, 7);
        if (!monthlyData[month]) monthlyData[month] = {};
        if (!monthlyData[month][t.category]) monthlyData[month][t.category] = 0;
        monthlyData[month][t.category] += parseFloat(t.amount);
      }
    }

    const months = Object.keys(monthlyData);
    const averages = {};
    
    for (const month of months) {
      for (const [category, total] of Object.entries(monthlyData[month])) {
        if (!averages[category]) averages[category] = { total: 0, count: 0 };
        averages[category].total += total;
        averages[category].count += 1;
      }
    }

    for (const [category, data] of Object.entries(averages)) {
      averages[category] = data.total / data.count;
    }

    return averages;
  }

  async createGoalPlan(goal, userProfile, currentSavings = 0) {
    const targetAmount = parseFloat(goal.target_amount);
    const targetDate = new Date(goal.target_date);
    const today = new Date();
    
    const monthsRemaining = Math.max(1, 
      (targetDate.getFullYear() - today.getFullYear()) * 12 + 
      (targetDate.getMonth() - today.getMonth())
    );
    
    const amountNeeded = targetAmount - currentSavings;
    const monthlyContribution = amountNeeded / monthsRemaining;
    const monthlyIncome = parseFloat(userProfile.monthly_income) || 0;

    const plan = {
      goal: goal.name,
      targetAmount,
      currentAmount: currentSavings,
      remainingAmount: amountNeeded,
      targetDate: goal.target_date,
      monthsRemaining,
      requiredMonthlyContribution: Math.ceil(monthlyContribution),
      percentageOfIncome: monthlyIncome > 0 
        ? ((monthlyContribution / monthlyIncome) * 100).toFixed(1)
        : null,
      feasibility: 'unknown',
      milestones: [],
      suggestions: []
    };

    // Assess feasibility
    if (monthlyIncome > 0) {
      const contributionRatio = monthlyContribution / monthlyIncome;
      if (contributionRatio <= 0.1) {
        plan.feasibility = 'easy';
        plan.feasibilityNote = 'This goal is easily achievable with your current income.';
      } else if (contributionRatio <= 0.2) {
        plan.feasibility = 'moderate';
        plan.feasibilityNote = 'Achievable with some adjustments to spending habits.';
      } else if (contributionRatio <= 0.35) {
        plan.feasibility = 'challenging';
        plan.feasibilityNote = 'Will require significant lifestyle changes or extended timeline.';
      } else {
        plan.feasibility = 'difficult';
        plan.feasibilityNote = 'Consider extending the timeline or finding additional income sources.';
      }
    }

    // Generate milestones
    const milestoneInterval = Math.ceil(monthsRemaining / 4);
    for (let i = 1; i <= 4; i++) {
      const milestoneMonth = i * milestoneInterval;
      if (milestoneMonth <= monthsRemaining) {
        const milestoneAmount = currentSavings + (monthlyContribution * milestoneMonth);
        plan.milestones.push({
          month: milestoneMonth,
          targetAmount: Math.round(milestoneAmount),
          percentage: Math.round((milestoneAmount / targetAmount) * 100)
        });
      }
    }

    // Add suggestions
    if (plan.feasibility === 'challenging' || plan.feasibility === 'difficult') {
      plan.suggestions.push('Consider extending your target date by 3-6 months.');
      plan.suggestions.push('Look for ways to increase income through freelancing or side gigs.');
      plan.suggestions.push('Review subscriptions and recurring expenses for potential cuts.');
    }
    
    if (amountNeeded > 50000) {
      plan.suggestions.push('Consider investing in short-term mutual funds for better returns.');
    }

    return plan;
  }

  /**
   * AI-enhanced goal suggestions
   */
  async suggestGoals(userProfile, transactionHistory, existingGoals = []) {
    const monthlyIncome = parseFloat(userProfile.monthly_income) || 50000;
    const categoryAverages = this.calculateCategoryAverages(transactionHistory);
    
    console.log('🤖 Generating AI goal suggestions...');
    
    try {
      const aiGoals = await huggingface.generateGoalSuggestions(
        userProfile,
        existingGoals,
        categoryAverages
      );
      
      if (aiGoals && aiGoals.length > 0) {
        console.log(`✅ Generated ${aiGoals.length} AI goal suggestions`);
        return aiGoals.map(g => ({
          ...g,
          method: 'ai'
        }));
      }
    } catch (error) {
      console.error('AI goal suggestion failed:', error.message);
    }

    // Fallback to rule-based suggestions
    console.log('⚙️ Using fallback goal suggestions');
    return this.getFallbackGoalSuggestions(userProfile, existingGoals, monthlyIncome);
  }

  /**
   * Fallback rule-based goal suggestions
   */
  getFallbackGoalSuggestions(userProfile, existingGoals, monthlyIncome) {
    const suggestions = [];
    
    const hasEmergencyFund = existingGoals.some(g => 
      g.name.toLowerCase().includes('emergency') || g.category === 'emergency'
    );
    
    if (!hasEmergencyFund) {
      suggestions.push({
        name: 'Emergency Fund',
        description: 'Build a safety net for unexpected expenses',
        suggestedAmount: monthlyIncome * 6,
        suggestedTimeframe: 12,
        priority: 'high',
        category: 'emergency',
        reasoning: 'Financial experts recommend 6 months of expenses as emergency fund.',
        method: 'rule'
      });
    }

    suggestions.push({
      name: 'Dream Vacation',
      description: 'Save for a memorable trip',
      suggestedAmount: monthlyIncome * 1.5,
      suggestedTimeframe: 6,
      priority: 'medium',
      category: 'lifestyle',
      reasoning: 'A planned vacation within budget is better than impulse travel spending.',
      method: 'rule'
    });

    if (userProfile.risk_tolerance !== 'low') {
      suggestions.push({
        name: 'Investment Portfolio',
        description: 'Start building long-term wealth',
        suggestedAmount: monthlyIncome * 3,
        suggestedTimeframe: 12,
        priority: 'high',
        category: 'investment',
        reasoning: 'Starting early with investments maximizes compound growth.',
        method: 'rule'
      });
    }

    suggestions.push({
      name: 'New Gadget Fund',
      description: 'Save for electronics or appliances',
      suggestedAmount: 30000,
      suggestedTimeframe: 4,
      priority: 'low',
      category: 'purchase',
      reasoning: 'Planned purchases prevent credit card debt.',
      method: 'rule'
    });

    return suggestions;
  }
}

module.exports = new BudgetGoalGenerator();
=======
const huggingface = require('./huggingface');

class BudgetGoalGenerator {
  constructor() {
    this.defaultCategories = [
      'Groceries', 'Shopping', 'Food & Dining', 'Transportation',
      'Entertainment', 'Bills & Utilities', 'Subscriptions', 'Healthcare'
    ];
  }

  /**
   * Generate AI-enhanced smart budgets
   */
  async generateSmartBudget(userProfile, transactionHistory) {
    const monthlyIncome = parseFloat(userProfile.monthly_income) || 0;
    const incomeType = userProfile.income_type || 'salaried';
    
    // Calculate category averages (local computation)
    const categoryAverages = this.calculateCategoryAverages(transactionHistory);
    
    // Apply 50/30/20 rule as baseline
    const needsBudget = monthlyIncome * 0.5;
    const wantsBudget = monthlyIncome * 0.3;
    const savingsBudget = monthlyIncome * 0.2;

    let adjustmentFactor = 1;
    if (incomeType === 'freelancer' || incomeType === 'gig') {
      adjustmentFactor = 0.8;
    }

    // Try AI-enhanced budget generation
    console.log('🤖 Generating AI-enhanced budget recommendations...');
    
    try {
      const aiResult = await huggingface.generateBudgetRecommendations(
        userProfile,
        categoryAverages,
        []
      );
      
      if (aiResult && aiResult.budgets && aiResult.budgets.length > 0) {
        console.log(`✅ Generated ${aiResult.budgets.length} AI budget recommendations`);
        
        return {
          totalMonthlyBudget: monthlyIncome * adjustmentFactor,
          needsAllocation: aiResult.needs_allocation || needsBudget * adjustmentFactor,
          wantsAllocation: aiResult.wants_allocation || wantsBudget * adjustmentFactor,
          savingsTarget: aiResult.savingsTarget || savingsBudget * adjustmentFactor,
          budgets: aiResult.budgets.map(b => ({
            category: b.category,
            type: b.type || 'wants',
            monthly_limit: Math.round(b.monthly_limit),
            historical_average: Math.round(categoryAverages[b.category] || 0),
            reasoning: b.reasoning || 'AI-generated recommendation',
            method: 'ai'
          })),
          adjustmentNote: aiResult.adjustmentNote || (adjustmentFactor < 1 
            ? 'Budget adjusted for variable income.'
            : null),
          method: 'ai'
        };
      }
    } catch (error) {
      console.error('AI budget generation failed:', error.message);
    }

    // Fallback to rule-based budget generation
    console.log('⚙️ Using fallback rule-based budget generation');
    return this.generateFallbackBudget(userProfile, categoryAverages, adjustmentFactor);
  }

  /**
   * Fallback rule-based budget generation
   */
  generateFallbackBudget(userProfile, categoryAverages, adjustmentFactor) {
    const monthlyIncome = parseFloat(userProfile.monthly_income) || 0;
    const needsBudget = monthlyIncome * 0.5 * adjustmentFactor;
    const wantsBudget = monthlyIncome * 0.3 * adjustmentFactor;
    const savingsBudget = monthlyIncome * 0.2 * adjustmentFactor;

    const budgets = [];
    const needsCategories = ['Groceries', 'Transportation', 'Bills & Utilities', 'Healthcare', 'Rent', 'EMI'];
    const wantsCategories = ['Shopping', 'Food & Dining', 'Entertainment', 'Subscriptions', 'Travel', 'Personal Care'];

    const needsPerCategory = needsBudget / needsCategories.length;
    for (const category of needsCategories) {
      const historicalSpend = categoryAverages[category] || 0;
      const suggestedLimit = Math.max(historicalSpend * 0.9, needsPerCategory);
      
      budgets.push({
        category,
        type: 'needs',
        monthly_limit: Math.round(suggestedLimit),
        historical_average: Math.round(historicalSpend),
        reasoning: historicalSpend > 0 
          ? `Based on your average spending of ₹${Math.round(historicalSpend)}`
          : 'Suggested based on 50/30/20 rule',
        method: 'rule'
      });
    }

    const wantsPerCategory = wantsBudget / wantsCategories.length;
    for (const category of wantsCategories) {
      const historicalSpend = categoryAverages[category] || 0;
      const suggestedLimit = historicalSpend > 0 
        ? Math.min(historicalSpend * 0.85, wantsPerCategory * 1.2)
        : wantsPerCategory;
      
      budgets.push({
        category,
        type: 'wants',
        monthly_limit: Math.round(suggestedLimit),
        historical_average: Math.round(historicalSpend),
        reasoning: historicalSpend > 0 
          ? `15% reduction from your average of ₹${Math.round(historicalSpend)}`
          : 'Suggested based on 50/30/20 rule',
        method: 'rule'
      });
    }

    return {
      totalMonthlyBudget: monthlyIncome * adjustmentFactor,
      needsAllocation: needsBudget,
      wantsAllocation: wantsBudget,
      savingsTarget: savingsBudget,
      budgets,
      adjustmentNote: adjustmentFactor < 1 
        ? 'Budget adjusted for variable income. Building emergency fund is recommended.'
        : null,
      method: 'rule'
    };
  }

  calculateCategoryAverages(transactions) {
    const monthlyData = {};
    
    for (const t of transactions) {
      if (t.type === 'debit' && t.category) {
        const month = new Date(t.transaction_date).toISOString().slice(0, 7);
        if (!monthlyData[month]) monthlyData[month] = {};
        if (!monthlyData[month][t.category]) monthlyData[month][t.category] = 0;
        monthlyData[month][t.category] += parseFloat(t.amount);
      }
    }

    const months = Object.keys(monthlyData);
    const averages = {};
    
    for (const month of months) {
      for (const [category, total] of Object.entries(monthlyData[month])) {
        if (!averages[category]) averages[category] = { total: 0, count: 0 };
        averages[category].total += total;
        averages[category].count += 1;
      }
    }

    for (const [category, data] of Object.entries(averages)) {
      averages[category] = data.total / data.count;
    }

    return averages;
  }

  async createGoalPlan(goal, userProfile, currentSavings = 0) {
    const targetAmount = parseFloat(goal.target_amount);
    const targetDate = new Date(goal.target_date);
    const today = new Date();
    
    const monthsRemaining = Math.max(1, 
      (targetDate.getFullYear() - today.getFullYear()) * 12 + 
      (targetDate.getMonth() - today.getMonth())
    );
    
    const amountNeeded = targetAmount - currentSavings;
    const monthlyContribution = amountNeeded / monthsRemaining;
    const monthlyIncome = parseFloat(userProfile.monthly_income) || 0;

    const plan = {
      goal: goal.name,
      targetAmount,
      currentAmount: currentSavings,
      remainingAmount: amountNeeded,
      targetDate: goal.target_date,
      monthsRemaining,
      requiredMonthlyContribution: Math.ceil(monthlyContribution),
      percentageOfIncome: monthlyIncome > 0 
        ? ((monthlyContribution / monthlyIncome) * 100).toFixed(1)
        : null,
      feasibility: 'unknown',
      milestones: [],
      suggestions: []
    };

    // Assess feasibility
    if (monthlyIncome > 0) {
      const contributionRatio = monthlyContribution / monthlyIncome;
      if (contributionRatio <= 0.1) {
        plan.feasibility = 'easy';
        plan.feasibilityNote = 'This goal is easily achievable with your current income.';
      } else if (contributionRatio <= 0.2) {
        plan.feasibility = 'moderate';
        plan.feasibilityNote = 'Achievable with some adjustments to spending habits.';
      } else if (contributionRatio <= 0.35) {
        plan.feasibility = 'challenging';
        plan.feasibilityNote = 'Will require significant lifestyle changes or extended timeline.';
      } else {
        plan.feasibility = 'difficult';
        plan.feasibilityNote = 'Consider extending the timeline or finding additional income sources.';
      }
    }

    // Generate milestones
    const milestoneInterval = Math.ceil(monthsRemaining / 4);
    for (let i = 1; i <= 4; i++) {
      const milestoneMonth = i * milestoneInterval;
      if (milestoneMonth <= monthsRemaining) {
        const milestoneAmount = currentSavings + (monthlyContribution * milestoneMonth);
        plan.milestones.push({
          month: milestoneMonth,
          targetAmount: Math.round(milestoneAmount),
          percentage: Math.round((milestoneAmount / targetAmount) * 100)
        });
      }
    }

    // Add suggestions
    if (plan.feasibility === 'challenging' || plan.feasibility === 'difficult') {
      plan.suggestions.push('Consider extending your target date by 3-6 months.');
      plan.suggestions.push('Look for ways to increase income through freelancing or side gigs.');
      plan.suggestions.push('Review subscriptions and recurring expenses for potential cuts.');
    }
    
    if (amountNeeded > 50000) {
      plan.suggestions.push('Consider investing in short-term mutual funds for better returns.');
    }

    return plan;
  }

  /**
   * AI-enhanced goal suggestions
   */
  async suggestGoals(userProfile, transactionHistory, existingGoals = []) {
    const monthlyIncome = parseFloat(userProfile.monthly_income) || 50000;
    const categoryAverages = this.calculateCategoryAverages(transactionHistory);
    
    console.log('🤖 Generating AI goal suggestions...');
    
    try {
      const aiGoals = await huggingface.generateGoalSuggestions(
        userProfile,
        existingGoals,
        categoryAverages
      );
      
      if (aiGoals && aiGoals.length > 0) {
        console.log(`✅ Generated ${aiGoals.length} AI goal suggestions`);
        return aiGoals.map(g => ({
          ...g,
          method: 'ai'
        }));
      }
    } catch (error) {
      console.error('AI goal suggestion failed:', error.message);
    }

    // Fallback to rule-based suggestions
    console.log('⚙️ Using fallback goal suggestions');
    return this.getFallbackGoalSuggestions(userProfile, existingGoals, monthlyIncome);
  }

  /**
   * Fallback rule-based goal suggestions
   */
  getFallbackGoalSuggestions(userProfile, existingGoals, monthlyIncome) {
    const suggestions = [];
    
    const hasEmergencyFund = existingGoals.some(g => 
      g.name.toLowerCase().includes('emergency') || g.category === 'emergency'
    );
    
    if (!hasEmergencyFund) {
      suggestions.push({
        name: 'Emergency Fund',
        description: 'Build a safety net for unexpected expenses',
        suggestedAmount: monthlyIncome * 6,
        suggestedTimeframe: 12,
        priority: 'high',
        category: 'emergency',
        reasoning: 'Financial experts recommend 6 months of expenses as emergency fund.',
        method: 'rule'
      });
    }

    suggestions.push({
      name: 'Dream Vacation',
      description: 'Save for a memorable trip',
      suggestedAmount: monthlyIncome * 1.5,
      suggestedTimeframe: 6,
      priority: 'medium',
      category: 'lifestyle',
      reasoning: 'A planned vacation within budget is better than impulse travel spending.',
      method: 'rule'
    });

    if (userProfile.risk_tolerance !== 'low') {
      suggestions.push({
        name: 'Investment Portfolio',
        description: 'Start building long-term wealth',
        suggestedAmount: monthlyIncome * 3,
        suggestedTimeframe: 12,
        priority: 'high',
        category: 'investment',
        reasoning: 'Starting early with investments maximizes compound growth.',
        method: 'rule'
      });
    }

    suggestions.push({
      name: 'New Gadget Fund',
      description: 'Save for electronics or appliances',
      suggestedAmount: 30000,
      suggestedTimeframe: 4,
      priority: 'low',
      category: 'purchase',
      reasoning: 'Planned purchases prevent credit card debt.',
      method: 'rule'
    });

    return suggestions;
  }
}

module.exports = new BudgetGoalGenerator();
>>>>>>> 2c5691fad8196faad9092c0293bb4957adef9391
