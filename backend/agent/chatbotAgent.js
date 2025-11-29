<<<<<<< HEAD
const huggingface = require('./huggingface');
const transactionCategorizer = require('./transactionCategorizer');
const expenseAnalyzer = require('./expenseAnalyzer');
const investmentAdvisor = require('./investmentAdvisor');
const savingsCoach = require('./savingsCoach');

class ChatbotAgent {
  constructor() {
    this.contextWindow = [];
    this.maxContext = 10;
  }

  async processMessage(userId, message, context = {}) {
    // Add to context window
    this.contextWindow.push({ role: 'user', content: message });
    if (this.contextWindow.length > this.maxContext) {
      this.contextWindow.shift();
    }

    // Detect intent
    const intent = await this.detectIntent(message);
    
    // Generate response based on intent
    let response;
    switch (intent.category) {
      case 'balance_inquiry':
        response = await this.handleBalanceInquiry(context);
        break;
      case 'spending_analysis':
        response = await this.handleSpendingAnalysis(context);
        break;
      case 'category_breakdown':
        response = await this.handleCategoryBreakdown(context);
        break;
      case 'goal_progress':
        response = await this.handleGoalProgress(context);
        break;
      case 'investment_advice':
        response = await this.handleInvestmentAdvice(context);
        break;
      case 'savings_tips':
        response = await this.handleSavingsTips(context);
        break;
      case 'budget_help':
        response = await this.handleBudgetHelp(context);
        break;
      case 'transaction_search':
        response = await this.handleTransactionSearch(message, context);
        break;
      case 'general_question':
        response = await this.handleGeneralQuestion(message, context);
        break;
      default:
        response = await this.handleGeneralQuestion(message, context);
    }

    // Add response to context
    this.contextWindow.push({ role: 'assistant', content: response.message });

    return response;
  }

  async detectIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    // Intent patterns with weights (more specific patterns = higher weight)
    const intents = {
      balance_inquiry: {
        keywords: ['balance', 'how much do i have', 'bank account', 'total money', 'account balance', 'my money', 'funds'],
        weight: 0.85
      },
      spending_analysis: {
        keywords: ['spending', 'spent', 'expenses', 'where did my money go', 'expense analysis', 'analyze spending', 'spending habits', 'expenditure'],
        weight: 0.85
      },
      category_breakdown: {
        keywords: ['category', 'breakdown', 'what did i spend on', 'spending categories', 'by category', 'category wise'],
        weight: 0.8
      },
      goal_progress: {
        keywords: ['goal', 'target', 'saving for', 'progress', 'how close am i', 'my goals', 'goal status'],
        weight: 0.85
      },
      investment_advice: {
        keywords: ['invest', 'investment', 'mutual fund', 'stocks', 'fd', 'fixed deposit', 'returns', 'where should i invest', 'sip', 'portfolio'],
        weight: 0.85
      },
      savings_tips: {
        keywords: ['save more', 'saving tips', 'cut expenses', 'reduce spending', 'tips to save', 'how to save', 'save money'],
        weight: 0.8
      },
      budget_help: {
        keywords: ['budget', 'limit', 'set budget', 'monthly budget', 'spending limit', 'create budget', 'budget plan'],
        weight: 0.8
      },
      transaction_search: {
        keywords: ['find transaction', 'search transaction', 'when did i', 'last purchase', 'transaction from', 'show transactions'],
        weight: 0.75
      }
    };

    let bestMatch = { category: 'general_question', confidence: 0.4 };
    let matchCount = 0;

    for (const [intent, config] of Object.entries(intents)) {
      for (const keyword of config.keywords) {
        if (lowerMessage.includes(keyword)) {
          matchCount++;
          // Prefer longer/more specific keyword matches
          const specificityBonus = keyword.split(' ').length > 1 ? 0.1 : 0;
          const confidence = Math.min(config.weight + specificityBonus, 0.95);
          
          if (confidence > bestMatch.confidence) {
            bestMatch = { category: intent, confidence };
          }
        }
      }
    }

    // If multiple intents matched, slightly lower confidence
    if (matchCount > 2) {
      bestMatch.confidence = Math.max(bestMatch.confidence - 0.1, 0.5);
    }

    // Log intent detection for debugging
    console.log(`🎯 Intent detected: ${bestMatch.category} (${(bestMatch.confidence * 100).toFixed(0)}% confidence)`);

