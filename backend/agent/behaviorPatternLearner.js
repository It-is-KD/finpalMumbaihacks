/**
 * Behavior Pattern Learner Agent
 * Detects and learns user spending patterns, income patterns, and behaviors
 */

class BehaviorPatternLearner {
  constructor() {
    this.patternTypes = {
      SPENDING_SPIKE: 'spending_spike',
      REGULAR_EXPENSE: 'regular_expense',
      INCOME_PATTERN: 'income_pattern',
      WEEKEND_SPENDING: 'weekend_spending',
      IMPULSE_BUYING: 'impulse_buying',
      PAYDAY_SPENDING: 'payday_spending',
      SEASONAL_TREND: 'seasonal_trend'
    };
  }

  async detectPatterns(transactions, user) {
    const patterns = [];

    if (!transactions || transactions.length === 0) {
      return patterns;
    }

    // Detect various patterns
    patterns.push(...this.detectSpendingSpikes(transactions));
    patterns.push(...this.detectRecurringExpenses(transactions));
    patterns.push(...this.detectWeekendSpending(transactions));
    patterns.push(...this.detectPaydayBehavior(transactions));
    patterns.push(...this.detectImpulseBuying(transactions));
    patterns.push(...this.detectCategoryTrends(transactions));

    // Add confidence scores
    for (const pattern of patterns) {
      pattern.detectedAt = new Date().toISOString();
      pattern.userId = user.id;
    }

    return patterns;
  }

  async predictIncome(user, incomeTransactions) {
    if (!incomeTransactions || incomeTransactions.length === 0) {
      return {
        predicted: false,
        message: 'Not enough income data to make predictions'
      };
    }

    const monthlyIncome = {};
    for (const tx of incomeTransactions) {
      const month = new Date(tx.transaction_date).toISOString().slice(0, 7);
      if (!monthlyIncome[month]) monthlyIncome[month] = 0;
      monthlyIncome[month] += parseFloat(tx.amount);
    }

    const incomeValues = Object.values(monthlyIncome);
    const average = incomeValues.reduce((a, b) => a + b, 0) / incomeValues.length;
    const variance = incomeValues.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / incomeValues.length;
    const stdDev = Math.sqrt(variance);
    const variabilityCoefficient = (stdDev / average) * 100;

    const isIrregular = user.income_type === 'irregular' || 
                        user.income_type === 'freelance' || 
                        user.income_type === 'gig' ||
                        variabilityCoefficient > 25;

    const prediction = {
      predicted: true,
      averageMonthlyIncome: average.toFixed(2),
      incomeVariability: variabilityCoefficient.toFixed(2),
      isIrregular,
      incomeType: user.income_type,
      monthlyHistory: monthlyIncome,
      predictions: this.predictNextMonths(incomeValues, isIrregular),
      recommendations: []
    };

    // Generate recommendations based on income pattern
    if (isIrregular) {
      prediction.recommendations.push({
        type: 'buffer',
        message: 'Keep a buffer of ₹' + (average * 2).toFixed(0) + ' for low-income months',
        priority: 'high'
      });

      // Identify low income periods
      const lowIncomeMonths = Object.entries(monthlyIncome)
        .filter(([, income]) => income < average * 0.7)
        .map(([month]) => month);

      if (lowIncomeMonths.length > 0) {
        prediction.recommendations.push({
          type: 'alert',
          message: `Historically, ${lowIncomeMonths.join(', ')} were low-income periods. Plan accordingly.`,
          priority: 'medium'
        });
      }
    }

    // High income month strategy
    const highIncomeMonths = Object.entries(monthlyIncome)
      .filter(([, income]) => income > average * 1.3);
    
    if (highIncomeMonths.length > 0) {
      prediction.recommendations.push({
        type: 'opportunity',
        message: 'During high-income months, save at least 40% to cover lean periods',
        priority: 'high'
      });
    }

    return prediction;
  }

  detectSpendingSpikes(transactions) {
    const patterns = [];
    const dailySpending = {};
    
    for (const tx of transactions.filter(t => t.type === 'debit')) {
      const date = new Date(tx.transaction_date).toISOString().slice(0, 10);
      if (!dailySpending[date]) dailySpending[date] = 0;
      dailySpending[date] += parseFloat(tx.amount);
    }

    const values = Object.values(dailySpending);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    
    for (const [date, amount] of Object.entries(dailySpending)) {
      if (amount > average * 2.5) {
        patterns.push({
          patternType: this.patternTypes.SPENDING_SPIKE,
          data: {
            date,
            amount,
            averageDaily: average.toFixed(2),
            percentageAboveAverage: (((amount - average) / average) * 100).toFixed(0)
          },
          confidenceScore: 0.9,
          insight: `Unusual spending spike on ${date}: ₹${amount.toFixed(0)} (${(amount / average).toFixed(1)}x average)`
        });
      }
    }

    return patterns.slice(0, 3);
  }

