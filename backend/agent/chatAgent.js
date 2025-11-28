/**
 * Financial Chat Agent
 * Natural language interface for financial queries and coaching
 */

const { HfInference } = require('@huggingface/inference');
require('dotenv').config();

class FinancialChatAgent {
  constructor() {
    this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
    this.contextWindow = [];
    this.maxContextLength = 10;
  }

  async chat(message, context) {
    const { user, transactions, goals, budgets } = context;
    
    // Build context summary
    const contextSummary = this.buildContextSummary(user, transactions, goals, budgets);
    
    // Determine intent
    const intent = this.classifyIntent(message);
    
    // Generate response based on intent
    let response;
    
    switch (intent) {
      case 'spending_query':
        response = this.handleSpendingQuery(message, transactions);
        break;
      case 'goal_query':
        response = this.handleGoalQuery(message, goals);
        break;
      case 'budget_query':
        response = this.handleBudgetQuery(message, budgets, transactions);
        break;
      case 'advice_request':
        response = this.handleAdviceRequest(message, context);
        break;
      case 'investment_query':
        response = this.handleInvestmentQuery(message, user);
        break;
      case 'general':
      default:
        response = await this.generateAIResponse(message, contextSummary);
        break;
    }

    // Add to context window
    this.contextWindow.push({ role: 'user', content: message });
    this.contextWindow.push({ role: 'assistant', content: response });
    
    // Trim context window
    if (this.contextWindow.length > this.maxContextLength * 2) {
      this.contextWindow = this.contextWindow.slice(-this.maxContextLength * 2);
    }

    return response;
  }

  buildContextSummary(user, transactions, goals, budgets) {
    const expenses = transactions.filter(tx => tx.type === 'debit');
    const totalExpenses = expenses.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    const income = transactions.filter(tx => tx.type === 'credit')
                               .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    const categoryBreakdown = {};
    for (const tx of expenses) {
      const cat = tx.category || 'Other';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + parseFloat(tx.amount);
    }

    return {
      userName: user.name,
      monthlyIncome: user.monthly_income,
      incomeType: user.income_type,
      riskTolerance: user.risk_tolerance,
      totalRecentExpenses: totalExpenses,
      totalRecentIncome: income,
      categoryBreakdown,
      activeGoals: goals.filter(g => g.status === 'active').length,
      goals: goals.map(g => ({ name: g.name, target: g.target_amount, current: g.current_amount })),
      budgets: budgets.map(b => ({ category: b.category, limit: b.monthly_limit }))
    };
  }

  classifyIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('spend') || lowerMessage.includes('expense') || 
        lowerMessage.includes('spent') || lowerMessage.includes('cost')) {
      return 'spending_query';
    }
    
    if (lowerMessage.includes('goal') || lowerMessage.includes('save for') || 
        lowerMessage.includes('target') || lowerMessage.includes('saving')) {
      return 'goal_query';
    }
    
    if (lowerMessage.includes('budget') || lowerMessage.includes('limit')) {
      return 'budget_query';
    }
    
    if (lowerMessage.includes('invest') || lowerMessage.includes('stock') || 
        lowerMessage.includes('mutual fund') || lowerMessage.includes('fd') ||
        lowerMessage.includes('sip') || lowerMessage.includes('portfolio')) {
      return 'investment_query';
    }
    
    if (lowerMessage.includes('advice') || lowerMessage.includes('suggest') || 
        lowerMessage.includes('recommend') || lowerMessage.includes('should i') ||
        lowerMessage.includes('how can') || lowerMessage.includes('tips')) {
      return 'advice_request';
    }
    
    return 'general';
  }

  handleSpendingQuery(message, transactions) {
    const expenses = transactions.filter(tx => tx.type === 'debit');
    const lowerMessage = message.toLowerCase();
    
    // Check for category-specific query
    const categories = ['food', 'shopping', 'groceries', 'transport', 'subscription', 
                        'entertainment', 'healthcare', 'education', 'bills', 'emi'];
    
    let categoryMatch = null;
    for (const cat of categories) {
      if (lowerMessage.includes(cat)) {
        categoryMatch = cat;
        break;
      }
    }

    if (categoryMatch) {
      const categoryExpenses = expenses.filter(tx => 
        tx.category?.toLowerCase().includes(categoryMatch)
      );
      const total = categoryExpenses.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
      const count = categoryExpenses.length;
      
      return `You've spent ₹${total.toFixed(2)} on ${categoryMatch} across ${count} transactions recently. ` +
             `This accounts for ${((total / expenses.reduce((s, t) => s + parseFloat(t.amount), 0)) * 100).toFixed(1)}% of your total spending.`;
    }

    // General spending summary
    const total = expenses.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    const categoryBreakdown = {};
    for (const tx of expenses) {
      const cat = tx.category || 'Other';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + parseFloat(tx.amount);
    }
    
    const topCategories = Object.entries(categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return `Your total spending is ₹${total.toFixed(2)}. Top spending categories:\n` +
           topCategories.map(([cat, amt]) => 
             `• ${cat}: ₹${amt.toFixed(2)} (${((amt/total)*100).toFixed(0)}%)`
           ).join('\n');
  }

  handleGoalQuery(message, goals) {
    const activeGoals = goals.filter(g => g.status === 'active');
    
    if (activeGoals.length === 0) {
      return "You don't have any active goals yet! Would you like me to help you set one? " +
             "Popular goals include: Emergency Fund, Vacation, New Gadget, or Investment Portfolio.";
    }

    let response = `You have ${activeGoals.length} active goal(s):\n\n`;
    
    for (const goal of activeGoals) {
      const progress = (parseFloat(goal.current_amount) / parseFloat(goal.target_amount)) * 100;
      const remaining = parseFloat(goal.target_amount) - parseFloat(goal.current_amount);
      const daysLeft = Math.ceil((new Date(goal.target_date) - new Date()) / (24 * 60 * 60 * 1000));
      
      response += `🎯 **${goal.name}**\n`;
      response += `   Progress: ₹${parseFloat(goal.current_amount).toFixed(0)} / ₹${parseFloat(goal.target_amount).toFixed(0)} (${progress.toFixed(0)}%)\n`;
      response += `   Remaining: ₹${remaining.toFixed(0)} in ${daysLeft} days\n`;
      response += `   Monthly needed: ₹${parseFloat(goal.monthly_saving_needed || 0).toFixed(0)}\n\n`;
    }

    return response;
  }

  handleBudgetQuery(message, budgets, transactions) {
    if (budgets.length === 0) {
      return "You haven't set any budgets yet! Setting budgets helps you control spending. " +
             "I recommend starting with categories where you spend the most.";
    }

    const currentMonth = new Date().toISOString().slice(0, 7);
    const expenses = transactions.filter(tx => 
      tx.type === 'debit' && 
      new Date(tx.transaction_date).toISOString().slice(0, 7) === currentMonth
    );

    let response = "📊 **Budget Status:**\n\n";
    
    for (const budget of budgets) {
      const spent = expenses
        .filter(tx => tx.category === budget.category)
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
      const percentage = (spent / parseFloat(budget.monthly_limit)) * 100;
      const status = percentage >= 100 ? '🔴' : percentage >= 80 ? '🟡' : '🟢';
      
      response += `${status} **${budget.category}**: ₹${spent.toFixed(0)} / ₹${parseFloat(budget.monthly_limit).toFixed(0)} (${percentage.toFixed(0)}%)\n`;
    }

    return response;
  }

  handleInvestmentQuery(message, user) {
    const riskTolerance = user.risk_tolerance || 'medium';
    const monthlyIncome = parseFloat(user.monthly_income) || 0;
    const suggestedInvestment = monthlyIncome * 0.2;

    let response = `Based on your ${riskTolerance} risk tolerance and monthly income of ₹${monthlyIncome.toFixed(0)}:\n\n`;
    
    if (riskTolerance === 'low') {
      response += "**Recommended for you:**\n";
      response += "• Fixed Deposits (6-7% returns)\n";
      response += "• PPF (7-8% tax-free)\n";
      response += "• Debt Mutual Funds (6-9%)\n";
      response += "• Sovereign Gold Bonds\n\n";
    } else if (riskTolerance === 'medium') {
      response += "**Recommended for you:**\n";
      response += "• Index Funds (10-15% long-term)\n";
      response += "• Large Cap Funds\n";
      response += "• ELSS for tax saving\n";
      response += "• Mix of equity and debt\n\n";
    } else {
      response += "**Recommended for you:**\n";
      response += "• Small & Mid Cap Funds (12-25%)\n";
      response += "• Direct Equity\n";
      response += "• ELSS Funds\n";
      response += "• Thematic/Sectoral Funds\n\n";
    }

    response += `💡 Consider investing ₹${suggestedInvestment.toFixed(0)}/month (20% of income) as a starting point.`;

    return response;
  }

  handleAdviceRequest(message, context) {
    const { user, transactions, goals } = context;
    const expenses = transactions.filter(tx => tx.type === 'debit');
    const totalExpenses = expenses.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    const monthlyIncome = parseFloat(user.monthly_income) || 0;
    
    const tips = [];
    
    // Savings rate tip
    if (monthlyIncome > 0) {
      const savingsRate = ((monthlyIncome - totalExpenses) / monthlyIncome) * 100;
      if (savingsRate < 20) {
        tips.push(`Your savings rate is ${savingsRate.toFixed(0)}%. Try to save at least 20% of your income.`);
      }
    }

    // Category-specific tips
    const categoryBreakdown = {};
    for (const tx of expenses) {
      const cat = tx.category || 'Other';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + parseFloat(tx.amount);
    }

    if (categoryBreakdown['Food & Dining'] > monthlyIncome * 0.15) {
      tips.push("Consider reducing dining out expenses. Cooking at home can save 40-60%.");
    }

    if (categoryBreakdown['Subscriptions'] > 1000) {
      tips.push("Review your subscriptions. Cancel unused ones or share family plans.");
    }

    if (categoryBreakdown['Shopping'] > monthlyIncome * 0.15) {
      tips.push("Use the 24-hour rule before purchases to avoid impulse buying.");
    }

    // Goal tips
    if (goals.filter(g => g.status === 'active').length === 0) {
      tips.push("Set financial goals! Having clear targets increases savings by 30%.");
    }

    // Emergency fund tip
    tips.push("Ensure you have 6 months of expenses as an emergency fund before investing.");

    if (tips.length === 0) {
      tips.push("You're doing great! Keep maintaining your financial discipline.");
    }

    return "💡 **Financial Tips for You:**\n\n" + tips.map((tip, i) => `${i + 1}. ${tip}`).join('\n\n');
  }

  async generateAIResponse(message, contextSummary) {
    try {
      // Use Hugging Face for general queries
      const prompt = `You are FinPal, a friendly financial advisor AI. The user's context:
- Name: ${contextSummary.userName}
- Monthly Income: ₹${contextSummary.monthlyIncome}
- Income Type: ${contextSummary.incomeType}
- Recent Expenses: ₹${contextSummary.totalRecentExpenses?.toFixed(0) || 0}
- Active Goals: ${contextSummary.activeGoals}

User question: ${message}

Provide a helpful, concise response focused on practical financial advice. Keep it friendly and under 150 words.`;

      const response = await this.hf.textGeneration({
        model: 'microsoft/DialoGPT-medium',
        inputs: prompt,
        parameters: {
          max_new_tokens: 200,
          temperature: 0.7,
          top_p: 0.9
        }
      });

      return response.generated_text || this.getFallbackResponse(message);
    } catch (error) {
      console.error('AI generation error:', error);
      return this.getFallbackResponse(message);
    }
  }

  getFallbackResponse(message) {
    const responses = [
      "I'm here to help with your finances! You can ask me about your spending, goals, budgets, or investment options.",
      "Let me help you with that! Try asking about your spending patterns, savings goals, or how to reduce expenses.",
      "I can help you analyze your finances, track goals, and provide investment suggestions. What would you like to know?",
      "As your financial coach, I can help with budgeting, saving tips, and investment advice. How can I assist you today?"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

module.exports = FinancialChatAgent;