    return bestMatch;
  }

  async handleBalanceInquiry(context) {
    const { bankAccounts = [], transactions = [], userProfile = {} } = context;
    
    if (bankAccounts.length === 0) {
      return {
        message: "I don't see any linked bank accounts yet. You can add your accounts in the Bank Accounts section to track your total balance across all accounts! 🏦",
        type: 'info',
        actions: ['link_bank'],
        method: 'rule'
      };
    }

    const totalBalance = bankAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);
    
    // Calculate recent expenses for context
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentExpenses = transactions
      .filter(t => {
        const txDate = new Date(t.transaction_date || t.date || t.created_at);
        return t.type === 'debit' && txDate >= thirtyDaysAgo;
      })
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    
    const monthlyIncome = parseFloat(userProfile.monthly_income) || 0;
    const savingsRate = monthlyIncome > 0 ? Math.round((monthlyIncome - recentExpenses) / monthlyIncome * 100) : 0;
    
    // Get AI-enhanced response with accurate data
    console.log('🤖 Generating AI balance summary...');
    
    try {
      const aiResponse = await huggingface.generateChatResponse(
        `Tell me about my current balance and financial status`,
        { 
          userProfile, 
          totalBalance, 
          monthlyIncome, 
          monthlyExpenses: recentExpenses, 
          savingsRate,
          topCategories: [],
          goals: context.goals || [],
          budgets: context.budgets || []
        },
        this.contextWindow
      );
      
      if (aiResponse) {
        return {
          message: aiResponse,
          type: 'balance',
          data: { totalBalance, accounts: bankAccounts },
          method: 'ai'
        };
      }
    } catch (error) {
      console.error('AI balance response failed:', error.message);
    }

    // Fallback to clean template
    let message = `💰 **Your Account Summary**\n\n`;
    message += `**Total Balance: ₹${totalBalance.toLocaleString('en-IN')}**\n\n`;
    
    for (const account of bankAccounts) {
      const balance = parseFloat(account.balance || 0);
      message += `• ${account.bank_name} (${account.account_type}): ₹${balance.toLocaleString('en-IN')}\n`;
    }
    
    if (recentExpenses > 0) {
      message += `\n📊 This month's spending: ₹${recentExpenses.toLocaleString('en-IN')}`;
    }

    return {
      message,
      type: 'balance',
      data: { totalBalance, accounts: bankAccounts },
      method: 'rule'
    };
  }

  async handleSpendingAnalysis(context) {
    const { transactions = [], budgets = [], userProfile = {} } = context;
    
    if (transactions.length === 0) {
      return {
        message: "I don't have any transaction data to analyze yet. Add your first transaction or use the UPI payment feature, and I'll provide detailed spending insights! 📊",
        type: 'info',
        method: 'rule'
      };
    }

    const analysis = await expenseAnalyzer.analyzeExpenses(transactions, budgets);
    
    // Get AI-enhanced analysis with accurate data
    console.log('🤖 Generating AI spending analysis...');
    
    try {
      // Build detailed category breakdown for AI
      const categoryBreakdown = Object.entries(analysis.categoryBreakdown || {})
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 5);
      
      const topCategories = categoryBreakdown.map(
        ([cat, data]) => `${cat} (₹${Math.round(data.total).toLocaleString('en-IN')})`
      );
      
      const aiContext = {
        userProfile,
        totalBalance: (analysis.totalIncome || 0) - (analysis.totalSpent || 0),
        monthlyIncome: analysis.totalIncome || 0,
        monthlyExpenses: analysis.totalSpent || 0,
        savingsRate: Math.max(0, Math.min(100, analysis.savingsRate || 0)),
        topCategories,
        goals: context.goals || [],
        budgets: budgets
      };
      
      const aiResponse = await huggingface.generateChatResponse(
        `Analyze my spending patterns and give me insights. What am I spending the most on?`,
        aiContext,
        this.contextWindow
      );
      
      if (aiResponse) {
        return {
          message: aiResponse,
          type: 'analysis',
          data: analysis,
          method: 'ai'
        };
      }
    } catch (error) {
      console.error('AI analysis response failed:', error.message);
    }

    // Fallback to clean template with accurate numbers
    let message = `📊 **Your Spending Analysis**\n\n`;
    message += `💸 Total Spent: ₹${(analysis.totalSpent || 0).toLocaleString('en-IN')}\n`;
    message += `💰 Total Income: ₹${(analysis.totalIncome || 0).toLocaleString('en-IN')}\n`;
    message += `📈 Savings Rate: ${Math.max(0, Math.min(100, analysis.savingsRate || 0)).toFixed(1)}%\n\n`;

    // Show top categories
    const sortedCategories = Object.entries(analysis.categoryBreakdown || {})
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 3);
    
    if (sortedCategories.length > 0) {
      message += `**Top Spending:**\n`;
      for (const [cat, data] of sortedCategories) {
        message += `• ${cat}: ₹${Math.round(data.total).toLocaleString('en-IN')}\n`;
      }
      message += '\n';
    }

    if (analysis.overspendingCategories?.length > 0) {
      message += `⚠️ **Budget Alerts:**\n`;
      for (const cat of analysis.overspendingCategories.slice(0, 3)) {
        message += `• ${cat.category}: ₹${Math.round(cat.spent).toLocaleString('en-IN')} / ₹${cat.limit} (${Math.min(cat.usage, 999)}%)\n`;
      }
    }

    return {
      message,
      type: 'analysis',
      data: analysis,
      method: 'rule'
    };
  }

  async handleCategoryBreakdown(context) {
    const { transactions = [] } = context;
    
    const categoryTotals = {};
    for (const t of transactions) {
      if (t.type === 'debit') {
        const category = t.category || 'Other';
        categoryTotals[category] = (categoryTotals[category] || 0) + parseFloat(t.amount);
      }
    }

    const sorted = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1]);
    
    let message = `📋 **Spending by Category**\n\n`;
    for (const [category, total] of sorted.slice(0, 8)) {
      const bar = '█'.repeat(Math.ceil(total / sorted[0][1] * 10));
      message += `${category}: ₹${total.toLocaleString('en-IN')}\n${bar}\n\n`;
    }

    return {
      message,
      type: 'category_breakdown',
      data: { categories: sorted }
    };
  }

  async handleGoalProgress(context) {
    const { goals = [] } = context;
    
    if (goals.length === 0) {
      return {
        message: "You haven't set any financial goals yet. Would you like me to help you create one? Goals help you save with purpose!",
        type: 'info',
        actions: ['create_goal']
      };
    }

    let message = `🎯 **Your Goal Progress**\n\n`;
    
    for (const goal of goals) {
      if (goal.status !== 'active') continue;
      
      const progress = (goal.current_amount / goal.target_amount * 100).toFixed(1);
      const remaining = goal.target_amount - goal.current_amount;
      const progressBar = '█'.repeat(Math.floor(progress / 10)) + '░'.repeat(10 - Math.floor(progress / 10));
      
      message += `**${goal.name}**\n`;
      message += `[${progressBar}] ${progress}%\n`;
      message += `₹${goal.current_amount.toLocaleString('en-IN')} / ₹${goal.target_amount.toLocaleString('en-IN')}\n`;
      message += `Remaining: ₹${remaining.toLocaleString('en-IN')}\n\n`;
    }

    return {
      message,
      type: 'goal_progress',
      data: { goals }
    };
  }

  async handleInvestmentAdvice(context) {
    const { userProfile = {}, goals = [], transactions = [] } = context;
    
    // Calculate monthly expenses
    const monthlyExpenses = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0) / 3; // Assuming 3 months data

    const recommendations = await investmentAdvisor.generateRecommendations(
      userProfile,
      goals,
      monthlyExpenses
    );

    let message = `💹 **Investment Recommendations**\n\n`;
    message += `Based on your risk tolerance (${userProfile.risk_tolerance || 'medium'}) and financial goals:\n\n`;

    for (const rec of recommendations.slice(0, 5)) {
      if (rec.type === 'recommendation') {
        message += `**${rec.name}**\n`;
        message += `• Amount: ₹${rec.amount?.toLocaleString('en-IN') || 'Varies'}\n`;
        message += `• Expected Returns: ${rec.expectedReturns}\n`;
        message += `• Risk: ${rec.riskLevel}\n\n`;
      } else if (rec.type === 'advice') {
        message += `💡 **${rec.title}**\n${rec.description}\n\n`;
      }
    }

    return {
      message,
      type: 'investment',
      data: { recommendations }
    };
  }

  async handleSavingsTips(context) {
    const { transactions = [], budgets = [] } = context;
    
    const analysis = await expenseAnalyzer.analyzeExpenses(transactions, budgets);
    const suggestions = await expenseAnalyzer.getSavingsSuggestions(analysis);

    let message = `💡 **Personalized Savings Tips**\n\n`;

    if (suggestions.length === 0) {
      message += "Great job! Your spending looks optimized. Keep maintaining your current habits.\n\n";
      message += "Here are some general tips:\n";
      message += "• Review subscriptions quarterly\n";
      message += "• Use the 24-hour rule for big purchases\n";
      message += "• Automate your savings on payday\n";
    } else {
      for (const suggestion of suggestions) {
        message += `**${suggestion.category}**\n`;
        message += `Current: ₹${suggestion.currentSpend.toLocaleString('en-IN')}\n`;
        message += `💰 Potential Savings: ₹${suggestion.potentialSavings.toLocaleString('en-IN')}\n`;
        message += `📝 ${suggestion.suggestion}\n\n`;
      }
    }

    return {
      message,
      type: 'savings_tips',
      data: { suggestions }
    };
  }

  async handleBudgetHelp(context) {
    const { userProfile = {}, transactions = [], budgets = [] } = context;
    const budgetGoalGenerator = require('./budgetGoalGenerator');
    
    if (budgets.length === 0) {
      const smartBudget = await budgetGoalGenerator.generateSmartBudget(userProfile, transactions);
      
      let message = `📊 **Suggested Budget Based on Your Income**\n\n`;
      message += `Monthly Income: ₹${userProfile.monthly_income?.toLocaleString('en-IN') || 'Not set'}\n\n`;
      message += `**Recommended Allocation:**\n`;
      message += `• Needs (50%): ₹${smartBudget.needsAllocation.toLocaleString('en-IN')}\n`;
      message += `• Wants (30%): ₹${smartBudget.wantsAllocation.toLocaleString('en-IN')}\n`;
      message += `• Savings (20%): ₹${smartBudget.savingsTarget.toLocaleString('en-IN')}\n\n`;

      return {
        message,
        type: 'budget_suggestion',
        data: smartBudget
      };
    }

    let message = `📊 **Your Current Budgets**\n\n`;
    for (const budget of budgets) {
      const usage = (budget.current_spent / budget.monthly_limit * 100).toFixed(1);
      message += `${budget.category}: ₹${budget.current_spent} / ₹${budget.monthly_limit} (${usage}%)\n`;
    }

    return {
      message,
      type: 'budget_status',
      data: { budgets }
    };
  }

  async handleTransactionSearch(message, context) {
    const { transactions = [] } = context;
    
    // Simple keyword extraction
    const keywords = message.toLowerCase()
      .replace(/find|search|transaction|when did i|last|purchase|from|at/g, '')
      .trim()
      .split(' ')
      .filter(w => w.length > 2);

    const matches = transactions.filter(t => {
      const searchText = `${t.description || ''} ${t.merchant_name || ''} ${t.category || ''}`.toLowerCase();
      return keywords.some(kw => searchText.includes(kw));
    });

    if (matches.length === 0) {
      return {
        message: "I couldn't find any transactions matching your search. Try being more specific or check the transaction history.",
        type: 'search_result',
        data: { matches: [] }
      };
    }

    let response = `🔍 **Found ${matches.length} transaction(s):**\n\n`;
    for (const t of matches.slice(0, 5)) {
      const date = new Date(t.transaction_date).toLocaleDateString('en-IN');
      response += `• ${date}: ${t.description || t.merchant_name || 'Transaction'}\n`;
      response += `  ${t.type === 'credit' ? '+' : '-'}₹${parseFloat(t.amount).toLocaleString('en-IN')} (${t.category || 'Uncategorized'})\n\n`;
    }

    if (matches.length > 5) {
      response += `...and ${matches.length - 5} more transactions.`;
    }

    return {
      message: response,
      type: 'search_result',
      data: { matches }
    };
  }

  async handleGeneralQuestion(message, context) {
    // Use AI for all general questions - fully AI-powered with rich context
    console.log('🤖 Generating AI response for general question...');
    
    const { userProfile = {}, transactions = [], goals = [], budgets = [], bankAccounts = [] } = context;
    
    // Calculate context data more accurately
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Filter to recent transactions for monthly calculations
    const recentTransactions = transactions.filter(t => {
      const txDate = new Date(t.transaction_date || t.date || t.created_at);
      return txDate >= thirtyDaysAgo;
    });
    
    const monthlyExpenses = recentTransactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    
    const monthlyIncomeFromTx = recentTransactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    
    const monthlyIncome = parseFloat(userProfile.monthly_income) || monthlyIncomeFromTx || 0;
    const savingsRate = monthlyIncome > 0 
      ? Math.max(0, Math.min(100, ((monthlyIncome - monthlyExpenses) / monthlyIncome * 100))).toFixed(1) 
      : 0;
    
    // Get top spending categories with amounts
    const categoryTotals = {};
    for (const t of recentTransactions) {
      if (t.type === 'debit' && t.category) {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + parseFloat(t.amount || 0);
      }
    }
    const topCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, amt]) => `${cat} (₹${Math.round(amt).toLocaleString('en-IN')})`);
    
    // Calculate total balance from bank accounts if available
    const totalBalance = bankAccounts.length > 0
      ? bankAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0)
      : recentTransactions.reduce((sum, t) => {
          return sum + (t.type === 'credit' ? parseFloat(t.amount || 0) : -parseFloat(t.amount || 0));
        }, 0);
    
    // Build rich context for AI
    const aiContext = {
      userProfile,
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      savingsRate: parseFloat(savingsRate),
      topCategories,
      goals: goals.filter(g => g.status === 'active').slice(0, 5),
      budgets: budgets.slice(0, 5),
      hasData: transactions.length > 0 || bankAccounts.length > 0
    };
    
    // Log context summary for debugging
    console.log('📊 Chat context:', {
      userId: userProfile.id,
      income: monthlyIncome,
      expenses: monthlyExpenses,
      savingsRate,
      topCategories: topCategories.length,
      transactionCount: transactions.length
    });
    
    try {
      const aiResponse = await huggingface.generateChatResponse(
        message,
        aiContext,
        this.contextWindow
      );
      
      if (aiResponse) {
        return {
          message: aiResponse,
          type: 'general',
          data: { contextUsed: true },
          method: 'ai'
        };
      }
    } catch (error) {
      console.error('AI response failed:', error.message);
    }

    // Smarter fallback based on what data is missing
    const hasTransactions = transactions.length > 0;
    const hasProfile = userProfile.monthly_income > 0;
    
    let fallbackMessage = "I'm here to help with your finances! ";
    if (!hasProfile && !hasTransactions) {
      fallbackMessage += "To give you personalized advice, please add your income in Settings and start tracking your transactions.";
    } else if (!hasTransactions) {
      fallbackMessage += "I see your profile is set up. Add some transactions so I can analyze your spending patterns!";
    } else {
      fallbackMessage += "You can ask me about your spending, goals, investments, or get tips on saving money. What would you like to know?";
    }

    return {
      message: fallbackMessage,
      type: 'general',
      data: {},
      method: 'fallback'
    };
  }

  getQuickReplies(lastResponse) {
    const quickReplies = {
      balance: ['Show spending analysis', 'Investment advice', 'My goals'],
      analysis: ['How can I save more?', 'Category breakdown', 'Set a budget'],
      investment: ['Tell me about mutual funds', 'Safe investment options', 'Start a SIP'],
      general: ['Check my balance', 'Analyze my spending', 'Investment tips']
    };

    return quickReplies[lastResponse.type] || quickReplies.general;
  }
}

