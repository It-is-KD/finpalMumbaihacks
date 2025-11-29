# FinPal - AI-Powered Personal Finance Manager

<div align="center">
  <h3>🤖 Your Intelligent Financial Companion</h3>
  <p>A cross-platform React Native Expo application with agentic AI for comprehensive financial management</p>
</div>

---

## 📱 Features

### Core Features
- **Transaction Categorization**: AI-powered automatic categorization of bank transactions (subscriptions, shopping, groceries, EMIs, investments, income, etc.)
- **Expense Analytics**: Detailed spending analysis with visual charts and trends
- **Budget Management**: Set and track budgets by category with smart alerts
- **Goal Tracking**: Financial goal setting with progress tracking and AI roadmaps
- **AI Chat Assistant**: Natural language financial advisor using conversational AI

### AI Agent Capabilities
- **Transaction Categorizer**: Intelligent categorization using keywords and NLP
- **Expense Analyzer**: Detects overspending patterns with 80% threshold alerts
- **Budget Goal Generator**: Suggests budgets using 50/30/20 rule
- **Savings Coach**: Provides behavioral nudges and savings recommendations
- **Investment Advisor**: Personalized investment suggestions (FDs, MFs, Stocks, Bonds)
- **Autonomous Planner**: Monthly financial roadmap generation
- **Behavior Pattern Learner**: Identifies spending patterns and habits
- **Chatbot Agent**: Intent recognition and query handling

### Subscription Plans

| Feature | Free Plan | Premium Plan (₹199/mo) |
|---------|-----------|------------------------|
| Transaction Tracking | ✅ | ✅ |
| AI Categorization | ✅ | ✅ |
| Budget Management | ✅ | ✅ |
| Goal Setting | ✅ | ✅ |
| AI Chat | Limited | Unlimited |
| Investment Insights | Basic | Advanced |
| Data Privacy | AI Learning | Blockchain Storage |
| Priority Support | ❌ | ✅ |

---

## 🛠 Tech Stack

### Frontend
- **React Native** with **Expo SDK 54**
- **React Native Paper** (Material Design UI)
- **React Navigation** (Native Stack + Bottom Tabs)
- **React Native Chart Kit** (Data visualization)
- **Async Storage** (Local persistence)

### Backend
- **Node.js** with **Express.js**
- **MySQL** (via XAMPP)
- **JWT** for authentication
- **bcryptjs** for password hashing

### AI Layer
- **HuggingFace Inference API**
- Custom agent modules for financial analysis
- Intent recognition and NLP processing

### Blockchain (Premium)
- Simulated blockchain for data integrity
- CryptoJS encryption for secure storage

---

## 📁 Project Structure

```
FinapalFinal/
├── backend/
│   ├── config/
│   │   ├── database.js       # MySQL connection pool
│   │   └── setupDatabase.js  # Database initialization
│   ├── agent/
│   │   ├── index.js          # Unified FinPal Agent
│   │   ├── huggingface.js    # AI API wrapper
│   │   ├── transactionCategorizer.js
│   │   ├── expenseAnalyzer.js
│   │   ├── budgetGoalGenerator.js
│   │   ├── savingsCoach.js
│   │   ├── investmentAdvisor.js
│   │   ├── autonomousPlanner.js
│   │   ├── behaviorPatternLearner.js
│   │   └── chatbotAgent.js
│   ├── blockchain/
│   │   └── index.js          # Simulated blockchain
│   ├── routes/
│   │   ├── auth.js
│   │   ├── transactions.js
│   │   ├── bankAccounts.js
│   │   ├── goals.js
│   │   ├── budgets.js
│   │   ├── ai.js
│   │   ├── blockchain.js
│   │   └── categories.js
│   ├── middleware/
│   │   └── auth.js           # JWT verification
│   ├── server.js             # Express server
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── api/
│   │   └── index.js          # API client
│   ├── context/
│   │   ├── AuthContext.js    # Authentication state
│   │   └── DataContext.js    # App data state
│   ├── components/
│   │   ├── Charts.js         # Chart components
│   │   └── Cards.js          # Reusable card components
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── HomeScreen.js
│   │   ├── ChatScreen.js
│   │   ├── AnalyticsScreen.js
│   │   ├── GoalsScreen.js
│   │   ├── BudgetScreen.js
│   │   ├── TransactionsScreen.js
│   │   ├── SettingsScreen.js
│   │   └── ProfileScreen.js
│   ├── theme/
│   │   └── index.js          # App theming
│   ├── assets/               # App icons and splash
│   ├── App.js                # Main entry point
│   ├── app.json              # Expo configuration
│   ├── babel.config.js
│   └── package.json
│
└── README.md
```

---

## 🎨 Design System

### Colors
```javascript
Primary:    #1d8973  // Teal Green
Secondary:  #286098  // Blue
Text:       #424343  // Dark Gray
Background: #fefffe  // Off White
```

### Typography
- Headlines: 600-700 weight
- Body: 400-500 weight
- Captions: 12px, gray-500

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Add transaction
- `GET /api/transactions/:id` - Get transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Bank Accounts
- `GET /api/bank-accounts` - Get linked accounts
- `POST /api/bank-accounts/link` - Link new account
- `DELETE /api/bank-accounts/:id` - Unlink account

### Goals
- `GET /api/goals` - Get all goals
- `POST /api/goals` - Create goal
- `PUT /api/goals/:id` - Update goal
- `PUT /api/goals/:id/progress` - Update progress

### Budgets
- `GET /api/budgets` - Get all budgets
- `POST /api/budgets` - Create budget
- `PUT /api/budgets/:id` - Update budget

### AI Endpoints
- `POST /api/ai/categorize` - Categorize transaction
- `GET /api/ai/insights` - Get AI insights
- `POST /api/ai/chat` - Chat with AI
- `GET /api/ai/goal-suggestions` - Get goal recommendations
- `GET /api/ai/budget-suggestions` - Get budget recommendations
- `GET /api/ai/savings-tips` - Get savings advice
- `GET /api/ai/investment-advice` - Get investment recommendations
- `GET /api/ai/monthly-plan` - Get monthly financial plan

---

## 📊 Database Schema

### Tables
- `users` - User accounts and subscription info
- `bank_accounts` - Linked bank account details
- `transactions` - All financial transactions
- `categories` - Transaction categories
- `goals` - Financial goals
- `budgets` - Budget limits by category
- `user_insights` - AI-generated insights
- `blockchain_records` - Encrypted data for premium users

---

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Rate limiting (recommended for production)
- Blockchain encryption for premium users
- Input validation and sanitization

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- React Native & Expo teams
- HuggingFace for AI capabilities
- React Native Paper for UI components
- All open-source contributors
