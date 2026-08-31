import React, { useState } from 'react';
import { X, DollarSign, Calendar, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { CategorySelector } from '../ui/CategorySelector';
import { addTransaction } from '../services/transactionService';

interface AddTransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddTransactionForm: React.FC<AddTransactionFormProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const transactionData = {
        title: formData.title,
        amount: formData.type === 'expense' ? -Math.abs(parseFloat(formData.amount)) : Math.abs(parseFloat(formData.amount)),
        type: formData.type,
        category: formData.category,
        date: new Date(formData.date),
        note: formData.note
      };

      await addTransaction(transactionData);
      
      // Reset form
      setFormData({
        title: '',
        amount: '',
        type: 'expense',
        category: '',
        date: new Date().toISOString().split('T')[0],
        note: ''
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      setErrors({ 
        submit: error.response?.data?.error || 'Failed to add transaction. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="w-full max-w-md transform transition-all duration-300 animate-in slide-in-from-bottom-4">
        <Card className="relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Add Transaction</h2>
            <p className="text-gray-600 dark:text-gray-300">Record a new income or expense</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.submit && (
              <div className="p-3 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 rounded-xl">
                <p className="text-red-600 dark:text-red-400 text-sm">{errors.submit}</p>
              </div>
            )}

            <Input
              label="Title"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter transaction title"
              icon={<FileText className="w-5 h-5 text-gray-400" />}
              error={errors.title}
              disabled={isLoading}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                placeholder="0.00"
                icon={<DollarSign className="w-5 h-5 text-gray-400" />}
                error={errors.amount}
                disabled={isLoading}
              />

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleInputChange('type', 'expense');
                      handleInputChange('category', '');
                    }}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                      formData.type === 'expense'
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                    }`}
                    disabled={isLoading}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleInputChange('type', 'income');
                      handleInputChange('category', '');
                    }}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                      formData.type === 'income'
                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                    }`}
                    disabled={isLoading}
                  >
                    Income
                  </button>
                </div>
              </div>
            </div>

            <CategorySelector
              value={formData.category}
              onChange={(value) => handleInputChange('category', value)}
              type={formData.type}
              error={errors.category}
              disabled={isLoading}
            />

            <Input
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              icon={<Calendar className="w-5 h-5 text-gray-400" />}
              error={errors.date}
              disabled={isLoading}
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Note (Optional)
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => handleInputChange('note', e.target.value)}
                placeholder="Add a note about this transaction..."
                rows={3}
                className="
                  block w-full rounded-xl border border-gray-300/50 dark:border-slate-600/50 px-3 py-2.5 
                  text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400
                  bg-white/50 dark:bg-slate-800/50 backdrop-blur-md
                  focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/50 
                  focus:ring-offset-2 focus:ring-offset-transparent focus:outline-none 
                  transition-all duration-300 resize-none
                "
                disabled={isLoading}
              />
            </div>

            <div className="flex space-x-3 pt-4">
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
                {isLoading ? 'Adding...' : 'Add Transaction'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};