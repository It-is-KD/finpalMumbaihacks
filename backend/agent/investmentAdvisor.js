/**
 * Investment Advisor Agent
 * Provides personalized investment recommendations based on user profile and goals
 */

class InvestmentAdvisor {
  constructor() {
    this.investmentOptions = {
      fd: {
        name: 'Fixed Deposit',
        type: 'fd',
        riskLevel: 'low',
        expectedReturn: { min: 5.5, max: 7.5 },
        minInvestment: 1000,
        lockIn: '1-5 years',
        liquidity: 'low',
        taxBenefit: false,
        description: 'Safe investment with guaranteed returns. Ideal for short-term goals.'
      },
      recurring_deposit: {
        name: 'Recurring Deposit',
        type: 'fd',
        riskLevel: 'low',
        expectedReturn: { min: 5.0, max: 7.0 },
        minInvestment: 500,
        lockIn: '6 months - 10 years',
        liquidity: 'low',
        taxBenefit: false,
        description: 'Build savings with small monthly deposits. Good for systematic savers.'
      },
      ppf: {
        name: 'Public Provident Fund',
        type: 'bonds',
        riskLevel: 'low',
        expectedReturn: { min: 7.0, max: 8.0 },
        minInvestment: 500,
        lockIn: '15 years',
        liquidity: 'very low',
        taxBenefit: true,
        description: 'Government-backed, tax-free returns. Best for long-term wealth building.'
      },
      nps: {
        name: 'National Pension System',
        type: 'bonds',
        riskLevel: 'medium',
        expectedReturn: { min: 8.0, max: 12.0 },
        minInvestment: 500,
        lockIn: 'Until 60',
        liquidity: 'very low',
        taxBenefit: true,
        description: 'Retirement-focused with tax benefits under 80CCD. Mix of equity and debt.'
      },
      elss: {
        name: 'Equity Linked Savings Scheme',
        type: 'mutual_funds',
        riskLevel: 'high',
        expectedReturn: { min: 10.0, max: 18.0 },
        minInvestment: 500,
        lockIn: '3 years',
        liquidity: 'medium',
        taxBenefit: true,
        description: 'Tax-saving mutual fund with equity exposure. Good for aggressive savers.'
      },
      index_funds: {
        name: 'Index Funds',
        type: 'mutual_funds',
        riskLevel: 'medium',
        expectedReturn: { min: 10.0, max: 15.0 },
        minInvestment: 100,
        lockIn: 'None',
        liquidity: 'high',
        taxBenefit: false,
        description: 'Low-cost funds tracking market indices. Ideal for passive investors.'
      },
      debt_funds: {
        name: 'Debt Mutual Funds',
        type: 'mutual_funds',
        riskLevel: 'low',
        expectedReturn: { min: 6.0, max: 9.0 },
        minInvestment: 500,
        lockIn: 'None',
        liquidity: 'high',
        taxBenefit: false,
        description: 'Lower risk than equity funds. Good for medium-term goals.'
      },
      large_cap: {
        name: 'Large Cap Stocks/Funds',
        type: 'stocks',
        riskLevel: 'medium',
        expectedReturn: { min: 10.0, max: 15.0 },
        minInvestment: 1000,
        lockIn: 'None',
        liquidity: 'high',
        taxBenefit: false,
        description: 'Blue-chip companies with stable growth. Lower volatility than small caps.'
      },
      small_mid_cap: {
        name: 'Small & Mid Cap Funds',
        type: 'stocks',
        riskLevel: 'high',
        expectedReturn: { min: 12.0, max: 25.0 },
        minInvestment: 500,
        lockIn: 'None',
        liquidity: 'high',
        taxBenefit: false,
        description: 'Higher growth potential with higher risk. For long-term aggressive investors.'
      },
      gold: {
        name: 'Digital Gold / Gold ETF',
        type: 'gold',
        riskLevel: 'medium',
        expectedReturn: { min: 5.0, max: 12.0 },
        minInvestment: 100,
        lockIn: 'None',
        liquidity: 'high',
        taxBenefit: false,
        description: 'Hedge against inflation. Good for portfolio diversification.'
      },
      sgb: {
        name: 'Sovereign Gold Bonds',
        type: 'gold',
        riskLevel: 'low',
        expectedReturn: { min: 6.0, max: 12.0 },
        minInvestment: 4000,
        lockIn: '8 years (5 year exit)',
        liquidity: 'low',
        taxBenefit: true,
        description: 'Government gold bonds with 2.5% annual interest. Tax-free on maturity.'
      }
    };
  }

