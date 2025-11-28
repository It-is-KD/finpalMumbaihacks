const huggingface = require('./huggingface');

class BehaviorPatternLearner {
  constructor() {
    this.patternTypes = [
      'spending_timing',
      'category_preference',
      'income_cycle',
      'saving_behavior',
      'impulse_tendency',
      'payment_method',
      'merchant_loyalty'
    ];
  }

  async learnPatterns(userId, transactions, userProfile = {}) {
    const patterns = [];

    // Spending timing patterns
    const timingPattern = this.analyzeSpendingTiming(transactions);
    if (timingPattern.confidence > 0.6) {
      patterns.push({
        userId,
        patternType: 'spending_timing',
        patternData: timingPattern,
        confidenceScore: timingPattern.confidence
      });
    }

    // Category preferences
    const categoryPattern = this.analyzeCategoryPreferences(transactions);
    patterns.push({
      userId,
      patternType: 'category_preference',
      patternData: categoryPattern,
      confidenceScore: 0.9
    });

    // Impulse spending tendency
    const impulsePattern = this.analyzeImpulseTendency(transactions);
    patterns.push({
      userId,
      patternType: 'impulse_tendency',
      patternData: impulsePattern,
      confidenceScore: impulsePattern.confidence
    });

    // Merchant loyalty
    const loyaltyPattern = this.analyzeMerchantLoyalty(transactions);
    patterns.push({
      userId,
      patternType: 'merchant_loyalty',
      patternData: loyaltyPattern,
      confidenceScore: 0.85
    });

    // Income cycle
    const incomePattern = this.analyzeIncomeCycle(transactions);
    if (incomePattern.detected) {
      patterns.push({
        userId,
        patternType: 'income_cycle',
        patternData: incomePattern,
        confidenceScore: incomePattern.confidence
      });
    }

    // Saving behavior
    const savingPattern = this.analyzeSavingBehavior(transactions);
    patterns.push({
      userId,
      patternType: 'saving_behavior',
      patternData: savingPattern,
      confidenceScore: savingPattern.confidence
    });

    // Enhance patterns with AI behavioral insights
    console.log('🤖 Enhancing patterns with AI behavioral analysis...');
    
    try {
      const aiInsights = await huggingface.generateBehavioralInsights(patterns, userProfile);
      
      if (aiInsights) {
        console.log('✅ AI behavioral analysis completed');
        
        // Merge AI insights into patterns
        if (aiInsights.insights && aiInsights.insights.length > 0) {
          for (const pattern of patterns) {
            const matching = aiInsights.insights.find(i => i.patternType === pattern.patternType);
            if (matching) {
              pattern.patternData.aiBehavioralInsight = matching.behavioralInsight;
              pattern.patternData.aiRecommendation = matching.recommendation;
              pattern.patternData.aiActionStep = matching.actionStep;
              pattern.patternData.method = 'ai';
            }
          }
        }
        
        // Add overall personality
        if (aiInsights.overallPersonality) {
          patterns.push({
            userId,
            patternType: 'financial_personality',
            patternData: {
              personality: aiInsights.overallPersonality,
              summary: aiInsights.summary,
              method: 'ai'
            },
            confidenceScore: 0.8
          });
        }
      }
    } catch (error) {
      console.error('AI behavioral analysis failed:', error.message);
    }

    return patterns;
  }

