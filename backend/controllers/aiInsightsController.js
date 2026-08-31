const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");

// ============================================================
// DATE HELPERS
// ============================================================

const getMonthStart = (date = new Date()) => {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1,
    0,
    0,
    0,
    0
  );
};

const getMonthEnd = (date = new Date()) => {
  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );
};

const getDateRange = (period) => {
  const now = new Date();

  switch (period) {
    case "week":
      return new Date(
        now.getTime() - 7 * 24 * 60 * 60 * 1000
      );

    case "quarter":
      return new Date(
        now.getFullYear(),
        now.getMonth() - 2,
        1
      );

    case "year":
      return new Date(
        now.getFullYear(),
        now.getMonth() - 11,
        1
      );

    case "6months":
      return new Date(
        now.getFullYear(),
        now.getMonth() - 5,
        1
      );

    case "month":
    default:
      return getMonthStart(now);
  }
};

// ============================================================
// SPENDING ANALYSIS
// ============================================================

const analyzeSpendingPatterns = (transactions) => {
  const now = new Date();

  // ==========================================================
  // ONLY INCLUDE TRANSACTIONS UP TO TODAY
  // ==========================================================

  const validTransactions = transactions.filter(
    (transaction) => {
      const transactionDate = new Date(
        transaction.date
      );

      return transactionDate <= now;
    }
  );

  const expenses = validTransactions.filter(
    (transaction) =>
      transaction.type === "expense"
  );

  const totalSpent = expenses.reduce(
    (sum, transaction) =>
      sum +
      Math.abs(
        Number(transaction.amount) || 0
      ),
    0
  );

  // ==========================================================
  // CATEGORY DISTRIBUTION
  // ==========================================================

  const categoryDistribution = {};

  expenses.forEach((transaction) => {
    const category =
      transaction.category ||
      "Uncategorized";

    const amount =
      Math.abs(
        Number(transaction.amount) || 0
      );

    if (!categoryDistribution[category]) {
      categoryDistribution[category] = {
        total: 0,
        count: 0,
        average: 0
      };
    }

    categoryDistribution[category].total +=
      amount;

    categoryDistribution[category].count +=
      1;
  });

  Object.values(
    categoryDistribution
  ).forEach((category) => {
    category.average =
      category.count > 0
        ? category.total /
          category.count
        : 0;
  });

  // ==========================================================
  // UNUSUAL SPENDING
  // ==========================================================

  const unusualSpending = [];

  expenses.forEach((transaction) => {
    const category =
      transaction.category ||
      "Uncategorized";

    const categoryTransactions =
      expenses.filter(
        (t) =>
          (t.category ||
            "Uncategorized") ===
            category &&
          t._id.toString() !==
            transaction._id.toString()
      );

    if (
      categoryTransactions.length ===
      0
    ) {
      return;
    }

    const previousAverage =
      categoryTransactions.reduce(
        (sum, t) =>
          sum +
          Math.abs(
            Number(t.amount) || 0
          ),
        0
      ) /
      categoryTransactions.length;

    const amount =
      Math.abs(
        Number(transaction.amount) || 0
      );

    if (
      previousAverage > 0 &&
      amount >
        previousAverage * 2
    ) {
      unusualSpending.push({
        transaction,
        deviation: (
          ((amount -
            previousAverage) /
            previousAverage) *
          100
        ).toFixed(1)
      });
    }
  });

  // ==========================================================
  // WEEKLY TREND - CURRENT CALENDAR MONTH
  // ==========================================================

  const weeklyTrend = [];

  const currentYear =
    now.getFullYear();

  const currentMonth =
    now.getMonth();

  const lastDayOfMonth =
    new Date(
      currentYear,
      currentMonth + 1,
      0
    ).getDate();

  // ----------------------------------------------------------
  // Week 1 -> 1-7
  // Week 2 -> 8-14
  // Week 3 -> 15-21
  // Week 4 -> 22-end of month
  // ----------------------------------------------------------

  const weekRanges = [
    {
      week: "Week 1",
      startDay: 1,
      endDay: 7
    },
    {
      week: "Week 2",
      startDay: 8,
      endDay: 14
    },
    {
      week: "Week 3",
      startDay: 15,
      endDay: 21
    },
    {
      week: "Week 4",
      startDay: 22,
      endDay: lastDayOfMonth
    }
  ];

  weekRanges.forEach(
    ({
      week,
      startDay,
      endDay
    }) => {
      const start = new Date(
        currentYear,
        currentMonth,
        startDay,
        0,
        0,
        0,
        0
      );

      const end = new Date(
        currentYear,
        currentMonth,
        endDay,
        23,
        59,
        59,
        999
      );

      // IMPORTANT:
      // Never allow the weekly calculation to
      // include a future date.

      const effectiveEnd =
        end > now ? now : end;

      const spent = expenses
        .filter((transaction) => {
          const date = new Date(
            transaction.date
          );

          return (
            date >= start &&
            date <= effectiveEnd
          );
        })
        .reduce(
          (sum, transaction) =>
            sum +
            Math.abs(
              Number(
                transaction.amount
              ) || 0
            ),
          0
        );

      weeklyTrend.push({
        week,
        spent: Number(
          spent.toFixed(2)
        )
      });
    }
  );

  // ==========================================================
  // DAILY AVERAGE
  // ==========================================================

  /*
   * Use the earliest VALID expense date.
   *
   * Future transactions are already removed above,
   * so they cannot affect this calculation.
   */

  const firstTransactionDate =
    expenses.length > 0
      ? new Date(
          Math.min(
            ...expenses.map(
              (transaction) =>
                new Date(
                  transaction.date
                ).getTime()
            )
          )
        )
      : now;

  const millisecondsPerDay =
    1000 * 60 * 60 * 24;

  const daysElapsed =
    expenses.length > 0
      ? Math.max(
          Math.ceil(
            (now -
              firstTransactionDate) /
              millisecondsPerDay
          ) + 1,
          1
        )
      : 1;

  const dailyAverage =
    totalSpent /
    daysElapsed;

  // ==========================================================
  // RETURN
  // ==========================================================

  return {
    dailyAverage: Number(
      dailyAverage.toFixed(2)
    ),

    weeklyTrend,

    categoryDistribution,

    unusualSpending
  };
};
// ============================================================
// BUDGET SPENDING
// ============================================================