  detectRecurringExpenses(transactions) {
    const patterns = [];
    const merchantAmounts = {};
    
    for (const tx of transactions.filter(t => t.type === 'debit' && t.merchant_name)) {
      const key = `${tx.merchant_name}_${Math.round(parseFloat(tx.amount) / 10) * 10}`;
      if (!merchantAmounts[key]) {
        merchantAmounts[key] = {
          merchant: tx.merchant_name,
          amount: parseFloat(tx.amount),
          count: 0,
          dates: []
        };
      }
      merchantAmounts[key].count++;
      merchantAmounts[key].dates.push(new Date(tx.transaction_date));
    }

    for (const [, data] of Object.entries(merchantAmounts)) {
      if (data.count >= 2) {
        // Check if dates are roughly periodic
        const intervals = [];
        for (let i = 1; i < data.dates.length; i++) {
          intervals.push(Math.abs(data.dates[i] - data.dates[i-1]) / (24 * 60 * 60 * 1000));
        }
        
        if (intervals.length > 0) {
          const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
          
          if (avgInterval >= 25 && avgInterval <= 35) {
            patterns.push({
              patternType: this.patternTypes.REGULAR_EXPENSE,
              data: {
                merchant: data.merchant,
                amount: data.amount,
                frequency: 'monthly',
                occurrences: data.count
              },
              confidenceScore: Math.min(0.95, 0.6 + (data.count * 0.1)),
              insight: `Recurring monthly expense: ${data.merchant} - ₹${data.amount.toFixed(0)}`
            });
          }
        }
      }
    }

    return patterns;
  }

  detectWeekendSpending(transactions) {
    const patterns = [];
    let weekendTotal = 0;
    let weekdayTotal = 0;
    let weekendCount = 0;
    let weekdayCount = 0;

    for (const tx of transactions.filter(t => t.type === 'debit')) {
      const day = new Date(tx.transaction_date).getDay();
      if (day === 0 || day === 6) {
        weekendTotal += parseFloat(tx.amount);
        weekendCount++;
      } else {
        weekdayTotal += parseFloat(tx.amount);
        weekdayCount++;
      }
    }

    const weekendAvg = weekendCount > 0 ? weekendTotal / weekendCount : 0;
    const weekdayAvg = weekdayCount > 0 ? weekdayTotal / weekdayCount : 0;

    if (weekendAvg > weekdayAvg * 1.5) {
      patterns.push({
        patternType: this.patternTypes.WEEKEND_SPENDING,
        data: {
          weekendAverageTransaction: weekendAvg.toFixed(2),
          weekdayAverageTransaction: weekdayAvg.toFixed(2),
          weekendSpendingRatio: (weekendAvg / weekdayAvg).toFixed(2)
        },
        confidenceScore: 0.85,
        insight: `Weekend spending is ${(weekendAvg / weekdayAvg).toFixed(1)}x higher than weekdays`
      });
    }

    return patterns;
  }

  detectPaydayBehavior(transactions) {
    const patterns = [];
    
    // Find likely payday (days with large credit transactions)
    const creditsPerDay = {};
    for (const tx of transactions.filter(t => t.type === 'credit')) {
      const day = new Date(tx.transaction_date).getDate();
      if (!creditsPerDay[day]) creditsPerDay[day] = { total: 0, count: 0 };
      creditsPerDay[day].total += parseFloat(tx.amount);
      creditsPerDay[day].count++;
    }

    // Find most common payday
    let payday = 1;
    let maxCredits = 0;
    for (const [day, data] of Object.entries(creditsPerDay)) {
      if (data.total > maxCredits) {
        maxCredits = data.total;
        payday = parseInt(day);
      }
    }

    // Check spending in days after payday
    const expenses = transactions.filter(t => t.type === 'debit');
    let postPaydaySpending = 0;
    let postPaydayCount = 0;
    let otherDaysSpending = 0;
    let otherDaysCount = 0;

    for (const tx of expenses) {
      const day = new Date(tx.transaction_date).getDate();
      const daysAfterPayday = (day - payday + 31) % 31;
      
      if (daysAfterPayday <= 5) {
        postPaydaySpending += parseFloat(tx.amount);
        postPaydayCount++;
      } else {
        otherDaysSpending += parseFloat(tx.amount);
        otherDaysCount++;
      }
    }

    const postPaydayAvg = postPaydayCount > 0 ? postPaydaySpending / postPaydayCount : 0;
    const otherDaysAvg = otherDaysCount > 0 ? otherDaysSpending / otherDaysCount : 0;

    if (postPaydayAvg > otherDaysAvg * 1.4) {
      patterns.push({
        patternType: this.patternTypes.PAYDAY_SPENDING,
        data: {
          likelyPayday: payday,
          postPaydayAverage: postPaydayAvg.toFixed(2),
          regularDaysAverage: otherDaysAvg.toFixed(2),
          spendingIncrease: (((postPaydayAvg - otherDaysAvg) / otherDaysAvg) * 100).toFixed(0)
        },
        confidenceScore: 0.8,
        insight: `Spending increases by ${(((postPaydayAvg - otherDaysAvg) / otherDaysAvg) * 100).toFixed(0)}% in the week after payday`
      });
    }

    return patterns;
  }

