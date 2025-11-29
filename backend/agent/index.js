<<<<<<< HEAD
const transactionCategorizer = require('./transactionCategorizer');
const expenseAnalyzer = require('./expenseAnalyzer');
const budgetGoalGenerator = require('./budgetGoalGenerator');
const savingsCoach = require('./savingsCoach');
const investmentAdvisor = require('./investmentAdvisor');
const autonomousPlanner = require('./autonomousPlanner');
const behaviorPatternLearner = require('./behaviorPatternLearner');
const chatbotAgent = require('./chatbotAgent');
const huggingface = require('./huggingface');

// Main AI Agent orchestrator using LangGraph-style state management
class FinPalAgent {
  constructor() {
    this.modules = {
      transactionCategorizer,
      expenseAnalyzer,
      budgetGoalGenerator,
      savingsCoach,
      investmentAdvisor,
      autonomousPlanner,
      behaviorPatternLearner,
      chatbotAgent
    };
    
    this.state = {
      currentUser: null,
      conversationHistory: [],
      lastAnalysis: null,
      activePatterns: []
    };
  }

  // State graph nodes
  async categorizeTransactions(transactions) {
    return await this.modules.transactionCategorizer.categorizeMultipleTransactions(transactions);
  }

  async analyzeExpenses(transactions, budgets) {
    return await this.modules.expenseAnalyzer.analyzeExpenses(transactions, budgets);
  }

  async generateBudgets(userProfile, transactions) {
    return await this.modules.budgetGoalGenerator.generateSmartBudget(userProfile, transactions);
  }

  async createGoalPlan(goal, userProfile, currentSavings) {
    return await this.modules.budgetGoalGenerator.createGoalPlan(goal, userProfile, currentSavings);
  }

  async getNudges(transactions, goals, budgets) {
    return await this.modules.savingsCoach.analyzeAndNudge(transactions, goals, budgets);
  }

  async getInvestmentRecommendations(userProfile, goals, expenses) {
    return await this.modules.investmentAdvisor.generateRecommendations(userProfile, goals, expenses);
  }

  async generateRoadmap(userProfile, transactions, goals, budgets) {
    return await this.modules.autonomousPlanner.generateMonthlyRoadmap(
      userProfile, transactions, goals, budgets
    );
  }

  async learnUserPatterns(userId, transactions, userProfile = {}) {
    const patterns = await this.modules.behaviorPatternLearner.learnPatterns(userId, transactions, userProfile);
    this.state.activePatterns = patterns;
    return patterns;
  }

  async chat(userId, message, context) {
    return await this.modules.chatbotAgent.processMessage(userId, message, context);
  }

  // Full agent pipeline - runs all analysis
  async runFullAnalysis(userId, userProfile, transactions, goals, budgets) {
    const analysis = {
      timestamp: new Date(),
      userId
    };

    // Step 1: Categorize uncategorized transactions
    const uncategorized = transactions.filter(t => !t.category);
    if (uncategorized.length > 0) {
      analysis.categorization = await this.categorizeTransactions(uncategorized);
    }

    // Step 2: Expense analysis
    analysis.expenses = await this.analyzeExpenses(transactions, budgets);

    // Step 3: Learn behavioral patterns
    analysis.patterns = await this.learnUserPatterns(userId, transactions);

    // Step 4: Get personalized nudges
    analysis.nudges = await this.getNudges(transactions, goals, budgets);

    // Step 5: Investment recommendations
    const avgExpenses = analysis.expenses.totalSpent;
    analysis.investments = await this.getInvestmentRecommendations(
      userProfile, goals, avgExpenses
    );

    // Step 6: Generate monthly roadmap
    analysis.roadmap = await this.generateRoadmap(userProfile, transactions, goals, budgets);

    // Step 7: Get savings suggestions
    analysis.savingsSuggestions = await this.modules.expenseAnalyzer.getSavingsSuggestions(
      analysis.expenses
    );

    this.state.lastAnalysis = analysis;
    return analysis;
  }

  // Get current state
  getState() {
    return this.state;
  }

  // Clear state
  resetState() {
    this.state = {
      currentUser: null,
      conversationHistory: [],
      lastAnalysis: null,
      activePatterns: []
    };
  }
}

