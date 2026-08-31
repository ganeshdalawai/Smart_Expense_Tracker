import React, { useState, useEffect } from 'react';
import {
  X,
  Target,
  DollarSign,
  Calendar,
  Tag,
  Palette,
  AlertTriangle
} from 'lucide-react';

import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Budget, updateBudget } from '../services/budgetService';

interface EditBudgetFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  budget: Budget | null;
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

const categories = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Groceries',
  'Gas',
  'Insurance',
  'Subscriptions',
  'Other'
];

const periods = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' }
];

type BudgetPeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

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

/*
 * Parse YYYY-MM-DD as a LOCAL date.
 *
 * We intentionally avoid:
 * new Date("2026-08-21")
 *
 * because JavaScript can interpret date-only strings as UTC,
 * which can cause timezone-related date shifts.
 */
const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);

  return new Date(year, month - 1, day);
};

/*
 * Format a Date as YYYY-MM-DD.
 */
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/*
 * Calculate the end date from the start date and selected period.
 *
 * Examples:
 *
 * 21 Aug + Weekly    => 27 Aug
 * 21 Aug + Monthly   => 31 Aug
 * 21 Aug + Quarterly => 31 Oct
 * 21 Aug + Yearly    => 31 Dec
 */
const calculateEndDate = (
  startDateString: string,
  period: BudgetPeriod
): string => {
  if (!startDateString) {
    return '';
  }

  const startDate = parseLocalDate(startDateString);

  switch (period) {
    case 'weekly': {
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);

      return formatDate(endDate);
    }

    case 'monthly': {
      // Last day of the same month
      const endDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth() + 1,
        0
      );

      return formatDate(endDate);
    }

    case 'quarterly': {
      // Last day of the third month in the period
      const endDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth() + 3,
        0
      );

      return formatDate(endDate);
    }

    case 'yearly': {
      // Last day of the same year
      const endDate = new Date(
        startDate.getFullYear(),
        12,
        0
      );

      return formatDate(endDate);
    }

    default:
      return '';
  }
};