  analyzeSpendingTiming(transactions) {
    const hourlySpending = Array(24).fill(0);
    const dailySpending = Array(7).fill(0);
    let totalTransactions = 0;

    for (const t of transactions) {
      if (t.type === 'debit') {
        const date = new Date(t.transaction_date);
        hourlySpending[date.getHours()] += parseFloat(t.amount);
        dailySpending[date.getDay()] += parseFloat(t.amount);
        totalTransactions++;
      }
    }

    // Find peak hours
    const peakHour = hourlySpending.indexOf(Math.max(...hourlySpending));
    const peakDay = dailySpending.indexOf(Math.max(...dailySpending));
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Detect patterns
    const isWeekendSpender = (dailySpending[0] + dailySpending[6]) > 
      (dailySpending.slice(1, 6).reduce((a, b) => a + b, 0) / 5 * 2);
    
    const isNightSpender = hourlySpending.slice(20, 24).reduce((a, b) => a + b, 0) > 
      hourlySpending.reduce((a, b) => a + b, 0) * 0.25;

    return {
      peakHour,
      peakDay: dayNames[peakDay],
      isWeekendSpender,
      isNightSpender,
      hourlyDistribution: hourlySpending,
      dailyDistribution: dailySpending.map((amount, i) => ({ day: dayNames[i], amount })),
      confidence: totalTransactions > 30 ? 0.85 : 0.5,
      insight: isWeekendSpender 
        ? 'You tend to spend more on weekends. Consider budget-friendly weekend activities.'
        : 'Your spending is consistent throughout the week.'
    };
  }

