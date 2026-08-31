import React, { useState, useEffect } from 'react';
import {
  X,
  Target,
  DollarSign,
  Calendar,
  FileText,
  Palette,
  AlertTriangle
} from 'lucide-react';

import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { CategorySelector } from '../ui/CategorySelector';
import { createBudget } from '../services/budgetService';

interface BudgetRecommendation {
  type?: string;
  category?: string;
  suggestedBudget?: number;
  currentBudget?: number;
  priority?: string;
  message?: string;
  period?: BudgetPeriod;
  name?: string;
}

interface CreateBudgetFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;

  // Optional recommendation coming from AI Insights
  recommendation?: BudgetRecommendation | null;
}

type BudgetPeriod =
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly';

interface FormData {
  name: string;
  category: string;
  budgetedAmount: string;
  period: BudgetPeriod;
  startDate: string;
  endDate: string;
  alertThreshold: string;
  color: string;
  description: string;
  tags: string;
  rollover: boolean;
}

const predefinedColors = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
  '#F97316',
  '#6366F1'
];

const periods: {
  value: BudgetPeriod;
  label: string;
}[] = [
  {
    value: 'weekly',
    label: 'Weekly'
  },
  {
    value: 'monthly',
    label: 'Monthly'
  },
  {
    value: 'quarterly',
    label: 'Quarterly'
  },
  {
    value: 'yearly',
    label: 'Yearly'
  }
];

// ============================================================
// DATE HELPERS
// ============================================================

const formatDateInput = (date: Date): string => {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const parseDateInput = (value: string): Date => {
  const [year, month, day] =
    value.split('-').map(Number);

  return new Date(
    year,
    month - 1,
    day
  );
};

// ============================================================
// CALCULATE END DATE
// ============================================================

const calculateEndDate = (
  startDateString: string,
  period: BudgetPeriod
): string => {
  if (!startDateString) {
    return '';
  }

  const startDate =
    parseDateInput(startDateString);

  let endDate: Date;

  switch (period) {
    case 'weekly':
      endDate = new Date(startDate);

      endDate.setDate(
        startDate.getDate() + 6
      );

      break;

    case 'monthly':
      endDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth() + 1,
        0
      );

      break;

    case 'quarterly':
      endDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth() + 3,
        0
      );

      break;

    case 'yearly':
      endDate = new Date(
        startDate.getFullYear(),
        11,
        31
      );

      break;

    default:
      endDate = new Date(startDate);
      break;
  }

  return formatDateInput(endDate);
};

// ============================================================
// DEFAULT FORM
// ============================================================

const getDefaultFormData = (): FormData => {
  const today =
    formatDateInput(new Date());

  return {
    name: '',
    category: '',
    budgetedAmount: '',
    period: 'monthly',

    startDate: today,

    endDate: calculateEndDate(
      today,
      'monthly'
    ),

    alertThreshold: '80',

    color:
      predefinedColors[0],

    description: '',
    tags: '',
    rollover: false
  };
};

// ============================================================
// COMPONENT
// ============================================================

export const CreateBudgetForm: React.FC<
  CreateBudgetFormProps