export const EditBudgetForm: React.FC<EditBudgetFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  budget
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    category: '',
    budgetedAmount: '',
    period: 'monthly',
    startDate: formatDate(new Date()),
    endDate: '',
    alertThreshold: '80',
    color: predefinedColors[0],
    description: '',
    tags: '',
    rollover: false
  });

  const [isLoading, setIsLoading] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  /*
   * Populate the form when the selected budget changes.
   */
  useEffect(() => {
    if (!budget) {
      return;
    }

    const startDate = formatDate(new Date(budget.startDate));

    /*
     * Recalculate the end date from the period instead of blindly
     * using the old value stored in the database.
     *
     * This ensures old budgets that had incorrect end dates
     * are also corrected when edited.
     */
    const calculatedEndDate = calculateEndDate(
      startDate,
      budget.period
    );

    setFormData({
      name: budget.name || '',
      category: budget.category || '',
      budgetedAmount: budget.budgetedAmount?.toString() || '',
      period: budget.period || 'monthly',
      startDate,
      endDate: calculatedEndDate,
      alertThreshold:
        budget.alertThreshold?.toString() || '80',
      color: budget.color || predefinedColors[0],
      description: budget.description || '',
      tags: budget.tags ? budget.tags.join(', ') : '',
      rollover: budget.rollover || false
    });

    setErrors({});
  }, [budget]);

  /*
   * Automatically recalculate the end date whenever:
   *
   * 1. Start date changes
   * 2. Period changes
   */
  useEffect(() => {
    if (!formData.startDate || !formData.period) {
      return;
    }

    const calculatedEndDate = calculateEndDate(
      formData.startDate,
      formData.period
    );

    setFormData(prev => {
      if (prev.endDate === calculatedEndDate) {
        return prev;
      }

      return {
        ...prev,
        endDate: calculatedEndDate
      };
    });

    /*
     * Clear an old end-date validation error because
     * the end date is now automatically recalculated.
     */
    if (errors.endDate) {
      setErrors(prev => ({
        ...prev,
        endDate: ''
      }));
    }
  }, [formData.startDate, formData.period]);

  /*
   * Validate all form fields.
   */
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Budget name is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    const budgetAmount = parseFloat(formData.budgetedAmount);

    if (!formData.budgetedAmount || isNaN(budgetAmount) || budgetAmount <= 0) {
      newErrors.budgetedAmount =
        'Budget amount must be greater than 0';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (
      formData.startDate &&
      formData.endDate &&
      parseLocalDate(formData.endDate) <=
        parseLocalDate(formData.startDate)
    ) {
      newErrors.endDate =
        'End date must be after start date';
    }

    const threshold = parseFloat(formData.alertThreshold);

    if (
      isNaN(threshold) ||
      threshold < 0 ||
      threshold > 100
    ) {
      newErrors.alertThreshold =
        'Alert threshold must be between 0 and 100';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  /*
   * Submit updated budget.
   */
  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!validateForm() || !budget) {
      return;
    }

    setIsLoading(true);

    try {
      const budgetId = budget._id || budget.id;

      if (!budgetId) {
        throw new Error('Budget ID not found');
      }

      const updatedData = {
        name: formData.name.trim(),

        category: formData.category,

        budgetedAmount: parseFloat(
          formData.budgetedAmount
        ),

        period: formData.period,

        startDate: parseLocalDate(
          formData.startDate
        ),

        endDate: parseLocalDate(
          formData.endDate
        ),

        alertThreshold: parseFloat(
          formData.alertThreshold
        ),

        isActive: true,

        color: formData.color,

        description:
          formData.description.trim() || undefined,

        tags: formData.tags
          ? formData.tags
              .split(',')
              .map(tag => tag.trim())
              .filter(Boolean)
          : [],

        rollover: formData.rollover
      };

      await updateBudget(
        budgetId,
        updatedData
      );

      /*
       * Tell the parent component that the budget
       * was successfully updated.
       */
      onSuccess();

      /*
       * Close the modal.
       */
      onClose();

    } catch (error: any) {
      console.error(
        'Error updating budget:',
        error
      );

      setErrors({
        submit:
          error?.response?.data?.error ||
          'Failed to update budget. Please try again.'
      });

    } finally {
      setIsLoading(false);
    }
  };

  /*
   * Generic input handler.
   */
  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  /*
   * Start date change.
   *
   * Changing the start date automatically causes the
   * end date to be recalculated by useEffect.
   */
  const handleStartDateChange = (
    value: string
  ) => {
    handleInputChange(
      'startDate',
      value
    );
  };

  if (!isOpen || !budget) {
    return null;
  }

  return (
    <div className="
      fixed
      inset-0
      bg-black/50
      backdrop-blur-sm
      flex
      items-center
      justify-center
      p-4
      z-50
      animate-in
      fade-in
      duration-300
    ">
      <div className="
        w-full
        max-w-2xl
        max-h-[90vh]
        overflow-y-auto
        transform
        transition-all
        duration-300
        animate-in
        slide-in-from-bottom-4
      ">
        <Card className="relative">

          {/* Close button */}
          <button
            onClick={onClose}
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
            disabled={isLoading}
          >
            <X className="
              w-5
              h-5
              text-gray-500
              dark:text-gray-400
            " />
          </button>

          {/* Header */}
          <div className="mb-6">
            <h2 className="
              text-2xl
              font-bold
              text-gray-900
              dark:text-white
              mb-2
            ">
              Edit Budget
            </h2>

            <p className="
              text-gray-600
              dark:text-gray-300
            ">
              Update your budget details
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >

            {/* Submit error */}
            {errors.submit && (
              <div className="
                p-3
                bg-red-50
                dark:bg-red-500/20
                border
                border-red-200
                dark:border-red-500/30
                rounded-xl
              ">
                <p className="
                  text-red-600
                  dark:text-red-400
                  text-sm
                ">
                  {errors.submit}
                </p>
              </div>
            )}

            {/* Name + Category */}
            <div className="
              grid
              grid-cols-1
              md:grid-cols-2
              gap-6
            ">

              <Input
                label="Budget Name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  handleInputChange(
                    'name',
                    e.target.value
                  )
                }
                placeholder="e.g., Monthly Groceries"
                icon={
                  <Target className="
                    w-5
                    h-5
                    text-gray-400
                  " />
                }
                error={errors.name}
                disabled={isLoading}
              />

              {/* Category */}
              <div className="space-y-1">
                <label className="
                  block
                  text-sm
                  font-medium
                  text-gray-700
                  dark:text-gray-200
                ">
                  Category
                </label>

                <div className="relative">
                  <Tag className="
                    absolute
                    left-3
                    top-1/2
                    transform
                    -translate-y-1/2
                    w-5
                    h-5
                    text-gray-400
                  " />

                  <select
                    value={formData.category}
                    onChange={(e) =>
                      handleInputChange(
                        'category',
                        e.target.value
                      )
                    }
                    className={`
                      block
                      w-full
                      rounded-xl
                      border
                      border-gray-300/50
                      dark:border-slate-600/50
                      pl-10
                      pr-3
                      py-2.5
                      text-gray-900
                      dark:text-white
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
                      ${
                        errors.category
                          ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50'
                          : ''
                      }
                    `}
                    disabled={isLoading}
                  >
                    <option value="">
                      Select a category
                    </option>

                    {categories.map(
                      category => (
                        <option
                          key={category}
                          value={category}
                          className="
                            bg-white
                            dark:bg-slate-800
                          "
                        >
                          {category}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {errors.category && (
                  <p className="
                    text-sm
                    text-red-500
                    dark:text-red-400
                  ">
                    {errors.category}
                  </p>
                )}
              </div>
            </div>

            {/* Amount + Period */}
            <div className="
              grid
              grid-cols-1
              md:grid-cols-2
              gap-6
            ">

              <Input
                label="Budget Amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.budgetedAmount}
                onChange={(e) =>
                  handleInputChange(
                    'budgetedAmount',
                    e.target.value
                  )
                }
                placeholder="0.00"
                icon={
                  <DollarSign className="
                    w-5
                    h-5
                    text-gray-400
                  " />
                }
                error={
                  errors.budgetedAmount
                }
                disabled={isLoading}
              />

              {/* Period */}
              <div className="space-y-1">
                <label className="
                  block
                  text-sm
                  font-medium
                  text-gray-700
                  dark:text-gray-200
                ">
                  Period
                </label>

                <div className="
                  grid
                  grid-cols-2
                  gap-2
                ">
                  {periods.map(period => (
                    <button
                      key={period.value}
                      type="button"
                      onClick={() =>
                        handleInputChange(
                          'period',
                          period.value as BudgetPeriod
                        )
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
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                        }
                      `}
                      disabled={isLoading}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="
              grid
              grid-cols-1
              md:grid-cols-2
              gap-6
            ">

              {/* Start Date */}
              <Input
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  handleStartDateChange(
                    e.target.value
                  )
                }
                icon={
                  <Calendar className="
                    w-5
                    h-5
                    text-gray-400
                  " />
                }
                error={errors.startDate}
                disabled={isLoading}
              />

              {/* End Date */}
              <Input
                label="End Date"
                type="date"
                value={formData.endDate}
                readOnly
                icon={
                  <Calendar className="
                    w-5
                    h-5
                    text-gray-400
                  " />
                }
                error={errors.endDate}
                disabled={isLoading}
              />
            </div>

            {/* Date explanation */}
            <div className="
              -mt-3
              text-xs
              text-gray-500
              dark:text-gray-400
            ">
              End date is automatically calculated from
              the selected period.
            </div>

            {/* Alert threshold + Color */}
            <div className="
              grid
              grid-cols-1
              md:grid-cols-2
              gap-6
            ">

              <Input
                label="Alert Threshold (%)"
                type="number"
                min="0"
                max="100"
                value={formData.alertThreshold}
                onChange={(e) =>
                  handleInputChange(
                    'alertThreshold',
                    e.target.value
                  )
                }
                placeholder="80"
                icon={
                  <AlertTriangle className="
                    w-5
                    h-5
                    text-gray-400
                  " />
                }
                error={
                  errors.alertThreshold
                }
                disabled={isLoading}
              />

              {/* Color */}
              <div className="space-y-1">

                <label className="
                  block
                  text-sm
                  font-medium
                  text-gray-700
                  dark:text-gray-200
                  mb-3
                ">
                  <Palette className="
                    w-4
                    h-4
                    inline
                    mr-2
                  " />

                  Color
                </label>

                <div className="
                  grid
                  grid-cols-5
                  gap-3
                ">
                  {predefinedColors.map(
                    color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() =>
                          handleInputChange(
                            'color',
                            color
                          )
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
                              ? 'ring-4 ring-blue-500/50 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 scale-110'
                              : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-slate-600'
                          }
                        `}
                        style={{
                          backgroundColor: color
                        }}
                        disabled={isLoading}
                      />
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">

              <label className="
                block
                text-sm
                font-medium
                text-gray-700
                dark:text-gray-200
              ">
                Description (Optional)
              </label>

              <textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange(
                    'description',
                    e.target.value
                  )
                }
                placeholder="Add a description for this budget..."
                rows={3}
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
                disabled={isLoading}
              />
            </div>

            {/* Tags */}
            <Input
              label="Tags (Optional)"
              type="text"
              value={formData.tags}
              onChange={(e) =>
                handleInputChange(
                  'tags',
                  e.target.value
                )
              }
              placeholder="e.g., essential, family, weekly (comma separated)"
              icon={
                <Tag className="
                  w-5
                  h-5
                  text-gray-400
                " />
              }
              disabled={isLoading}
            />

            {/* Rollover */}
            <div className="
              flex
              items-center
              space-x-3
            ">
              <input
                type="checkbox"
                id="rollover"
                checked={formData.rollover}
                onChange={(e) =>
                  handleInputChange(
                    'rollover',
                    e.target.checked
                  )
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
                disabled={isLoading}
              />

              <label
                htmlFor="rollover"
                className="
                  text-sm
                  text-gray-700
                  dark:text-gray-200
                "
              >
                Rollover unused budget to next
                period
              </label>
            </div>

            {/* Preview */}
            <div className="
              p-4
              bg-gray-50
              dark:bg-slate-800/50
              rounded-xl
            ">
              <h4 className="
                text-sm
                font-medium
                text-gray-900
                dark:text-white
                mb-3
              ">
                Preview
              </h4>

              <div className="
                flex
                items-center
                space-x-3
              ">
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
                  <p className="
                    font-medium
                    text-gray-900
                    dark:text-white
                  ">
                    {formData.name ||
                      'Budget Name'}
                  </p>

                  <p className="
                    text-sm
                    text-gray-500
                    dark:text-gray-400
                  ">
                    {formData.category ||
                      'Category'}{' '}
                    • {formData.period} • $
                    {formData.budgetedAmount ||
                      '0'}
                  </p>

                  <p className="
                    text-xs
                    text-gray-500
                    dark:text-gray-400
                    mt-1
                  ">
                    {formData.startDate ||
                      'Start date'}{' '}
                    →{' '}
                    {formData.endDate ||
                      'End date'}
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="
              flex
              space-x-3
              pt-4
            ">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading
                  ? 'Updating...'
                  : 'Update Budget'}
              </Button>
            </div>

          </form>
        </Card>
      </div>
    </div>
  );
};