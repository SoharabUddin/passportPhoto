import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-slate-800 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            Passport Photo Pro
          </h1>
          <p className="mt-1 text-md text-slate-500 dark:text-slate-400">
            AI-Powered Passport Photos, Made Easy.
          </p>
        </div>
      </div>
    </header>
  );
};