  detectImpulseBuying(transactions) {
    const patterns = [];
    const expenses = transactions.filter(t => t.type === 'debit');
    
    // Group transactions by day
    const dailyTransactions = {};
    for (const tx of expenses) {
      const date = new Date(tx.transaction_date).toISOString().slice(0, 10);
      if (!dailyTransactions[date]) dailyTransactions[date] = [];
      dailyTransactions[date].push(tx);
    }

    // Look for days with many small transactions in shopping/entertainment
    let impulseDays = 0;
    let totalDays = Object.keys(dailyTransactions).length;

    for (const [, txs] of Object.entries(dailyTransactions)) {
      const shoppingTxs = txs.filter(t => 
        t.category === 'Shopping' || t.category === 'Entertainment'
      );
      if (shoppingTxs.length >= 3) {
        impulseDays++;
      }
    }

    if (impulseDays > totalDays * 0.2) {
      patterns.push({
        patternType: this.patternTypes.IMPULSE_BUYING,
        data: {
          impulseDays,
          totalDays,
          percentage: ((impulseDays / totalDays) * 100).toFixed(0)
        },
        confidenceScore: 0.75,
        insight: `Impulse buying detected on ${impulseDays} out of ${totalDays} days (${((impulseDays / totalDays) * 100).toFixed(0)}%)`
      });
    }

    return patterns;
  }

  detectCategoryTrends(transactions) {
    const patterns = [];
    const expenses = transactions.filter(t => t.type === 'debit');
    
    // Group by month and category
    const monthlyCategory = {};
    for (const tx of expenses) {
      const month = new Date(tx.transaction_date).toISOString().slice(0, 7);
      const cat = tx.category || 'Other';
      const key = `${month}_${cat}`;
      if (!monthlyCategory[key]) {
        monthlyCategory[key] = { month, category: cat, total: 0 };
      }
      monthlyCategory[key].total += parseFloat(tx.amount);
    }

    // Find trends (increasing or decreasing)
    const categories = [...new Set(expenses.map(t => t.category || 'Other'))];
    
    for (const cat of categories) {
      const catData = Object.values(monthlyCategory)
        .filter(d => d.category === cat)
        .sort((a, b) => a.month.localeCompare(b.month));

      if (catData.length >= 2) {
        const first = catData[0].total;
        const last = catData[catData.length - 1].total;
        const change = ((last - first) / first) * 100;

        if (Math.abs(change) > 30) {
          patterns.push({
            patternType: this.patternTypes.SEASONAL_TREND,
            data: {
              category: cat,
              change: change.toFixed(0),
              direction: change > 0 ? 'increasing' : 'decreasing',
              firstMonth: catData[0].month,
              lastMonth: catData[catData.length - 1].month
            },
            confidenceScore: 0.7,
            insight: `${cat} spending is ${change > 0 ? 'increasing' : 'decreasing'} by ${Math.abs(change).toFixed(0)}%`
          });
        }
      }
    }

    return patterns.slice(0, 3);
  }

  predictNextMonths(incomeValues, isIrregular) {
    if (incomeValues.length < 2) {
      return { available: false };
    }

    const average = incomeValues.reduce((a, b) => a + b, 0) / incomeValues.length;
    const predictions = [];
    
    for (let i = 1; i <= 3; i++) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() + i);
      
      predictions.push({
        month: monthDate.toISOString().slice(0, 7),
        monthName: monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        predictedIncome: average.toFixed(2),
        confidenceLevel: isIrregular ? 'low' : 'medium',
        range: isIrregular ? {
          low: (average * 0.6).toFixed(2),
          high: (average * 1.4).toFixed(2)
        } : {
          low: (average * 0.9).toFixed(2),
          high: (average * 1.1).toFixed(2)
        }
      });
    }

    return {
      available: true,
      predictions
    };
  }
}

module.exports = BehaviorPatternLearner;
