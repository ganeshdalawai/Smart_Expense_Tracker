import React from 'react';
import {
  X,
  Calendar,
  Target,
  TrendingUp,
  AlertTriangle,
  Tag,
  DollarSign,
} from 'lucide-react';

import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Budget } from '../services/budgetService';

interface BudgetDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget: Budget | null;
  formatAmount: (amount: number) => string;
}

export const BudgetDetailsModal: React.FC<BudgetDetailsModalProps> = ({
  isOpen,
  onClose,
  budget,
  formatAmount,
}) => {
  if (!isOpen || !budget) {
    return null;
  }

  // ============================================================
  // DATE HELPERS
  // ============================================================

  /**
   * Convert a date into a valid Date object.
   */
  const parseDate = (value: Date | string | undefined): Date | null => {
    if (!value) return null;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  };

  /**
   * Calculate the number of days between two dates.
   *
   * +1 makes the range inclusive.
   *
   * Example:
   *
   * Aug 21 -> Aug 31
   *
   * = 11 days
   */
  const getInclusiveDaysBetween = (
    start: Date,
    end: Date
  ): number => {
    const startDay = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate()
    );

    const endDay = new Date(
      end.getFullYear(),
      end.getMonth(),
      end.getDate()
    );

    const difference =
      endDay.getTime() - startDay.getTime();

    return Math.max(
      1,
      Math.floor(
        difference / (1000 * 60 * 60 * 24)
      ) + 1
    );
  };

  /**
   * Format dates consistently.
   */
  const formatDate = (
    value: Date | string | undefined
  ): string => {
    const date = parseDate(value);

    if (!date) {
      return 'Not set';
    }

    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };


  // ============================================================
  // BUDGET VALUES
  // ============================================================

  const budgetedAmount =
    Number(budget.budgetedAmount) || 0;

  const spentAmount =
    Number(budget.spentAmount) || 0;

  /**
   * Percentage of budget already spent.
   */
  const percentage =
    budgetedAmount > 0
      ? (spentAmount / budgetedAmount) * 100
      : 0;

  /**
   * Positive = money remaining.
   *
   * Negative = budget exceeded.
   */
  const remaining =
    budgetedAmount - spentAmount;


  // ============================================================
  // DATE CALCULATIONS
  // ============================================================

  const startDate =
    parseDate(budget.startDate);

  const endDate =
    parseDate(budget.endDate);

  const today = new Date();

  /**
   * Total number of days in the ACTUAL budget period.
   *
   * We do NOT use:
   *
   * monthly = 30
   * quarterly = 90
   * yearly = 365
   *
   * because the user-selected dates are more accurate.
   */
  const totalDays =
    startDate && endDate
      ? getInclusiveDaysBetween(
          startDate,
          endDate
        )
      : 1;


  /**
   * Days elapsed in the budget period.
   *
   * Before start:
   * 0 days
   *
   * During period:
   * actual number of days elapsed
   *
   * After end:
   * total period days
   */
  let daysElapsed = 0;

  if (startDate && endDate) {
    if (today < startDate) {
      daysElapsed = 0;
    } else if (today > endDate) {
      daysElapsed = totalDays;
    } else {
      daysElapsed =
        getInclusiveDaysBetween(
          startDate,
          today
        );
    }
  }


  /**
   * Days remaining.
   *
   * Before budget starts:
   * full budget period
   *
   * During budget:
   * remaining days
   *
   * After budget ends:
   * 0
   */
  let daysRemaining = 0;

  if (startDate && endDate) {
    if (today < startDate) {
      daysRemaining = totalDays;
    } else if (today > endDate) {
      daysRemaining = 0;
    } else {
      daysRemaining =
        Math.max(
          0,
          totalDays - daysElapsed
        );
    }
  }


  // ============================================================
  // DAILY SPENDING
  // ============================================================

  /**
   * Budget allowed per day.
   */
  const dailyBudget =
    budgetedAmount / totalDays;


  /**
   * Actual daily spending.
   *
   * Don't divide by zero when the budget hasn't started.
   */
  const dailySpent =
    daysElapsed > 0
      ? spentAmount / daysElapsed
      : 0;


  /**
   * Time progress.
   */
  const timeProgress =
    totalDays > 0
      ? Math.min(
          (daysElapsed / totalDays) * 100,
          100
        )
      : 0;


  // ============================================================
  // STATUS
  // ============================================================

  const alertThreshold =
    Number(budget.alertThreshold) || 80;

  const getStatus = () => {
    if (percentage >= 100) {
      return {
        label: 'Over Budget',
        color:
          'text-red-600 dark:text-red-400',
        bgColor:
          'bg-red-50 dark:bg-red-500/20',
      };
    }

    if (percentage >= alertThreshold) {
      return {
        label: 'Near Limit',
        color:
          'text-yellow-600 dark:text-yellow-400',
        bgColor:
          'bg-yellow-50 dark:bg-yellow-500/20',
      };
    }

    return {
      label: 'On Track',
      color:
        'text-green-600 dark:text-green-400',
      bgColor:
        'bg-green-50 dark:bg-green-500/20',
    };
  };


  const status = getStatus();


  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">

      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 animate-in slide-in-from-bottom-4">

        <Card className="relative">

          {/* ==================================================
              CLOSE BUTTON
          ================================================== */}

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>


          <div className="space-y-6">


            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="flex items-start space-x-4">

              <div
                className="w-12 h-12 rounded-2xl shadow-lg flex-shrink-0 flex items-center justify-center"
                style={{
                  backgroundColor:
                    budget.color || '#3B82F6',
                }}
              >
                <Target className="w-6 h-6 text-white" />
              </div>


              <div className="flex-1 min-w-0">

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {budget.name}
                </h2>

                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  {budget.category}
                </p>


                <div
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.color} ${status.bgColor}`}
                >
                  {status.label}
                </div>

              </div>

            </div>


            {/* ==================================================
                DESCRIPTION
            ================================================== */}

            {budget.description && (
              <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">

                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  Description
                </h3>

                <p className="text-gray-600 dark:text-gray-300">
                  {budget.description}
                </p>

              </div>
            )}


            {/* ==================================================
                PROGRESS OVERVIEW
            ================================================== */}

            <div className="space-y-4">

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Progress Overview
              </h3>


              <div className="space-y-3">

                <div className="flex justify-between text-sm">

                  <span className="text-gray-600 dark:text-gray-300">
                    Spent
                  </span>

                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatAmount(spentAmount)}
                  </span>

                </div>


                {/* Progress bar */}

                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">

                  <div
                    className={`h-4 rounded-full transition-all duration-500 ${
                      percentage >= 100
                        ? 'bg-red-500'
                        : percentage >= alertThreshold
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min(
                        percentage,
                        100
                      )}%`,
                    }}
                  />

                </div>


                <div className="flex justify-between text-sm">

                  <span className="text-gray-600 dark:text-gray-300">
                    Budget
                  </span>

                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatAmount(budgetedAmount)}
                  </span>

                </div>

              </div>

            </div>


            {/* ==================================================
                STATISTICS
            ================================================== */}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">


              {/* Remaining */}

              <div className="text-center p-4 bg-blue-50 dark:bg-blue-500/20 rounded-xl">

                <DollarSign className="w-6 h-6 text-blue-500 dark:text-blue-400 mx-auto mb-2" />

                <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                  {remaining >= 0
                    ? 'Remaining'
                    : 'Over By'}
                </p>

                <p
                  className={`text-lg font-bold ${
                    remaining >= 0
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-red-700 dark:text-red-300'
                  }`}
                >
                  {formatAmount(
                    Math.abs(remaining)
                  )}
                </p>

              </div>


              {/* Progress */}

              <div className="text-center p-4 bg-green-50 dark:bg-green-500/20 rounded-xl">

                <TrendingUp className="w-6 h-6 text-green-500 dark:text-green-400 mx-auto mb-2" />

                <p className="text-xs text-green-600 dark:text-green-400 mb-1">
                  Progress
                </p>

                <p className="text-lg font-bold text-green-700 dark:text-green-300">
                  {percentage.toFixed(1)}%
                </p>

              </div>


              {/* Days left */}

              <div className="text-center p-4 bg-purple-50 dark:bg-purple-500/20 rounded-xl">

                <Calendar className="w-6 h-6 text-purple-500 dark:text-purple-400 mx-auto mb-2" />

                <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">
                  Days Left
                </p>

                <p
                  className={`text-lg font-bold ${
                    daysRemaining < 7
                      ? 'text-yellow-700 dark:text-yellow-300'
                      : 'text-purple-700 dark:text-purple-300'
                  }`}
                >
                  {daysRemaining}
                </p>

              </div>


              {/* Alert */}

              <div className="text-center p-4 bg-orange-50 dark:bg-orange-500/20 rounded-xl">

                <AlertTriangle className="w-6 h-6 text-orange-500 dark:text-orange-400 mx-auto mb-2" />

                <p className="text-xs text-orange-600 dark:text-orange-400 mb-1">
                  Alert at
                </p>

                <p className="text-lg font-bold text-orange-700 dark:text-orange-300">
                  {alertThreshold}%
                </p>

              </div>

            </div>


            {/* ==================================================
                SPENDING ANALYSIS
            ================================================== */}

            <div className="space-y-4">

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Spending Analysis
              </h3>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


                {/* Daily Average */}

                <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">

                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Daily Average
                  </h4>

                  <div className="space-y-2">

                    <div className="flex justify-between text-sm">

                      <span className="text-gray-600 dark:text-gray-300">
                        Budgeted per day
                      </span>

                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatAmount(
                          dailyBudget
                        )}
                      </span>

                    </div>


                    <div className="flex justify-between text-sm">

                      <span className="text-gray-600 dark:text-gray-300">
                        Actual per day
                      </span>

                      <span
                        className={`font-medium ${
                          dailySpent > dailyBudget
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}
                      >
                        {formatAmount(
                          dailySpent
                        )}
                      </span>

                    </div>

                  </div>

                </div>


                {/* Time Progress */}

                <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">

                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Time Progress
                  </h4>

                  <div className="space-y-2">

                    <div className="flex justify-between text-sm">

                      <span className="text-gray-600 dark:text-gray-300">
                        Days elapsed
                      </span>

                      <span className="font-medium text-gray-900 dark:text-white">
                        {daysElapsed} / {totalDays}
                      </span>

                    </div>


                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">

                      <div
                        className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                        style={{
                          width: `${timeProgress}%`,
                        }}
                      />

                    </div>

                  </div>

                </div>

              </div>

            </div>


            {/* ==================================================
                BUDGET DETAILS
            ================================================== */}

            <div className="space-y-4">

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Budget Details
              </h3>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


                <div className="space-y-3">

                  <div className="flex justify-between">

                    <span className="text-gray-600 dark:text-gray-300">
                      Period
                    </span>

                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {budget.period}
                    </span>

                  </div>


                  <div className="flex justify-between">

                    <span className="text-gray-600 dark:text-gray-300">
                      Start Date
                    </span>

                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatDate(
                        budget.startDate
                      )}
                    </span>

                  </div>


                  <div className="flex justify-between">

                    <span className="text-gray-600 dark:text-gray-300">
                      End Date
                    </span>

                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatDate(
                        budget.endDate
                      )}
                    </span>

                  </div>

                </div>


                <div className="space-y-3">

                  <div className="flex justify-between">

                    <span className="text-gray-600 dark:text-gray-300">
                      Total Period
                    </span>

                    <span className="font-medium text-gray-900 dark:text-white">
                      {totalDays} days
                    </span>

                  </div>


                  <div className="flex justify-between">

                    <span className="text-gray-600 dark:text-gray-300">
                      Rollover
                    </span>

                    <span className="font-medium text-gray-900 dark:text-white">
                      {budget.rollover
                        ? 'Enabled'
                        : 'Disabled'}
                    </span>

                  </div>


                  <div className="flex justify-between">

                    <span className="text-gray-600 dark:text-gray-300">
                      Status
                    </span>

                    <span className="font-medium text-gray-900 dark:text-white">
                      {budget.isActive
                        ? 'Active'
                        : 'Inactive'}
                    </span>

                  </div>

                </div>

              </div>

            </div>


            {/* ==================================================
                TAGS
            ================================================== */}

            {budget.tags &&
              budget.tags.length > 0 && (

                <div className="space-y-3">

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Tags
                  </h3>


                  <div className="flex flex-wrap gap-2">

                    {budget.tags.map(
                      (tag, index) => (

                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                        >

                          <Tag className="w-3 h-3 mr-1" />

                          {tag}

                        </span>

                      )
                    )}

                  </div>

                </div>

              )}


            {/* ==================================================
                ACTIONS
            ================================================== */}

            <div className="flex space-x-3 pt-4 border-t border-gray-200/50 dark:border-slate-700/50">

              <Button
                variant="ghost"
                onClick={onClose}
                className="flex-1"
              >
                Close
              </Button>

              <Button
                className="flex-1"
                type="button"
              >
                Edit Budget
              </Button>

            </div>

          </div>

        </Card>

      </div>

    </div>
  );
};