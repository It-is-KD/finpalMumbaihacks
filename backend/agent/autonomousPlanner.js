<<<<<<< HEAD
const huggingface = require('./huggingface');
const budgetGoalGenerator = require('./budgetGoalGenerator');
const investmentAdvisor = require('./investmentAdvisor');
const savingsCoach = require('./savingsCoach');

class AutonomousPlanner {
  constructor() {
    this.planningHorizon = 12; // months
  }

  async generateMonthlyRoadmap(userProfile, transactions, goals, budgets) {
    const roadmap = {
      generatedAt: new Date(),
      planningHorizon: this.planningHorizon,
      monthlyPlans: [],
      summary: {},
      recommendations: []
    };

    const monthlyIncome = parseFloat(userProfile.monthly_income) || 50000;
    const incomeType = userProfile.income_type;
    
    // Analyze income patterns for variable income
    const incomePattern = this.analyzeIncomePattern(transactions, incomeType);
    
    // Calculate average monthly expenses
    const avgExpenses = this.calculateAverageExpenses(transactions);
    
    // Generate 12-month plan
    for (let month = 0; month < this.planningHorizon; month++) {
      const currentDate = new Date();
      currentDate.setMonth(currentDate.getMonth() + month);
      
      const monthPlan = {
        month: currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
        expectedIncome: this.predictIncome(monthlyIncome, incomePattern, month),
        plannedExpenses: {},
        savingsTarget: 0,
        goalContributions: [],
        investmentAllocation: [],
        bufferAmount: 0,
        alerts: []
      };

      // Adjust for predicted low-income periods
      if (incomeType === 'freelancer' || incomeType === 'gig') {
        if (incomePattern.lowMonths.includes(currentDate.getMonth())) {
          monthPlan.alerts.push({
            type: 'income_warning',
            message: `Historically lower income month. Consider using savings buffer.`
          });
          monthPlan.bufferAmount = monthlyIncome * 0.2;
        }
      }

      // Plan expenses based on budgets
      for (const budget of budgets) {
        monthPlan.plannedExpenses[budget.category] = parseFloat(budget.monthly_limit);
      }

      // Calculate savings target
      const totalExpenses = Object.values(monthPlan.plannedExpenses).reduce((a, b) => a + b, 0);
      monthPlan.savingsTarget = monthPlan.expectedIncome - totalExpenses - monthPlan.bufferAmount;

      // Allocate to goals
      const activeGoals = goals.filter(g => g.status === 'active');
      if (activeGoals.length > 0 && monthPlan.savingsTarget > 0) {
        const perGoalAmount = monthPlan.savingsTarget * 0.6 / activeGoals.length;
        for (const goal of activeGoals) {
          monthPlan.goalContributions.push({
            goalId: goal.id,
            goalName: goal.name,
            contribution: Math.round(perGoalAmount)
          });
        }
      }

      // Investment allocation from remaining savings
      const investmentAmount = monthPlan.savingsTarget * 0.4;
      if (investmentAmount > 1000) {
        monthPlan.investmentAllocation = this.allocateInvestments(
          investmentAmount,
          userProfile.risk_tolerance
        );
      }

      roadmap.monthlyPlans.push(monthPlan);
    }

    // Generate summary
    roadmap.summary = {
      totalProjectedIncome: roadmap.monthlyPlans.reduce((sum, m) => sum + m.expectedIncome, 0),
      totalPlannedSavings: roadmap.monthlyPlans.reduce((sum, m) => sum + m.savingsTarget, 0),
      totalGoalContributions: roadmap.monthlyPlans.reduce((sum, m) => 
        sum + m.goalContributions.reduce((gs, g) => gs + g.contribution, 0), 0),
      totalInvestments: roadmap.monthlyPlans.reduce((sum, m) => 
        sum + m.investmentAllocation.reduce((is, i) => is + i.amount, 0), 0),
      goalProjections: this.projectGoalCompletions(goals, roadmap.monthlyPlans)
    };

    // Add high-level recommendations
    roadmap.recommendations = await this.generateRoadmapRecommendations(roadmap, userProfile);

    return roadmap;
  }

