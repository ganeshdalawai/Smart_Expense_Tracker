import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Target,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Filter,
  RefreshCw,
  Calendar
} from 'lucide-react';

import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

import { BudgetCard } from './BudgetCard';
import { BudgetGoalCard } from './BudgetGoalCard';
import { BudgetAnalyticsChart } from './BudgetAnalyticsChart';
import { BudgetDetailsModal } from './BudgetDetailsModal';
import { AddProgressModal } from './AddProgressModal';
import { BudgetFilters } from './BudgetFilters';

import { CreateBudgetForm } from '../forms/CreateBudgetForm';
import { CreateBudgetGoalForm } from '../forms/CreateBudgetGoalForm';
import { EditBudgetForm } from '../forms/EditBudgetForm';
import { EditBudgetGoalForm } from '../forms/EditBudgetGoalForm';

import { BudgetAlerts } from './BudgetAlerts';

import { useCurrency } from '../settings/CurrencySelector';

import {
  Budget,
  BudgetGoal,
  BudgetAnalytics,
  getBudgets,
  getBudgetGoals,
  getBudgetAnalytics,
  deleteBudget,
  deleteBudgetGoal,
  updateBudgetGoal,
  refreshBudgets
} from '../services/budgetService';


export const BudgetOverview: React.FC = () => {

  // ============================================================
  // STATE
  // ============================================================

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<BudgetGoal[]>([]);
  const [analytics, setAnalytics] = useState<BudgetAnalytics | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [activeTab, setActiveTab] = useState<
    'budgets' | 'goals' | 'analytics'
  >('budgets');


  // ============================================================
  // FORM STATES
  // ============================================================

  const [isCreateBudgetOpen, setIsCreateBudgetOpen] = useState(false);
  const [isCreateGoalOpen, setIsCreateGoalOpen] = useState(false);

  const [isEditBudgetOpen, setIsEditBudgetOpen] = useState(false);
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);

  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [editingGoal, setEditingGoal] = useState<BudgetGoal | null>(null);


  // ============================================================
  // MODAL STATES
  // ============================================================

  const [isBudgetDetailsOpen, setIsBudgetDetailsOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  const [isAddProgressOpen, setIsAddProgressOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<BudgetGoal | null>(null);

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);


  // ============================================================
  // FILTERS
  // ============================================================

  const [filters, setFilters] = useState({
    period: 'all',
    status: 'all',
    category: 'all',
    sortBy: 'name',
    sortDirection: 'asc',
    dateRange: {
      start: '',
      end: ''
    }
  });


  const { formatAmount } = useCurrency();


  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================

  const getBudgetPercentage = (budget: Budget): number => {
    const budgeted = Number(budget.budgetedAmount) || 0;
    const spent = Number(budget.spentAmount) || 0;

    if (budgeted <= 0) {
      return 0;
    }

    return (spent / budgeted) * 100;
  };


  const getRemainingAmount = (budget: Budget): number => {
    const budgeted = Number(budget.budgetedAmount) || 0;
    const spent = Number(budget.spentAmount) || 0;

    return budgeted - spent;
  };


  const getPeriodLabel = (period?: string): string => {
    switch (period) {
      case 'weekly':
        return 'Weekly';

      case 'monthly':
        return 'Monthly';

      case 'quarterly':
        return 'Quarterly';

      case 'yearly':
        return 'Yearly';

      default:
        return 'Budget Period';
    }
  };


  const getBudgetStatus = (budget: Budget) => {
    const percentage = getBudgetPercentage(budget);

    const threshold = Number(budget.alertThreshold) || 80;

    if (percentage >= 100) {
      return {
        label: 'Over Budget',
        type: 'over-budget'
      };
    }

    if (percentage >= threshold) {
      return {
        label: 'Near Limit',
        type: 'warning'
      };
    }

    return {
      label: 'On Track',
      type: 'on-track'
    };
  };


  // ============================================================
  // FETCH DATA
  // ============================================================

  const fetchData = useCallback(async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      /*
       * Recalculate spending before retrieving budgets.
       *
       * IMPORTANT:
       * The backend should calculate spending using:
       *
       * transaction.category === budget.category
       * AND
       * transaction.date >= budget.startDate
       * AND
       * transaction.date <= budget.endDate
       *
       * This prevents old transactions from being counted
       * in the current budget.
       */

      await refreshBudgets();

      const [
        budgetsData,
        goalsData,
        analyticsData
      ] = await Promise.all([
        getBudgets(),
        getBudgetGoals(),
        getBudgetAnalytics()
      ]);

      setBudgets(Array.isArray(budgetsData) ? budgetsData : []);
      setGoals(Array.isArray(goalsData) ? goalsData : []);
      setAnalytics(analyticsData || null);

    } catch (error) {
      console.error('Error fetching budget data:', error);

      /*
       * Do NOT insert fake financial data here.
       *
       * Showing fake $2000 / $1200 values can make the user
       * think their actual financial data is different.
       */

      setBudgets([]);
      setGoals([]);
      setAnalytics(null);

    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);


  useEffect(() => {
    fetchData();
  }, [fetchData]);


  // ============================================================
  // FILTER + SORT BUDGETS
  // ============================================================

  const filteredBudgets = budgets
    .filter((budget) => {

      // Period filter
      if (
        filters.period !== 'all' &&
        budget.period !== filters.period
      ) {
        return false;
      }


      // Category filter
      if (
        filters.category !== 'all' &&
        budget.category !== filters.category
      ) {
        return false;
      }


      // Status filter
      if (filters.status !== 'all') {

        const percentage = getBudgetPercentage(budget);

        const threshold =
          Number(budget.alertThreshold) || 80;


        if (
          filters.status === 'over-budget' &&
          percentage < 100
        ) {
          return false;
        }


        if (
          filters.status === 'warning' &&
          (
            percentage < threshold ||
            percentage >= 100
          )
        ) {
          return false;
        }


        if (
          filters.status === 'on-track' &&
          percentage >= threshold
        ) {
          return false;
        }
      }


      // Date filter
      if (
        filters.dateRange.start &&
        budget.startDate
      ) {
        if (
          new Date(budget.startDate) <
          new Date(filters.dateRange.start)
        ) {
          return false;
        }
      }


      if (
        filters.dateRange.end &&
        budget.endDate
      ) {
        if (
          new Date(budget.endDate) >
          new Date(filters.dateRange.end)
        ) {
          return false;
        }
      }


      return true;
    })


    .sort((a, b) => {

      let aValue: any;
      let bValue: any;


      switch (filters.sortBy) {

        case 'amount':

          aValue = Number(a.budgetedAmount) || 0;
          bValue = Number(b.budgetedAmount) || 0;

          break;


        case 'spent':

          aValue = Number(a.spentAmount) || 0;
          bValue = Number(b.spentAmount) || 0;

          break;


        case 'percentage':

          aValue = getBudgetPercentage(a);
          bValue = getBudgetPercentage(b);

          break;


        case 'remaining':

          aValue = getRemainingAmount(a);
          bValue = getRemainingAmount(b);

          break;


        case 'endDate':

          aValue = a.endDate
            ? new Date(a.endDate).getTime()
            : 0;

          bValue = b.endDate
            ? new Date(b.endDate).getTime()
            : 0;

          break;


        default:

          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();

          break;
      }


      if (filters.sortDirection === 'desc') {
        return aValue < bValue ? 1 : -1;
      }

      return aValue > bValue ? 1 : -1;
    });


  // ============================================================
  // FILTER + SORT GOALS
  // ============================================================

  const filteredGoals = goals
    .filter((goal) => {

      if (
        filters.status !== 'all' &&
        goal.status !== filters.status
      ) {
        return false;
      }


      if (
        filters.category !== 'all' &&
        goal.category !== filters.category
      ) {
        return false;
      }


      return true;
    })


    .sort((a, b) => {

      let aValue: any;
      let bValue: any;


      switch (filters.sortBy) {

        case 'amount':

          aValue = Number(a.targetAmount) || 0;
          bValue = Number(b.targetAmount) || 0;

          break;


        case 'percentage':

          aValue =
            a.targetAmount > 0
              ? (a.currentAmount / a.targetAmount) * 100
              : 0;

          bValue =
            b.targetAmount > 0
              ? (b.currentAmount / b.targetAmount) * 100
              : 0;

          break;


        case 'remaining':

          aValue =
            (Number(a.targetAmount) || 0) -
            (Number(a.currentAmount) || 0);

          bValue =
            (Number(b.targetAmount) || 0) -
            (Number(b.currentAmount) || 0);

          break;


        case 'endDate':

          aValue = a.targetDate
            ? new Date(a.targetDate).getTime()
            : 0;

          bValue = b.targetDate
            ? new Date(b.targetDate).getTime()
            : 0;

          break;


        default:

          aValue = (a.title || '').toLowerCase();
          bValue = (b.title || '').toLowerCase();

          break;
      }


      if (filters.sortDirection === 'desc') {
        return aValue < bValue ? 1 : -1;
      }

      return aValue > bValue ? 1 : -1;
    });


  // ============================================================
  // DELETE BUDGET
  // ============================================================

  const handleDeleteBudget = async (id: string) => {

    if (!id) return;


    if (
      !confirm(
        'Are you sure you want to delete this budget?'
      )
    ) {
      return;
    }


    try {

      await deleteBudget(id);

      await fetchData(true);

    } catch (error) {

      console.error(
        'Error deleting budget:',
        error
      );

      alert(
        'Unable to delete the budget. Please try again.'
      );
    }
  };


  // ============================================================
  // DELETE GOAL
  // ============================================================

  const handleDeleteGoal = async (id: string) => {

    if (!id) return;


    if (
      !confirm(
        'Are you sure you want to delete this goal?'
      )
    ) {
      return;
    }


    try {

      await deleteBudgetGoal(id);

      await fetchData(true);

    } catch (error) {

      console.error(
        'Error deleting goal:',
        error
      );

      alert(
        'Unable to delete the goal. Please try again.'
      );
    }
  };


  // ============================================================
  // EDIT BUDGET
  // ============================================================

  const handleEditBudget = (budget: Budget) => {

    setEditingBudget(budget);
    setIsEditBudgetOpen(true);
  };


  // ============================================================
  // EDIT GOAL
  // ============================================================

  const handleEditGoal = (goal: BudgetGoal) => {

    setEditingGoal(goal);
    setIsEditGoalOpen(true);
  };


  // ============================================================
  // VIEW BUDGET DETAILS
  // ============================================================

  const handleViewBudgetDetails = (budget: Budget) => {

    setSelectedBudget(budget);
    setIsBudgetDetailsOpen(true);
  };


  // ============================================================
  // ADD GOAL PROGRESS
  // ============================================================

  const handleAddProgress = (goal: BudgetGoal) => {

    setSelectedGoal(goal);
    setIsAddProgressOpen(true);
  };


  const handleProgressSubmit = async (
    amount: number
  ) => {

    if (!selectedGoal) return;


    try {

      const goalId =
        selectedGoal._id ||
        selectedGoal.id;


      if (!goalId) {
        throw new Error(
          'Goal ID not found'
        );
      }


      await updateBudgetGoal(
        goalId,
        {
          currentAmount:
            selectedGoal.currentAmount +
            amount
        }
      );


      await fetchData(true);

    } catch (error) {

      console.error(
        'Error adding progress:',
        error
      );

      throw error;
    }
  };


  // ============================================================
  // CHANGE GOAL STATUS
  // ============================================================

  const handleStatusChange = async (
    goal: BudgetGoal,
    status:
      | 'active'
      | 'completed'
      | 'paused'
      | 'cancelled'
  ) => {

    try {

      const goalId =
        goal._id ||
        goal.id;


      if (!goalId) {
        throw new Error(
          'Goal ID not found'
        );
      }


      await updateBudgetGoal(
        goalId,
        { status }
      );


      await fetchData(true);

    } catch (error) {

      console.error(
        'Error updating goal status:',
        error
      );
    }
  };


  // ============================================================
  // CATEGORIES
  // ============================================================

  const categories = Array.from(
    new Set(
      [
        ...budgets.map(
          (budget) => budget.category
        ),
        ...goals.map(
          (goal) => goal.category
        )
      ].filter(Boolean)
    )
  );


  // ============================================================
  // LOADING SCREEN
  // ============================================================

  if (isLoading) {

    return (
      <div className="space-y-6">

        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Budget Management
            </h1>

            <p className="text-gray-600 dark:text-gray-300">
              Loading your budget overview...
            </p>

          </div>

        </div>


        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

          {[1, 2, 3, 4].map((i) => (

            <div
              key={i}
              className="
                bg-white/70
                dark:bg-slate-800/70
                backdrop-blur-xl
                border
                border-gray-200/50
                dark:border-slate-700/50
                rounded-2xl
                p-6
                animate-pulse
              "
            >

              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2 mb-3" />

              <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />

            </div>

          ))}

        </div>

      </div>
    );
  }


  // ============================================================
  // MAIN UI
  // ============================================================

  return (

    <div className="space-y-6">


      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex items-center justify-between">

        <div className="min-w-0 flex-1">

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Budget Management
          </h1>

          <p className="text-gray-600 dark:text-gray-300">
            Track your spending, set goals, and manage your financial health.
          </p>

        </div>


        <div className="flex items-center space-x-3 flex-shrink-0">

          {/* Refresh */}

          <Button
            variant="glass"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
          >

            <RefreshCw
              className={`w-4 h-4 mr-2 ${
                isRefreshing
                  ? 'animate-spin'
                  : ''
              }`}
            />

            <span className="hidden sm:inline">
              Refresh
            </span>

          </Button>


          {/* Add Goal */}

          <Button
            variant="glass"
            size="sm"
            onClick={() =>
              setIsCreateGoalOpen(true)
            }
          >

            <Target className="w-4 h-4 mr-2" />

            <span className="hidden sm:inline">
              Add Goal
            </span>

          </Button>


          {/* Create Budget */}

          <Button
            onClick={() =>
              setIsCreateBudgetOpen(true)
            }
          >

            <Plus className="w-4 h-4 mr-2" />

            <span className="hidden sm:inline">
              Create Budget
            </span>

          </Button>

        </div>

      </div>


      {/* ======================================================
          QUICK STATS
      ====================================================== */}

      {analytics && (

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">


          {/* Total Budgeted */}

          <Card className="p-4">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Total Budgeted
                </p>

                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatAmount(
                    Number(
                      analytics.totalBudgeted
                    ) || 0
                  )}
                </p>

              </div>


              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">

                <Target className="w-5 h-5 text-blue-500 dark:text-blue-400" />

              </div>

            </div>

          </Card>


          {/* Total Spent */}

          <Card className="p-4">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Total Spent
                </p>

                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatAmount(
                    Number(
                      analytics.totalSpent
                    ) || 0
                  )}
                </p>

              </div>


              <div className="w-10 h-10 bg-red-50 dark:bg-red-500/20 rounded-xl flex items-center justify-center">

                <TrendingUp className="w-5 h-5 text-red-500 dark:text-red-400" />

              </div>

            </div>

          </Card>


          {/* Over Budget */}

          <Card className="p-4">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Over Budget
                </p>

                <p className="text-xl font-bold text-red-600 dark:text-red-400">
                  {analytics.budgetsOverLimit}
                </p>

              </div>


              <div className="w-10 h-10 bg-red-50 dark:bg-red-500/20 rounded-xl flex items-center justify-center">

                <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400" />

              </div>

            </div>

          </Card>


          {/* Near Limit */}

          <Card className="p-4">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Near Limit
                </p>

                <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                  {analytics.budgetsNearLimit}
                </p>

              </div>


              <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-500/20 rounded-xl flex items-center justify-center">

                <TrendingUp className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />

              </div>

            </div>

          </Card>

        </div>

      )}


      {/* ======================================================
          BUDGET ALERTS
      ====================================================== */}

      <BudgetAlerts
        budgets={budgets}
        formatAmount={formatAmount}
      />


      {/* ======================================================
          TAB NAVIGATION
      ====================================================== */}

      <div className="flex items-center justify-between">

        <div className="flex items-center space-x-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-1">

          {[
            {
              id: 'budgets',
              label: 'Budgets',
              icon: Target
            },
            {
              id: 'goals',
              label: 'Goals',
              icon: CheckCircle
            },
            {
              id: 'analytics',
              label: 'Analytics',
              icon: TrendingUp
            }
          ].map((tab) => {

            const Icon = tab.icon;

            return (

              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(
                    tab.id as
                      | 'budgets'
                      | 'goals'
                      | 'analytics'
                  )
                }
                className={`
                  flex
                  items-center
                  space-x-2
                  px-4
                  py-2
                  rounded-lg
                  text-sm
                  font-medium
                  transition-all
                  duration-300

                  ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >

                <Icon className="w-4 h-4" />

                <span className="hidden sm:inline">
                  {tab.label}
                </span>

              </button>

            );
          })}

        </div>


        {/* Filters */}

        <Button
          variant="glass"
          size="sm"
          onClick={() =>
            setIsFiltersOpen(true)
          }
        >

          <Filter className="w-4 h-4 mr-2" />

          <span className="hidden sm:inline">
            Filter
          </span>

        </Button>

      </div>


      {/* ======================================================
          BUDGET TAB
      ====================================================== */}

      {activeTab === 'budgets' && (

        <div className="space-y-4">


          {/* Budget period information */}

          {filteredBudgets.length > 0 && (

            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">

              <Calendar className="w-4 h-4" />

              <span>
                Budgets are calculated using transactions
                within each budget's start and end dates.
              </span>

            </div>

          )}


          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

            {filteredBudgets.map((budget) => {

              const percentage =
                getBudgetPercentage(budget);

              const status =
                getBudgetStatus(budget);

              return (

                <div
                  key={
                    budget._id ||
                    budget.id
                  }
                  className="relative"
                >

                  {/* Small period/status information */}

                  <div className="absolute top-3 left-3 z-10 pointer-events-none">

                    <span
                      className={`
                        inline-flex
                        items-center
                        px-2
                        py-1
                        rounded-full
                        text-xs
                        font-medium

                        ${
                          status.type ===
                          'over-budget'

                            ? 'bg-red-500/20 text-red-400'

                            : status.type ===
                              'warning'

                            ? 'bg-yellow-500/20 text-yellow-400'

                            : 'bg-green-500/20 text-green-400'
                        }
                      `}
                    >
                      {status.label}
                    </span>

                  </div>


                  <BudgetCard
                    budget={budget}
                    onEdit={() =>
                      handleEditBudget(
                        budget
                      )
                    }
                    onDelete={() =>
                      handleDeleteBudget(
                        budget._id ||
                          budget.id ||
                          ''
                      )
                    }
                    onViewDetails={() =>
                      handleViewBudgetDetails(
                        budget
                      )
                    }
                    formatAmount={
                      formatAmount
                    }
                  />


                  {/* Period details */}

                  <div className="mt-2 px-2 text-xs text-gray-500 dark:text-gray-400">

                    <div className="flex justify-between">

                      <span>
                        {getPeriodLabel(
                          budget.period
                        )}
                      </span>

                      <span>
                        {percentage.toFixed(1)}%
                        used
                      </span>

                    </div>

                  </div>

                </div>

              );
            })}


            {/* Empty state */}

            {filteredBudgets.length === 0 && (

              <div className="col-span-full">

                <Card className="text-center py-12">

                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No budgets found
                  </h3>

                  <p className="text-gray-600 dark:text-gray-300 mb-4">

                    {budgets.length === 0

                      ? 'Create your first budget to start tracking your spending.'

                      : 'No budgets match your current filters. Try adjusting your filter criteria.'
                    }

                  </p>


                  <Button
                    onClick={() =>
                      setIsCreateBudgetOpen(
                        true
                      )
                    }
                  >

                    <Plus className="w-4 h-4 mr-2" />

                    Create Budget

                  </Button>

                </Card>

              </div>

            )}

          </div>

        </div>

      )}


      {/* ======================================================
          GOALS TAB
      ====================================================== */}

      {activeTab === 'goals' && (

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

          {filteredGoals.map((goal) => (

            <BudgetGoalCard
              key={
                goal._id ||
                goal.id
              }
              goal={goal}
              onEdit={() =>
                handleEditGoal(goal)
              }
              onDelete={() =>
                handleDeleteGoal(
                  goal._id ||
                    goal.id ||
                    ''
                )
              }
              onAddProgress={() =>
                handleAddProgress(goal)
              }
              onStatusChange={(status) =>
                handleStatusChange(
                  goal,
                  status
                )
              }
              formatAmount={
                formatAmount
              }
            />

          ))}


          {filteredGoals.length === 0 && (

            <div className="col-span-full">

              <Card className="text-center py-12">

                <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No goals found
                </h3>

                <p className="text-gray-600 dark:text-gray-300 mb-4">

                  {goals.length === 0

                    ? 'Set your first financial goal to start saving.'

                    : 'No goals match your current filters. Try adjusting your filter criteria.'
                  }

                </p>


                <Button
                  onClick={() =>
                    setIsCreateGoalOpen(
                      true
                    )
                  }
                >

                  <Plus className="w-4 h-4 mr-2" />

                  Create Goal

                </Button>

              </Card>

            </div>

          )}

        </div>

      )}


      {/* ======================================================
          ANALYTICS TAB
      ====================================================== */}

      {activeTab === 'analytics' && analytics && (

        <BudgetAnalyticsChart
          analytics={analytics}
          formatAmount={formatAmount}
        />

      )}


      {/* ======================================================
          CREATE BUDGET
      ====================================================== */}

      <CreateBudgetForm
        isOpen={
          isCreateBudgetOpen
        }
        onClose={() =>
          setIsCreateBudgetOpen(false)
        }
        onSuccess={async () => {

          setIsCreateBudgetOpen(false);

          await fetchData(true);

        }}
      />


      {/* ======================================================
          CREATE GOAL
      ====================================================== */}

      <CreateBudgetGoalForm
        isOpen={
          isCreateGoalOpen
        }
        onClose={() =>
          setIsCreateGoalOpen(false)
        }
        onSuccess={async () => {

          setIsCreateGoalOpen(false);

          await fetchData(true);

        }}
      />


      {/* ======================================================
          EDIT BUDGET
      ====================================================== */}

      <EditBudgetForm
        isOpen={
          isEditBudgetOpen
        }
        onClose={() => {

          setIsEditBudgetOpen(false);
          setEditingBudget(null);

        }}
        onSuccess={async () => {

          setIsEditBudgetOpen(false);
          setEditingBudget(null);

          await fetchData(true);

        }}
        budget={editingBudget}
      />


      {/* ======================================================
          EDIT GOAL
      ====================================================== */}

      <EditBudgetGoalForm
        isOpen={
          isEditGoalOpen
        }
        onClose={() => {

          setIsEditGoalOpen(false);
          setEditingGoal(null);

        }}
        onSuccess={async () => {

          setIsEditGoalOpen(false);
          setEditingGoal(null);

          await fetchData(true);

        }}
        goal={editingGoal}
      />


      {/* ======================================================
          BUDGET DETAILS
      ====================================================== */}

      <BudgetDetailsModal
        isOpen={
          isBudgetDetailsOpen
        }
        onClose={() => {

          setIsBudgetDetailsOpen(false);
          setSelectedBudget(null);

        }}
        budget={selectedBudget}
        formatAmount={
          formatAmount
        }
      />


      {/* ======================================================
          ADD GOAL PROGRESS
      ====================================================== */}

      <AddProgressModal
        isOpen={
          isAddProgressOpen
        }
        onClose={() => {

          setIsAddProgressOpen(false);
          setSelectedGoal(null);

        }}
        goal={selectedGoal}
        onAddProgress={
          handleProgressSubmit
        }
        formatAmount={
          formatAmount
        }
      />


      {/* ======================================================
          FILTER MODAL
      ====================================================== */}

      <BudgetFilters
        isOpen={
          isFiltersOpen
        }
        onClose={() =>
          setIsFiltersOpen(false)
        }
        filters={filters}
        onFiltersChange={
          setFilters
        }
        categories={
          categories
        }
      />

    </div>
  );
};