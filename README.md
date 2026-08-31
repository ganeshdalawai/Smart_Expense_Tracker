# 💰 Smart Expense Tracker

A full-stack personal finance management system for tracking expenses, managing budgets, analyzing spending patterns, and generating financial insights.

The application provides an interactive dashboard with financial summaries, spending analytics, budget recommendations, expense predictions, and financial health analysis.

---

## 🚀 Features

### 📊 Financial Dashboard
- Total balance, income, and expense overview
- 6-month financial trend visualization
- Expense category distribution
- Interactive financial summaries

### 💳 Transaction Management
- Add income and expense transactions
- Edit and delete transactions
- Categorize transactions
- Track transaction dates and amounts
- Persistent transaction storage

### 🎯 Budget Management
- Create budgets for individual categories
- Weekly, monthly, quarterly, and yearly budget periods
- Budget progress tracking
- Budget threshold alerts
- AI-powered budget recommendations
- Adjust existing budgets based on spending patterns

### 📈 Spending Analytics
- Daily spending average
- Weekly spending trends
- Category-wise spending analysis
- Number of categories used
- Unusual transaction detection
- Historical spending analysis

### 🤖 AI-Powered Financial Insights
- Spending pattern analysis
- Financial health score
- Spending trend identification
- Personalized financial recommendations
- Budget optimization suggestions
- Expense prediction using Machine Learning

### 🔮 Expense Prediction
- Machine Learning-based spending prediction
- Linear Regression model
- Next-month expense prediction
- Quarterly spending estimation
- Annual spending estimation
- Historical data-based trend analysis
- Model confidence and R² evaluation

### 💱 Multi-Currency Support
- Support for multiple international currencies
- USD, EUR, GBP, INR, JPY, CAD, AUD and more
- Dynamic currency formatting
- Persistent currency selection

### 🔐 User Authentication
- User registration and login
- Secure authentication
- Persistent user sessions
- Password reset functionality

### 🎨 User Interface
- Responsive dashboard
- Dark/light theme support
- Modern component-based React architecture
- Responsive navigation
- Interactive charts and visualizations

---

## 🛠️ Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide React
- Recharts

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- REST APIs

### Machine Learning

- Python
- Linear Regression
- Historical transaction analysis
- Expense forecasting

### Development Tools

- Git
- GitHub
- VS Code
- npm

---

## 🏗️ Project Architecture

```text
Smart_Expense_Tracker/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── budget/
│   │   │   ├── categories/
│   │   │   ├── dashboard/
│   │   │   ├── forms/
│   │   │   ├── insights/
│   │   │   ├── navigation/
│   │   │   ├── services/
│   │   │   └── settings/
│   │   │
│   │   ├── contexts/
│   │   ├── data/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── index.css
│   │
│   └── package.json
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── server.js
│   └── package.json
│
├── .gitignore
└── README.md