  analyzeIncomePattern(transactions, incomeType) {
    const monthlyIncome = {};
    
    for (const t of transactions) {
      if (t.type === 'credit') {
        const month = new Date(t.transaction_date).getMonth();
        if (!monthlyIncome[month]) monthlyIncome[month] = [];
        monthlyIncome[month].push(parseFloat(t.amount));
      }
    }

    const monthlyTotals = {};
    for (const [month, amounts] of Object.entries(monthlyIncome)) {
      monthlyTotals[month] = amounts.reduce((a, b) => a + b, 0);
    }

    const avgIncome = Object.values(monthlyTotals).reduce((a, b) => a + b, 0) / 
      Math.max(1, Object.keys(monthlyTotals).length);
    
    const lowMonths = [];
    const highMonths = [];
    
    for (const [month, total] of Object.entries(monthlyTotals)) {
      if (total < avgIncome * 0.7) lowMonths.push(parseInt(month));
      if (total > avgIncome * 1.3) highMonths.push(parseInt(month));
    }

    return {
      averageMonthlyIncome: avgIncome,
      lowMonths,
      highMonths,
      volatility: incomeType === 'freelancer' || incomeType === 'gig' ? 'high' : 'low'
    };
  }

  predictIncome(baseIncome, incomePattern, monthOffset) {
    const targetMonth = (new Date().getMonth() + monthOffset) % 12;
    
    if (incomePattern.lowMonths.includes(targetMonth)) {
      return baseIncome * 0.7;
    } else if (incomePattern.highMonths.includes(targetMonth)) {
      return baseIncome * 1.3;
    }
    return baseIncome;
  }

  calculateAverageExpenses(transactions) {
    const monthlyExpenses = {};
    
    for (const t of transactions) {
      if (t.type === 'debit') {
        const monthKey = new Date(t.transaction_date).toISOString().slice(0, 7);
        if (!monthlyExpenses[monthKey]) monthlyExpenses[monthKey] = 0;
        monthlyExpenses[monthKey] += parseFloat(t.amount);
      }
    }

    const totals = Object.values(monthlyExpenses);
    return totals.length > 0 ? totals.reduce((a, b) => a + b, 0) / totals.length : 0;
  }

  allocateInvestments(amount, riskTolerance) {
    const allocations = [];
    
    if (riskTolerance === 'low') {
      allocations.push({ type: 'FD', amount: Math.round(amount * 0.5) });
      allocations.push({ type: 'PPF', amount: Math.round(amount * 0.3) });
      allocations.push({ type: 'Bonds', amount: Math.round(amount * 0.2) });
    } else if (riskTolerance === 'medium') {
      allocations.push({ type: 'Mutual Funds', amount: Math.round(amount * 0.4) });
      allocations.push({ type: 'FD', amount: Math.round(amount * 0.25) });
      allocations.push({ type: 'Gold', amount: Math.round(amount * 0.15) });
      allocations.push({ type: 'NPS', amount: Math.round(amount * 0.2) });
    } else {
      allocations.push({ type: 'Equity Funds', amount: Math.round(amount * 0.45) });
      allocations.push({ type: 'Stocks', amount: Math.round(amount * 0.25) });
      allocations.push({ type: 'Mutual Funds', amount: Math.round(amount * 0.2) });
      allocations.push({ type: 'Gold', amount: Math.round(amount * 0.1) });
    }
    
    return allocations;
  }

  projectGoalCompletions(goals, monthlyPlans) {
    const projections = [];
    
    for (const goal of goals) {
      if (goal.status !== 'active') continue;
      
      let projectedAmount = parseFloat(goal.current_amount);
      let completionMonth = null;
      
      for (let i = 0; i < monthlyPlans.length; i++) {
        const plan = monthlyPlans[i];
        const contribution = plan.goalContributions.find(g => g.goalId === goal.id);
        if (contribution) {
          projectedAmount += contribution.contribution;
        }
        
        if (projectedAmount >= goal.target_amount && !completionMonth) {
          completionMonth = plan.month;
        }
      }
      
      projections.push({
        goalId: goal.id,
        goalName: goal.name,
        targetAmount: goal.target_amount,
        projectedAmount: Math.round(projectedAmount),
        estimatedCompletion: completionMonth,
        onTrack: projectedAmount >= goal.target_amount
      });
    }
    
    return projections;
  }

