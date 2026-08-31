import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, CreditCard, Target, Brain, Tag } from 'lucide-react';
import { BoltBadge } from '../ui/BoltBadge';

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'transactions', label: 'Transactions', icon: CreditCard, path: '/transactions' },
    { id: 'budget', label: 'Budget', icon: Target, path: '/budget' },
    { id: 'categories', label: 'Categories', icon: Tag, path: '/categories' },
    { id: 'insights', label: 'Insights', icon: Brain, path: '/insights' }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-gray-200/50 dark:border-slate-700/50 shadow-2xl">
      {/* Bolt Badge - Top Center */}
      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
        <BoltBadge size="sm" variant="custom" />
      </div>
      
      <div className="px-4 py-2">
        <div className="flex items-center justify-around">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};