const huggingface = require('./huggingface');

class InvestmentAdvisor {
  constructor() {
    this.investmentOptions = {
      fd: {
        name: 'Fixed Deposit',
        type: 'fd',
        minInvestment: 1000,
        expectedReturns: { min: 5.5, max: 7.5 },
        riskLevel: 'low',
        liquidity: 'low',
        taxBenefit: false,
        tenure: { min: 7, max: 120 }, // months
        description: 'Safe investment with guaranteed returns. Best for conservative investors.'
      },
      bonds: {
        name: 'Government Bonds',
        type: 'bonds',
        minInvestment: 10000,
        expectedReturns: { min: 7, max: 8.5 },
        riskLevel: 'low',
        liquidity: 'medium',
        taxBenefit: true,
        tenure: { min: 36, max: 180 },
        description: 'Government-backed securities with tax benefits. Good for long-term wealth preservation.'
      },
      mutual_funds: {
        name: 'Mutual Funds',
        type: 'mutual_funds',
        minInvestment: 500,
        expectedReturns: { min: 10, max: 15 },
        riskLevel: 'medium',
        liquidity: 'high',
        taxBenefit: true,
        tenure: { min: 12, max: 240 },
        description: 'Diversified investment managed by professionals. SIP option available.'
      },
      stocks: {
        name: 'Direct Stocks',
        type: 'stocks',
        minInvestment: 100,
        expectedReturns: { min: 12, max: 25 },
        riskLevel: 'high',
        liquidity: 'high',
        taxBenefit: false,
        tenure: { min: 1, max: 360 },
        description: 'Direct equity investment. Higher returns with higher risk.'
      },
      gold: {
        name: 'Digital Gold/SGBs',
        type: 'gold',
        minInvestment: 1,
        expectedReturns: { min: 8, max: 12 },
        riskLevel: 'medium',
        liquidity: 'medium',
        taxBenefit: true,
        tenure: { min: 60, max: 96 },
        description: 'Hedge against inflation. Sovereign Gold Bonds offer additional interest.'
      },
      ppf: {
        name: 'Public Provident Fund',
        type: 'ppf',
        minInvestment: 500,
        expectedReturns: { min: 7.1, max: 7.1 },
        riskLevel: 'low',
        liquidity: 'low',
        taxBenefit: true,
        tenure: { min: 180, max: 180 },
        description: 'Tax-free returns with government backing. 15-year lock-in period.'
      },
      nps: {
        name: 'National Pension System',
        type: 'nps',
        minInvestment: 500,
        expectedReturns: { min: 9, max: 12 },
        riskLevel: 'medium',
        liquidity: 'low',
        taxBenefit: true,
        tenure: { min: 240, max: 480 },
        description: 'Retirement-focused investment with additional tax benefits under 80CCD.'
      }
    };
  }