  async generateRoadmapRecommendations(roadmap, userProfile) {
    const recommendations = [];
    
    // Check if savings are too low
    const savingsRate = roadmap.summary.totalPlannedSavings / roadmap.summary.totalProjectedIncome;
    if (savingsRate < 0.2) {
      recommendations.push({
        type: 'warning',
        title: 'Increase Savings Rate',
        description: `Your projected savings rate is ${(savingsRate * 100).toFixed(1)}%. Aim for at least 20%.`,
        action: 'Review discretionary spending categories for potential cuts.',
        method: 'rule'
      });
    }

    // Check goal progress
    const offTrackGoals = roadmap.summary.goalProjections.filter(g => !g.onTrack);
    if (offTrackGoals.length > 0) {
      recommendations.push({
        type: 'action',
        title: 'Goals Need Attention',
        description: `${offTrackGoals.length} goal(s) may not be achieved at current pace.`,
        action: 'Consider increasing monthly contributions or extending timelines.',
        method: 'rule'
      });
    }

    // Investment diversification check
    if (roadmap.summary.totalInvestments > 0) {
      recommendations.push({
        type: 'tip',
        title: 'Regular Investment Review',
        description: 'Review and rebalance your investment portfolio quarterly.',
        action: 'Set a reminder to review investments every 3 months.',
        method: 'rule'
      });
    }

    // Generate AI narrative for the roadmap
    console.log('🤖 Generating AI roadmap narrative...');
    
    try {
      const aiNarrative = await huggingface.generateRoadmapNarrative(roadmap, userProfile);
      
      if (aiNarrative) {
        console.log('✅ AI roadmap narrative generated');
        
        // Add AI-generated narrative
        roadmap.aiNarrative = {
          summaryNarrative: aiNarrative.summaryNarrative,
          closingStatement: aiNarrative.closingStatement,
          method: 'ai'
        };
        
        // Add AI milestones
        if (aiNarrative.keyMilestones && aiNarrative.keyMilestones.length > 0) {
          roadmap.aiMilestones = aiNarrative.keyMilestones.map(m => ({
            ...m,
            method: 'ai'
          }));
        }
        
        // Add AI risk mitigation
        if (aiNarrative.risksAndMitigation && aiNarrative.risksAndMitigation.length > 0) {
          for (const risk of aiNarrative.risksAndMitigation) {
            recommendations.push({
              type: 'ai_risk',
              title: `Risk: ${risk.risk}`,
              description: risk.mitigation,
              action: 'Take preventive action',
              method: 'ai'
            });
          }
        }
      }
    } catch (error) {
      console.error('AI roadmap narrative failed:', error.message);
    }

    return recommendations;
  }

  async adjustPlanForLifeEvent(currentPlan, event) {
    const adjustedPlan = { ...currentPlan };
    
    const eventAdjustments = {
      job_loss: {
        savingsMultiplier: 1.5,
        investmentMultiplier: 0.2,
        message: 'Focus on building emergency fund. Pause non-essential investments.'
      },
      salary_hike: {
        savingsMultiplier: 1.3,
        investmentMultiplier: 1.5,
        message: 'Great news! Increase savings and investment allocations.'
      },
      new_expense: {
        savingsMultiplier: 0.8,
        investmentMultiplier: 0.8,
        message: 'Adjust budget to accommodate new expense while maintaining savings.'
      },
      windfall: {
        savingsMultiplier: 1,
        investmentMultiplier: 2,
        message: 'Consider investing the windfall for long-term growth.'
      }
    };

    const adjustment = eventAdjustments[event.type];
    if (adjustment) {
      for (const plan of adjustedPlan.monthlyPlans) {
        plan.savingsTarget *= adjustment.savingsMultiplier;
        plan.investmentAllocation = plan.investmentAllocation.map(i => ({
          ...i,
          amount: Math.round(i.amount * adjustment.investmentMultiplier)
        }));
        plan.alerts.push({
          type: 'life_event',
          message: adjustment.message
        });
      }
    }

    return adjustedPlan;
  }
}

