# 💰 FinTrack – Personal Finance Dashboard

[![Built with Bolt.new](https://img.shields.io/badge/Built%20with-Bolt.new-FF6B6B?style=for-the-badge&logo=bolt&logoColor=white)](https://bolt.new)

A comprehensive personal finance management application built with React, TypeScript, and Node.js. Track expenses, manage budgets, and gain AI-powered insights into your financial habits.

## 🚀 Features

- 📊 **Interactive Dashboard** - Real-time financial overview with charts and analytics
- 💳 **Transaction Management** - Add, edit, and categorize income and expenses
- 🎯 **Budget Tracking** - Set budgets and monitor spending across categories
- 🏆 **Savings Goals** - Create and track progress toward financial goals
- 🧠 **AI Insights** - Smart recommendations and spending pattern analysis
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🌙 **Dark/Light Theme** - Toggle between themes for comfortable viewing
- 💱 **Multi-Currency Support** - Support for 12+ major currencies

## 🛠️ Tech Stack

**Frontend:**
- ⚛️ React 18 with TypeScript
- 🎨 Tailwind CSS for styling
- 📊 Custom chart components
- 🔄 React Router for navigation
- 💾 Local storage for persistence

**Backend:**
- 🟢 Node.js with Express
- 🍃 MongoDB with Mongoose
- 🔐 JWT authentication
- 📈 Advanced analytics algorithms

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fintrack
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd ../backend
   npm install
   ```

4. **Set up environment variables**
   
   Create a `.env` file in the backend directory:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   ```

5. **Start the development servers**
   
   Backend:
   ```bash
   cd backend
   npm run dev
   ```
   
   Frontend:
   ```bash
   cd frontend
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to `http://localhost:5173` to view the application.

## 📱 Features Overview

### Dashboard
- Real-time balance and spending overview
- Interactive charts showing income vs expenses
- Recent transactions list
- Quick stats and financial health indicators

### Transaction Management
- Add income and expense transactions
- Categorize transactions with custom categories
- Edit and delete existing transactions
- Advanced filtering and search capabilities

### Budget Management
- Create budgets for different categories
- Track spending against budget limits
- Visual progress indicators
- Budget alerts and notifications

### AI Insights
- Unusual spending detection
- Budget optimization recommendations
- Savings opportunity identification
- Financial health scoring
- Predictive spending forecasts

### Goals & Savings
- Set financial goals with target amounts
- Track progress with visual indicators
- Priority-based goal management
- Recurring goal support

## 🎨 Design Features

- **Glass Morphism UI** - Modern, translucent design elements
- **Smooth Animations** - Micro-interactions and hover effects
- **Responsive Layout** - Optimized for all screen sizes
- **Dark/Light Themes** - Comfortable viewing in any environment
- **Accessibility** - WCAG compliant design patterns

## 🔧 Development

### Project Structure
```
fintrack/
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── services/      # API service functions
│   │   ├── contexts/      # React contexts
│   │   └── types/         # TypeScript type definitions
├── backend/           # Node.js backend application
│   ├── controllers/       # Route controllers
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   └── middlewares/      # Custom middleware
└── README.md
```

### Available Scripts

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

**Backend:**
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ using [Bolt.new](https://bolt.new) - The AI-powered full-stack development platform**