import React from 'react';
import badge from '../../public/black_circle_360x360.png'

interface BoltBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'custom';
  showText?: boolean;
}

export const BoltBadge: React.FC<BoltBadgeProps> = ({ 
  className = '', 
  size = 'md',
  variant = 'custom',
  showText = false
}) => {
  const sizes = {
    sm: 'w-12 h-12',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const handleClick = () => {
    window.open('https://bolt.new', '_blank', 'noopener,noreferrer');
  };

  if (variant === 'custom') {
    return (
      <div className={`inline-flex items-center space-x-2 ${className}`}>
        <button
          onClick={handleClick}
          className={`${sizes[size]} transition-all duration-300 hover:scale-110 hover:rotate-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-transparent rounded-full`}
          title="Built with Bolt.new - Click to visit"
        >
          <img 
            src={badge}
            alt="Powered by Bolt.new"
            className="w-full h-full object-contain drop-shadow-lg hover:drop-shadow-xl transition-all duration-300"
          />
        </button>
        {showText && (
          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            Built with Bolt.new
          </span>
        )}
      </div>
    );
  }

  // Fallback to shields.io badge
  const shieldsBadge = 'https://img.shields.io/badge/Built%20with-Bolt.new-FF6B6B?style=for-the-badge&logo=bolt&logoColor=white';

  return (
    <div className={`inline-flex items-center ${className}`}>
      <img 
        src={shieldsBadge}
        alt="Built with Bolt.new"
        className={`h-8 transition-all duration-300 hover:scale-105 cursor-pointer`}
        onClick={handleClick}
      />
    </div>
  );
};