> = ({
  isOpen,
  onClose,
  onSuccess,
  recommendation
}) => {

  const [
    formData,
    setFormData
  ] = useState<FormData>(
    getDefaultFormData()
  );

  const [
    isLoading,
    setIsLoading
  ] = useState(false);

  const [
    errors,
    setErrors
  ] = useState<Record<string, string>>({});

  // ==========================================================
  // APPLY AI RECOMMENDATION
  // ==========================================================

  useEffect(() => {
    if (
      !isOpen ||
      !recommendation
    ) {
      return;
    }

    const today =
      formatDateInput(new Date());

    /*
     * Use the period supplied by the recommendation
     * if available.
     *
     * Otherwise default to monthly.
     */
    const recommendedPeriod: BudgetPeriod =
      recommendation.period &&
      periods.some(
        period =>
          period.value ===
          recommendation.period
      )
        ? recommendation.period
        : 'monthly';

    /*
     * Use the recommended category.
     */
    const recommendedCategory =
      recommendation.category ||
      '';

    /*
     * Automatically create a sensible
     * budget name.
     *
     * Example:
     *
     * Groceries
     * ->
     * Monthly Groceries
     */
    const recommendedName =
      recommendation.name ||
      (
        recommendedCategory
          ? `${
              recommendedPeriod
                .charAt(0)
                .toUpperCase() +
              recommendedPeriod.slice(1)
            } ${recommendedCategory}`
          : ''
      );

    /*
     * Suggested budget amount from AI.
     */
    const recommendedAmount =
      recommendation.suggestedBudget !==
      undefined
        ? String(
            recommendation.suggestedBudget
          )
        : '';

    /*
     * Automatically calculate the end date.
     */
    const recommendedEndDate =
      calculateEndDate(
        today,
        recommendedPeriod
      );

    setFormData(
      prev => ({
        ...prev,

        name:
          recommendedName,

        category:
          recommendedCategory,

        budgetedAmount:
          recommendedAmount,

        period:
          recommendedPeriod,

        startDate:
          today,

        endDate:
          recommendedEndDate
      })
    );

    setErrors({});

  }, [
    isOpen,
    recommendation
  ]);

  // ==========================================================
  // AUTOMATIC DATE CALCULATION
  // ==========================================================

  useEffect(() => {
    if (
      !formData.startDate ||
      !formData.period
    ) {
      return;
    }

    const calculatedEndDate =
      calculateEndDate(
        formData.startDate,
        formData.period
      );

    setFormData(prev => {
      if (
        prev.endDate ===
        calculatedEndDate
      ) {
        return prev;
      }

      return {
        ...prev,
        endDate:
          calculatedEndDate
      };
    });

  }, [
    formData.startDate,
    formData.period
  ]);

  // ==========================================================
  // VALIDATION
  // ==========================================================

  const validateForm = () => {
    const newErrors:
      Record<string, string> = {};

    if (
      !formData.name.trim()
    ) {
      newErrors.name =
        'Budget name is required';
    }

    if (
      !formData.category
    ) {
      newErrors.category =
        'Category is required';
    }

    const amount =
      parseFloat(
        formData.budgetedAmount
      );

    if (
      !formData.budgetedAmount ||
      Number.isNaN(amount) ||
      amount <= 0
    ) {
      newErrors.budgetedAmount =
        'Budget amount must be greater than 0';
    }

    if (
      !formData.startDate
    ) {
      newErrors.startDate =
        'Start date is required';
    }

    if (
      !formData.endDate
    ) {
      newErrors.endDate =
        'End date is required';

    } else if (
      parseDateInput(
        formData.endDate
      ) <
      parseDateInput(
        formData.startDate
      )
    ) {
      newErrors.endDate =
        'End date cannot be before start date';
    }

    const threshold =
      parseFloat(
        formData.alertThreshold
      );

    if (
      Number.isNaN(threshold) ||
      threshold < 0 ||
      threshold > 100
    ) {
      newErrors.alertThreshold =
        'Alert threshold must be between 0 and 100';
    }

    setErrors(
      newErrors
    );

    return (
      Object.keys(
        newErrors
      ).length === 0
    );
  };

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (
      !validateForm()
    ) {
      return;
    }

    setIsLoading(true);

    try {
      const startDate =
        parseDateInput(
          formData.startDate
        );

      const endDate =
        parseDateInput(
          formData.endDate
        );

      const budgetData = {
        name:
          formData.name.trim(),

        category:
          formData.category,

        budgetedAmount:
          parseFloat(
            formData.budgetedAmount
          ),

        period:
          formData.period,

        startDate,

        endDate,

        alertThreshold:
          parseFloat(
            formData.alertThreshold
          ),

        isActive:
          true,

        color:
          formData.color,

        description:
          formData.description.trim() ||
          undefined,

        tags:
          formData.tags
            ? formData.tags
                .split(',')
                .map(
                  tag =>
                    tag.trim()
                )
                .filter(Boolean)
            : [],

        rollover:
          formData.rollover
      };

      console.log(
        'Creating budget:',
        budgetData
      );

      await createBudget(
        budgetData
      );

      // Reset form
      setFormData(
        getDefaultFormData()
      );

      setErrors({});

      // Refresh parent
      onSuccess();

      // Close modal
      onClose();

    } catch (
      error: any
    ) {
      console.error(
        'Error creating budget:',
        error
      );

      setErrors({
        submit:
          error?.response?.data?.error ||
          error?.message ||
          'Failed to create budget. Please try again.'
      });

    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================================
  // INPUT CHANGE
  // ==========================================================

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean
  ) => {
    setFormData(
      prev => ({
        ...prev,
        [field]:
          value
      })
    );

    if (
      errors[field]
    ) {
      setErrors(
        prev => ({
          ...prev,
          [field]:
            ''
        })
      );
    }
  };

  // ==========================================================
  // START DATE CHANGE
  // ==========================================================

  const handleStartDateChange = (
    value: string
  ) => {
    setFormData(
      prev => {
        const calculatedEndDate =
          calculateEndDate(
            value,
            prev.period
          );

        return {
          ...prev,

          startDate:
            value,

          endDate:
            calculatedEndDate
        };
      }
    );

    setErrors(
      prev => ({
        ...prev,

        startDate: '',

        endDate: ''
      })
    );
  };

  // ==========================================================
  // CLOSE
  // ==========================================================

  const handleClose = () => {
    if (
      isLoading
    ) {
      return;
    }

    setErrors({});

    onClose();
  };

  // ==========================================================
  // DON'T RENDER
  // ==========================================================

  if (
    !isOpen
  ) {
    return null;
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div
      className="
        fixed inset-0
        bg-black/50
        backdrop-blur-sm
        flex items-center justify-center
        p-4
        z-50
        animate-in
        fade-in
        duration-300
      "
    >
      <div
        className="
          w-full
          max-w-2xl
          max-h-[90vh]
          overflow-y-auto
          transform
          transition-all
          duration-300
          animate-in
          slide-in-from-bottom-4
        "
      >
        <Card className="relative">

          {/* CLOSE */}

          <button
            type="button"
            onClick={
              handleClose
            }
            disabled={
              isLoading
            }
            className="
              absolute
              top-4
              right-4
              p-2
              hover:bg-gray-100
              dark:hover:bg-slate-800
              rounded-xl
              transition-colors
              z-10
            "
          >
            <X
              className="
                w-5
                h-5
                text-gray-500
                dark:text-gray-400
              "
            />
          </button>

          {/* HEADER */}

          <div className="mb-6">

            <h2
              className="
                text-2xl
                font-bold
                text-gray-900
                dark:text-white
                mb-2
              "
            >
              Create Budget
            </h2>

            <p
              className="
                text-gray-600
                dark:text-gray-300
              "
            >
              Set up a budget to track your spending
            </p>

            {/* AI RECOMMENDATION NOTICE */}

            {recommendation && (
              <div
                className="
                  mt-4
                  p-3
                  rounded-xl
                  bg-purple-50
                  dark:bg-purple-500/10
                  border
                  border-purple-200
                  dark:border-purple-500/20
                "
              >
                <p
                  className="
                    text-sm
                    font-medium
                    text-purple-700
                    dark:text-purple-300
                  "
                >
                  AI recommendation applied
                </p>

                <p
                  className="
                    text-xs
                    text-purple-600
                    dark:text-purple-400
                    mt-1
                  "
                >
                  The category and suggested budget
                  amount have been filled automatically.
                  You can still change them before creating
                  the budget.
                </p>
              </div>
            )}

          </div>

          {/* FORM */}

          <form
            onSubmit={
              handleSubmit
            }
            className="space-y-6"
          >

            {/* SUBMIT ERROR */}

            {errors.submit && (
              <div
                className="
                  p-3
                  bg-red-50
                  dark:bg-red-500/20
                  border
                  border-red-200
                  dark:border-red-500/30
                  rounded-xl
                "
              >
                <p
                  className="
                    text-red-600
                    dark:text-red-400
                    text-sm
                  "
                >
                  {errors.submit}
                </p>
              </div>
            )}

            {/* NAME + CATEGORY */}

            <div
              className="
                grid
                grid-cols-1
                md:grid-cols-2
                gap-6
              "
            >

              <Input
                label="Budget Name"
                type="text"
                value={
                  formData.name
                }
                onChange={
                  e =>
                    handleInputChange(
                      'name',
                      e.target.value
                    )
                }
                placeholder="e.g., Monthly Groceries"
                icon={
                  <Target
                    className="
                      w-5
                      h-5
                      text-gray-400
                    "
                  />
                }
                error={
                  errors.name
                }
                disabled={
                  isLoading
                }
              />

              <CategorySelector
                value={
                  formData.category
                }
                onChange={
                  value =>
                    handleInputChange(
                      'category',
                      value
                    )
                }
                type="expense"
                error={
                  errors.category
                }
                disabled={
                  isLoading
                }
              />

            </div>

            {/* AMOUNT + PERIOD */}

            <div
              className="
                grid
                grid-cols-1
                md:grid-cols-2
                gap-6
              "
            >

              <Input
                label="Budget Amount"
                type="number"
                step="0.01"
                min="0"
                value={
                  formData.budgetedAmount
                }
                onChange={
                  e =>
                    handleInputChange(
                      'budgetedAmount',
                      e.target.value
                    )
                }
                placeholder="0.00"
                icon={
                  <DollarSign
                    className="
                      w-5
                      h-5
                      text-gray-400
                    "
                  />
                }
                error={
                  errors.budgetedAmount
                }
                disabled={
                  isLoading
                }
              />

              {/* PERIOD */}

              <div
                className="
                  space-y-1
                "
              >

                <label
                  className="
                    block
                    text-sm
                    font-medium
                    text-gray-700
                    dark:text-gray-200
                  "
                >
                  Period
                </label>

                <div
                  className="
                    grid
                    grid-cols-2
                    gap-2
                  "
                >

                  {periods.map(
                    period => (
                      <button
                        key={
                          period.value
                        }
                        type="button"
                        onClick={() =>
                          handleInputChange(
                            'period',
                            period.value
                          )
                        }
                        disabled={
                          isLoading
                        }
                        className={`
                          px-3
                          py-2
                          rounded-xl
                          text-sm
                          font-medium
                          transition-all
                          duration-300

                          ${
                            formData.period ===
                            period.value

                              ? `
                                bg-blue-500
                                text-white
                                shadow-lg
                                shadow-blue-500/25
                              `

                              : `
                                bg-gray-100
                                dark:bg-slate-800
                                text-gray-700
                                dark:text-gray-300
                                hover:bg-gray-200
                                dark:hover:bg-slate-700
                              `
                          }
                        `}
                      >
                        {
                          period.label
                        }
                      </button>
                    )
                  )}

                </div>

              </div>

            </div>

            {/* DATES */}

            <div
              className="
                grid
                grid-cols-1
                md:grid-cols-2
                gap-6
              "
            >

              <Input
                label="Start Date"
                type="date"
                value={
                  formData.startDate
                }
                onChange={
                  e =>
                    handleStartDateChange(
                      e.target.value
                    )
                }
                icon={
                  <Calendar
                    className="
                      w-5
                      h-5
                      text-gray-400
                    "
                  />
                }
                error={
                  errors.startDate
                }
                disabled={
                  isLoading
                }
              />

              <Input
                label="End Date"
                type="date"
                value={
                  formData.endDate
                }
                readOnly
                disabled={
                  isLoading
                }
                icon={
                  <Calendar
                    className="
                      w-5
                      h-5
                      text-gray-400
                    "
                  />
                }
                error={
                  errors.endDate
                }
              />

            </div>

            {/* DATE INFORMATION */}

            <div
              className="
                p-4
                rounded-xl
                bg-blue-50
                dark:bg-blue-500/10
                border
                border-blue-200
                dark:border-blue-500/20
              "
            >

              <div
                className="
                  flex
                  items-start
                  gap-3
                "
              >

                <Calendar
                  className="
                    w-5
                    h-5
                    text-blue-500
                    mt-0.5
                    flex-shrink-0
                  "
                />

                <div>

                  <p
                    className="
                      text-sm
                      font-medium
                      text-blue-700
                      dark:text-blue-300
                    "
                  >
                    {
                      formData.period
                        .charAt(0)
                        .toUpperCase() +
                      formData.period.slice(1)
                    } budget period
                  </p>

                  <p
                    className="
                      text-sm
                      text-blue-600
                      dark:text-blue-400
                      mt-1
                    "
                  >
                    {
                      formData.startDate ||
                      'Start date'
                    }

                    {' → '}

                    {
                      formData.endDate ||
                      'End date'
                    }
                  </p>

                  <p
                    className="
                      text-xs
                      text-blue-500
                      dark:text-blue-400
                      mt-1
                    "
                  >
                    End date is calculated automatically
                    from the selected period.
                  </p>

                </div>

              </div>

            </div>

            {/* ALERT + COLOR */}

            <div
              className="
                grid
                grid-cols-1
                md:grid-cols-2
                gap-6
              "
            >

              <Input
                label="Alert Threshold (%)"
                type="number"
                min="0"
                max="100"
                value={
                  formData.alertThreshold
                }
                onChange={
                  e =>
                    handleInputChange(
                      'alertThreshold',
                      e.target.value
                    )
                }
                placeholder="80"
                icon={
                  <AlertTriangle
                    className="
                      w-5
                      h-5
                      text-gray-400
                    "
                  />
                }
                error={
                  errors.alertThreshold
                }
                disabled={
                  isLoading
                }
              />

              {/* COLOR */}

              <div
                className="
                  space-y-1
                "
              >

                <label
                  className="
                    block
                    text-sm
                    font-medium
                    text-gray-700
                    dark:text-gray-200
                    mb-3
                  "
                >

                  <Palette
                    className="
                      w-4
                      h-4
                      inline
                      mr-2
                    "
                  />

                  Color

                </label>

                <div
                  className="
                    grid
                    grid-cols-5
                    gap-3
                  "
                >

                  {predefinedColors.map(
                    color => (
                      <button
                        key={
                          color
                        }
                        type="button"
                        onClick={() =>
                          handleInputChange(
                            'color',
                            color
                          )
                        }
                        disabled={
                          isLoading
                        }
                        className={`
                          w-12
                          h-12
                          rounded-xl
                          transition-all
                          duration-300
                          hover:scale-110

                          ${
                            formData.color ===
                            color

                              ? `
                                ring-4
                                ring-blue-500/50
                                ring-offset-2
                                ring-offset-white
                                dark:ring-offset-slate-800
                                scale-110
                              `

                              : `
                                hover:ring-2
                                hover:ring-gray-300
                                dark:hover:ring-slate-600
                              `
                          }
                        `}
                        style={{
                          backgroundColor:
                            color
                        }}
                      />
                    )
                  )}

                </div>

              </div>

            </div>

            {/* DESCRIPTION */}

            <div
              className="
                space-y-1
              "
            >

              <label
                className="
                  block
                  text-sm
                  font-medium
                  text-gray-700
                  dark:text-gray-200
                "
              >
                Description (Optional)
              </label>

              <textarea
                value={
                  formData.description
                }
                onChange={
                  e =>
                    handleInputChange(
                      'description',
                      e.target.value
                    )
                }
                placeholder="Add a description for this budget..."
                rows={3}
                disabled={
                  isLoading
                }
                className="
                  block
                  w-full
                  rounded-xl
                  border
                  border-gray-300/50
                  dark:border-slate-600/50
                  px-3
                  py-2.5
                  text-gray-900
                  dark:text-white
                  placeholder-gray-500
                  dark:placeholder-gray-400
                  bg-white/50
                  dark:bg-slate-800/50
                  backdrop-blur-md
                  focus:border-blue-500/50
                  focus:ring-2
                  focus:ring-blue-500/50
                  focus:ring-offset-2
                  focus:ring-offset-transparent
                  focus:outline-none
                  transition-all
                  duration-300
                  resize-none
                "
              />

            </div>

            {/* TAGS */}

            <Input
              label="Tags (Optional)"
              type="text"
              value={
                formData.tags
              }
              onChange={
                e =>
                  handleInputChange(
                    'tags',
                    e.target.value
                  )
              }
              placeholder="e.g., essential, family, weekly"
              icon={
                <FileText
                  className="
                    w-5
                    h-5
                    text-gray-400
                  "
                />
              }
              disabled={
                isLoading
              }
            />

            {/* ROLLOVER */}

            <div
              className="
                flex
                items-center
                space-x-3
              "
            >

              <input
                type="checkbox"
                id="rollover"
                checked={
                  formData.rollover
                }
                onChange={
                  e =>
                    handleInputChange(
                      'rollover',
                      e.target.checked
                    )
                }
                disabled={
                  isLoading
                }
                className="
                  rounded
                  border-gray-300
                  dark:border-slate-600
                  bg-white
                  dark:bg-slate-800
                  text-blue-600
                  focus:ring-blue-500/50
                  focus:ring-offset-0
                "
              />

              <label
                htmlFor="rollover"
                className="
                  text-sm
                  text-gray-700
                  dark:text-gray-200
                "
              >
                Rollover unused budget to next period
              </label>

            </div>

            {/* PREVIEW */}

            <div
              className="
                p-4
                bg-gray-50
                dark:bg-slate-800/50
                rounded-xl
              "
            >

              <h4
                className="
                  text-sm
                  font-medium
                  text-gray-900
                  dark:text-white
                  mb-3
                "
              >
                Preview
              </h4>

              <div
                className="
                  flex
                  items-center
                  space-x-3
                "
              >

                <div
                  className="
                    w-4
                    h-4
                    rounded-full
                    shadow-lg
                  "
                  style={{
                    backgroundColor:
                      formData.color
                  }}
                />

                <div>

                  <p
                    className="
                      font-medium
                      text-gray-900
                      dark:text-white
                    "
                  >
                    {
                      formData.name ||
                      'Budget Name'
                    }
                  </p>

                  <p
                    className="
                      text-sm
                      text-gray-500
                      dark:text-gray-400
                    "
                  >
                    {
                      formData.category ||
                      'Category'
                    }

                    {' • '}

                    {
                      formData.period
                    }

                    {' • $'}

                    {
                      formData.budgetedAmount ||
                      '0'
                    }
                  </p>

                  <p
                    className="
                      text-xs
                      text-gray-500
                      dark:text-gray-400
                      mt-1
                    "
                  >
                    {
                      formData.startDate
                    }

                    {' → '}

                    {
                      formData.endDate
                    }
                  </p>

                </div>

              </div>

            </div>

            {/* BUTTONS */}

            <div
              className="
                flex
                space-x-3
                pt-4
              "
            >

              <Button
                type="button"
                variant="ghost"
                onClick={
                  handleClose
                }
                className="flex-1"
                disabled={
                  isLoading
                }
              >
                Cancel
              </Button>

              <Button
                type="submit"
                className="flex-1"
                disabled={
                  isLoading
                }
              >
                {
                  isLoading
                    ? 'Creating...'
                    : 'Create Budget'
                }
              </Button>

            </div>

          </form>

        </Card>
      </div>
    </div>
  );
};