  async generateRecommendations(userProfile, goals, monthlyExpenses) {
    const recommendations = [];
    const riskTolerance = userProfile.risk_tolerance || 'medium';
    const monthlyIncome = parseFloat(userProfile.monthly_income) || 50000;
    const incomeType = userProfile.income_type || 'salaried';
    const investableAmount = (monthlyIncome - monthlyExpenses) * 0.7;

    if (investableAmount <= 0) {
      return [{
        type: 'warning',
        title: 'Build Savings First',
        description: 'Focus on reducing expenses before investing. Aim to save at least 20% of income.',
        action: 'Review your expense analysis for potential cuts.',
        method: 'rule'
      }];
    }

    // Emergency fund check
    const hasEmergencyGoal = goals.some(g => g.category === 'emergency' || g.name.toLowerCase().includes('emergency'));
    if (!hasEmergencyGoal) {
      recommendations.push({
        type: 'priority',
        investmentType: 'fd',
        name: 'Emergency Fund in FD',
        amount: monthlyIncome * 6,
        monthlyContribution: monthlyIncome * 0.15,
        description: 'Before other investments, build 6 months expenses as emergency fund in a liquid FD.',
        expectedReturns: '6-7%',
        riskLevel: 'low',
        priority: 1,
        method: 'rule'
      });
    }

    // Risk-based base recommendations
    if (riskTolerance === 'low') {
      recommendations.push(
        this.createRecommendation('fd', investableAmount * 0.4, 'Conservative Growth'),
        this.createRecommendation('ppf', 12500, 'Tax Saving'),
        this.createRecommendation('bonds', investableAmount * 0.3, 'Stable Income')
      );
    } else if (riskTolerance === 'medium') {
      recommendations.push(
        this.createRecommendation('mutual_funds', investableAmount * 0.4, 'Balanced Growth'),
        this.createRecommendation('gold', investableAmount * 0.1, 'Inflation Hedge'),
        this.createRecommendation('fd', investableAmount * 0.2, 'Stability'),
        this.createRecommendation('nps', investableAmount * 0.15, 'Retirement Planning')
      );
    } else {
      recommendations.push(
        this.createRecommendation('stocks', investableAmount * 0.3, 'High Growth'),
        this.createRecommendation('mutual_funds', investableAmount * 0.35, 'Diversified Growth'),
        this.createRecommendation('gold', investableAmount * 0.1, 'Portfolio Balance'),
        this.createRecommendation('nps', investableAmount * 0.1, 'Tax-Efficient Retirement')
      );
    }

    // Add goal-specific recommendations
    for (const goal of goals) {
      const targetDate = new Date(goal.target_date);
      const monthsRemaining = Math.max(1,
        (targetDate.getFullYear() - new Date().getFullYear()) * 12 +
        (targetDate.getMonth() - new Date().getMonth())
      );
      
      const goalRecommendation = this.getGoalBasedRecommendation(goal, monthsRemaining, riskTolerance);
      if (goalRecommendation) {
        recommendations.push(goalRecommendation);
      }
    }

    // Income type specific advice
    if (incomeType === 'freelancer' || incomeType === 'gig') {
      recommendations.push({
        type: 'advice',
        title: 'Variable Income Strategy',
        description: 'With irregular income, maintain higher liquid savings. Consider SIPs that allow pause/resume.',
        suggestions: [
          'Keep 3 months expenses in savings account',
          'Use SIP pause feature during low-income months',
          'Avoid long-term lock-in investments initially'
        ],
        method: 'rule'
      });
    }

    // Now enhance with AI explanations
    console.log('🤖 Enhancing investment recommendations with AI...');
    
    try {
      const financialSummary = {
        surplus: investableAmount,
        savingsRate: monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome * 100).toFixed(1) : 0
      };
      
      const aiEnhancements = await huggingface.generateInvestmentAdvice(
        userProfile,
        goals,
        financialSummary,
        recommendations
      );
      
      if (aiEnhancements && aiEnhancements.length > 0) {
        console.log(`✅ AI enhanced ${aiEnhancements.length} recommendations`);
        
        // Merge AI insights into recommendations
        for (const rec of recommendations) {
          const matching = aiEnhancements.find(ai => ai.type === rec.investmentType);
          if (matching) {
            rec.explanation = matching.explanation || rec.description;
            rec.whyThisWorks = matching.whyThisWorks;
            rec.tips = matching.tips;
            rec.warnings = matching.warnings;
            rec.method = 'ai';
          }
        }
      }
    } catch (error) {
      console.error('AI investment advice enhancement failed:', error.message);
    }