  async recommend(user, transactions, goals) {
    const recommendations = [];
    const monthlyIncome = parseFloat(user.monthly_income) || 0;
    const riskTolerance = user.risk_tolerance || 'medium';
    const incomeType = user.income_type || 'regular';

    // Calculate investable surplus
    const monthlyExpenses = this.calculateMonthlyExpenses(transactions);
    const investableSurplus = Math.max(0, monthlyIncome - monthlyExpenses);
    const goalSavings = this.calculateGoalSavings(goals);

    // Determine investment allocation based on risk tolerance
    const allocation = this.getAllocation(riskTolerance, incomeType);

    // Generate recommendations
    const totalInvestable = investableSurplus - goalSavings;
    
    if (totalInvestable <= 0) {
      return {
        summary: 'Focus on building savings before investing',
        investableSurplus: 0,
        recommendations: [{
          type: 'advice',
          title: 'Build Savings First',
          message: 'Your current income doesn\'t leave much room for investments. Focus on reducing expenses and meeting your savings goals first.',
          priority: 'high'
        }]
      };
    }

    // Emergency fund first
    if (!this.hasEmergencyFund(transactions, monthlyExpenses)) {
      recommendations.push({
        ...this.investmentOptions.recurring_deposit,
        recommendedAmount: Math.min(totalInvestable * 0.5, monthlyExpenses * 0.5),
        reason: 'Build an emergency fund of 6 months expenses before other investments',
        priority: 1
      });
    }

    // Tax-saving investments (80C)
    const taxSavingAmount = Math.min(totalInvestable * allocation.taxSaving, 12500); // 1.5L yearly / 12
    if (taxSavingAmount >= 500) {
      if (riskTolerance === 'high') {
        recommendations.push({
          ...this.investmentOptions.elss,
          recommendedAmount: taxSavingAmount,
          reason: 'Maximize tax savings under 80C while getting equity exposure',
          priority: 2
        });
      } else {
        recommendations.push({
          ...this.investmentOptions.ppf,
          recommendedAmount: taxSavingAmount,
          reason: 'Safe, tax-free returns with government backing',
          priority: 2
        });
      }
    }

    // Retirement (NPS)
    if (monthlyIncome > 30000 && incomeType === 'regular') {
      recommendations.push({
        ...this.investmentOptions.nps,
        recommendedAmount: Math.min(totalInvestable * 0.1, 4166), // 50K yearly / 12
        reason: 'Additional tax benefit under 80CCD(1B) and retirement planning',
        priority: 3
      });
    }

    // Core investment based on risk tolerance
    const coreAmount = totalInvestable * allocation.core;
    
    if (riskTolerance === 'low') {
      recommendations.push({
        ...this.investmentOptions.debt_funds,
        recommendedAmount: coreAmount * 0.6,
        reason: 'Low-risk, better returns than FD with liquidity',
        priority: 4
      });
      recommendations.push({
        ...this.investmentOptions.sgb,
        recommendedAmount: coreAmount * 0.4,
        reason: 'Gold as portfolio hedge with government backing',
        priority: 5
      });
    } else if (riskTolerance === 'medium') {
      recommendations.push({
        ...this.investmentOptions.index_funds,
        recommendedAmount: coreAmount * 0.5,
        reason: 'Passive investing with market-linked returns',
        priority: 4
      });
      recommendations.push({
        ...this.investmentOptions.large_cap,
        recommendedAmount: coreAmount * 0.3,
        reason: 'Stable equity exposure through blue-chip companies',
        priority: 5
      });
      recommendations.push({
        ...this.investmentOptions.gold,
        recommendedAmount: coreAmount * 0.2,
        reason: 'Portfolio diversification and inflation hedge',
        priority: 6
      });
    } else {
      recommendations.push({
        ...this.investmentOptions.index_funds,
        recommendedAmount: coreAmount * 0.4,
        reason: 'Low-cost equity exposure as base',
        priority: 4
      });
      recommendations.push({
        ...this.investmentOptions.small_mid_cap,
        recommendedAmount: coreAmount * 0.4,
        reason: 'Higher growth potential for long-term wealth',
        priority: 5
      });
      recommendations.push({
        ...this.investmentOptions.gold,
        recommendedAmount: coreAmount * 0.2,
        reason: 'Portfolio diversification',
        priority: 6
      });
    }

    // Special recommendations for irregular income
    if (incomeType === 'irregular' || incomeType === 'freelance' || incomeType === 'gig') {
      recommendations.push({
        type: 'advice',
        title: 'Irregular Income Strategy',
        message: 'During high-income months, invest more. Keep 3 months expenses in liquid funds.',
        priority: 0
      });
    }

    return {
      summary: this.generateSummary(riskTolerance, totalInvestable),
      investableSurplus: totalInvestable,
      allocation,
      recommendations: recommendations.sort((a, b) => a.priority - b.priority)
    };
  }

  calculateMonthlyExpenses(transactions) {
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

  calculateGoalSavings(goals) {
    return goals
      .filter(g => g.status === 'active')
      .reduce((sum, g) => sum + parseFloat(g.monthly_saving_needed || 0), 0);
  }

  hasEmergencyFund(transactions, monthlyExpenses) {
    // Simplified check - in reality would check account balances
    return monthlyExpenses * 6 < 100000; // Assume they have emergency fund if expenses are low
  }

  getAllocation(riskTolerance, incomeType) {
    const baseAllocation = {
      low: { taxSaving: 0.3, core: 0.6, liquid: 0.1 },
      medium: { taxSaving: 0.25, core: 0.65, liquid: 0.1 },
      high: { taxSaving: 0.2, core: 0.75, liquid: 0.05 }
    };

    const allocation = baseAllocation[riskTolerance] || baseAllocation.medium;

    // Increase liquid allocation for irregular income
    if (incomeType === 'irregular' || incomeType === 'freelance' || incomeType === 'gig') {
      allocation.liquid = 0.2;
      allocation.core -= 0.1;
    }

    return allocation;
  }

  generateSummary(riskTolerance, investable) {
    if (investable < 1000) {
      return 'Start with small investments and build the habit. Even ₹100/month compounds over time.';
    }
    
    const summaries = {
      low: 'A conservative portfolio focused on capital preservation with steady returns.',
      medium: 'A balanced portfolio with mix of equity and debt for growth with stability.',
      high: 'An aggressive portfolio focused on wealth creation through equity investments.'
    };

    return summaries[riskTolerance] || summaries.medium;
  }
}

module.exports = InvestmentAdvisor;