module.exports = new AutonomousPlanner();
=======
const huggingface = require('./huggingface');
const budgetGoalGenerator = require('./budgetGoalGenerator');
const investmentAdvisor = require('./investmentAdvisor');
const savingsCoach = require('./savingsCoach');

class AutonomousPlanner {
  constructor() {
    this.planningHorizon = 12; // months
  }

  async generateMonthlyRoadmap(userProfile, transactions, goals, budgets) {
    const roadmap = {
      generatedAt: new Date(),
      planningHorizon: this.planningHorizon,
      monthlyPlans: [],
      summary: {},
      recommendations: []
    };

    const monthlyIncome = parseFloat(userProfile.monthly_income) || 50000;
    const incomeType = userProfile.income_type;
    
    // Analyze income patterns for variable income
    const incomePattern = this.analyzeIncomePattern(transactions, incomeType);
    
    // Calculate average monthly expenses
    const avgExpenses = this.calculateAverageExpenses(transactions);
    
    // Generate 12-month plan
    for (let month = 0; month < this.planningHorizon; month++) {
      const currentDate = new Date();
      currentDate.setMonth(currentDate.getMonth() + month);
      
      const monthPlan = {
        month: currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
        expectedIncome: this.predictIncome(monthlyIncome, incomePattern, month),
        plannedExpenses: {},
        savingsTarget: 0,
        goalContributions: [],
        investmentAllocation: [],
        bufferAmount: 0,
        alerts: []
      };

      // Adjust for predicted low-income periods
      if (incomeType === 'freelancer' || incomeType === 'gig') {
        if (incomePattern.lowMonths.includes(currentDate.getMonth())) {
          monthPlan.alerts.push({
            type: 'income_warning',
            message: `Historically lower income month. Consider using savings buffer.`
          });
          monthPlan.bufferAmount = monthlyIncome * 0.2;
        }
      }

      // Plan expenses based on budgets
      for (const budget of budgets) {
        monthPlan.plannedExpenses[budget.category] = parseFloat(budget.monthly_limit);
      }

      // Calculate savings target
      const totalExpenses = Object.values(monthPlan.plannedExpenses).reduce((a, b) => a + b, 0);
      monthPlan.savingsTarget = monthPlan.expectedIncome - totalExpenses - monthPlan.bufferAmount;

      // Allocate to goals
      const activeGoals = goals.filter(g => g.status === 'active');
      if (activeGoals.length > 0 && monthPlan.savingsTarget > 0) {
        const perGoalAmount = monthPlan.savingsTarget * 0.6 / activeGoals.length;
        for (const goal of activeGoals) {
          monthPlan.goalContributions.push({
            goalId: goal.id,
            goalName: goal.name,
            contribution: Math.round(perGoalAmount)
          });
        }
      }

      // Investment allocation from remaining savings
      const investmentAmount = monthPlan.savingsTarget * 0.4;
      if (investmentAmount > 1000) {
        monthPlan.investmentAllocation = this.allocateInvestments(
          investmentAmount,
          userProfile.risk_tolerance
        );
      }

      roadmap.monthlyPlans.push(monthPlan);
    }

    // Generate summary
    roadmap.summary = {
      totalProjectedIncome: roadmap.monthlyPlans.reduce((sum, m) => sum + m.expectedIncome, 0),
      totalPlannedSavings: roadmap.monthlyPlans.reduce((sum, m) => sum + m.savingsTarget, 0),
      totalGoalContributions: roadmap.monthlyPlans.reduce((sum, m) => 
        sum + m.goalContributions.reduce((gs, g) => gs + g.contribution, 0), 0),
      totalInvestments: roadmap.monthlyPlans.reduce((sum, m) => 
        sum + m.investmentAllocation.reduce((is, i) => is + i.amount, 0), 0),
      goalProjections: this.projectGoalCompletions(goals, roadmap.monthlyPlans)
    };

    // Add high-level recommendations
    roadmap.recommendations = await this.generateRoadmapRecommendations(roadmap, userProfile);

    return roadmap;
  }