module.exports = new ChatbotAgent();
=======
const huggingface = require('./huggingface');
const transactionCategorizer = require('./transactionCategorizer');
const expenseAnalyzer = require('./expenseAnalyzer');
const investmentAdvisor = require('./investmentAdvisor');
const savingsCoach = require('./savingsCoach');

class ChatbotAgent {
  constructor() {
    this.contextWindow = [];
    this.maxContext = 10;
  }

  async processMessage(userId, message, context = {}) {
    // Add to context window
    this.contextWindow.push({ role: 'user', content: message });
    if (this.contextWindow.length > this.maxContext) {
      this.contextWindow.shift();
    }

    // Detect intent
    const intent = await this.detectIntent(message);
    
    // Generate response based on intent
    let response;
    switch (intent.category) {
      case 'balance_inquiry':
        response = await this.handleBalanceInquiry(context);
        break;
      case 'spending_analysis':
        response = await this.handleSpendingAnalysis(context);
        break;
      case 'category_breakdown':
        response = await this.handleCategoryBreakdown(context);
        break;
      case 'goal_progress':
        response = await this.handleGoalProgress(context);
        break;
      case 'investment_advice':
        response = await this.handleInvestmentAdvice(context);
        break;
      case 'savings_tips':
        response = await this.handleSavingsTips(context);
        break;
      case 'budget_help':
        response = await this.handleBudgetHelp(context);
        break;
      case 'transaction_search':
        response = await this.handleTransactionSearch(message, context);
        break;
      case 'general_question':
        response = await this.handleGeneralQuestion(message, context);
        break;
      default:
        response = await this.handleGeneralQuestion(message, context);
    }

    // Add response to context
    this.contextWindow.push({ role: 'assistant', content: response.message });

    return response;
  }