  analyzeCategoryPreferences(transactions) {
    const categoryTotals = {};
    const categoryCounts = {};
    
    for (const t of transactions) {
      if (t.type === 'debit' && t.category) {
        if (!categoryTotals[t.category]) {
          categoryTotals[t.category] = 0;
          categoryCounts[t.category] = 0;
        }
        categoryTotals[t.category] += parseFloat(t.amount);
        categoryCounts[t.category]++;
      }
    }

    const totalSpent = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
    
    const preferences = Object.entries(categoryTotals)
      .map(([category, total]) => ({
        category,
        totalSpent: total,
        transactionCount: categoryCounts[category],
        percentage: ((total / totalSpent) * 100).toFixed(1),
        avgTransaction: total / categoryCounts[category]
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent);

    return {
      topCategories: preferences.slice(0, 5),
      bottomCategories: preferences.slice(-3),
      totalSpent,
      insight: `Your top spending category is ${preferences[0]?.category || 'Unknown'} at ${preferences[0]?.percentage || 0}% of expenses.`
    };
  }

  analyzeImpulseTendency(transactions) {
    const impulseIndicators = {
      lateNightPurchases: 0,
      multipleSmallPurchases: 0,
      sameDayMultiplePurchases: 0,
      highVarianceSpending: false
    };

    const dailyTransactions = {};
    const amounts = [];

    for (const t of transactions) {
      if (t.type === 'debit') {
        const date = new Date(t.transaction_date);
        const dateKey = date.toDateString();
        const hour = date.getHours();
        
        // Late night (10 PM - 4 AM)
        if (hour >= 22 || hour <= 4) {
          impulseIndicators.lateNightPurchases++;
        }

        // Track daily transactions
        if (!dailyTransactions[dateKey]) dailyTransactions[dateKey] = [];
        dailyTransactions[dateKey].push(parseFloat(t.amount));
        amounts.push(parseFloat(t.amount));
      }
    }

    // Multiple small purchases in a day
    for (const dayTxns of Object.values(dailyTransactions)) {
      if (dayTxns.length >= 5) {
        impulseIndicators.sameDayMultiplePurchases++;
      }
      const smallPurchases = dayTxns.filter(a => a < 200).length;
      if (smallPurchases >= 3) {
        impulseIndicators.multipleSmallPurchases++;
      }
    }

    // Calculate spending variance
    if (amounts.length > 0) {
      const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const variance = amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / amounts.length;
      impulseIndicators.highVarianceSpending = variance > mean * mean;
    }

    // Calculate impulse score (0-100)
    const impulseScore = Math.min(100, 
      (impulseIndicators.lateNightPurchases * 5) +
      (impulseIndicators.multipleSmallPurchases * 3) +
      (impulseIndicators.sameDayMultiplePurchases * 4) +
      (impulseIndicators.highVarianceSpending ? 20 : 0)
    );

    let tendency = 'low';
    if (impulseScore > 60) tendency = 'high';
    else if (impulseScore > 30) tendency = 'moderate';

    return {
      impulseScore,
      tendency,
      indicators: impulseIndicators,
      confidence: transactions.length > 50 ? 0.8 : 0.5,
      insight: tendency === 'high' 
        ? 'You show signs of impulsive spending. Consider the 24-hour rule for purchases over ₹1000.'
        : 'Your spending appears thoughtful and planned. Keep it up!'
    };
  }

  analyzeMerchantLoyalty(transactions) {
    const merchantCounts = {};
    const merchantTotals = {};

    for (const t of transactions) {
      if (t.type === 'debit' && t.merchant_name) {
        if (!merchantCounts[t.merchant_name]) {
          merchantCounts[t.merchant_name] = 0;
          merchantTotals[t.merchant_name] = 0;
        }
        merchantCounts[t.merchant_name]++;
        merchantTotals[t.merchant_name] += parseFloat(t.amount);
      }
    }

    const loyalMerchants = Object.entries(merchantCounts)
      .filter(([_, count]) => count >= 3)
      .map(([merchant, count]) => ({
        merchant,
        visits: count,
        totalSpent: merchantTotals[merchant],
        avgSpend: merchantTotals[merchant] / count
      }))
      .sort((a, b) => b.visits - a.visits);

    return {
      topMerchants: loyalMerchants.slice(0, 5),
      totalLoyalMerchants: loyalMerchants.length,
      insight: loyalMerchants.length > 0 
        ? `You frequently shop at ${loyalMerchants[0].merchant}. Consider if they offer loyalty rewards.`
        : 'You have diverse shopping habits across many merchants.'
    };
  }

  analyzeIncomeCycle(transactions) {
    const incomeTransactions = transactions.filter(t => t.type === 'credit');
    
    if (incomeTransactions.length < 3) {
      return { detected: false, confidence: 0 };
    }

    const dayOfMonth = {};
    const amounts = [];

    for (const t of incomeTransactions) {
      const date = new Date(t.transaction_date);
      const day = date.getDate();
      if (!dayOfMonth[day]) dayOfMonth[day] = [];
      dayOfMonth[day].push(parseFloat(t.amount));
      amounts.push(parseFloat(t.amount));
    }

    // Find consistent salary day
    const sortedDays = Object.entries(dayOfMonth)
      .sort((a, b) => b[1].length - a[1].length);
    
    const topDay = sortedDays[0];
    const isRegular = topDay && topDay[1].length >= 2;
    
    // Check if amounts are consistent (salary)
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const isConsistentAmount = amounts.every(a => Math.abs(a - avgAmount) < avgAmount * 0.2);

    return {
      detected: isRegular,
      salaryDay: isRegular ? parseInt(topDay[0]) : null,
      isConsistentAmount,
      averageIncome: Math.round(avgAmount),
      confidence: isRegular && isConsistentAmount ? 0.9 : 0.6,
      incomeType: isConsistentAmount ? 'regular' : 'variable',
      insight: isRegular 
        ? `Your income typically arrives around the ${topDay[0]}th of each month.`
        : 'Your income pattern is variable. Consider maintaining a larger emergency buffer.'
    };
  }

  analyzeSavingBehavior(transactions) {
    const monthlyData = {};
    
    for (const t of transactions) {
      const monthKey = new Date(t.transaction_date).toISOString().slice(0, 7);
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0 };
      }
      if (t.type === 'credit') {
        monthlyData[monthKey].income += parseFloat(t.amount);
      } else {
        monthlyData[monthKey].expense += parseFloat(t.amount);
      }
    }

    const monthlySavings = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        savings: data.income - data.expense,
        savingsRate: data.income > 0 ? ((data.income - data.expense) / data.income * 100) : 0
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const avgSavingsRate = monthlySavings.reduce((sum, m) => sum + m.savingsRate, 0) / 
      Math.max(1, monthlySavings.length);
    
    const savingsConsistency = monthlySavings.filter(m => m.savingsRate > 10).length / 
      Math.max(1, monthlySavings.length);

    let behavior = 'inconsistent';
    if (avgSavingsRate >= 25 && savingsConsistency > 0.7) behavior = 'excellent';
    else if (avgSavingsRate >= 15 && savingsConsistency > 0.5) behavior = 'good';
    else if (avgSavingsRate >= 5) behavior = 'developing';

    return {
      averageSavingsRate: avgSavingsRate.toFixed(1),
      savingsConsistency: (savingsConsistency * 100).toFixed(1),
      behavior,
      monthlyTrend: monthlySavings.slice(-6),
      confidence: monthlySavings.length >= 3 ? 0.85 : 0.5,
      insight: behavior === 'excellent' 
        ? 'Excellent saving habits! Consider investing surplus for growth.'
        : `Your savings rate is ${avgSavingsRate.toFixed(1)}%. Aim for 20% or higher.`
    };
  }

