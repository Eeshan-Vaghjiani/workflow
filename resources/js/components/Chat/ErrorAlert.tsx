import React, { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
  autoHide?: boolean;
  duration?: number;
}

export default function ErrorAlert({ 
  message, 
  onDismiss, 
  autoHide = true,
  duration = 5000 
}: ErrorAlertProps) {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onDismiss) onDismiss();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [autoHide, duration, onDismiss]);
  
  if (!visible) return null;
  
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded relative mb-4 animate-fade-in">
      <div className="flex items-center">
        <AlertCircle className="h-4 w-4 mr-2" />
        <span>{message}</span>
      </div>
      <button
        onClick={() => {
          setVisible(false);
          if (onDismiss) onDismiss();
        }}
        className="absolute top-0 right-0 p-2 text-red-600 dark:text-red-300"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
} 