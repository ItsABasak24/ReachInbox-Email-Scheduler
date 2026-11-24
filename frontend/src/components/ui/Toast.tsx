import React from 'react';
import { Toaster as HotToaster } from 'react-hot-toast';

export const Toaster: React.FC = () => {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#0f172a',
          color: '#f8fafc',
          border: '1px solid #334155',
          borderRadius: '0.75rem',
          fontSize: '0.875rem',
          padding: '12px 16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#0f172a',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#0f172a',
          },
        },
      }}
    />
  );
};

export default Toaster;
