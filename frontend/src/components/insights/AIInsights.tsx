import React, { useState, useEffect } from 'react';

import {
  TrendingUp,
  PiggyBank,
  Target,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Info,
  Brain,
  BarChart3,
  DollarSign,
  Zap,
  RefreshCw,
  Plus,
  Edit3
} from 'lucide-react';

import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useCurrency } from '../settings/CurrencySelector';

import {
  AIInsight,
  AIInsightsOverview,
  getAIInsightsOverview,
  getSpendingAnalysis
} from '../services/aiInsightsService';

import { CreateBudgetForm } from '../forms/CreateBudgetForm';
import { EditBudgetForm } from '../forms/EditBudgetForm';
import { TransactionDetailsModal } from './TransactionDetailsModal';
import { BudgetRecommendationModal } from './BudgetRecommendationModal';
import { SavingsOpportunityModal } from './SavingsOpportunityModal';
import { SpendingForecastModal } from './SpendingForecastModal';

import {
  getBudgets,
  Budget
} from '../services/budgetService';

export const AIInsights: React.FC = () => {
  const [insightsData, setInsightsData] =
    useState<AIInsightsOverview | null>(null);

  const [budgets, setBudgets] =
    useState<Budget[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [activeTab, setActiveTab] = useState<
    'overview' |
    'analysis' |
    'recommendations' |
    'health' |
    'predictions'
  >('overview');

  const [refreshing, setRefreshing] =
    useState(false);

  // =========================================================
  // MODAL STATES
  // =========================================================

  const [isCreateBudgetOpen, setIsCreateBudgetOpen] =
    useState(false);

  const [isEditBudgetOpen, setIsEditBudgetOpen] =
    useState(false);

  const [editingBudget, setEditingBudget] =
    useState<Budget | null>(null);

  const [budgetRecommendationForForm, setBudgetRecommendationForForm] =
  useState<any | null>(null);

  const [isTransactionDetailsOpen, setIsTransactionDetailsOpen] =
    useState(false);

  const [selectedInsight, setSelectedInsight] =
    useState<AIInsight | null>(null);

  const [isBudgetRecommendationOpen, setIsBudgetRecommendationOpen] =
    useState(false);

  const [isSavingsOpportunityOpen, setIsSavingsOpportunityOpen] =
    useState(false);

  const [isSpendingForecastOpen, setIsSpendingForecastOpen] =
    useState(false);

  const { formatAmount } = useCurrency();

  // =========================================================
  // FETCH AI INSIGHTS
  // =========================================================

  const fetchInsights = async () => {
    try {
      setIsLoading(true);

      /*
       * Get:
       * 1. AI overview
       * 2. Current budgets
       * 3. Current month spending analysis
       */
      const [
        insightsResponse,
        budgetsResponse,
        spendingResponse
      ] = await Promise.all([
        getAIInsightsOverview(),
        getBudgets(),
        getSpendingAnalysis('month')
      ]);

      /*
       * IMPORTANT:
       *
       * getSpendingAnalysis('month') gives us the
       * CURRENT MONTH spending analysis.
       *
       * categoryDistribution inside this response
       * therefore contains only categories used during
       * the current month.
       *
       * We intentionally DO NOT use:
       *
       * insightsResponse.spendingPatterns.categoriesUsed
       *
       * because that can represent categories from the
       * user's complete transaction history.
       */
      const updatedInsightsData: AIInsightsOverview = {
        ...insightsResponse,

        spendingPatterns: {
          ...spendingResponse.analysis,

          /*
           * Keep categoryDistribution from the CURRENT
           * MONTH analysis.
           *
           * Categories Used is calculated in the UI from
           * the number of keys in this object.
           */
          categoryDistribution:
            spendingResponse.analysis
              ?.categoryDistribution || {}
        }
      };

      setInsightsData(
        updatedInsightsData
      );

      setBudgets(
        budgetsResponse
      );

    } catch (error) {
      console.error(
        'Error fetching AI insights:',
        error
      );

      // =====================================================
      // FALLBACK DATA
      // =====================================================

      setInsightsData({
        insights: [
          {
            id: 'demo-1',
            type: 'warning',
            title: 'High Spending Alert',
            description:
              "You've spent 25% more on dining out this month compared to last month.",
            icon: 'AlertTriangle',
            priority: 'high',
            actionText: 'View Details'
          },
          {
            id: 'demo-2',
            type: 'recommendation',
            title: 'Budget Optimization',
            description:
              'Consider increasing your grocery budget by $150 based on your spending patterns.',
            icon: 'Target',
            priority: 'medium',
            actionText: 'Adjust Budget'
          },
          {
            id: 'demo-3',
            type: 'success',
            title: 'Savings Achievement',
            description:
              "Great job! You've saved 15% more than your target this month.",
            icon: 'PiggyBank',
            priority: 'low',
            actionText: 'View Progress'
          }
        ],

        summary: {
          totalInsights: 3,
          highPriority: 1,
          financialHealthScore: 75,
          monthlySpending: 2500,
          savingsRate: '15.5'
        },

        spendingPatterns: {
          dailyAverage: 83.33,

          weeklyTrend: [],

          categoryDistribution: {},

          unusualSpending: []
        },

        budgetRecommendations: [],

        financialHealth: {
          score: 75,
          savingsRate: '15.5',
          budgetAdherence: '85.2',
          budgetsOverLimit: 1,
          recommendation: 'Good'
        },

        predictions: {
          nextMonth: 2625,
          nextQuarter: 8100,
          nextYear: 30600,
          confidenceLevel: 'medium'
        }
      });

    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================
  // REFRESH
  // =========================================================

  const handleRefresh = async () => {
    setRefreshing(true);

    await fetchInsights();

    setRefreshing(false);
  };

  // =========================================================
  // INSIGHT ACTIONS
  // =========================================================

  const handleInsightAction = (
    insight: AIInsight
  ) => {
    setSelectedInsight(
      insight
    );

    switch (insight.id) {
      case 'unusual-spending':
        setIsTransactionDetailsOpen(true);
        break;

      case 'budget-recommendations':
        setIsBudgetRecommendationOpen(true);
        break;

      case 'financial-health':
        setActiveTab('health');
        break;

      case 'savings-opportunity':
        setIsSavingsOpportunityOpen(true);
        break;

      case 'spending-prediction':
        setIsSpendingForecastOpen(true);
        break;

      default:
        console.log(
          'Action for insight:',
          insight.title
        );
    }
  };

  // =========================================================
  // BUDGET RECOMMENDATION ACTION
  // =========================================================

  const handleBudgetRecommendationAction = (
  recommendation: any
) => {

  // ---------------------------------------------------------
  // CREATE NEW BUDGET
  // ---------------------------------------------------------

  if (
    recommendation.type ===
    'create_budget'
  ) {

    /*
     * Store the AI recommendation.
     *
     * CreateBudgetForm will use this to automatically
     * fill:
     *
     * - Budget Name
     * - Category
     * - Suggested Budget
     * - Period
     */
    setBudgetRecommendationForForm(
      recommendation
    );

    setIsCreateBudgetOpen(
      true
    );

    return;
  }

  // ---------------------------------------------------------
  // ADJUST EXISTING BUDGET
  // ---------------------------------------------------------

  const existingBudget =
    budgets.find(
      budget =>
        budget.category ===
        recommendation.category
    );

  if (
    existingBudget
  ) {

    setEditingBudget(
      existingBudget
    );

    setIsEditBudgetOpen(
      true
    );

  } else {

    /*
     * No existing budget found.
     *
     * Treat it as a new budget recommendation.
     */
    setBudgetRecommendationForForm(
      recommendation
    );

    setIsCreateBudgetOpen(
      true
    );
  }
};

  // =========================================================
  // FORM SUCCESS
  // =========================================================

  const handleFormSuccess = () => {

  setBudgetRecommendationForForm(
    null
  );

  fetchInsights();
};

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchInsights();
  }, []);

  // =========================================================
  // ICONS
  // =========================================================

  const getIcon = (
    iconName: string
  ) => {
    const iconMap: Record<
      string,
      React.ReactNode
    > = {
      TrendingUp:
        <TrendingUp className="w-6 h-6" />,

      PiggyBank:
        <PiggyBank className="w-6 h-6" />,

      Target:
        <Target className="w-6 h-6" />,

      AlertTriangle:
        <AlertTriangle className="w-6 h-6" />,

      CheckCircle:
        <CheckCircle className="w-6 h-6" />,

      Info:
        <Info className="w-6 h-6" />,

      BarChart3:
        <BarChart3 className="w-6 h-6" />,

      DollarSign:
        <DollarSign className="w-6 h-6" />
    };

    return (
      iconMap[iconName] ||
      <TrendingUp className="w-6 h-6" />
    );
  };

  // =========================================================
  // ICON COLORS
  // =========================================================

  const getIconColor = (
    type: string
  ) => {
    const colorMap: Record<
      string,
      string
    > = {
      success:
        'text-green-500 dark:text-green-400 bg-green-50 dark:bg-green-500/20',

      warning:
        'text-yellow-500 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/20',

      error:
        'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/20',

      info:
        'text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/20',

      recommendation:
        'text-purple-500 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/20'
    };

    return (
      colorMap[type] ||
      'text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-500/20'
    );
  };

  // =========================================================
  // PRIORITY BADGE
  // =========================================================

  const getPriorityBadge = (
    priority: string
  ) => {
    const badges: Record<
      string,
      {
        color: string;
        label: string;
      }
    > = {
      high: {
        color:
          'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400',
        label: 'High'
      },

      medium: {
        color:
          'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
        label: 'Medium'
      },

      low: {
        color:
          'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400',
        label: 'Low'
      }
    };

    const badge =
      badges[priority] ||
      badges.low;

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}
      >
        {badge.label}
      </span>
    );
  };

  // =========================================================
  // PREDICTION CHANGE
  // =========================================================

  const getPredictionChange = () => {
    if (!insightsData) {
      return 0;
    }

    const currentSpending =
      Number(
        insightsData.summary
          .monthlySpending
      ) || 0;

    const predictedSpending =
      Number(
        insightsData.predictions
          .nextMonth
      ) || 0;

    if (
      currentSpending <= 0
    ) {
      return 0;
    }

    return (
      ((predictedSpending -
        currentSpending) /
        currentSpending) *
      100
    );
  };

  const predictionChange =
    insightsData?.predictions
      .trendPercentage !==
    undefined
      ? Number(
          insightsData.predictions
            .trendPercentage
        )
      : getPredictionChange();

  // =========================================================
  // PREDICTION TREND TEXT
  // =========================================================

  const getPredictionTrendText = () => {
    if (!insightsData) {
      return 'Unable to calculate spending trend';
    }

    const trendDirection =
      insightsData.predictions
        .trendDirection;

    if (
      trendDirection ===
      'stable'
    ) {
      return 'Your spending is projected to remain stable next month';
    }

    if (
      trendDirection ===
      'increasing'
    ) {
      return `Your spending is projected to increase by ${Math.abs(
        predictionChange
      ).toFixed(1)}% next month`;
    }

    if (
      trendDirection ===
      'decreasing'
    ) {
      return `Your spending is projected to decrease by ${Math.abs(
        predictionChange
      ).toFixed(1)}% next month`;
    }

    if (
      Math.abs(
        predictionChange
      ) < 1
    ) {
      return 'Your spending is projected to remain stable next month';
    }

    if (
      predictionChange > 0
    ) {
      return `Your spending is projected to increase by ${predictionChange.toFixed(
        1
      )}% next month`;
    }

    return `Your spending is projected to decrease by ${Math.abs(
      predictionChange
    ).toFixed(1)}% next month`;
  };

  // =========================================================
  // PREDICTION RECOMMENDATION
  // =========================================================

  const getPredictionRecommendation = () => {
    if (!insightsData) {
      return 'No prediction data is available.';
    }

    const prediction =
      insightsData.predictions;

    const change =
      prediction.trendPercentage ??
      0;

    const direction =
      prediction.trendDirection;

    if (
      direction ===
        'increasing' ||
      change > 5
    ) {
      return 'Your spending is expected to increase. Consider reviewing your expenses and adjusting your budgets before next month.';
    }

    if (
      direction ===
        'decreasing' ||
      change < -5
    ) {
      return 'Your spending is expected to decrease. This is a good opportunity to maintain your current spending habits and increase your savings.';
    }

    return 'Your spending is expected to remain relatively stable. Continue monitoring your expenses and staying within your budgets.';
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (isLoading) {
    return (
      <div className="space-y-6">

        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              AI Insights
            </h1>

            <p className="text-gray-600 dark:text-gray-300">
              Loading your personalized financial insights...
            </p>

          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {[1, 2, 3].map(
            i => (
              <div
                key={i}
                className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-slate-700/50 rounded-2xl p-6 animate-pulse"
              >

                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2 mb-2" />

                <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />

              </div>
            )
          )}

        </div>

      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (!insightsData) {
    return (
      <div className="space-y-6">

        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              AI Insights
            </h1>

            <p className="text-gray-600 dark:text-gray-300">
              Unable to load insights. Please try again.
            </p>

          </div>

          <Button
            onClick={
              handleRefresh
            }
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>

        </div>

      </div>
    );
  }

  // =========================================================
  // CURRENT MONTH CATEGORY COUNT
  // =========================================================

  /*
   * This is the important part.
   *
   * categoryDistribution comes from:
   *
   * getSpendingAnalysis('month')
   *
   * Therefore its keys represent ONLY categories that
   * have been used in the CURRENT MONTH.
   *
   * Example:
   *
   * {
   *   "Food & Dining": {...}
   * }
   *
   * => 1
   *
   * If Transportation is added:
   *
   * {
   *   "Food & Dining": {...},
   *   "Transportation": {...}
   * }
   *
   * => 2
   */
  const currentMonthCategoryCount =
    Object.keys(
      insightsData
        .spendingPatterns
        .categoryDistribution || {}
    ).length;

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex items-center justify-between">

        <div className="min-w-0 flex-1">

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            AI Insights
          </h1>

          <p className="text-gray-600 dark:text-gray-300 truncate">
            Personalized recommendations based on your financial data
          </p>

        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">

          <Button
            variant="glass"
            size="sm"
            onClick={
              handleRefresh
            }
            disabled={refreshing}
          >

            <RefreshCw
              className={`w-4 h-4 mr-2 ${
                refreshing
                  ? 'animate-spin'
                  : ''
              }`}
            />

            <span className="hidden sm:inline">
              Refresh
            </span>

          </Button>

        </div>

      </div>

      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        {/* Financial Health */}

        <Card className="p-4">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Financial Health
              </p>

              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {
                  insightsData.summary
                    .financialHealthScore
                }/100
              </p>

            </div>

            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">

              <Brain className="w-5 h-5 text-blue-500 dark:text-blue-400" />

            </div>

          </div>

        </Card>

        {/* Monthly Spending */}

        <Card className="p-4">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Monthly Spending
              </p>

              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatAmount(
                  insightsData.summary
                    .monthlySpending
                )}
              </p>

            </div>

            <div className="w-10 h-10 bg-red-50 dark:bg-red-500/20 rounded-xl flex items-center justify-center">

              <DollarSign className="w-5 h-5 text-red-500 dark:text-red-400" />

            </div>

          </div>

        </Card>

        {/* Savings Rate */}

        <Card className="p-4">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Savings Rate
              </p>

              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {
                  insightsData.summary
                    .savingsRate
                }%
              </p>

            </div>

            <div className="w-10 h-10 bg-green-50 dark:bg-green-500/20 rounded-xl flex items-center justify-center">

              <PiggyBank className="w-5 h-5 text-green-500 dark:text-green-400" />

            </div>

          </div>

        </Card>

        {/* High Priority */}

        <Card className="p-4">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                High Priority
              </p>

              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {
                  insightsData.summary
                    .highPriority
                }
              </p>

            </div>

            <div className="w-10 h-10 bg-red-50 dark:bg-red-500/20 rounded-xl flex items-center justify-center">

              <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400" />

            </div>

          </div>

        </Card>

      </div>

      {/* =====================================================
          TAB NAVIGATION
      ===================================================== */}

      <div className="flex items-center space-x-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-1 overflow-x-auto">

        {[
          {
            id: 'overview',
            label: 'Overview',
            icon: Brain
          },
          {
            id: 'analysis',
            label: 'Analysis',
            icon: BarChart3
          },
          {
            id: 'recommendations',
            label: 'Recommendations',
            icon: Target
          },
          {
            id: 'health',
            label: 'Health Score',
            icon: CheckCircle
          },
          {
            id: 'predictions',
            label: 'Predictions',
            icon: TrendingUp
          }
        ].map(tab => {

          const Icon =
            tab.icon;

          return (
            <button
              key={
                tab.id
              }
              onClick={() =>
                setActiveTab(
                  tab.id as
                    | 'overview'
                    | 'analysis'
                    | 'recommendations'
                    | 'health'
                    | 'predictions'
                )
              }
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                activeTab ===
                tab.id
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >

              <Icon className="w-4 h-4" />

              <span className="hidden sm:inline">
                {
                  tab.label
                }
              </span>

            </button>
          );
        })}

      </div>

      {/* =====================================================
          OVERVIEW
      ===================================================== */}

      {activeTab ===
        'overview' && (

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {insightsData.insights.map(
            insight => (

              <Card
                key={
                  insight.id
                }
                className="hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:scale-105"
              >

                <div className="space-y-4">

                  <div className="flex items-start justify-between">

                    <div className="flex items-start space-x-4 min-w-0 flex-1">

                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 dark:border-slate-600/30 flex-shrink-0 ${getIconColor(
                          insight.type
                        )}`}
                      >
                        {getIcon(
                          insight.icon
                        )}
                      </div>

                      <div className="min-w-0 flex-1">

                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {
                            insight.title
                          }
                        </h3>

                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                          {
                            insight.description
                          }
                        </p>

                      </div>

                    </div>

                    <div className="flex-shrink-0 ml-2">
                      {getPriorityBadge(
                        insight.priority
                      )}
                    </div>

                  </div>

                  {insight.actionText && (

                    <Button
                      variant="glass"
                      className="w-full justify-between group hover:bg-blue-50 dark:hover:bg-blue-500/20 hover:border-blue-300 dark:hover:border-blue-500/30"
                      onClick={() =>
                        handleInsightAction(
                          insight
                        )
                      }
                    >

                      <span>
                        {
                          insight.actionText
                        }
                      </span>

                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />

                    </Button>

                  )}

                </div>

              </Card>

            )
          )}

        </div>
      )}

      {/* =====================================================
          ANALYSIS
      ===================================================== */}

      {activeTab ===
        'analysis' && (

        <div className="space-y-6">

          {/* =================================================
              SUMMARY
          ================================================= */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Daily Average */}

            <Card>

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Daily Average
                  </p>

                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {formatAmount(
                      insightsData
                        .spendingPatterns
                        .dailyAverage
                    )}
                  </p>

                </div>

                <div className="w-11 h-11 rounded-xl bg-blue-500/20 flex items-center justify-center">

                  <TrendingUp className="w-5 h-5 text-blue-500" />

                </div>

              </div>

            </Card>

            {/* =================================================
                CATEGORIES USED - CURRENT MONTH
                ================================================= */}

            <Card>

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Categories Used
                  </p>

                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {currentMonthCategoryCount}
                  </p>

                </div>

                <div className="w-11 h-11 rounded-xl bg-purple-500/20 flex items-center justify-center">

                  <BarChart3 className="w-5 h-5 text-purple-500" />

                </div>

              </div>

            </Card>

            {/* Unusual Transactions */}

            <Card>

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Unusual Transactions
                  </p>

                  <p
                    className={`text-2xl font-bold mt-1 ${
                      insightsData
                        .spendingPatterns
                        .unusualSpending
                        .length > 0
                        ? 'text-red-500'
                        : 'text-green-500'
                    }`}
                  >
                    {
                      insightsData
                        .spendingPatterns
                        .unusualSpending
                        .length
                    }
                  </p>

                </div>

                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                    insightsData
                      .spendingPatterns
                      .unusualSpending
                      .length > 0
                      ? 'bg-red-500/20'
                      : 'bg-green-500/20'
                  }`}
                >

                  {insightsData
                    .spendingPatterns
                    .unusualSpending
                    .length > 0 ? (

                    <AlertTriangle className="w-5 h-5 text-red-500" />

                  ) : (

                    <CheckCircle className="w-5 h-5 text-green-500" />

                  )}

                </div>

              </div>

            </Card>

          </div>

          {/* =================================================
              WEEKLY SPENDING
          ================================================= */}

          <Card>

            <div className="space-y-5">

              <div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Weekly Spending Trend
                </h3>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Your spending across the current month
                </p>

              </div>

              {insightsData
                .spendingPatterns
                .weeklyTrend
                .length > 0 ? (

                <div className="space-y-4">

                  {insightsData
                    .spendingPatterns
                    .weeklyTrend
                    .map(
                      (
                        week: any,
                        index: number
                      ) => {

                        const maxSpent =
                          Math.max(
                            ...insightsData
                              .spendingPatterns
                              .weeklyTrend
                              .map(
                                (
                                  w: any
                                ) =>
                                  Number(
                                    w.spent
                                  ) ||
                                  0
                              ),
                            1
                          );

                        const spent =
                          Number(
                            week.spent
                          ) ||
                          0;

                        const percentage =
                          (spent /
                            maxSpent) *
                          100;

                        return (
                          <div
                            key={
                              index
                            }
                          >

                            <div className="flex justify-between items-center mb-2">

                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {
                                  week.week
                                }
                              </span>

                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {formatAmount(
                                  spent
                                )}
                              </span>

                            </div>

                            <div className="w-full h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">

                              <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                style={{
                                  width: `${percentage}%`
                                }}
                              />

                            </div>

                          </div>
                        );
                      }
                    )}

                </div>

              ) : (

                <div className="text-center py-8">

                  <BarChart3 className="w-10 h-10 text-gray-400 mx-auto mb-3" />

                  <p className="text-gray-500 dark:text-gray-400">
                    No weekly spending data available
                  </p>

                </div>

              )}

            </div>

          </Card>

          {/* =================================================
              CATEGORY DISTRIBUTION
          ================================================= */}

          <Card>

            <div className="space-y-5">

              <div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Spending by Category
                </h3>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  See where your money is being spent
                </p>

              </div>

              {Object.keys(
                insightsData
                  .spendingPatterns
                  .categoryDistribution
              ).length > 0 ? (

                <div className="space-y-4">

                  {Object.entries(
                    insightsData
                      .spendingPatterns
                      .categoryDistribution
                  )
                    .sort(
                      ([, a], [, b]) =>
                        b.total -
                        a.total
                    )
                    .map(
                      (
                        [
                          category,
                          data
                        ]
                      ) => {

                        const totalSpent =
                          Object.values(
                            insightsData
                              .spendingPatterns
                              .categoryDistribution
                          ).reduce(
                            (
                              sum,
                              item
                            ) =>
                              sum +
                              (Number(
                                item.total
                              ) ||
                                0),
                            0
                          );

                        const percentage =
                          totalSpent >
                          0
                            ? (data.total /
                                totalSpent) *
                              100
                            : 0;

                        return (
                          <div
                            key={
                              category
                            }
                            className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl"
                          >

                            <div className="flex justify-between items-center mb-2">

                              <div>

                                <p className="font-medium text-gray-900 dark:text-white">
                                  {
                                    category
                                  }
                                </p>

                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {
                                    data.count
                                  }{' '}
                                  transaction
                                  {data.count !==
                                  1
                                    ? 's'
                                    : ''}
                                </p>

                              </div>

                              <div className="text-right">

                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {formatAmount(
                                    data.total
                                  )}
                                </p>

                                <p className="text-xs text-blue-500 dark:text-blue-400">
                                  {percentage.toFixed(
                                    1
                                  )}
                                  %
                                </p>

                              </div>

                            </div>

                            <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">

                              <div
                                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                                style={{
                                  width: `${percentage}%`
                                }}
                              />

                            </div>

                          </div>
                        );
                      }
                    )}

                </div>

              ) : (

                <div className="text-center py-8">

                  <PiggyBank className="w-10 h-10 text-gray-400 mx-auto mb-3" />

                  <p className="text-gray-500 dark:text-gray-400">
                    No category spending data available
                  </p>

                </div>

              )}

            </div>

          </Card>

          {/* =================================================
              UNUSUAL SPENDING
          ================================================= */}

          <Card>

            <div className="space-y-5">

              <div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Unusual Spending
                </h3>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Transactions that differ significantly from your normal spending
                </p>

              </div>

              {insightsData
                .spendingPatterns
                .unusualSpending
                .length > 0 ? (

                <div className="space-y-3">

                  {insightsData
                    .spendingPatterns
                    .unusualSpending
                    .map(
                      (
                        item: any,
                        index: number
                      ) => (

                        <div
                          key={
                            index
                          }
                          className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl"
                        >

                          <div className="flex items-center gap-3">

                            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">

                              <AlertTriangle className="w-5 h-5 text-red-500" />

                            </div>

                            <div>

                              <p className="font-medium text-gray-900 dark:text-white">
                                {
                                  item
                                    .transaction
                                    ?.title ||
                                  'Unusual Transaction'
                                }
                              </p>

                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {
                                  item.deviation
                                }
                                % above normal
                              </p>

                            </div>

                          </div>

                          <span className="font-semibold text-red-500">

                            {item
                              .transaction
                              ?.amount !==
                            undefined
                              ? formatAmount(
                                  Math.abs(
                                    Number(
                                      item
                                        .transaction
                                        .amount
                                    )
                                  )
                                )
                              : '--'}

                          </span>

                        </div>

                      )
                    )}

                </div>

              ) : (

                <div className="flex flex-col items-center justify-center py-8">

                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-3">

                    <CheckCircle className="w-6 h-6 text-green-500" />

                  </div>

                  <p className="font-medium text-gray-900 dark:text-white">
                    No unusual spending detected
                  </p>

                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Your transactions look normal based on your spending patterns.
                  </p>

                </div>

              )}

            </div>

          </Card>

        </div>
      )}

      {/* =====================================================
          RECOMMENDATIONS
      ===================================================== */}

      {activeTab ===
        'recommendations' && (

        <div className="space-y-6">

          {insightsData
            .budgetRecommendations
            .length > 0 ? (

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {insightsData
                .budgetRecommendations
                .map(
                  (
                    rec,
                    index
                  ) => (

                    <Card
                      key={
                        index
                      }
                      className="hover:shadow-lg transition-shadow"
                    >

                      <div className="space-y-4">

                        <div className="flex items-start justify-between">

                          <div className="flex-1">

                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 capitalize">
                              {
                                rec.type.replace(
                                  '_',
                                  ' '
                                )
                              }{' '}
                              -{' '}
                              {
                                rec.category
                              }
                            </h3>

                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                              {
                                rec.message
                              }
                            </p>

                          </div>

                          {getPriorityBadge(
                            rec.priority
                          )}

                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-gray-200/50 dark:border-slate-700/50">

                          {rec.currentBudget !==
                            undefined && (

                            <div className="text-sm">

                              <span className="text-gray-500 dark:text-gray-400">
                                Current:{' '}
                              </span>

                              <span className="font-medium">
                                {formatAmount(
                                  rec.currentBudget
                                )}
                              </span>

                            </div>

                          )}

                          <div className="text-sm">

                            <span className="text-gray-500 dark:text-gray-400">
                              Suggested:{' '}
                            </span>

                            <span className="font-medium text-blue-600 dark:text-blue-400">
                              {formatAmount(
                                rec.suggestedBudget
                              )}
                            </span>

                          </div>

                        </div>

                        <Button
                          variant="glass"
                          className="w-full"
                          onClick={() =>
                            handleBudgetRecommendationAction(
                              rec
                            )
                          }
                        >

                          {rec.type ===
                          'create_budget' ? (

                            <>
                              <Plus className="w-4 h-4 mr-2" />
                              Create Budget
                            </>

                          ) : (

                            <>
                              <Edit3 className="w-4 h-4 mr-2" />
                              Adjust Budget
                            </>

                          )}

                        </Button>

                      </div>

                    </Card>

                  )
                )}

            </div>

          ) : (

            <Card className="text-center py-12">

              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Recommendations
              </h3>

              <p className="text-gray-600 dark:text-gray-300">
                Your budgets are well-optimized! Keep up the good work.
              </p>

            </Card>

          )}

        </div>
      )}

      {/* =====================================================
          HEALTH SCORE
      ===================================================== */}

      {activeTab ===
        'health' && (

        <div className="space-y-6">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <Card>

              <div className="space-y-6">

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Financial Health Score
                </h3>

                <div className="flex flex-col items-center justify-center py-4">

                  <div className="relative w-36 h-36">

                    <svg
                      className="w-36 h-36 transform -rotate-90"
                      viewBox="0 0 120 120"
                    >

                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-gray-200 dark:text-slate-700"
                      />

                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`
                          ${
                            (insightsData
                              .financialHealth
                              .score /
                              100) *
                            314
                          } 314
                        `}
                        className={
                          insightsData
                            .financialHealth
                            .score >=
                          80
                            ? 'text-green-500'
                            : insightsData
                                .financialHealth
                                .score >=
                              60
                            ? 'text-yellow-500'
                            : 'text-red-500'
                        }
                      />

                    </svg>

                    <div className="absolute inset-0 flex items-center justify-center">

                      <div className="text-center">

                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                          {
                            insightsData
                              .financialHealth
                              .score
                          }
                        </span>

                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          / 100
                        </p>

                      </div>

                    </div>

                  </div>

                  <p className="text-xl font-semibold text-gray-900 dark:text-white mt-4">
                    {
                      insightsData
                        .financialHealth
                        .recommendation
                    }
                  </p>

                  <p className="text-gray-600 dark:text-gray-300 text-center mt-1">
                    Your overall financial health is{' '}
                    {insightsData
                      .financialHealth
                      .recommendation.toLowerCase()}
                    .
                  </p>

                </div>

              </div>

            </Card>

            <Card>

              <div className="space-y-5">

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Health Breakdown
                </h3>

                <div className="space-y-3">

                  <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-500/20 rounded-xl">

                    <div>

                      <p className="font-medium text-green-700 dark:text-green-300">
                        Savings Rate
                      </p>

                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Money saved from your income
                      </p>

                    </div>

                    <span className="text-lg font-semibold text-green-800 dark:text-green-200">
                      {
                        insightsData
                          .financialHealth
                          .savingsRate
                      }
                      %
                    </span>

                  </div>

                  <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-500/20 rounded-xl">

                    <div>

                      <p className="font-medium text-blue-700 dark:text-blue-300">
                        Budget Adherence
                      </p>

                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        How well you stay within budgets
                      </p>

                    </div>

                    <span className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                      {
                        insightsData
                          .financialHealth
                          .budgetAdherence
                      }
                      %
                    </span>

                  </div>

                  <div className="flex justify-between items-center p-4 bg-red-50 dark:bg-red-500/20 rounded-xl">

                    <div>

                      <p className="font-medium text-red-700 dark:text-red-300">
                        Budgets Over Limit
                      </p>

                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Number of budgets exceeding their limit
                      </p>

                    </div>

                    <span className="text-lg font-semibold text-red-800 dark:text-red-200">
                      {
                        insightsData
                          .financialHealth
                          .budgetsOverLimit
                      }
                    </span>

                  </div>

                </div>

              </div>

            </Card>

          </div>

          <Card>

            <div className="space-y-5">

              <div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Score Contribution
                </h3>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  How your financial health score is calculated
                </p>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="p-4 rounded-xl bg-green-50 dark:bg-green-500/20">

                  <div className="flex items-center justify-between mb-2">

                    <span className="font-medium text-green-700 dark:text-green-300">
                      Savings Rate
                    </span>

                    <span className="font-bold text-green-800 dark:text-green-200">
                      {insightsData
                        .financialHealth
                        .scoreBreakdown
                        ?.savingsRate ??
                        '--'}{' '}
                      / 40
                    </span>

                  </div>

                  <div className="w-full h-2 bg-green-100 dark:bg-green-900/40 rounded-full overflow-hidden">

                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          ((insightsData
                            .financialHealth
                            .scoreBreakdown
                            ?.savingsRate ??
                            0) /
                            40) *
                            100
                        )}%`
                      }}
                    />

                  </div>

                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                    Maximum contribution: 40 points
                  </p>

                </div>

                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/20">

                  <div className="flex items-center justify-between mb-2">

                    <span className="font-medium text-blue-700 dark:text-blue-300">
                      Budget Adherence
                    </span>

                    <span className="font-bold text-blue-800 dark:text-blue-200">
                      {insightsData
                        .financialHealth
                        .scoreBreakdown
                        ?.budgetAdherence ??
                        '--'}{' '}
                      / 30
                    </span>

                  </div>

                  <div className="w-full h-2 bg-blue-100 dark:bg-blue-900/40 rounded-full overflow-hidden">

                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          ((insightsData
                            .financialHealth
                            .scoreBreakdown
                            ?.budgetAdherence ??
                            0) /
                            30) *
                            100
                        )}%`
                      }}
                    />

                  </div>

                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    Maximum contribution: 30 points
                  </p>

                </div>

                <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-500/20">

                  <div className="flex items-center justify-between mb-2">

                    <span className="font-medium text-purple-700 dark:text-purple-300">
                      Spending Trend
                    </span>

                    <span className="font-bold text-purple-800 dark:text-purple-200">
                      {insightsData
                        .financialHealth
                        .scoreBreakdown
                        ?.spendingTrend ??
                        '--'}{' '}
                      / 20
                    </span>

                  </div>

                  <div className="w-full h-2 bg-purple-100 dark:bg-purple-900/40 rounded-full overflow-hidden">

                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          ((insightsData
                            .financialHealth
                            .scoreBreakdown
                            ?.spendingTrend ??
                            0) /
                            20) *
                            100
                        )}%`
                      }}
                    />

                  </div>

                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                    Maximum contribution: 20 points
                  </p>

                </div>

                <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-500/20">

                  <div className="flex items-center justify-between mb-2">

                    <span className="font-medium text-yellow-700 dark:text-yellow-300">
                      Income Stability
                    </span>

                    <span className="font-bold text-yellow-800 dark:text-yellow-200">
                      {insightsData
                        .financialHealth
                        .scoreBreakdown
                        ?.incomeStability ??
                        '--'}{' '}
                      / 10
                    </span>

                  </div>

                  <div className="w-full h-2 bg-yellow-100 dark:bg-yellow-900/40 rounded-full overflow-hidden">

                    <div
                      className="h-full bg-yellow-500 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          ((insightsData
                            .financialHealth
                            .scoreBreakdown
                            ?.incomeStability ??
                            0) /
                            10) *
                            100
                        )}%`
                      }}
                    />

                  </div>

                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                    Maximum contribution: 10 points
                  </p>

                </div>

              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">

                <span className="font-semibold text-gray-900 dark:text-white">
                  Total Financial Health Score
                </span>

                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {
                    insightsData
                      .financialHealth
                      .score
                  }{' '}
                  / 100
                </span>

              </div>

            </div>

          </Card>

          <Card>

            <div className="flex items-start gap-4">

              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  insightsData
                    .financialHealth
                    .score >=
                  80
                    ? 'bg-green-100 dark:bg-green-500/20'
                    : insightsData
                        .financialHealth
                        .score >=
                      60
                    ? 'bg-yellow-100 dark:bg-yellow-500/20'
                    : 'bg-red-100 dark:bg-red-500/20'
                }`}
              >

                <CheckCircle
                  className={`w-6 h-6 ${
                    insightsData
                      .financialHealth
                      .score >=
                    80
                      ? 'text-green-500'
                      : insightsData
                          .financialHealth
                          .score >=
                        60
                      ? 'text-yellow-500'
                      : 'text-red-500'
                  }`}
                />

              </div>

              <div>

                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Financial Recommendation
                </h3>

                <p className="text-gray-600 dark:text-gray-300 mt-1">

                  {
                    insightsData
                      .financialHealth
                      .recommendation ===
                    'Excellent'
                      ? 'Excellent work! Continue maintaining your savings and spending habits.'
                      : insightsData
                          .financialHealth
                          .recommendation ===
                        'Good'
                      ? 'Your finances are in good shape. Continue controlling expenses and maintaining a healthy savings rate.'
                      : insightsData
                          .financialHealth
                          .recommendation ===
                        'Fair'
                      ? 'Your financial health has room for improvement. Focus on reducing unnecessary expenses and increasing savings.'
                      : 'Your finances need attention. Focus on reducing expenses, staying within budgets, and improving your savings rate.'
                  }

                </p>

              </div>

            </div>

          </Card>

        </div>

      )}

      {/* =====================================================
          PREDICTIONS
      ===================================================== */}

      {activeTab ===
        'predictions' && (

        <div className="space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <Card>

              <div className="space-y-4">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Next Month
                    </p>

                    <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                      {formatAmount(
                        insightsData
                          .predictions
                          .nextMonth
                      )}
                    </h3>

                  </div>

                  <div className="w-11 h-11 rounded-xl bg-blue-500/20 flex items-center justify-center">

                    <TrendingUp className="w-5 h-5 text-blue-500" />

                  </div>

                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Predicted spending for the next month
                </p>

              </div>

            </Card>

            <Card>

              <div className="space-y-4">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Next Quarter
                    </p>

                    <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                      {formatAmount(
                        insightsData
                          .predictions
                          .nextQuarter
                      )}
                    </h3>

                  </div>

                  <div className="w-11 h-11 rounded-xl bg-purple-500/20 flex items-center justify-center">

                    <BarChart3 className="w-5 h-5 text-purple-500" />

                  </div>

                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Estimated spending over the next 3 months
                </p>

              </div>

            </Card>

            <Card>

              <div className="space-y-4">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Next Year
                    </p>

                    <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                      {formatAmount(
                        insightsData
                          .predictions
                          .nextYear
                      )}
                    </h3>

                  </div>

                  <div className="w-11 h-11 rounded-xl bg-green-500/20 flex items-center justify-center">

                    <Target className="w-5 h-5 text-green-500" />

                  </div>

                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Estimated annual spending
                </p>

              </div>

            </Card>

          </div>

          <Card>

            <div className="space-y-5">

              <div className="flex items-center justify-between">

                <div>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Prediction Overview
                  </h3>

                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    AI-powered analysis of your spending pattern
                  </p>

                </div>

                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                  ML Powered
                </span>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Current Monthly Spending
                  </p>

                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                    {formatAmount(
                      insightsData
                        .summary
                        .monthlySpending
                    )}
                  </p>

                </div>

                <div className="flex items-center justify-center">

                  <ArrowRight className="w-6 h-6 text-gray-400" />

                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-500/20 rounded-xl">

                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Predicted Next Month
                  </p>

                  <p className="text-xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                    {formatAmount(
                      insightsData
                        .predictions
                        .nextMonth
                    )}
                  </p>

                </div>

              </div>

              <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Expected Spending Change
                    </p>

                    <p
                      className={`text-xl font-bold mt-1 ${
                        predictionChange >
                        0
                          ? 'text-red-500'
                          : predictionChange <
                            0
                          ? 'text-green-500'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >

                      {Math.abs(
                        predictionChange
                      ) < 1
                        ? 'Stable'
                        : `${
                            predictionChange >
                            0
                              ? '+'
                              : ''
                          }${predictionChange.toFixed(
                            1
                          )}%`}

                    </p>

                  </div>

                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      predictionChange >
                      0
                        ? 'bg-red-500/20 text-red-400'
                        : predictionChange <
                          0
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >

                    {predictionChange >
                    0
                      ? 'Spending may increase'
                      : predictionChange <
                        0
                      ? 'Spending may decrease'
                      : 'Spending is stable'}

                  </div>

                </div>

              </div>

            </div>

          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <Card>

              <div className="space-y-4">

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Prediction Insights
                </h3>

                <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">

                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Spending Trend
                  </p>

                  <p className="font-semibold text-gray-900 dark:text-white">
                    {
                      getPredictionTrendText()
                    }
                  </p>

                </div>

                <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Trend Direction
                      </p>

                      <p
                        className={`font-semibold capitalize mt-1 ${
                          insightsData
                            .predictions
                            .trendDirection ===
                          'increasing'
                            ? 'text-red-500'
                            : insightsData
                                .predictions
                                .trendDirection ===
                              'decreasing'
                            ? 'text-green-500'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {
                          insightsData
                            .predictions
                            .trendDirection ||
                          'Stable'
                        }
                      </p>

                    </div>

                    <TrendingUp
                      className={`w-5 h-5 ${
                        insightsData
                          .predictions
                          .trendDirection ===
                        'increasing'
                          ? 'text-red-500'
                          : insightsData
                              .predictions
                              .trendDirection ===
                            'decreasing'
                          ? 'text-green-500'
                          : 'text-gray-400'
                      }`}
                    />

                  </div>

                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-500/20 rounded-xl">

                  <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">
                    Recommendation
                  </p>

                  <p className="font-medium text-blue-900 dark:text-blue-200">
                    {
                      getPredictionRecommendation()
                    }
                  </p>

                </div>

              </div>

            </Card>

            <Card>

              <div className="space-y-4">

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Prediction Model
                </h3>

                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-500/20 rounded-xl">

                  <div>

                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      Machine Learning Model
                    </p>

                    <p className="font-semibold text-blue-900 dark:text-blue-200 mt-1">
                      {insightsData
                        .predictions
                        .model ===
                      'linear_regression'
                        ? 'Linear Regression'
                        : insightsData
                            .predictions
                            .model ||
                          'Statistical Model'}
                    </p>

                  </div>

                  <Brain className="w-6 h-6 text-blue-500" />

                </div>

                <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Confidence Level
                      </p>

                      <p className="font-semibold text-gray-900 dark:text-white mt-1 capitalize">
                        {
                          insightsData
                            .predictions
                            .confidenceLevel ||
                          'Low'
                        }
                      </p>

                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        insightsData
                          .predictions
                          .confidenceLevel
                          ?.toLowerCase() ===
                        'high'
                          ? 'bg-green-500/20 text-green-400'
                          : insightsData
                              .predictions
                              .confidenceLevel
                              ?.toLowerCase() ===
                            'medium'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {
                        insightsData
                          .predictions
                          .confidenceLevel ||
                        'Low'
                      }
                    </span>

                  </div>

                </div>

                <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Historical Data
                      </p>

                      <p className="font-semibold text-gray-900 dark:text-white mt-1">
                        {
                          insightsData
                            .predictions
                            .monthsOfData ||
                          0
                        }{' '}
                        {insightsData
                          .predictions
                          .monthsOfData ===
                        1
                          ? 'month'
                          : 'months'}
                      </p>

                    </div>

                    <BarChart3 className="w-5 h-5 text-gray-400" />

                  </div>

                </div>

                <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Model Fit (R²)
                      </p>

                      <p className="font-semibold text-gray-900 dark:text-white mt-1">

                        {insightsData
                          .predictions
                          .rSquared !==
                        undefined
                          ? `${(
                              insightsData
                                .predictions
                                .rSquared *
                              100
                            ).toFixed(
                              1
                            )}%`
                          : 'Not available'}

                      </p>

                    </div>

                    <Target className="w-5 h-5 text-gray-400" />

                  </div>

                </div>

              </div>

            </Card>

          </div>

          <Card>

            <div className="space-y-4">

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                What This Prediction Means
              </h3>

              <div className="p-5 bg-gray-50 dark:bg-slate-800/50 rounded-xl">

                <div className="flex items-start gap-4">

                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">

                    <Brain className="w-5 h-5 text-blue-500" />

                  </div>

                  <div>

                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">

                      Based on your previous{' '}

                      <strong>
                        {
                          insightsData
                            .predictions
                            .monthsOfData ||
                          0
                        }
                      </strong>{' '}

                      months of spending data, the model predicts that your spending next month will be approximately{' '}

                      <strong>
                        {formatAmount(
                          insightsData
                            .predictions
                            .nextMonth
                        )}
                      </strong>
                      .

                      {' '}

                      Your expected change is approximately{' '}

                      <strong>
                        {Math.abs(
                          predictionChange
                        ) < 1
                          ? 'stable'
                          : `${
                              predictionChange >
                              0
                                ? '+'
                                : ''
                            }${predictionChange.toFixed(
                              1
                            )}%`}
                      </strong>{' '}

                      compared with your current monthly spending.

                    </p>

                  </div>

                </div>

              </div>

            </div>

          </Card>

        </div>

      )}

      {/* =====================================================
          CALL TO ACTION
      ===================================================== */}

      <Card>

        <div className="text-center py-8">

          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-blue-500/25">

            <Zap className="w-8 h-8 text-white" />

          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Want More Advanced Insights?
          </h3>

          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Upgrade to premium for AI-powered financial coaching, detailed analytics, and personalized recommendations.
          </p>

          <Button>
            Upgrade to Premium
          </Button>

        </div>

      </Card>

      {/* =====================================================
          MODALS
      ===================================================== */}

      <CreateBudgetForm
  isOpen={
    isCreateBudgetOpen
  }

  onClose={() => {
    setIsCreateBudgetOpen(
      false
    );

    setBudgetRecommendationForForm(
      null
    );
  }}

  onSuccess={
    handleFormSuccess
  }

  recommendation={
    budgetRecommendationForForm
  }
/>

      <EditBudgetForm
        isOpen={
          isEditBudgetOpen
        }
        onClose={() => {
          setIsEditBudgetOpen(
            false
          );

          setEditingBudget(
            null
          );
        }}
        onSuccess={
          handleFormSuccess
        }
        budget={
          editingBudget
        }
      />

      <TransactionDetailsModal
        isOpen={
          isTransactionDetailsOpen
        }
        onClose={() => {
          setIsTransactionDetailsOpen(
            false
          );

          setSelectedInsight(
            null
          );
        }}
        insight={
          selectedInsight
        }
        formatAmount={
          formatAmount
        }
      />

      <BudgetRecommendationModal
        isOpen={
          isBudgetRecommendationOpen
        }
        onClose={() => {
          setIsBudgetRecommendationOpen(
            false
          );

          setSelectedInsight(
            null
          );
        }}
        insight={
          selectedInsight
        }
        formatAmount={
          formatAmount
        }
        onApplyRecommendation={
          handleBudgetRecommendationAction
        }
      />

      <SavingsOpportunityModal
        isOpen={
          isSavingsOpportunityOpen
        }
        onClose={() => {
          setIsSavingsOpportunityOpen(
            false
          );

          setSelectedInsight(
            null
          );
        }}
        insight={
          selectedInsight
        }
        formatAmount={
          formatAmount
        }
      />

      <SpendingForecastModal
        isOpen={
          isSpendingForecastOpen
        }
        onClose={() => {
          setIsSpendingForecastOpen(
            false
          );

          setSelectedInsight(
            null
          );
        }}
        insight={
          selectedInsight
        }
        formatAmount={
          formatAmount
        }
        predictions={
          insightsData.predictions
        }
      />

    </div>
  );
};