module.exports = new FinPalAgent();
=======
const transactionCategorizer = require('./transactionCategorizer');
const expenseAnalyzer = require('./expenseAnalyzer');
const budgetGoalGenerator = require('./budgetGoalGenerator');
const savingsCoach = require('./savingsCoach');
const investmentAdvisor = require('./investmentAdvisor');
const autonomousPlanner = require('./autonomousPlanner');
const behaviorPatternLearner = require('./behaviorPatternLearner');
const chatbotAgent = require('./chatbotAgent');
const huggingface = require('./huggingface');

// Main AI Agent orchestrator using LangGraph-style state management
class FinPalAgent {
  constructor() {
    this.modules = {
      transactionCategorizer,
      expenseAnalyzer,
      budgetGoalGenerator,
      savingsCoach,
      investmentAdvisor,
      autonomousPlanner,
      behaviorPatternLearner,
      chatbotAgent
    };
    
    this.state = {
      currentUser: null,
      conversationHistory: [],
      lastAnalysis: null,
      activePatterns: []
    };
  }

  // State graph nodes
  async categorizeTransactions(transactions) {
    return await this.modules.transactionCategorizer.categorizeMultipleTransactions(transactions);
  }

  async analyzeExpenses(transactions, budgets) {
    return await this.modules.expenseAnalyzer.analyzeExpenses(transactions, budgets);
  }

  async generateBudgets(userProfile, transactions) {
    return await this.modules.budgetGoalGenerator.generateSmartBudget(userProfile, transactions);
  }

  async createGoalPlan(goal, userProfile, currentSavings) {
    return await this.modules.budgetGoalGenerator.createGoalPlan(goal, userProfile, currentSavings);
  }

  async getNudges(transactions, goals, budgets) {
    return await this.modules.savingsCoach.analyzeAndNudge(transactions, goals, budgets);
  }

  async getInvestmentRecommendations(userProfile, goals, expenses) {
    return await this.modules.investmentAdvisor.generateRecommendations(userProfile, goals, expenses);
  }

  async generateRoadmap(userProfile, transactions, goals, budgets) {
    return await this.modules.autonomousPlanner.generateMonthlyRoadmap(
      userProfile, transactions, goals, budgets
    );
  }

  async learnUserPatterns(userId, transactions, userProfile = {}) {
    const patterns = await this.modules.behaviorPatternLearner.learnPatterns(userId, transactions, userProfile);
    this.state.activePatterns = patterns;
    return patterns;
  }

  async chat(userId, message, context) {
    return await this.modules.chatbotAgent.processMessage(userId, message, context);
  }

  // Full agent pipeline - runs all analysis
  async runFullAnalysis(userId, userProfile, transactions, goals, budgets) {
    const analysis = {
      timestamp: new Date(),
      userId
    };

    // Step 1: Categorize uncategorized transactions
    const uncategorized = transactions.filter(t => !t.category);
    if (uncategorized.length > 0) {
      analysis.categorization = await this.categorizeTransactions(uncategorized);
    }

    // Step 2: Expense analysis
    analysis.expenses = await this.analyzeExpenses(transactions, budgets);

    // Step 3: Learn behavioral patterns
    analysis.patterns = await this.learnUserPatterns(userId, transactions);

    // Step 4: Get personalized nudges
    analysis.nudges = await this.getNudges(transactions, goals, budgets);

    // Step 5: Investment recommendations
    const avgExpenses = analysis.expenses.totalSpent;
    analysis.investments = await this.getInvestmentRecommendations(
      userProfile, goals, avgExpenses
    );

    // Step 6: Generate monthly roadmap
    analysis.roadmap = await this.generateRoadmap(userProfile, transactions, goals, budgets);

    // Step 7: Get savings suggestions
    analysis.savingsSuggestions = await this.modules.expenseAnalyzer.getSavingsSuggestions(
      analysis.expenses
    );

    this.state.lastAnalysis = analysis;
    return analysis;
  }

  // Get current state
  getState() {
    return this.state;
  }

  // Clear state
  resetState() {
    this.state = {
      currentUser: null,
      conversationHistory: [],
      lastAnalysis: null,
      activePatterns: []
    };
  }
}

module.exports = new FinPalAgent();
>>>>>>> 2c5691fad8196faad9092c0293bb4957adef9391