  async getPersonalizedRecommendations(patterns, userProfile = {}) {
    const recommendations = [];

    // First, collect rule-based recommendations
    for (const pattern of patterns) {
      switch (pattern.patternType) {
        case 'spending_timing':
          if (pattern.patternData.isNightSpender) {
            recommendations.push({
              type: 'behavioral',
              title: 'Avoid Late Night Shopping',
              description: 'You tend to spend more late at night, which often leads to impulse purchases.',
              action: 'Remove saved payment methods from shopping apps to add friction.',
              method: 'rule'
            });
          }
          break;
          
        case 'impulse_tendency':
          if (pattern.patternData.tendency === 'high') {
            recommendations.push({
              type: 'behavioral',
              title: 'Control Impulse Spending',
              description: `Your impulse score is ${pattern.patternData.impulseScore}/100.`,
              action: 'Use the 24-hour rule: Wait before making purchases over ₹1000.',
              method: 'rule'
            });
          }
          break;
          
        case 'saving_behavior':
          if (pattern.patternData.behavior !== 'excellent') {
            recommendations.push({
              type: 'savings',
              title: 'Improve Savings Rate',
              description: `Current rate: ${pattern.patternData.averageSavingsRate}%. Target: 20%+`,
              action: 'Set up automatic transfers to savings account on salary day.',
              method: 'rule'
            });
          }
          break;
      }
      
      // Add AI-generated recommendations if available
      if (pattern.patternData.aiRecommendation) {
        recommendations.push({
          type: 'ai_behavioral',
          patternType: pattern.patternType,
          title: `AI Insight: ${pattern.patternType.replace('_', ' ')}`,
          description: pattern.patternData.aiBehavioralInsight,
          action: pattern.patternData.aiActionStep,
          aiRecommendation: pattern.patternData.aiRecommendation,
          method: 'ai'
        });
      }
    }

    // Get overall AI behavioral coaching if not already included
    const hasAiRecommendations = recommendations.some(r => r.method === 'ai');
    
    if (!hasAiRecommendations && patterns.length > 0) {
      console.log('🤖 Generating AI behavioral coaching...');
      
      try {
        const aiCoaching = await huggingface.generateBehavioralInsights(patterns, userProfile);
        
        if (aiCoaching && aiCoaching.insights) {
          for (const insight of aiCoaching.insights.slice(0, 3)) {
            recommendations.push({
              type: 'ai_coaching',
              title: `${insight.patternType}: AI Insight`,
              description: insight.behavioralInsight,
              recommendation: insight.recommendation,
              action: insight.actionStep,
              method: 'ai'
            });
          }
        }
      } catch (error) {
        console.error('AI behavioral coaching failed:', error.message);
      }
    }

    return recommendations;
  }
}

module.exports = new BehaviorPatternLearner();
