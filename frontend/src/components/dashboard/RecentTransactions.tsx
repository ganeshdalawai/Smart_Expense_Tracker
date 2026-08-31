import React from 'react';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Card } from '../ui/Card';
import { Transaction } from '../services/transactionService';

interface RecentTransactionsProps {
  transactions: Transaction[];
  formatAmount: (amount: number) => string;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({ 
  transactions, 
  formatAmount 
}) => {
  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
        <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-colors">
          View all
        </button>
      </div>
      
      <div className="space-y-4">
        {transactions.slice(0, 5).map((transaction) => (
          <div key={transaction._id || transaction.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-all duration-300 backdrop-blur-md">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20 dark:border-slate-600/30 ${
                transaction.type === 'income' ? 'bg-green-50 dark:bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400'
              }`}>
                {transaction.type === 'income' ? (
                  <ArrowUpRight className="w-5 h-5" />
                ) : (
                  <ArrowDownLeft className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{transaction.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{transaction.category}</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className={`font-semibold ${
                transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {transaction.type === 'income' ? '+' : ''}{formatAmount(Math.abs(transaction.amount))}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(transaction.date).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};