  async detectIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    // Intent patterns with weights (more specific patterns = higher weight)
    const intents = {
      balance_inquiry: {
        keywords: ['balance', 'how much do i have', 'bank account', 'total money', 'account balance', 'my money', 'funds'],
        weight: 0.85
      },
      spending_analysis: {
        keywords: ['spending', 'spent', 'expenses', 'where did my money go', 'expense analysis', 'analyze spending', 'spending habits', 'expenditure'],
        weight: 0.85
      },
      category_breakdown: {
        keywords: ['category', 'breakdown', 'what did i spend on', 'spending categories', 'by category', 'category wise'],
        weight: 0.8
      },
      goal_progress: {
        keywords: ['goal', 'target', 'saving for', 'progress', 'how close am i', 'my goals', 'goal status'],
        weight: 0.85
      },
      investment_advice: {
        keywords: ['invest', 'investment', 'mutual fund', 'stocks', 'fd', 'fixed deposit', 'returns', 'where should i invest', 'sip', 'portfolio'],
        weight: 0.85
      },
      savings_tips: {
        keywords: ['save more', 'saving tips', 'cut expenses', 'reduce spending', 'tips to save', 'how to save', 'save money'],
        weight: 0.8
      },
      budget_help: {
        keywords: ['budget', 'limit', 'set budget', 'monthly budget', 'spending limit', 'create budget', 'budget plan'],
        weight: 0.8
      },
      transaction_search: {
        keywords: ['find transaction', 'search transaction', 'when did i', 'last purchase', 'transaction from', 'show transactions'],
        weight: 0.75
      }
    };