    return recommendations;
  }

  createRecommendation(type, amount, purpose) {
    const option = this.investmentOptions[type];
    return {
      type: 'recommendation',
      investmentType: type,
      name: `${option.name} for ${purpose}`,
      amount: Math.round(amount),
      monthlyContribution: Math.round(amount / 12),
      description: option.description,
      expectedReturns: `${option.expectedReturns.min}-${option.expectedReturns.max}%`,
      riskLevel: option.riskLevel,
      minInvestment: option.minInvestment,
      taxBenefit: option.taxBenefit,
      liquidity: option.liquidity
    };
  }

  getGoalBasedRecommendation(goal, monthsRemaining, riskTolerance) {
    const amount = goal.target_amount - goal.current_amount;
    
    if (monthsRemaining <= 12) {
      // Short-term goal - low risk
      return {
        type: 'goal_specific',
        goalName: goal.name,
        investmentType: 'fd',
        name: `Short-term FD for ${goal.name}`,
        amount: Math.round(amount),
        description: 'For short-term goals, FD provides safety and predictable returns.',
        expectedReturns: '6-7%',
        riskLevel: 'low'
      };
    } else if (monthsRemaining <= 36) {
      // Medium-term - balanced
      return {
        type: 'goal_specific',
        goalName: goal.name,
        investmentType: 'mutual_funds',
        name: `Debt Mutual Fund for ${goal.name}`,
        amount: Math.round(amount),
        description: 'Debt mutual funds offer better returns than FD for 1-3 year horizon.',
        expectedReturns: '7-9%',
        riskLevel: 'low-medium'
      };
    } else {
      // Long-term - can take more risk
      const type = riskTolerance === 'low' ? 'ppf' : 'mutual_funds';
      return {
        type: 'goal_specific',
        goalName: goal.name,
        investmentType: type,
        name: `Equity Fund for ${goal.name}`,
        amount: Math.round(amount),
        description: 'For 3+ year goals, equity offers best inflation-beating returns.',
        expectedReturns: '12-15%',
        riskLevel: 'medium-high'
      };
    }
  }

  async getInvestmentEducation(topic) {
    const educationalContent = {
      sip: {
        title: 'Systematic Investment Plan (SIP)',
        description: 'SIP allows you to invest a fixed amount regularly in mutual funds.',
        benefits: [
          'Rupee cost averaging reduces market timing risk',
          'Disciplined investing habit',
          'Start with as low as ₹500/month',
          'Power of compounding over time'
        ],
        example: 'Investing ₹5,000/month for 20 years at 12% returns = ₹50 lakhs'
      },
      compounding: {
        title: 'Power of Compounding',
        description: 'Earning returns on your returns over time.',
        benefits: [
          'Earlier you start, more wealth you build',
          'Even small amounts grow significantly',
          'Works best with long investment horizon'
        ],
        example: '₹1 lakh at 12% for 30 years becomes ₹30 lakhs'
      },
      diversification: {
        title: 'Portfolio Diversification',
        description: 'Spreading investments across different asset classes.',
        benefits: [
          'Reduces overall portfolio risk',
          'Different assets perform well at different times',
          'Smoother returns over time'
        ],
        example: 'Mix of stocks (50%), bonds (30%), gold (10%), FD (10%)'
      },
      tax_saving: {
        title: 'Tax-Saving Investments (80C)',
        description: 'Investments that reduce your taxable income.',
        options: [
          'PPF - ₹1.5L limit, 7.1% returns',
          'ELSS Mutual Funds - 3 year lock-in, 12-15% returns',
          'NPS - Additional ₹50K under 80CCD(1B)',
          'Life Insurance Premium'
        ],
        example: 'Investing ₹1.5L in ELSS can save ₹46,800 tax (30% bracket)'
      }
    };

    return educationalContent[topic] || educationalContent.sip;
  }

  async calculateProjectedReturns(amount, years, investmentType) {
    const option = this.investmentOptions[investmentType];
    if (!option) return null;

    const avgReturn = (option.expectedReturns.min + option.expectedReturns.max) / 2 / 100;
    
    // For SIP calculation
    const sipMonthlyAmount = amount;
    const months = years * 12;
    const monthlyRate = avgReturn / 12;
    
    const sipFutureValue = sipMonthlyAmount * 
      (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
    
    // For lumpsum
    const lumpsumFutureValue = amount * Math.pow(1 + avgReturn, years);
    
    return {
      investmentType,
      inputAmount: amount,
      years,
      expectedReturn: `${option.expectedReturns.min}-${option.expectedReturns.max}%`,
      sipProjection: {
        monthlyInvestment: sipMonthlyAmount,
        totalInvested: sipMonthlyAmount * months,
        futureValue: Math.round(sipFutureValue),
        returns: Math.round(sipFutureValue - (sipMonthlyAmount * months))
      },
      lumpsumProjection: {
        investment: amount,
        futureValue: Math.round(lumpsumFutureValue),
        returns: Math.round(lumpsumFutureValue - amount)
      }
    };
  }
}

module.exports = new InvestmentAdvisor();