  analyzeIncomePattern(transactions, incomeType) {
    const monthlyIncome = {};
    
    for (const t of transactions) {
      if (t.type === 'credit') {
        const month = new Date(t.transaction_date).getMonth();
        if (!monthlyIncome[month]) monthlyIncome[month] = [];
        monthlyIncome[month].push(parseFloat(t.amount));
      }
    }

    const monthlyTotals = {};
    for (const [month, amounts] of Object.entries(monthlyIncome)) {
      monthlyTotals[month] = amounts.reduce((a, b) => a + b, 0);
    }

    const avgIncome = Object.values(monthlyTotals).reduce((a, b) => a + b, 0) / 
      Math.max(1, Object.keys(monthlyTotals).length);
    
    const lowMonths = [];
    const highMonths = [];
    
    for (const [month, total] of Object.entries(monthlyTotals)) {
      if (total < avgIncome * 0.7) lowMonths.push(parseInt(month));
      if (total > avgIncome * 1.3) highMonths.push(parseInt(month));
    }

    return {
      averageMonthlyIncome: avgIncome,
      lowMonths,
      highMonths,
      volatility: incomeType === 'freelancer' || incomeType === 'gig' ? 'high' : 'low'
    };
  }

  predictIncome(baseIncome, incomePattern, monthOffset) {
    const targetMonth = (new Date().getMonth() + monthOffset) % 12;
    
    if (incomePattern.lowMonths.includes(targetMonth)) {
      return baseIncome * 0.7;
    } else if (incomePattern.highMonths.includes(targetMonth)) {
      return baseIncome * 1.3;
    }
    return baseIncome;
  }

  calculateAverageExpenses(transactions) {
    const monthlyExpenses = {};
    
    for (const t of transactions) {
      if (t.type === 'debit') {
        const monthKey = new Date(t.transaction_date).toISOString().slice(0, 7);
        if (!monthlyExpenses[monthKey]) monthlyExpenses[monthKey] = 0;
        monthlyExpenses[monthKey] += parseFloat(t.amount);
      }
    }

    const totals = Object.values(monthlyExpenses);
    return totals.length > 0 ? totals.reduce((a, b) => a + b, 0) / totals.length : 0;
  }

  allocateInvestments(amount, riskTolerance) {
    const allocations = [];
    
    if (riskTolerance === 'low') {
      allocations.push({ type: 'FD', amount: Math.round(amount * 0.5) });
      allocations.push({ type: 'PPF', amount: Math.round(amount * 0.3) });
      allocations.push({ type: 'Bonds', amount: Math.round(amount * 0.2) });
    } else if (riskTolerance === 'medium') {
      allocations.push({ type: 'Mutual Funds', amount: Math.round(amount * 0.4) });
      allocations.push({ type: 'FD', amount: Math.round(amount * 0.25) });
      allocations.push({ type: 'Gold', amount: Math.round(amount * 0.15) });
      allocations.push({ type: 'NPS', amount: Math.round(amount * 0.2) });
    } else {
      allocations.push({ type: 'Equity Funds', amount: Math.round(amount * 0.45) });
      allocations.push({ type: 'Stocks', amount: Math.round(amount * 0.25) });
      allocations.push({ type: 'Mutual Funds', amount: Math.round(amount * 0.2) });
      allocations.push({ type: 'Gold', amount: Math.round(amount * 0.1) });
    }
    
    return allocations;
  }

  projectGoalCompletions(goals, monthlyPlans) {
    const projections = [];
    
    for (const goal of goals) {
      if (goal.status !== 'active') continue;
      
      let projectedAmount = parseFloat(goal.current_amount);
      let completionMonth = null;
      
      for (let i = 0; i < monthlyPlans.length; i++) {
        const plan = monthlyPlans[i];
        const contribution = plan.goalContributions.find(g => g.goalId === goal.id);
        if (contribution) {
          projectedAmount += contribution.contribution;
        }
        
        if (projectedAmount >= goal.target_amount && !completionMonth) {
          completionMonth = plan.month;
        }
      }
      
      projections.push({
        goalId: goal.id,
        goalName: goal.name,
        targetAmount: goal.target_amount,
        projectedAmount: Math.round(projectedAmount),
        estimatedCompletion: completionMonth,
        onTrack: projectedAmount >= goal.target_amount
      });
    }
    
    return projections;
  }