    let bestMatch = { category: 'general_question', confidence: 0.4 };
    let matchCount = 0;

    for (const [intent, config] of Object.entries(intents)) {
      for (const keyword of config.keywords) {
        if (lowerMessage.includes(keyword)) {
          matchCount++;
          // Prefer longer/more specific keyword matches
          const specificityBonus = keyword.split(' ').length > 1 ? 0.1 : 0;
          const confidence = Math.min(config.weight + specificityBonus, 0.95);
          
          if (confidence > bestMatch.confidence) {
            bestMatch = { category: intent, confidence };
          }
        }
      }
    }

    // If multiple intents matched, slightly lower confidence
    if (matchCount > 2) {
      bestMatch.confidence = Math.max(bestMatch.confidence - 0.1, 0.5);
    }

    // Log intent detection for debugging
    console.log(`🎯 Intent detected: ${bestMatch.category} (${(bestMatch.confidence * 100).toFixed(0)}% confidence)`);

    return bestMatch;
  }

  async handleBalanceInquiry(context) {
    const { bankAccounts = [], transactions = [], userProfile = {} } = context;
    
    if (bankAccounts.length === 0) {
      return {
        message: "I don't see any linked bank accounts yet. You can add your accounts in the Bank Accounts section to track your total balance across all accounts! 🏦",
        type: 'info',
        actions: ['link_bank'],
        method: 'rule'
      };
    }

    const totalBalance = bankAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);
    
    // Calculate recent expenses for context
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentExpenses = transactions
      .filter(t => {
        const txDate = new Date(t.transaction_date || t.date || t.created_at);
        return t.type === 'debit' && txDate >= thirtyDaysAgo;
      })
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    
    const monthlyIncome = parseFloat(userProfile.monthly_income) || 0;
    const savingsRate = monthlyIncome > 0 ? Math.round((monthlyIncome - recentExpenses) / monthlyIncome * 100) : 0;
    
    // Get AI-enhanced response with accurate data
    console.log('🤖 Generating AI balance summary...');
    
    try {
      const aiResponse = await huggingface.generateChatResponse(
        `Tell me about my current balance and financial status`,
        { 
          userProfile, 
          totalBalance, 
          monthlyIncome, 
          monthlyExpenses: recentExpenses, 
          savingsRate,
          topCategories: [],
          goals: context.goals || [],
          budgets: context.budgets || []
        },
        this.contextWindow
      );
      
      if (aiResponse) {
        return {
          message: aiResponse,
          type: 'balance',
          data: { totalBalance, accounts: bankAccounts },
          method: 'ai'
        };
      }
    } catch (error) {
      console.error('AI balance response failed:', error.message);
    }

    // Fallback to clean template
    let message = `💰 **Your Account Summary**\n\n`;
    message += `**Total Balance: ₹${totalBalance.toLocaleString('en-IN')}**\n\n`;
    
    for (const account of bankAccounts) {
      const balance = parseFloat(account.balance || 0);
      message += `• ${account.bank_name} (${account.account_type}): ₹${balance.toLocaleString('en-IN')}\n`;
    }
    
    if (recentExpenses > 0) {
      message += `\n📊 This month's spending: ₹${recentExpenses.toLocaleString('en-IN')}`;
    }

    return {
      message,
      type: 'balance',
      data: { totalBalance, accounts: bankAccounts },
      method: 'rule'
    };
  }

  async handleSpendingAnalysis(context) {
    const { transactions = [], budgets = [], userProfile = {} } = context;
    
    if (transactions.length === 0) {
      return {
        message: "I don't have any transaction data to analyze yet. Add your first transaction or use the UPI payment feature, and I'll provide detailed spending insights! 📊",
        type: 'info',
        method: 'rule'
      };
    }

    const analysis = await expenseAnalyzer.analyzeExpenses(transactions, budgets);
    
    // Get AI-enhanced analysis with accurate data
    console.log('🤖 Generating AI spending analysis...');
    
    try {
      // Build detailed category breakdown for AI
      const categoryBreakdown = Object.entries(analysis.categoryBreakdown || {})
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 5);
      
      const topCategories = categoryBreakdown.map(
        ([cat, data]) => `${cat} (₹${Math.round(data.total).toLocaleString('en-IN')})`
      );
      
      const aiContext = {
        userProfile,
        totalBalance: (analysis.totalIncome || 0) - (analysis.totalSpent || 0),
        monthlyIncome: analysis.totalIncome || 0,
        monthlyExpenses: analysis.totalSpent || 0,
        savingsRate: Math.max(0, Math.min(100, analysis.savingsRate || 0)),
        topCategories,
        goals: context.goals || [],
        budgets: budgets
      };
      
      const aiResponse = await huggingface.generateChatResponse(
        `Analyze my spending patterns and give me insights. What am I spending the most on?`,
        aiContext,
        this.contextWindow
      );
      
      if (aiResponse) {
        return {
          message: aiResponse,
          type: 'analysis',
          data: analysis,
          method: 'ai'
        };
      }
    } catch (error) {
      console.error('AI analysis response failed:', error.message);
    }

    // Fallback to clean template with accurate numbers
    let message = `📊 **Your Spending Analysis**\n\n`;
    message += `💸 Total Spent: ₹${(analysis.totalSpent || 0).toLocaleString('en-IN')}\n`;
    message += `💰 Total Income: ₹${(analysis.totalIncome || 0).toLocaleString('en-IN')}\n`;
    message += `📈 Savings Rate: ${Math.max(0, Math.min(100, analysis.savingsRate || 0)).toFixed(1)}%\n\n`;

    // Show top categories
    const sortedCategories = Object.entries(analysis.categoryBreakdown || {})
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 3);
    
    if (sortedCategories.length > 0) {
      message += `**Top Spending:**\n`;
      for (const [cat, data] of sortedCategories) {
        message += `• ${cat}: ₹${Math.round(data.total).toLocaleString('en-IN')}\n`;
      }
      message += '\n';
    }

    if (analysis.overspendingCategories?.length > 0) {
      message += `⚠️ **Budget Alerts:**\n`;
      for (const cat of analysis.overspendingCategories.slice(0, 3)) {
        message += `• ${cat.category}: ₹${Math.round(cat.spent).toLocaleString('en-IN')} / ₹${cat.limit} (${Math.min(cat.usage, 999)}%)\n`;
      }
    }

    return {
      message,
      type: 'analysis',
      data: analysis,
      method: 'rule'
    };
  }

  async handleCategoryBreakdown(context) {
    const { transactions = [] } = context;
    
    const categoryTotals = {};
    for (const t of transactions) {
      if (t.type === 'debit') {
        const category = t.category || 'Other';
        categoryTotals[category] = (categoryTotals[category] || 0) + parseFloat(t.amount);
      }
    }

    const sorted = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1]);
    
    let message = `📋 **Spending by Category**\n\n`;
    for (const [category, total] of sorted.slice(0, 8)) {
      const bar = '█'.repeat(Math.ceil(total / sorted[0][1] * 10));
      message += `${category}: ₹${total.toLocaleString('en-IN')}\n${bar}\n\n`;
    }

    return {
      message,
      type: 'category_breakdown',
      data: { categories: sorted }
    };
  }

  async handleGoalProgress(context) {
    const { goals = [] } = context;
    
    if (goals.length === 0) {
      return {
        message: "You haven't set any financial goals yet. Would you like me to help you create one? Goals help you save with purpose!",
        type: 'info',
        actions: ['create_goal']
      };
    }

    let message = `🎯 **Your Goal Progress**\n\n`;
    
    for (const goal of goals) {
      if (goal.status !== 'active') continue;
      
      const progress = (goal.current_amount / goal.target_amount * 100).toFixed(1);
      const remaining = goal.target_amount - goal.current_amount;
      const progressBar = '█'.repeat(Math.floor(progress / 10)) + '░'.repeat(10 - Math.floor(progress / 10));
      
      message += `**${goal.name}**\n`;
      message += `[${progressBar}] ${progress}%\n`;
      message += `₹${goal.current_amount.toLocaleString('en-IN')} / ₹${goal.target_amount.toLocaleString('en-IN')}\n`;
      message += `Remaining: ₹${remaining.toLocaleString('en-IN')}\n\n`;
    }

    return {
      message,
      type: 'goal_progress',
      data: { goals }
    };
  }

  async handleInvestmentAdvice(context) {
    const { userProfile = {}, goals = [], transactions = [] } = context;
    
    // Calculate monthly expenses
    const monthlyExpenses = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0) / 3; // Assuming 3 months data

    const recommendations = await investmentAdvisor.generateRecommendations(
      userProfile,
      goals,
      monthlyExpenses
    );

    let message = `💹 **Investment Recommendations**\n\n`;
    message += `Based on your risk tolerance (${userProfile.risk_tolerance || 'medium'}) and financial goals:\n\n`;

    for (const rec of recommendations.slice(0, 5)) {
      if (rec.type === 'recommendation') {
        message += `**${rec.name}**\n`;
        message += `• Amount: ₹${rec.amount?.toLocaleString('en-IN') || 'Varies'}\n`;
        message += `• Expected Returns: ${rec.expectedReturns}\n`;
        message += `• Risk: ${rec.riskLevel}\n\n`;
      } else if (rec.type === 'advice') {
        message += `💡 **${rec.title}**\n${rec.description}\n\n`;
      }
    }

    return {
      message,
      type: 'investment',
      data: { recommendations }
    };
  }

  async handleSavingsTips(context) {
    const { transactions = [], budgets = [] } = context;
    
    const analysis = await expenseAnalyzer.analyzeExpenses(transactions, budgets);
    const suggestions = await expenseAnalyzer.getSavingsSuggestions(analysis);

    let message = `💡 **Personalized Savings Tips**\n\n`;

    if (suggestions.length === 0) {
      message += "Great job! Your spending looks optimized. Keep maintaining your current habits.\n\n";
      message += "Here are some general tips:\n";
      message += "• Review subscriptions quarterly\n";
      message += "• Use the 24-hour rule for big purchases\n";
      message += "• Automate your savings on payday\n";
    } else {
      for (const suggestion of suggestions) {
        message += `**${suggestion.category}**\n`;
        message += `Current: ₹${suggestion.currentSpend.toLocaleString('en-IN')}\n`;
        message += `💰 Potential Savings: ₹${suggestion.potentialSavings.toLocaleString('en-IN')}\n`;
        message += `📝 ${suggestion.suggestion}\n\n`;
      }
    }

    return {
      message,
      type: 'savings_tips',
      data: { suggestions }
    };
  }

  async handleBudgetHelp(context) {
    const { userProfile = {}, transactions = [], budgets = [] } = context;
    const budgetGoalGenerator = require('./budgetGoalGenerator');
    
    if (budgets.length === 0) {
      const smartBudget = await budgetGoalGenerator.generateSmartBudget(userProfile, transactions);
      
      let message = `📊 **Suggested Budget Based on Your Income**\n\n`;
      message += `Monthly Income: ₹${userProfile.monthly_income?.toLocaleString('en-IN') || 'Not set'}\n\n`;
      message += `**Recommended Allocation:**\n`;
      message += `• Needs (50%): ₹${smartBudget.needsAllocation.toLocaleString('en-IN')}\n`;
      message += `• Wants (30%): ₹${smartBudget.wantsAllocation.toLocaleString('en-IN')}\n`;
      message += `• Savings (20%): ₹${smartBudget.savingsTarget.toLocaleString('en-IN')}\n\n`;

      return {
        message,
        type: 'budget_suggestion',
        data: smartBudget
      };
    }

    let message = `📊 **Your Current Budgets**\n\n`;
    for (const budget of budgets) {
      const usage = (budget.current_spent / budget.monthly_limit * 100).toFixed(1);
      message += `${budget.category}: ₹${budget.current_spent} / ₹${budget.monthly_limit} (${usage}%)\n`;
    }

    return {
      message,
      type: 'budget_status',
      data: { budgets }
    };
  }

  async handleTransactionSearch(message, context) {
    const { transactions = [] } = context;
    
    // Simple keyword extraction
    const keywords = message.toLowerCase()
      .replace(/find|search|transaction|when did i|last|purchase|from|at/g, '')
      .trim()
      .split(' ')
      .filter(w => w.length > 2);

    const matches = transactions.filter(t => {
      const searchText = `${t.description || ''} ${t.merchant_name || ''} ${t.category || ''}`.toLowerCase();
      return keywords.some(kw => searchText.includes(kw));
    });

    if (matches.length === 0) {
      return {
        message: "I couldn't find any transactions matching your search. Try being more specific or check the transaction history.",
        type: 'search_result',
        data: { matches: [] }
      };
    }

    let response = `🔍 **Found ${matches.length} transaction(s):**\n\n`;
    for (const t of matches.slice(0, 5)) {
      const date = new Date(t.transaction_date).toLocaleDateString('en-IN');
      response += `• ${date}: ${t.description || t.merchant_name || 'Transaction'}\n`;
      response += `  ${t.type === 'credit' ? '+' : '-'}₹${parseFloat(t.amount).toLocaleString('en-IN')} (${t.category || 'Uncategorized'})\n\n`;
    }

    if (matches.length > 5) {
      response += `...and ${matches.length - 5} more transactions.`;
    }

    return {
      message: response,
      type: 'search_result',
      data: { matches }
    };
  }

  async handleGeneralQuestion(message, context) {
    // Use AI for all general questions - fully AI-powered with rich context
    console.log('🤖 Generating AI response for general question...');
    
    const { userProfile = {}, transactions = [], goals = [], budgets = [], bankAccounts = [] } = context;
    
    // Calculate context data more accurately
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Filter to recent transactions for monthly calculations
    const recentTransactions = transactions.filter(t => {
      const txDate = new Date(t.transaction_date || t.date || t.created_at);
      return txDate >= thirtyDaysAgo;
    });
    
    const monthlyExpenses = recentTransactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    
    const monthlyIncomeFromTx = recentTransactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    
    const monthlyIncome = parseFloat(userProfile.monthly_income) || monthlyIncomeFromTx || 0;
    const savingsRate = monthlyIncome > 0 
      ? Math.max(0, Math.min(100, ((monthlyIncome - monthlyExpenses) / monthlyIncome * 100))).toFixed(1) 
      : 0;
    
    // Get top spending categories with amounts
    const categoryTotals = {};
    for (const t of recentTransactions) {
      if (t.type === 'debit' && t.category) {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + parseFloat(t.amount || 0);
      }
    }
    const topCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, amt]) => `${cat} (₹${Math.round(amt).toLocaleString('en-IN')})`);
    
    // Calculate total balance from bank accounts if available
    const totalBalance = bankAccounts.length > 0
      ? bankAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0)
      : recentTransactions.reduce((sum, t) => {
          return sum + (t.type === 'credit' ? parseFloat(t.amount || 0) : -parseFloat(t.amount || 0));
        }, 0);
    
    // Build rich context for AI
    const aiContext = {
      userProfile,
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      savingsRate: parseFloat(savingsRate),
      topCategories,
      goals: goals.filter(g => g.status === 'active').slice(0, 5),
      budgets: budgets.slice(0, 5),
      hasData: transactions.length > 0 || bankAccounts.length > 0
    };
    
    // Log context summary for debugging
    console.log('📊 Chat context:', {
      userId: userProfile.id,
      income: monthlyIncome,
      expenses: monthlyExpenses,
      savingsRate,
      topCategories: topCategories.length,
      transactionCount: transactions.length
    });
    
    try {
      const aiResponse = await huggingface.generateChatResponse(
        message,
        aiContext,
        this.contextWindow
      );
      
      if (aiResponse) {
        return {
          message: aiResponse,
          type: 'general',
          data: { contextUsed: true },
          method: 'ai'
        };
      }
    } catch (error) {
      console.error('AI response failed:', error.message);
    }

    // Smarter fallback based on what data is missing
    const hasTransactions = transactions.length > 0;
    const hasProfile = userProfile.monthly_income > 0;
    
    let fallbackMessage = "I'm here to help with your finances! ";
    if (!hasProfile && !hasTransactions) {
      fallbackMessage += "To give you personalized advice, please add your income in Settings and start tracking your transactions.";
    } else if (!hasTransactions) {
      fallbackMessage += "I see your profile is set up. Add some transactions so I can analyze your spending patterns!";
    } else {
      fallbackMessage += "You can ask me about your spending, goals, investments, or get tips on saving money. What would you like to know?";
    }

    return {
      message: fallbackMessage,
      type: 'general',
      data: {},
      method: 'fallback'
    };
  }

  getQuickReplies(lastResponse) {
    const quickReplies = {
      balance: ['Show spending analysis', 'Investment advice', 'My goals'],
      analysis: ['How can I save more?', 'Category breakdown', 'Set a budget'],
      investment: ['Tell me about mutual funds', 'Safe investment options', 'Start a SIP'],
      general: ['Check my balance', 'Analyze my spending', 'Investment tips']
    };

    return quickReplies[lastResponse.type] || quickReplies.general;
  }
}

module.exports = new ChatbotAgent();
>>>>>>> 2c5691fad8196faad9092c0293bb4957adef9391
