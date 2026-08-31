const mongoose = require("mongoose");
const Budget = require("../models/Budget");
const Transaction = require("../models/Transaction");

// ============================================================
// HELPER: Calculate spending for ONE budget
// ============================================================

const calculateBudgetSpending = async (budget, userId) => {
  const startDate = new Date(budget.startDate);
  const endDate = new Date(budget.endDate);

  // Include the complete end date
  endDate.setHours(23, 59, 59, 999);

  const userObjectId = new mongoose.Types.ObjectId(userId);

  const result = await Transaction.aggregate([
    {
      $match: {
        userId: userObjectId,
        category: budget.category,
        type: "expense",

        date: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: {
            $abs: "$amount",
          },
        },
      },
    },
  ]);

  return result[0]?.total || 0;
};


// ============================================================
// GET ALL BUDGETS
// GET /api/budgets
// ============================================================

exports.getAllBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({
      userId: req.userId,
    }).sort({ createdAt: -1 });

    const enrichedBudgets = await Promise.all(
      budgets.map(async (budget) => {

        const spentAmount = await calculateBudgetSpending(
          budget,
          req.userId
        );

        // Keep database value synchronized
        await Budget.findByIdAndUpdate(
          budget._id,
          {
            spentAmount,
          }
        );

        return {
          ...budget.toObject(),
          spentAmount,
        };
      })
    );

    res.json(enrichedBudgets);

  } catch (error) {

    console.error("Error fetching budgets:", error);

    res.status(500).json({
      error: error.message,
    });
  }
};


// ============================================================
// CREATE BUDGET
// POST /api/budgets
// ============================================================

exports.createBudget = async (req, res) => {
  try {

    const {
      name,
      category,
      budgetedAmount,
      period,
      startDate,
      endDate,
      alertThreshold,
      color,
      description,
      tags,
      rollover,
    } = req.body;

    // Basic validation
    if (!name || !category || budgetedAmount == null) {
      return res.status(400).json({
        error: "Name, category and budget amount are required",
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: "Start date and end date are required",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: "Invalid start or end date",
      });
    }

    if (start > end) {
      return res.status(400).json({
        error: "Start date cannot be after end date",
      });
    }

    const budget = await Budget.create({
      userId: req.userId,

      name,
      category,

      budgetedAmount: Number(budgetedAmount),

      spentAmount: 0,

      period: period || "monthly",

      startDate: start,
      endDate: end,

      alertThreshold:
        alertThreshold != null
          ? Number(alertThreshold)
          : 80,

      isActive: true,

      color,
      description,
      tags,
      rollover,
    });

    // Calculate initial spending immediately
    const spentAmount = await calculateBudgetSpending(
      budget,
      req.userId
    );

    budget.spentAmount = spentAmount;

    await budget.save();

    res.status(201).json(budget);

  } catch (error) {

    console.error("Error creating budget:", error);

    res.status(500).json({
      error: error.message,
    });
  }
};


// ============================================================
// UPDATE BUDGET
// PUT /api/budgets/:id
// ============================================================

exports.updateBudget = async (req, res) => {
  try {

    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!budget) {
      return res.status(404).json({
        error: "Budget not found",
      });
    }

    // Update allowed fields
    const allowedFields = [
      "name",
      "category",
      "budgetedAmount",
      "period",
      "startDate",
      "endDate",
      "alertThreshold",
      "color",
      "description",
      "tags",
      "rollover",
      "isActive",
    ];

    allowedFields.forEach((field) => {

      if (req.body[field] !== undefined) {
        budget[field] = req.body[field];
      }

    });

    // Validate dates after update
    const start = new Date(budget.startDate);
    const end = new Date(budget.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: "Invalid start or end date",
      });
    }

    if (start > end) {
      return res.status(400).json({
        error: "Start date cannot be after end date",
      });
    }

    // Recalculate spending after changes
    const spentAmount = await calculateBudgetSpending(
      budget,
      req.userId
    );

    budget.spentAmount = spentAmount;

    await budget.save();

    res.json(budget);

  } catch (error) {

    console.error("Error updating budget:", error);

    res.status(500).json({
      error: error.message,
    });
  }
};


// ============================================================
// DELETE BUDGET
// DELETE /api/budgets/:id
// ============================================================

exports.deleteBudget = async (req, res) => {
  try {

    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!budget) {
      return res.status(404).json({
        error: "Budget not found",
      });
    }

    res.json({
      message: "Budget deleted successfully",
    });

  } catch (error) {

    console.error("Error deleting budget:", error);

    res.status(500).json({
      error: error.message,
    });
  }
};


// ============================================================
// GET BUDGET ANALYTICS
// GET /api/budgets/analytics
// ============================================================