  async generateRoadmapRecommendations(roadmap, userProfile) {
    const recommendations = [];
    
    // Check if savings are too low
    const savingsRate = roadmap.summary.totalPlannedSavings / roadmap.summary.totalProjectedIncome;
    if (savingsRate < 0.2) {
      recommendations.push({
        type: 'warning',
        title: 'Increase Savings Rate',
        description: `Your projected savings rate is ${(savingsRate * 100).toFixed(1)}%. Aim for at least 20%.`,
        action: 'Review discretionary spending categories for potential cuts.',
        method: 'rule'
      });
    }

    // Check goal progress
    const offTrackGoals = roadmap.summary.goalProjections.filter(g => !g.onTrack);
    if (offTrackGoals.length > 0) {
      recommendations.push({
        type: 'action',
        title: 'Goals Need Attention',
        description: `${offTrackGoals.length} goal(s) may not be achieved at current pace.`,
        action: 'Consider increasing monthly contributions or extending timelines.',
        method: 'rule'
      });
    }

    // Investment diversification check
    if (roadmap.summary.totalInvestments > 0) {
      recommendations.push({
        type: 'tip',
        title: 'Regular Investment Review',
        description: 'Review and rebalance your investment portfolio quarterly.',
        action: 'Set a reminder to review investments every 3 months.',
        method: 'rule'
      });
    }

    // Generate AI narrative for the roadmap
    console.log('🤖 Generating AI roadmap narrative...');
    
    try {
      const aiNarrative = await huggingface.generateRoadmapNarrative(roadmap, userProfile);
      
      if (aiNarrative) {
        console.log('✅ AI roadmap narrative generated');
        
        // Add AI-generated narrative
        roadmap.aiNarrative = {
          summaryNarrative: aiNarrative.summaryNarrative,
          closingStatement: aiNarrative.closingStatement,
          method: 'ai'
        };
        
        // Add AI milestones
        if (aiNarrative.keyMilestones && aiNarrative.keyMilestones.length > 0) {
          roadmap.aiMilestones = aiNarrative.keyMilestones.map(m => ({
            ...m,
            method: 'ai'
          }));
        }
        
        // Add AI risk mitigation
        if (aiNarrative.risksAndMitigation && aiNarrative.risksAndMitigation.length > 0) {
          for (const risk of aiNarrative.risksAndMitigation) {
            recommendations.push({
              type: 'ai_risk',
              title: `Risk: ${risk.risk}`,
              description: risk.mitigation,
              action: 'Take preventive action',
              method: 'ai'
            });
          }
        }
      }
    } catch (error) {
      console.error('AI roadmap narrative failed:', error.message);
    }

    return recommendations;
  }

  async adjustPlanForLifeEvent(currentPlan, event) {
    const adjustedPlan = { ...currentPlan };
    
    const eventAdjustments = {
      job_loss: {
        savingsMultiplier: 1.5,
        investmentMultiplier: 0.2,
        message: 'Focus on building emergency fund. Pause non-essential investments.'
      },
      salary_hike: {
        savingsMultiplier: 1.3,
        investmentMultiplier: 1.5,
        message: 'Great news! Increase savings and investment allocations.'
      },
      new_expense: {
        savingsMultiplier: 0.8,
        investmentMultiplier: 0.8,
        message: 'Adjust budget to accommodate new expense while maintaining savings.'
      },
      windfall: {
        savingsMultiplier: 1,
        investmentMultiplier: 2,
        message: 'Consider investing the windfall for long-term growth.'
      }
    };

    const adjustment = eventAdjustments[event.type];
    if (adjustment) {
      for (const plan of adjustedPlan.monthlyPlans) {
        plan.savingsTarget *= adjustment.savingsMultiplier;
        plan.investmentAllocation = plan.investmentAllocation.map(i => ({
          ...i,
          amount: Math.round(i.amount * adjustment.investmentMultiplier)
        }));
        plan.alerts.push({
          type: 'life_event',
          message: adjustment.message
        });
      }
    }

    return adjustedPlan;
  }
}

module.exports = new AutonomousPlanner();
>>>>>>> 2c5691fad8196faad9092c0293bb4957adef9391