const calculateBudgetSpent = async (
  budget,
  userId
) => {
  const transactions =
    await Transaction.find({
      userId,
      category: budget.category,
      type: "expense",
      date: {
        $gte: new Date(
          budget.startDate
        ),
        $lte: new Date(
          budget.endDate
        )
      }
    });

  return transactions.reduce(
    (sum, transaction) =>
      sum +
      Math.abs(
        Number(transaction.amount) || 0
      ),
    0
  );
};

// ============================================================
// BUDGET RECOMMENDATIONS
// ============================================================

const generateBudgetRecommendations = async (
  budgets,
  userId
) => {
  const recommendations = [];

  // ==========================================================
  // GET LAST 6 MONTHS OF EXPENSES
  // ==========================================================

  const now = new Date();

  const sixMonthsAgo = new Date(
    now.getFullYear(),
    now.getMonth() - 5,
    1
  );

  const transactions =
    await Transaction.find({
      userId,
      type: "expense",
      date: {
        $gte: sixMonthsAgo,
        $lte: now
      }
    });

  // ==========================================================
  // MONTHLY SPENDING BY CATEGORY
  // ==========================================================

  const categoryMonthlySpending = {};

  transactions.forEach((transaction) => {
    const category =
      transaction.category ||
      "Uncategorized";

    const date =
      new Date(transaction.date);

    const monthKey =
      `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

    if (!categoryMonthlySpending[category]) {
      categoryMonthlySpending[category] = {};
    }

    categoryMonthlySpending[category][monthKey] =
      (categoryMonthlySpending[category][monthKey] || 0) +
      Math.abs(
        Number(transaction.amount) || 0
      );
  });

  // ==========================================================
  // AVERAGE MONTHLY SPENDING
  // ==========================================================

  const categoryAverages = {};

  Object.entries(
    categoryMonthlySpending
  ).forEach(
    ([category, months]) => {
      const values =
        Object.values(months);

      const total =
        values.reduce(
          (sum, value) =>
            sum + value,
          0
        );

      categoryAverages[category] =
        values.length > 0
          ? total / values.length
          : 0;
    }
  );

  // ==========================================================
  // EXISTING BUDGETS
  // ==========================================================

  for (const budget of budgets) {
    const budgetAmount =
      Number(
        budget.budgetedAmount
      ) || 0;

    if (budgetAmount <= 0) {
      continue;
    }

    const category =
      budget.category;

    const averageSpending =
      categoryAverages[category] || 0;

    const currentSpent =
      await calculateBudgetSpent(
        budget,
        userId
      );

    const percentage =
      (currentSpent /
        budgetAmount) *
      100;

    // ========================================================
    // OVER BUDGET
    // ========================================================

    if (percentage > 100) {
      const suggestedBudget =
        Math.ceil(
          Math.max(
            averageSpending * 1.10,
            currentSpent * 1.05
          ) / 50
        ) * 50;

      recommendations.push({
        type: "increase_budget",

        category,

        message:
          `You've exceeded your ${category} budget. You have spent $${currentSpent.toFixed(
            0
          )} against a budget of $${budgetAmount.toFixed(
            0
          )}. Based on your historical spending, a budget of around $${suggestedBudget.toFixed(
            0
          )} may be more realistic.`,

        priority: "high",

        currentBudget:
          budgetAmount,

        suggestedBudget
      });

      continue;
    }

    // ========================================================
    // CLOSE TO BUDGET
    // ========================================================

    if (percentage >= 80) {
      const suggestedBudget =
        Math.ceil(
          Math.max(
            averageSpending * 1.10,
            budgetAmount
          ) / 50
        ) * 50;

      recommendations.push({
        type: "increase_budget",

        category,

        message:
          `You've used ${percentage.toFixed(
            0
          )}% of your ${category} budget. Based on your historical spending, consider a budget of around $${suggestedBudget.toFixed(
            0
          )}.`,

        priority: "medium",

        currentBudget:
          budgetAmount,

        suggestedBudget
      });

      continue;
    }

    // ========================================================
    // BUDGET MUCH HIGHER THAN SPENDING
    // ========================================================

    if (
      averageSpending > 0 &&
      budgetAmount >
        averageSpending * 1.5 &&
      percentage < 60
    ) {
      const suggestedBudget =
        Math.ceil(
          (averageSpending * 1.20) /
            50
        ) * 50;

      if (
        suggestedBudget <
        budgetAmount * 0.8
      ) {
        recommendations.push({
          type: "decrease_budget",

          category,

          message:
            `Your current ${category} budget is $${budgetAmount.toFixed(
              0
            )}, while your average monthly spending is around $${averageSpending.toFixed(
              0
            )}. A budget of approximately $${suggestedBudget.toFixed(
              0
            )} may be more appropriate.`,

          priority: "low",

          currentBudget:
            budgetAmount,

          suggestedBudget
        });
      }
    }
  }

  // ==========================================================
  // CATEGORIES WITHOUT BUDGET
  // ==========================================================

  for (
    const [category, averageSpending] of Object.entries(
      categoryAverages
    )
  ) {
    const hasBudget =
      budgets.some(
        (budget) =>
          budget.category ===
          category
      );

    if (
      !hasBudget &&
      averageSpending >= 100
    ) {
      const suggestedBudget =
        Math.ceil(
          (averageSpending * 1.10) /
            50
        ) * 50;

      recommendations.push({
        type: "create_budget",

        category,

        message:
          `You spend approximately $${averageSpending.toFixed(
            0
          )} per month on ${category}. Consider creating a monthly budget of around $${suggestedBudget.toFixed(
            0
          )}.`,

        priority: "medium",

        suggestedBudget
      });
    }
  }

  // ==========================================================
  // SORT BY PRIORITY
  // ==========================================================

  const priorityOrder = {
    high: 1,
    medium: 2,
    low: 3
  };

  recommendations.sort(
    (a, b) =>
      priorityOrder[a.priority] -
      priorityOrder[b.priority]
  );

  return recommendations;
};

// ============================================================
// FINANCIAL HEALTH
// ============================================================

const calculateFinancialHealth = (
  transactions,
  budgets,
  budgetSpending = {},
  historicalTransactions = []
) => {
  // ==========================================================
  // CURRENT MONTH INCOME
  // ==========================================================

  const income =
    transactions
      .filter(
        (t) =>
          t.type === "income"
      )
      .reduce(
        (sum, t) =>
          sum +
          Math.abs(
            Number(t.amount) || 0
          ),
        0
      );

  // ==========================================================
  // CURRENT MONTH EXPENSES
  // ==========================================================

  const expenses =
    transactions
      .filter(
        (t) =>
          t.type === "expense"
      )
      .reduce(
        (sum, t) =>
          sum +
          Math.abs(
            Number(t.amount) || 0
          ),
        0
      );

  // ==========================================================
  // SAVINGS
  // ==========================================================

  const savings =
    income - expenses;

  const savingsRate =
    income > 0
      ? (savings / income) * 100
      : 0;

  // ==========================================================
  // SAVINGS SCORE
  // ==========================================================

  let savingsScore = 0;

  if (savingsRate >= 30) {
    savingsScore = 40;
  } else if (savingsRate >= 20) {
    savingsScore = 35;
  } else if (savingsRate >= 10) {
    savingsScore = 25;
  } else if (savingsRate > 0) {
    savingsScore = 15;
  } else {
    savingsScore = 0;
  }

  // ==========================================================
  // BUDGET ADHERENCE
  // ==========================================================

  let budgetAdherence = 100;
  let budgetsOverLimit = 0;

  const adherenceValues = [];

  budgets.forEach((budget) => {
    const budgetAmount =
      Number(
        budget.budgetedAmount
      ) || 0;

    if (budgetAmount <= 0) {
      return;
    }

    const spent =
      Number(
        budgetSpending[
          budget._id.toString()
        ]
      ) || 0;

    const percentage =
      (spent /
        budgetAmount) *
      100;

    if (percentage > 100) {
      budgetsOverLimit++;
    }

    const adherence =
      Math.max(
        0,
        Math.min(
          100,
          100 -
            Math.max(
              0,
              percentage - 100
            )
        )
      );

    adherenceValues.push(
      adherence
    );
  });

  if (
    adherenceValues.length > 0
  ) {
    budgetAdherence =
      adherenceValues.reduce(
        (sum, value) =>
          sum + value,
        0
      ) /
      adherenceValues.length;
  }

  const budgetScore =
    (budgetAdherence / 100) *
    30;

  // ==========================================================
  // SPENDING TREND
  // ==========================================================

  const now = new Date();

  const monthlySpending = {};

  historicalTransactions
    .filter(
      (t) =>
        t.type === "expense"
    )
    .forEach((transaction) => {
      const date =
        new Date(
          transaction.date
        );

      const key =
        `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

      monthlySpending[key] =
        (monthlySpending[key] || 0) +
        Math.abs(
          Number(transaction.amount) || 0
        );
    });

  const monthlyValues = [];

  for (let i = 5; i >= 0; i--) {
    const date =
      new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      );

    const key =
      `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

    monthlyValues.push(
      monthlySpending[key] || 0
    );
  }

  let spendingTrendPercentage = 0;
  let spendingTrendScore = 8;

  if (
    monthlyValues.length >= 6
  ) {
    const previousThree =
      monthlyValues.slice(0, 3);

    const latestThree =
      monthlyValues.slice(3, 6);

    const previousAverage =
      previousThree.reduce(
        (sum, value) =>
          sum + value,
        0
      ) / 3;

    const latestAverage =
      latestThree.reduce(
        (sum, value) =>
          sum + value,
        0
      ) / 3;

    if (
      previousAverage > 0
    ) {
      spendingTrendPercentage =
        ((latestAverage -
          previousAverage) /
          previousAverage) *
        100;
    }

    if (
      spendingTrendPercentage <=
      -10
    ) {
      spendingTrendScore = 15;
    } else if (
      spendingTrendPercentage <=
      0
    ) {
      spendingTrendScore = 13;
    } else if (
      spendingTrendPercentage <=
      10
    ) {
      spendingTrendScore = 10;
    } else if (
      spendingTrendPercentage <=
      20
    ) {
      spendingTrendScore = 6;
    } else {
      spendingTrendScore = 2;
    }
  }

  // ==========================================================
  // INCOME STABILITY
  // ==========================================================

  const monthlyIncome = {};

  historicalTransactions
    .filter(
      (t) =>
        t.type === "income"
    )
    .forEach((transaction) => {
      const date =
        new Date(
          transaction.date
        );

      const key =
        `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

      monthlyIncome[key] =
        (monthlyIncome[key] || 0) +
        Math.abs(
          Number(transaction.amount) || 0
        );
    });

  const incomeValues = [];

  for (let i = 5; i >= 0; i--) {
    const date =
      new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      );

    const key =
      `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

    if (
      monthlyIncome[key] !==
      undefined
    ) {
      incomeValues.push(
        monthlyIncome[key]
      );
    }
  }

  let incomeStabilityScore = 8;

  if (
    incomeValues.length >= 6
  ) {
    const averageIncome =
      incomeValues.reduce(
        (sum, value) =>
          sum + value,
        0
      ) /
      incomeValues.length;

    if (
      averageIncome > 0
    ) {
      const maxDeviation =
        Math.max(
          ...incomeValues.map(
            (value) =>
              Math.abs(
                value -
                  averageIncome
              ) /
              averageIncome
          )
        );

      if (
        maxDeviation <= 0.10
      ) {
        incomeStabilityScore = 15;
      } else if (
        maxDeviation <= 0.20
      ) {
        incomeStabilityScore = 12;
      } else if (
        maxDeviation <= 0.30
      ) {
        incomeStabilityScore = 9;
      } else {
        incomeStabilityScore = 6;
      }
    }
  } else if (
    incomeValues.length >= 3
  ) {
    incomeStabilityScore = 11;
  } else if (
    incomeValues.length >= 1
  ) {
    incomeStabilityScore = 8;
  }

  // ==========================================================
  // FINAL SCORE
  // ==========================================================

  const score = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        savingsScore +
          budgetScore +
          spendingTrendScore +
          incomeStabilityScore
      )
    )
  );

  // ==========================================================
  // HEALTH DESCRIPTION
  // ==========================================================

  let recommendation;

  if (score >= 85) {
    recommendation =
      "Excellent";
  } else if (score >= 70) {
    recommendation =
      "Good";
  } else if (score >= 50) {
    recommendation =
      "Fair";
  } else {
    recommendation =
      "Needs Improvement";
  }

  return {
    score,

    savingsRate:
      Number(
        savingsRate.toFixed(1)
      ),

    budgetAdherence:
      Number(
        budgetAdherence.toFixed(1)
      ),

    budgetsOverLimit,

    spendingTrend:
      Number(
        spendingTrendPercentage.toFixed(1)
      ),

    incomeStability:
      Number(
        incomeStabilityScore.toFixed(1)
      ),

    scoreBreakdown: {
      savingsRate:
        Number(
          savingsScore.toFixed(1)
        ),

      budgetAdherence:
        Number(
          budgetScore.toFixed(1)
        ),

      spendingTrend:
        Number(
          spendingTrendScore.toFixed(1)
        ),

      incomeStability:
        Number(
          incomeStabilityScore.toFixed(1)
        )
    },

    recommendation
  };
};

// ============================================================
// GET MONTHLY SPENDING HISTORY
// ============================================================

const getMonthlySpending = async (
  userId,
  months = 6
) => {
  const now = new Date();

  const startDate =
    new Date(
      now.getFullYear(),
      now.getMonth() -
        (months - 1),
      1
    );

  const data =
    await Transaction.aggregate([
      {
        $match: {
          userId:
            new mongoose.Types.ObjectId(
              userId
            ),

          type: "expense",

          date: {
            $gte: startDate
          }
        }
      },

      {
        $group: {
          _id: {
            year: {
              $year: "$date"
            },

            month: {
              $month: "$date"
            }
          },

          total: {
            $sum: {
              $abs: "$amount"
            }
          }
        }
      }
    ]);

  const result = [];

  for (
    let i = months - 1;
    i >= 0;
    i--
  ) {
    const date =
      new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      );

    const year =
      date.getFullYear();

    const month =
      date.getMonth() + 1;

    const found =
      data.find(
        (item) =>
          item._id.year === year &&
          item._id.month === month
      );

    result.push({
      year,

      month,

      label:
        date.toLocaleDateString(
          "en-US",
          {
            month: "short"
          }
        ),

      amount:
        found
          ? Number(found.total)
          : 0
    });
  }

  return result;
};

// ============================================================
// MACHINE LEARNING - LINEAR REGRESSION
// ============================================================

const predictFutureSpending =
  async (userId) => {
    const monthlyData =
      await getMonthlySpending(
        userId,
        6
      );

    const trainingData =
      monthlyData
        .map(
          (month, index) => ({
            x: index + 1,
            y:
              Number(
                month.amount
              ) || 0
          })
        )
        .filter(
          (month) =>
            month.y > 0
        );

    // ========================================================
    // NO DATA
    // ========================================================

    if (
      trainingData.length === 0
    ) {
      return {
        nextMonth: 0,
        nextQuarter: 0,
        nextYear: 0,
        trendPercentage: 0,
        trendDirection:
          "stable",
        confidenceLevel:
          "low",
        monthsOfData: 0,
        averageMonthlySpending: 0,
        model:
          "linear_regression",
        rSquared: 0
      };
    }

    // ========================================================
    // ONE MONTH
    // ========================================================

    if (
      trainingData.length === 1
    ) {
      const current =
        trainingData[0].y;

      return {
        nextMonth:
          Number(
            current.toFixed(2)
          ),

        nextQuarter:
          Number(
            (current * 3).toFixed(2)
          ),

        nextYear:
          Number(
            (current * 12).toFixed(2)
          ),

        trendPercentage: 0,

        trendDirection:
          "stable",

        confidenceLevel:
          "low",

        monthsOfData: 1,

        averageMonthlySpending:
          Number(
            current.toFixed(2)
          ),

        model:
          "linear_regression",

        rSquared: 0
      };
    }

    // ========================================================
    // LINEAR REGRESSION
    // ========================================================

    const n =
      trainingData.length;

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    trainingData.forEach(
      ({ x, y }) => {
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
      }
    );

    const denominator =
      n * sumX2 -
      sumX * sumX;

    let slope = 0;

    if (
      denominator !== 0
    ) {
      slope =
        (n * sumXY -
          sumX * sumY) /
        denominator;
    }

    const meanX =
      sumX / n;

    const meanY =
      sumY / n;

    const intercept =
      meanY -
      slope * meanX;

    // ========================================================
    // PREDICT NEXT MONTH
    // ========================================================

    const latestX =
      Math.max(
        ...trainingData.map(
          (item) => item.x
        )
      );

    const nextX =
      latestX + 1;

    let nextMonth =
      intercept +
      slope * nextX;

    nextMonth =
      Math.max(
        0,
        nextMonth
      );

    // ========================================================
    // R-SQUARED
    // ========================================================

    let ssTotal = 0;
    let ssResidual = 0;

    trainingData.forEach(
      ({ x, y }) => {
        const predicted =
          intercept +
          slope * x;

        ssTotal +=
          Math.pow(
            y - meanY,
            2
          );

        ssResidual +=
          Math.pow(
            y - predicted,
            2
          );
      }
    );

    let rSquared = 0;

    if (
      ssTotal !== 0
    ) {
      rSquared =
        1 -
        ssResidual /
          ssTotal;
    }

    rSquared =
      Math.max(
        0,
        Math.min(
          1,
          rSquared
        )
      );

    // ========================================================
    // TREND
    // ========================================================

    const latestSpending =
      trainingData[
        trainingData.length - 1
      ].y;

    let trendPercentage = 0;

    if (
      latestSpending > 0
    ) {
      trendPercentage =
        ((nextMonth -
          latestSpending) /
          latestSpending) *
        100;
    }

    trendPercentage =
      Math.max(
        -50,
        Math.min(
          50,
          trendPercentage
        )
      );

    let trendDirection =
      "stable";

    if (
      trendPercentage > 5
    ) {
      trendDirection =
        "increasing";
    } else if (
      trendPercentage < -5
    ) {
      trendDirection =
        "decreasing";
    }

    // ========================================================
    // CONFIDENCE
    // ========================================================

    let confidenceLevel =
      "low";

    if (
      trainingData.length >= 6 &&
      rSquared >= 0.7
    ) {
      confidenceLevel =
        "high";
    } else if (
      trainingData.length >= 3 &&
      rSquared >= 0.4
    ) {
      confidenceLevel =
        "medium";
    }

    // ========================================================
    // AVERAGE
    // ========================================================

    const averageMonthlySpending =
      sumY / n;

    return {
      nextMonth:
        Number(
          nextMonth.toFixed(2)
        ),

      nextQuarter:
        Number(
          (nextMonth * 3).toFixed(2)
        ),

      nextYear:
        Number(
          (nextMonth * 12).toFixed(2)
        ),

      trendPercentage:
        Number(
          trendPercentage.toFixed(1)
        ),

      trendDirection,

      confidenceLevel,

      monthsOfData:
        trainingData.length,

      averageMonthlySpending:
        Number(
          averageMonthlySpending.toFixed(
            2
          )
        ),

      model:
        "linear_regression",

      rSquared:
        Number(
          rSquared.toFixed(3)
        )
    };
  };

// ============================================================
// CATEGORY PREDICTIONS
// ============================================================

const getCategoryPredictions =
  async (userId) => {
    const now =
      new Date();

    const startDate =
      new Date(
        now.getFullYear(),
        now.getMonth() - 5,
        1
      );

    const transactions =
      await Transaction.find({
        userId,
        type: "expense",
        date: {
          $gte: startDate
        }
      });

    const categories = [
      ...new Set(
        transactions.map(
          (transaction) =>
            transaction.category ||
            "Uncategorized"
        )
      )
    ];

    const predictions = {};

    for (
      const category of categories
    ) {
      const monthlyValues = [];

      for (
        let i = 5;
        i >= 0;
        i--
      ) {
        const date =
          new Date(
            now.getFullYear(),
            now.getMonth() - i,
            1
          );

        const monthStart =
          new Date(
            date.getFullYear(),
            date.getMonth(),
            1
          );

        const monthEnd =
          new Date(
            date.getFullYear(),
            date.getMonth() + 1,
            0,
            23,
            59,
            59,
            999
          );

        const monthlySpent =
          transactions
            .filter(
              (transaction) => {
                const transactionDate =
                  new Date(
                    transaction.date
                  );

                return (
                  (transaction.category ||
                    "Uncategorized") ===
                    category &&
                  transactionDate >=
                    monthStart &&
                  transactionDate <=
                    monthEnd
                );
              }
            )
            .reduce(
              (sum, transaction) =>
                sum +
                Math.abs(
                  Number(
                    transaction.amount
                  ) || 0
                ),
              0
            );

        monthlyValues.push(
          monthlySpent
        );
      }

      const average =
        monthlyValues.reduce(
          (sum, value) =>
            sum + value,
          0
        ) /
        monthlyValues.length;

      const firstMonth =
        monthlyValues[0];

      const lastMonth =
        monthlyValues[
          monthlyValues.length - 1
        ];

      let trend =
        "stable";

      if (
        firstMonth > 0
      ) {
        const change =
          ((lastMonth -
            firstMonth) /
            firstMonth) *
          100;

        if (
          change > 10
        ) {
          trend =
            "increasing";
        } else if (
          change < -10
        ) {
          trend =
            "decreasing";
        }
      }

      predictions[category] = {
        nextMonth:
          Number(
            average.toFixed(2)
          ),

        trend
      };
    }

    return predictions;
  };

// ============================================================
// GET AI INSIGHTS OVERVIEW
// ============================================================

exports.getInsightsOverview =
  async (req, res) => {
    try {
      const userId =
        req.userId;

      const monthStart =
        getMonthStart();

      const monthEnd =
        getMonthEnd();

      // --------------------------------------------------------
      // SIX MONTH HISTORY
      // --------------------------------------------------------

      const sixMonthsAgo =
        new Date(
          new Date().getFullYear(),
          new Date().getMonth() - 5,
          1
        );

      // --------------------------------------------------------
      // GET DATA
      // --------------------------------------------------------

      const [
        transactions,
        historicalTransactions,
        budgets,
        allExpenseTransactions
      ] = await Promise.all([
        // Current month transactions
        Transaction.find({
          userId,
          date: {
            $gte: monthStart,
            $lte: monthEnd
          }
        }).sort({
          date: -1
        }),

        // Six month transaction history
        Transaction.find({
          userId,
          date: {
            $gte: sixMonthsAgo,
            $lte: monthEnd
          }
        }),

        // Active budgets
        Budget.find({
          userId,
          isActive: true
        }),

        // ALL expense transactions
        // Used specifically for Categories Used
        Transaction.find({
          userId,
          type: "expense"
        }).select("category")
      ]);

      // ========================================================
      // CATEGORIES USED
      // ========================================================
      //
      // Count distinct expense categories across
      // the user's complete transaction history.
      //
      // Example:
      // Food & Dining
      // Groceries
      // Transportation
      //
      // Result = 3
      // ========================================================

      const categoriesUsed =
        new Set(
          allExpenseTransactions.map(
            (transaction) =>
              transaction.category ||
              "Uncategorized"
          )
        ).size;

      // ========================================================
      // BUDGET SPENDING
      // ========================================================

      const budgetSpending = {};

      await Promise.all(
        budgets.map(
          async (budget) => {
            budgetSpending[
              budget._id.toString()
            ] =
              await calculateBudgetSpent(
                budget,
                userId
              );
          }
        )
      );

      // ========================================================
      // ANALYZE CURRENT MONTH SPENDING
      // ========================================================

      const spendingPatterns =
        analyzeSpendingPatterns(
          transactions
        );

      // Add complete-history category count
      spendingPatterns.categoriesUsed =
        categoriesUsed;

      // ========================================================
      // BUDGET RECOMMENDATIONS
      // ========================================================

      const budgetRecommendations =
        await generateBudgetRecommendations(
          budgets,
          userId
        );

      // ========================================================
      // FINANCIAL HEALTH
      // ========================================================

      const financialHealth =
        calculateFinancialHealth(
          transactions,
          budgets,
          budgetSpending,
          historicalTransactions
        );

      // ========================================================
      // ML PREDICTION
      // ========================================================

      const predictions =
        await predictFutureSpending(
          userId
        );

      // ========================================================
      // CURRENT MONTH EXPENSES
      // ========================================================

      const totalExpenses =
        transactions
          .filter(
            (t) =>
              t.type === "expense"
          )
          .reduce(
            (sum, t) =>
              sum +
              Math.abs(
                Number(t.amount) || 0
              ),
            0
          );

      const insights = [];

      // ========================================================
      // UNUSUAL SPENDING
      // ========================================================

      if (
        spendingPatterns
          .unusualSpending.length >
        0
      ) {
        insights.push({
          id:
            "unusual-spending",

          type:
            "warning",

          title:
            "Unusual Spending Detected",

          description:
            `You have ${spendingPatterns.unusualSpending.length} unusually large transaction(s) compared with your normal category spending.`,

          icon:
            "AlertTriangle",

          priority:
            "high",

          actionText:
            "Review Transactions",

          data:
            spendingPatterns.unusualSpending
        });
      }

      // ========================================================
      // BUDGET RECOMMENDATIONS
      // ========================================================

      if (
        budgetRecommendations.length >
        0
      ) {
        insights.push({
          id:
            "budget-recommendations",

          type:
            "recommendation",

          title:
            "Budget Adjustments Needed",

          description:
            `${budgetRecommendations.length} budget recommendation(s) are available based on your spending patterns.`,

          icon:
            "Target",

          priority:
            "high",

          actionText:
            "Adjust Budgets",

          data:
            budgetRecommendations
        });
      }

      // ========================================================
      // FINANCIAL HEALTH
      // ========================================================

      insights.push({
        id:
          "financial-health",

        type:
          financialHealth.score >=
          70
            ? "success"
            : financialHealth.score >=
              40
            ? "warning"
            : "error",

        title:
          `Financial Health: ${financialHealth.recommendation}`,

        description:
          `Your financial health score is ${financialHealth.score}/100. Savings rate: ${financialHealth.savingsRate}%`,

        icon:
          "TrendingUp",

        priority:
          "medium",

        actionText:
          "View Details",

        data:
          financialHealth
      });

      // ========================================================
      // SAVINGS OPPORTUNITY
      // ========================================================

      if (
        totalExpenses > 0
      ) {
        const topCategory =
          Object.entries(
            spendingPatterns
              .categoryDistribution
          ).sort(
            ([, a], [, b]) =>
              b.total -
              a.total
          )[0];

        if (
          topCategory
        ) {
          const [
            categoryName,
            categoryData
          ] = topCategory;

          const potentialSavings =
            categoryData.total *
            0.1;

          insights.push({
            id:
              "savings-opportunity",

            type:
              "recommendation",

            title:
              "Savings Opportunity",

            description:
              `You could save approximately $${potentialSavings.toFixed(
                0
              )} by reducing ${categoryName} spending by 10%.`,

            icon:
              "PiggyBank",

            priority:
              "medium",

            actionText:
              "Learn More",

            data: {
              category:
                categoryName,

              currentSpending:
                categoryData.total,

              potentialSavings
            }
          });
        }
      }

      // ========================================================
      // SPENDING FORECAST
      // ========================================================

      let forecastDescription =
        `Based on your spending history, you're projected to spend approximately $${predictions.nextMonth.toFixed(
          0
        )} next month.`;

      if (
        predictions.trendDirection ===
        "increasing"
      ) {
        forecastDescription +=
          ` Your spending trend is increasing by approximately ${predictions.trendPercentage}%.`;
      } else if (
        predictions.trendDirection ===
        "decreasing"
      ) {
        forecastDescription +=
          ` Your spending trend is decreasing by approximately ${Math.abs(
            predictions.trendPercentage
          )}%.`;
      } else {
        forecastDescription +=
          " Your spending trend is currently stable.";
      }

      forecastDescription +=
        ` Confidence: ${predictions.confidenceLevel}.`;

      insights.push({
        id:
          "spending-prediction",

        type:
          "info",

        title:
          "Spending Forecast",

        description:
          forecastDescription,

        icon:
          "TrendingUp",

        priority:
          "low",

        actionText:
          "View Forecast",

        data:
          predictions
      });

      // ========================================================
      // RESPONSE
      // ========================================================

      res.json({
        insights,

        summary: {
          totalInsights:
            insights.length,

          highPriority:
            insights.filter(
              (i) =>
                i.priority ===
                "high"
            ).length,

          financialHealthScore:
            financialHealth.score,

          monthlySpending:
            totalExpenses,

          savingsRate:
            financialHealth.savingsRate
        },

        spendingPatterns,

        budgetRecommendations,

        financialHealth,

        predictions
      });
    } catch (error) {
      console.error(
        "Error generating AI insights:",
        error
      );

      res.status(500).json({
        error:
          error.message
      });
    }
  };

// ============================================================
// SPENDING ANALYSIS ENDPOINT
// ============================================================

exports.getSpendingAnalysis =
  async (req, res) => {
    try {
      const userId =
        req.userId;

      const {
        period = "6months"
      } = req.query;

      const startDate =
        getDateRange(
          period
        );

      const transactions =
        await Transaction.find({
          userId,

          date: {
            $gte: startDate
          },

          type:
            "expense"
        }).sort({
          date: -1
        });

      const analysis =
        analyzeSpendingPatterns(
          transactions
        );

      // Count categories in the selected period
      analysis.categoriesUsed =
        new Set(
          transactions.map(
            (transaction) =>
              transaction.category ||
              "Uncategorized"
          )
        ).size;

      const totalSpent =
        transactions.reduce(
          (sum, transaction) =>
            sum +
            Math.abs(
              Number(
                transaction.amount
              ) || 0
            ),
          0
        );

      res.json({
        period,

        analysis,

        totalTransactions:
          transactions.length,

        totalSpent
      });
    } catch (error) {
      console.error(
        "Error analyzing spending:",
        error
      );

      res.status(500).json({
        error:
          error.message
      });
    }
  };

// ============================================================
// BUDGET RECOMMENDATIONS ENDPOINT
// ============================================================

exports.getBudgetRecommendations =
  async (req, res) => {
    try {
      const userId =
        req.userId;

      const budgets =
        await Budget.find({
          userId,
          isActive: true
        });

      const recommendations =
        await generateBudgetRecommendations(
          budgets,
          userId
        );

      res.json({
        recommendations,

        totalRecommendations:
          recommendations.length,

        highPriority:
          recommendations.filter(
            (r) =>
              r.priority ===
              "high"
          ).length
      });
    } catch (error) {
      console.error(
        "Error generating budget recommendations:",
        error
      );

      res.status(500).json({
        error:
          error.message
      });
    }
  };

// ============================================================
// FINANCIAL HEALTH ENDPOINT
// ============================================================

exports.getFinancialHealth =
  async (req, res) => {
    try {
      const userId =
        req.userId;

      const monthStart =
        getMonthStart();

      const monthEnd =
        getMonthEnd();

      // --------------------------------------------------------
      // SIX MONTH HISTORY
      // --------------------------------------------------------

      const sixMonthsAgo =
        new Date(
          new Date().getFullYear(),
          new Date().getMonth() - 5,
          1
        );

      const [
        transactions,
        historicalTransactions,
        budgets
      ] = await Promise.all([
        // Current month
        Transaction.find({
          userId,

          date: {
            $gte: monthStart,
            $lte: monthEnd
          }
        }),

        // Historical transactions
        Transaction.find({
          userId,

          date: {
            $gte: sixMonthsAgo,
            $lte: monthEnd
          }
        }),

        // Active budgets
        Budget.find({
          userId,
          isActive: true
        })
      ]);

      // ========================================================
      // BUDGET SPENDING
      // ========================================================

      const budgetSpending = {};

      await Promise.all(
        budgets.map(
          async (budget) => {
            budgetSpending[
              budget._id.toString()
            ] =
              await calculateBudgetSpent(
                budget,
                userId
              );
          }
        )
      );

      // ========================================================
      // CALCULATE HEALTH
      // ========================================================

      const healthData =
        calculateFinancialHealth(
          transactions,
          budgets,
          budgetSpending,
          historicalTransactions
        );

      res.json(
        healthData
      );
    } catch (error) {
      console.error(
        "Error calculating financial health:",
        error
      );

      res.status(500).json({
        error:
          error.message
      });
    }
  };

// ============================================================
// PREDICTIONS ENDPOINT
// ============================================================

exports.getPredictions =
  async (req, res) => {
    try {
      const userId =
        req.userId;

      // --------------------------------------------------------
      // ML prediction
      // --------------------------------------------------------

      const predictions =
        await predictFutureSpending(
          userId
        );

      // --------------------------------------------------------
      // Category predictions
      // --------------------------------------------------------

      const categoryPredictions =
        await getCategoryPredictions(
          userId
        );

      res.json({
        ...predictions,

        categoryPredictions,

        model:
          predictions.model ||
          "linear_regression"
      });
    } catch (error) {
      console.error(
        "Error generating predictions:",
        error
      );

      res.status(500).json({
        error:
          error.message
      });
    }
  };