exports.getAnalytics = async (req, res) => {
  try {

    const userObjectId = new mongoose.Types.ObjectId(
      req.userId
    );

    const budgets = await Budget.find({
      userId: req.userId,
    });

    let totalBudgeted = 0;
    let totalSpent = 0;

    let budgetsOverLimit = 0;
    let budgetsNearLimit = 0;

    const categoryBreakdown = {};

    // --------------------------------------------------------
    // Calculate each budget
    // --------------------------------------------------------

    const enrichedBudgets = await Promise.all(

      budgets.map(async (budget) => {

        const spentAmount =
          await calculateBudgetSpending(
            budget,
            req.userId
          );

        await Budget.findByIdAndUpdate(
          budget._id,
          {
            spentAmount,
          }
        );

        return {
          ...budget.toObject(),
          spentAmount,
        };
      })
    );


    // --------------------------------------------------------
    // Overall budget statistics
    // --------------------------------------------------------

    enrichedBudgets.forEach((budget) => {

      totalBudgeted += Number(
        budget.budgetedAmount || 0
      );

      totalSpent += Number(
        budget.spentAmount || 0
      );

      const percentage =
        budget.budgetedAmount > 0
          ? (budget.spentAmount /
              budget.budgetedAmount) *
            100
          : 0;

      if (percentage >= 100) {

        budgetsOverLimit++;

      } else if (
        percentage >=
        Number(budget.alertThreshold || 80)
      ) {

        budgetsNearLimit++;
      }


      // Category breakdown
      if (!categoryBreakdown[budget.category]) {

        categoryBreakdown[budget.category] = {
          budgeted: 0,
          spent: 0,
          percentage: 0,
        };
      }

      categoryBreakdown[budget.category].budgeted +=
        Number(budget.budgetedAmount || 0);

      categoryBreakdown[budget.category].spent +=
        Number(budget.spentAmount || 0);
    });


    // --------------------------------------------------------
    // Calculate category percentages
    // --------------------------------------------------------

    Object.keys(categoryBreakdown).forEach(
      (category) => {

        const item =
          categoryBreakdown[category];

        if (item.budgeted > 0) {

          item.percentage = Math.round(
            (item.spent / item.budgeted) * 100
          );
        }
      }
    );


    // --------------------------------------------------------
    // Six-month budget/spending trend
    // --------------------------------------------------------

    const monthlyTrend = [];

    const now = new Date();

    for (let i = 5; i >= 0; i--) {

      const date = new Date(now);

      date.setMonth(
        date.getMonth() - i
      );

      const monthStart = new Date(
        date.getFullYear(),
        date.getMonth(),
        1
      );

      const monthEnd = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );


      // Budgets active during this month
      const monthBudgets =
        await Budget.find({
          userId: req.userId,

          startDate: {
            $lte: monthEnd,
          },

          endDate: {
            $gte: monthStart,
          },
        });


      const monthBudgeted =
        monthBudgets.reduce(
          (sum, budget) =>
            sum +
            Number(
              budget.budgetedAmount || 0
            ),
          0
        );


      // Actual spending
      const monthSpending =
        await Transaction.aggregate([

          {
            $match: {

              userId: userObjectId,

              type: "expense",

              date: {
                $gte: monthStart,
                $lte: monthEnd,
              },
            },
          },

          {
            $group: {

              _id: null,

              total: {
                $sum: {
                  $abs: "$amount",
                },
              },
            },
          },
        ]);


      const monthSpent =
        monthSpending[0]?.total || 0;


      monthlyTrend.push({

        month: date.toLocaleDateString(
          "en-US",
          {
            month: "short",
          }
        ),

        budgeted: monthBudgeted,

        spent: monthSpent,
      });
    }


    // --------------------------------------------------------
    // Response
    // --------------------------------------------------------

    res.json({

      totalBudgeted,

      totalSpent,

      budgetsOverLimit,

      budgetsNearLimit,

      categoryBreakdown,

      monthlyTrend,

      budgets: enrichedBudgets,
    });

  } catch (error) {

    console.error(
      "Error getting budget analytics:",
      error
    );

    res.status(500).json({
      error: error.message,
    });
  }
};


// ============================================================
// RECALCULATE BUDGET SPENDING
// ============================================================

exports.recalculateBudgetSpending =
  async (userId) => {

    try {

      const budgets =
        await Budget.find({
          userId,
        });

      await Promise.all(

        budgets.map(async (budget) => {

          const spentAmount =
            await calculateBudgetSpending(
              budget,
              userId
            );

          await Budget.findByIdAndUpdate(
            budget._id,
            {
              spentAmount,
            }
          );
        })
      );

    } catch (error) {

      console.error(
        "Error recalculating budget spending:",
        error
      );
    }
  };


// ============================================================
// REFRESH BUDGETS
// GET/POST /api/budgets/refresh
// ============================================================

exports.refreshBudgets = async (req, res) => {

  try {

    await exports.recalculateBudgetSpending(
      req.userId
    );

    const budgets =
      await Budget.find({
        userId: req.userId,
      });

    // Return fresh calculated values
    const enrichedBudgets =
      await Promise.all(

        budgets.map(async (budget) => {

          const spentAmount =
            await calculateBudgetSpending(
              budget,
              req.userId
            );

          return {
            ...budget.toObject(),
            spentAmount,
          };
        })
      );

    res.json(enrichedBudgets);

  } catch (error) {

    console.error(
      "Error refreshing budgets:",
      error
    );

    res.status(500).json({
      error: error.message,
    });
  }
};