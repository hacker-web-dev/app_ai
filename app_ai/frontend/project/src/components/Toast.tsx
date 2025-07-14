import React, { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface ToastProps {
  isVisible: boolean;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({
  isVisible,
  message,
  type = 'success',
  onClose,
  duration = 3000
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const typeStyles = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-400',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-400',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-400',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-400'
  };

  const iconStyles = {
    success: 'text-green-400 dark:text-green-500',
    info: 'text-blue-400 dark:text-blue-500',
    warning: 'text-yellow-400 dark:text-yellow-500',
    error: 'text-red-400 dark:text-red-500'
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
      <div className={`max-w-sm w-full ${typeStyles[type]} border rounded-lg shadow-lg p-4`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <CheckCircle className={`h-5 w-5 ${iconStyles[type]}`} />
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium">{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={onClose}
              className={`inline-flex ${type === 'success' ? 'text-green-400 dark:text-green-500 hover:text-green-600 dark:hover:text-green-400' : 
                          type === 'info' ? 'text-blue-400 dark:text-blue-500 hover:text-blue-600 dark:hover:text-blue-400' :
                          type === 'warning' ? 'text-yellow-400 dark:text-yellow-500 hover:text-yellow-600 dark:hover:text-yellow-400' :
                          'text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400'} transition-colors`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast;