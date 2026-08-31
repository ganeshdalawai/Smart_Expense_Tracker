import { register } from './components/services/authService';
import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';

import { Sidebar } from './components/navigation/Sidebar';
import { BottomNav } from './components/navigation/BottomNav';

import { Dashboard } from './components/dashboard/Dashboard';
import { TransactionTable } from './components/transactions/TransactionTable';
import { BudgetOverview } from './components/budget/BudgetOverview';
import { CategoryManager } from './components/categories/CategoryManager';
import { AIInsights } from './components/insights/AIInsights';

import { SettingsPage } from './components/settings/Settings';

import { ThemeProvider } from './contexts/ThemeContext';
import { User } from './types';
import { aiInsights } from './data/mockData';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // ============================================================
  // CHECK AUTHENTICATION
  // ============================================================

  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        } catch (error) {
          console.error(
            'Error parsing user data:',
            error
          );

          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }

      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  // ============================================================
  // LOGIN
  // ============================================================

  const handleLogin = (
    email: string,
    password: string,
    userData?: any
  ) => {
    const loggedInUser =
      userData || {
        name: 'John Doe',
        email
      };

    setUser(loggedInUser);

    localStorage.setItem(
      'user',
      JSON.stringify(loggedInUser)
    );
  };

  // ============================================================
  // REGISTER
  // ============================================================

  const handleRegister = async (
    name: string,
    email: string,
    password: string
  ) => {
    try {
      const res = await register({
        name,
        email,
        password
      });

      if (res.user) {
        setUser(res.user);

        localStorage.setItem(
          'user',
          JSON.stringify(res.user)
        );
      }
    } catch (error: any) {
      console.error(
        'Registration failed:',
        error
      );

      alert(
        error.response?.data?.error ||
        'Registration failed. Please try again.'
      );

      throw error;
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    setUser(null);

    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // ============================================================
  // LOADING SCREEN
  // ============================================================

  if (isLoading) {
    return (
      <ThemeProvider>
        <div
          className="
            min-h-screen
            bg-gradient-to-br
            from-gray-50
            via-blue-50
            to-indigo-50
            dark:from-slate-900
            dark:via-slate-900
            dark:to-cyan-950
            flex
            items-center
            justify-center
          "
        >
          <div className="text-center">

            <div
              className="
                w-16
                h-16
                bg-gradient-to-br
                from-cyan-500
                to-teal-600
                rounded-2xl
                flex
                items-center
                justify-center
                mx-auto
                mb-4
                shadow-2xl
                shadow-cyan-500/25
                animate-pulse
              "
            >
              <svg
                className="w-8 h-8 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
              </svg>
            </div>

            <h2
              className="
                text-xl
                font-semibold
                text-gray-900
                dark:text-white
                mb-2
              "
            >
              Loading FinTrack
            </h2>

            <p
              className="
                text-gray-600
                dark:text-gray-300
              "
            >
              Please wait...
            </p>

          </div>
        </div>
      </ThemeProvider>
    );
  }

  // ============================================================
  // APPLICATION
  // ============================================================

  return (
    <ThemeProvider>
      <Router>

        <div
          className="
            min-h-screen
            bg-gradient-to-br
            from-gray-50
            via-blue-50
            to-indigo-50
            dark:from-slate-900
            dark:via-slate-900
            dark:to-cyan-950
            transition-all
            duration-500
          "
        >

          {/* ==================================================
              BACKGROUND EFFECTS
          ================================================== */}

          <div
            className="
              fixed
              inset-0
              overflow-hidden
              pointer-events-none
            "
          >

            <div
              className="
                absolute
                -top-40
                -right-40
                w-80
                h-80
                bg-cyan-500/10
                dark:bg-cyan-500/10
                rounded-full
                blur-3xl
                animate-pulse
              "
            />

            <div
              className="
                absolute
                -bottom-40
                -left-40
                w-80
                h-80
                bg-teal-500/10
                dark:bg-teal-500/10
                rounded-full
                blur-3xl
                animate-pulse
                delay-1000
              "
            />

            <div
              className="
                absolute
                top-1/2
                left-1/2
                transform
                -translate-x-1/2
                -translate-y-1/2
                w-96
                h-96
                bg-cyan-500/5
                dark:bg-cyan-500/5
                rounded-full
                blur-3xl
                animate-pulse
                delay-500
              "
            />

          </div>

          {/* ==================================================
              AUTHENTICATION
          ================================================== */}

          {!user ? (

            <div className="relative z-10">

              <Routes>

                <Route
                  path="/login"
                  element={
                    <LoginForm
                      onLogin={handleLogin}
                      onSwitchToRegister={() => {}}
                    />
                  }
                />

                <Route
                  path="/register"
                  element={
                    <RegisterForm
                      onRegister={handleRegister}
                      onSwitchToLogin={() => {}}
                    />
                  }
                />

                <Route
                  path="*"
                  element={
                    <Navigate
                      to="/login"
                      replace
                    />
                  }
                />

              </Routes>

            </div>

          ) : (

            <>
              {/* ==================================================
                  SIDEBAR
              ================================================== */}

              <Sidebar
                isCollapsed={
                  isSidebarCollapsed
                }
                onToggleCollapse={() =>
                  setIsSidebarCollapsed(
                    !isSidebarCollapsed
                  )
                }
                onLogout={
                  handleLogout
                }
              />

              {/* ==================================================
                  MAIN CONTENT
              ================================================== */}

              <div
                className={`
                  transition-all
                  duration-300
                  relative
                  z-10

                  ${
                    isSidebarCollapsed
                      ? 'md:ml-16'
                      : 'md:ml-64'
                  }
                `}
              >

                <main
                  className="
                    min-h-screen
                    p-6
                    pb-20
                    md:pb-6
                  "
                >

                  <Routes>

                    {/* Dashboard */}

                    <Route
                      path="/dashboard"
                      element={
                        <Dashboard />
                      }
                    />

                    {/* Transactions */}

                    <Route
                      path="/transactions"
                      element={
                        <TransactionTable />
                      }
                    />

                    {/* Budget */}

                    <Route
                      path="/budget"
                      element={
                        <BudgetOverview />
                      }
                    />

                    {/* Categories */}

                    <Route
                      path="/categories"
                      element={
                        <CategoryManager />
                      }
                    />

                    {/* AI Insights */}

                    <Route
                      path="/insights"
                      element={
                        <AIInsights
                          insights={
                            aiInsights
                          }
                        />
                      }
                    />

                    {/* Settings */}

                    <Route
                      path="/settings"
                      element={
                        <SettingsPage />
                      }
                    />

                    {/* Default */}

                    <Route
                      path="*"
                      element={
                        <Navigate
                          to="/dashboard"
                          replace
                        />
                      }
                    />

                  </Routes>

                </main>

              </div>

              {/* ==================================================
                  MOBILE NAVIGATION
              ================================================== */}

              <BottomNav />

            </>

          )}

        </div>

      </Router>
    </ThemeProvider>
  );
}

export default App;