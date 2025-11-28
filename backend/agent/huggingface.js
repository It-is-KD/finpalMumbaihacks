const fetch = require('node-fetch');
require('dotenv').config();

class HuggingFaceService {
  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY;
    this.baseUrl = 'https://api-inference.huggingface.co/models';
    this.textModel = 'mistralai/Mixtral-8x7B-Instruct-v0.1';
    this.classificationModel = 'facebook/bart-large-mnli';
    this.defaultTimeout = 30000;
  }

  /**
   * Generate text using the LLM with structured JSON output support
   */
  async generateText(prompt, options = {}) {
    const maxTokens = typeof options === 'number' ? options : (options.maxTokens || 500);
    const temperature = options.temperature || 0.7;
    const timeoutMs = options.timeoutMs || this.defaultTimeout;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(`${this.baseUrl}/${this.textModel}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: maxTokens,
            temperature,
            return_full_text: false,
            do_sample: true
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        console.error('HuggingFace API Error:', error);
        return null;
      }

      const result = await response.json();
      if (Array.isArray(result) && result[0]?.generated_text) {
        return result[0].generated_text.trim();
      }
      return null;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('HuggingFace API timeout');
      } else {
        console.error('HuggingFace API Error:', error.message);
      }
      return null;
    }
  }

  /**
   * Generate JSON-structured output from the LLM
   */
  async generateJSON(prompt, exampleSchema, options = {}) {
    const jsonPrompt = `${prompt}

IMPORTANT: Respond with ONLY valid JSON matching this structure (no markdown, no explanation):
${JSON.stringify(exampleSchema, null, 2)}

JSON Response:`;

    const response = await this.generateText(jsonPrompt, { 
      ...options, 
      maxTokens: options.maxTokens || 800,
      temperature: options.temperature || 0.5
    });

    if (!response) return null;

    try {
      let jsonStr = response;
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1];
      
      const startBrace = jsonStr.indexOf('{');
      const startBracket = jsonStr.indexOf('[');
      const start = startBrace === -1 ? startBracket : 
                    startBracket === -1 ? startBrace : 
                    Math.min(startBrace, startBracket);
      
      if (start !== -1) {
        let depth = 0;
        let end = start;
        for (let i = start; i < jsonStr.length; i++) {
          if (jsonStr[i] === '{' || jsonStr[i] === '[') depth++;
          if (jsonStr[i] === '}' || jsonStr[i] === ']') depth--;
          if (depth === 0) { end = i + 1; break; }
        }
        jsonStr = jsonStr.slice(start, end);
      }
      
      return JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse JSON from HuggingFace:', response?.slice(0, 200));
      return null;
    }
  }

  /**
   * Classify text using zero-shot classification
   */
  async classifyText(text, labels) {
    try {
      const response = await fetch(`${this.baseUrl}/${this.classificationModel}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: text,
          parameters: { candidate_labels: labels }
        })
      });

      if (!response.ok) {
        console.error('Classification API Error');
        return { label: labels[0], score: 0.5 };
      }

      const result = await response.json();
      return {
        label: result.labels[0],
        score: result.scores[0],
        allLabels: result.labels,
        allScores: result.scores
      };
    } catch (error) {
      console.error('Classification Error:', error);
      return { label: labels[0], score: 0.5 };
    }
  }

  /**
   * AI-powered transaction categorization
   */
  async categorizeTransaction(transaction, categories, recentTransactions = []) {
    const { description, merchant_name, amount, type } = transaction;
    
    const prompt = `You are a financial transaction categorizer for an Indian fintech app.

Categorize this transaction into ONE of these categories:
${categories.join(', ')}

Transaction details:
- Description: ${description || 'N/A'}
- Merchant: ${merchant_name || 'N/A'}
- Amount: ₹${amount}
- Type: ${type}
${recentTransactions.length > 0 ? `
Recent transactions for context:
${recentTransactions.slice(0, 5).map(t => `- ${t.description}: ${t.category}`).join('\n')}` : ''}

Respond with JSON: category, confidence (0-1), reasoning`;

    const result = await this.generateJSON(prompt, {
      category: "Shopping",
      confidence: 0.95,
      reasoning: "Amazon is an e-commerce platform"
    });

    if (result && categories.includes(result.category)) {
      return { category: result.category, confidence: result.confidence || 0.8, reasoning: result.reasoning || '', method: 'ai' };
    }

    const classification = await this.classifyText(`${description || ''} ${merchant_name || ''}`, categories);
    return { category: classification.label, confidence: classification.score, reasoning: 'Zero-shot classification', method: 'classification' };
  }

  /**
   * AI-powered expense insights generation
   */
  async generateExpenseInsights(analysisData, userProfile) {
    const prompt = `You are FinPal, an AI financial advisor for Indian users.

Analyze this spending data and generate 3-5 actionable insights:

User: Monthly Income ₹${userProfile.monthly_income || 'Unknown'}, Risk: ${userProfile.risk_tolerance || 'medium'}

Summary: Spent ₹${analysisData.totalSpent}, Income ₹${analysisData.totalIncome}, Savings ${analysisData.savingsRate}%

Top Categories:
${Object.entries(analysisData.categoryBreakdown || {}).sort((a, b) => b[1].total - a[1].total).slice(0, 5).map(([cat, data]) => `- ${cat}: ₹${data.total.toFixed(0)}`).join('\n')}
${analysisData.overspendingCategories?.length > 0 ? `
Overspending: ${analysisData.overspendingCategories.map(c => `${c.category}: ₹${c.spent}/₹${c.limit}`).join(', ')}` : ''}

Generate insights with type (overspending/savings_alert/savings_positive/tip), title, description, priority, action.`;

    const result = await this.generateJSON(prompt, {
      insights: [{ type: "overspending", title: "High Food Expenses", description: "You've spent ₹8,500 on food", priority: "high", action: "Try meal prepping" }]
    }, { maxTokens: 1000 });

    return result?.insights || [];
  }

  /**
   * AI-powered savings suggestions
   */
  async generateSavingsSuggestions(analysisData, userProfile) {
    const prompt = `You are FinPal, an AI savings coach for Indian users.

Suggest 3-5 specific ways to save money:

Income: ₹${userProfile.monthly_income || 'Unknown'}, Savings Rate: ${analysisData.savingsRate}%

Spending:
${Object.entries(analysisData.categoryBreakdown || {}).sort((a, b) => b[1].total - a[1].total).slice(0, 8).map(([cat, data]) => `- ${cat}: ₹${data.total.toFixed(0)}`).join('\n')}

Generate suggestions with category, currentSpend, suggestion, potentialSavings.`;

    const result = await this.generateJSON(prompt, {
      suggestions: [{ category: "Food & Dining", currentSpend: 8500, suggestion: "Cook at home 3x/week", potentialSavings: 3000 }]
    }, { maxTokens: 800 });

    return result?.suggestions || [];
  }

  /**
   * AI-powered budget recommendations
   */
  async generateBudgetRecommendations(userProfile, categoryAverages, existingBudgets = []) {
    const prompt = `You are FinPal, an AI budget planner for Indian users.

Create personalized budget recommendations:

User: Income ₹${userProfile.monthly_income}, Type: ${userProfile.income_type || 'salaried'}, Risk: ${userProfile.risk_tolerance || 'medium'}

Historical Spending:
${Object.entries(categoryAverages).map(([cat, avg]) => `- ${cat}: ₹${Math.round(avg)}`).join('\n')}

Suggest budgets with category, monthly_limit, type (needs/wants), reasoning. Follow 50/30/20 rule.`;

    const result = await this.generateJSON(prompt, {
      budgets: [{ category: "Groceries", monthly_limit: 8000, type: "needs", reasoning: "Based on your average" }],
      savingsTarget: 15000,
      adjustmentNote: "Budget for stable income"
    }, { maxTokens: 1000 });

    return result;
  }

  /**
   * AI-powered goal suggestions
   */
  async generateGoalSuggestions(userProfile, existingGoals, spendingPatterns) {
    const prompt = `You are FinPal, an AI goal advisor for Indian users.

Suggest 3-4 personalized financial goals:

User: Income ₹${userProfile.monthly_income}, Risk: ${userProfile.risk_tolerance || 'medium'}
${existingGoals.length > 0 ? `Existing Goals: ${existingGoals.map(g => g.name).join(', ')}` : ''}

Top Spending: ${Object.entries(spendingPatterns).slice(0, 5).map(([cat, amt]) => `${cat}: ₹${Math.round(amt)}`).join(', ')}

Suggest goals with name, description, suggestedAmount, suggestedTimeframe (months), priority, category, reasoning.`;

    const result = await this.generateJSON(prompt, {
      goals: [{ name: "Emergency Fund", description: "6-month buffer", suggestedAmount: 300000, suggestedTimeframe: 12, priority: "high", category: "emergency", reasoning: "Safety net first" }]
    }, { maxTokens: 800 });

    return result?.goals || [];
  }

  /**
   * AI-powered investment advice
   */
  async generateInvestmentAdvice(userProfile, goals, financialSummary, existingRecommendations) {
    const prompt = `You are FinPal, an AI investment advisor for Indian users.

Enhance investment recommendations with explanations:

User: Income ₹${userProfile.monthly_income}, Risk: ${userProfile.risk_tolerance || 'medium'}, Type: ${userProfile.income_type || 'salaried'}
Surplus: ₹${financialSummary.surplus || 0}, Savings Rate: ${financialSummary.savingsRate || 0}%

Goals: ${goals.map(g => `${g.name}: ₹${g.target_amount}`).join(', ')}

Recommendations:
${existingRecommendations.slice(0, 5).map(r => `- ${r.name}: ₹${r.amount} (${r.riskLevel})`).join('\n')}

Add explanation, whyThisWorks, tips, warnings for each.`;

    const result = await this.generateJSON(prompt, {
      recommendations: [{ type: "mutual_funds", explanation: "Good for medium risk", whyThisWorks: "SIPs automate investing", tips: ["Start with large-cap"], warnings: ["Market risks apply"] }]
    }, { maxTokens: 1000 });

    return result?.recommendations || [];
  }

  /**
   * AI-powered behavioral insights
   */
  async generateBehavioralInsights(patterns, userProfile) {
    const prompt = `You are FinPal, an AI behavioral finance coach.

Analyze spending patterns and provide coaching:

User: Income ₹${userProfile.monthly_income}, Risk: ${userProfile.risk_tolerance || 'medium'}

Patterns:
${patterns.map(p => `- ${p.patternType}: ${p.patternData?.insight || JSON.stringify(p.patternData).slice(0, 100)} (${(p.confidenceScore * 100).toFixed(0)}% confidence)`).join('\n')}

Provide behavioralInsight, recommendation, actionStep for each. Also overall personality and summary.`;

    const result = await this.generateJSON(prompt, {
      insights: [{ patternType: "impulse_tendency", behavioralInsight: "Late-night shopping suggests emotional spending", recommendation: "Sleep on purchases after 10 PM", actionStep: "Remove saved payment methods" }],
      overallPersonality: "Mindful Spender",
      summary: "Good discipline, room for impulse control"
    }, { maxTokens: 1000 });

    return result;
  }

  /**
   * AI-powered roadmap narrative
   */
  async generateRoadmapNarrative(roadmap, userProfile) {
    const prompt = `You are FinPal, creating a motivating financial roadmap.

User: Income ₹${userProfile.monthly_income}, Risk: ${userProfile.risk_tolerance || 'medium'}

12-Month Plan:
- Projected Income: ₹${roadmap.summary.totalProjectedIncome}
- Planned Savings: ₹${roadmap.summary.totalPlannedSavings}
- Investments: ₹${roadmap.summary.totalInvestments}

Goals: ${roadmap.summary.goalProjections?.map(g => `${g.goalName}: ${g.onTrack ? '✓' : '⚠'}`).join(', ')}

Generate summaryNarrative (2-3 sentences), keyMilestones, risksAndMitigation, closingStatement.`;

    const result = await this.generateJSON(prompt, {
      summaryNarrative: "Your financial journey looks promising...",
      keyMilestones: [{ month: "March 2025", milestone: "Emergency fund 50% complete" }],
      risksAndMitigation: [{ risk: "Variable income", mitigation: "Maintain buffer" }],
      closingStatement: "Stay consistent!"
    }, { maxTokens: 800 });

    return result;
  }

  /**
   * AI-powered chat response - Grounded in user's actual data
   */
  async generateChatResponse(message, context, conversationHistory = []) {
    // Build a strict, data-grounded system prompt
    const hasFinancialData = context.monthlyIncome > 0 || context.monthlyExpenses > 0 || context.totalBalance !== 0;
    
    const systemPrompt = `You are FinPal, a friendly and accurate AI financial coach for Indian users.

IMPORTANT RULES:
1. Use ONLY the numbers provided in USER_DATA below - never invent or guess amounts.
2. If USER_DATA shows 0 or "Unknown" for something the user asks about, say "I don't have that information yet - please add your transactions/income in the app."
3. Be concise: 2-4 sentences maximum.
4. Use ₹ for all amounts (Indian Rupees).
5. Be encouraging but realistic.
6. For investment questions, give general guidance only - no specific stock picks.
7. Always ground your response in the actual numbers from USER_DATA.

=== USER_DATA (use ONLY these numbers) ===
Name: ${context.userProfile?.name || 'User'}
Monthly Income: ${context.userProfile?.monthly_income ? '₹' + Number(context.userProfile.monthly_income).toLocaleString('en-IN') : 'Not set'}
Risk Tolerance: ${context.userProfile?.risk_tolerance || 'medium'}
Current Balance: ${context.totalBalance !== undefined ? '₹' + Number(context.totalBalance).toLocaleString('en-IN') : 'Unknown'}
Monthly Expenses: ${context.monthlyExpenses ? '₹' + Number(context.monthlyExpenses).toLocaleString('en-IN') : 'No data'}
Savings Rate: ${context.savingsRate ? context.savingsRate + '%' : 'No data'}
Top Spending Categories: ${context.topCategories?.length > 0 ? context.topCategories.join(', ') : 'No category data'}
${context.goals?.length > 0 ? `Active Goals: ${context.goals.map(g => g.name).join(', ')}` : 'Goals: None set'}
${context.budgets?.length > 0 ? `Budgets Set: ${context.budgets.length} categories` : 'Budgets: None set'}
=== END USER_DATA ===

${!hasFinancialData ? 'NOTE: User has limited data in the app. Encourage them to add transactions and set up their profile.' : ''}`;

    const recentMessages = conversationHistory.slice(-4).map(m => `${m.role === 'user' ? 'User' : 'FinPal'}: ${m.content}`).join('\n');
    
    const prompt = `${systemPrompt}

${recentMessages ? `Recent conversation:\n${recentMessages}\n\n` : ''}User's question: ${message}

FinPal's response (remember: use ONLY the USER_DATA numbers, be concise, be helpful):`;

    // Use lower temperature for more accurate, deterministic responses
    const response = await this.generateText(prompt, { 
      maxTokens: 300, 
      temperature: 0.3  // Lower temperature = more focused/accurate
    });
    
    // Clean up response - remove any artifacts
    let cleanResponse = response?.trim() || null;
    if (cleanResponse) {
      // Remove any "FinPal:" prefix if model repeated it
      cleanResponse = cleanResponse.replace(/^FinPal:\s*/i, '');
      // Remove incomplete sentences at the end
      if (cleanResponse.length > 50 && !cleanResponse.match(/[.!?]$/)) {
        const lastSentenceEnd = Math.max(
          cleanResponse.lastIndexOf('.'),
          cleanResponse.lastIndexOf('!'),
          cleanResponse.lastIndexOf('?')
        );
        if (lastSentenceEnd > cleanResponse.length * 0.5) {
          cleanResponse = cleanResponse.slice(0, lastSentenceEnd + 1);
        }
      }
    }
    
    return cleanResponse || "I'm here to help with your finances! Ask me about your spending, goals, or get savings tips.";
  }

  /**
   * AI-powered nudge generation
   */
  async generateNudges(nudgeContexts, userProfile) {
    const prompt = `You are FinPal, creating personalized financial nudges.

User: ${userProfile.name || 'User'}, Income ₹${userProfile.monthly_income}

Situations:
${nudgeContexts.map((ctx, i) => `${i + 1}. ${ctx.type}: ${ctx.category || ''} ₹${ctx.amount || 0}${ctx.percentOver ? ` (${ctx.percentOver}% over)` : ''}${ctx.goalName ? ` Goal: ${ctx.goalName}` : ''}`).join('\n')}

Generate friendly, emoji-rich nudges with message, action, priority for each.`;

    const result = await this.generateJSON(prompt, {
      nudges: [{ type: "overspending", message: "₹3,500 on Swiggy! 🍕 How about cooking tonight?", action: "Try home cooking", priority: "medium" }]
    }, { maxTokens: 600 });

    return result?.nudges || [];
  }

  // Legacy fallback method for backward compatibility
  getFallbackResponse(prompt) {
    if (prompt.includes('categorize') || prompt.includes('category')) {
      return 'Based on the transaction, this appears to be a general expense.';
    }
    if (prompt.includes('investment') || prompt.includes('invest')) {
      return 'Consider diversifying with FDs, mutual funds based on your goals.';
    }
    if (prompt.includes('save') || prompt.includes('saving')) {
      return 'Follow the 50/30/20 rule: 50% needs, 30% wants, 20% savings.';
    }
    return 'I can help manage finances, track expenses, set goals, and provide investment advice.';
  }
}

module.exports = new HuggingFaceService();
