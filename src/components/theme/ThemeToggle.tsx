'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'İşıqlı rejimə keç' : 'Tünd rejimə keç'}
      title={theme === 'dark' ? 'İşıqlı rejimə keç' : 'Tünd rejimə keç'}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-200 cursor-pointer ${
        theme === 'dark'
          ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-700'
          : 'bg-white border-zinc-200 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 hover:border-zinc-300 shadow-sm'
      } ${className}`}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-purple-600 transition-transform duration-200 hover:-rotate-12" />
      )}
    </button>
  );
};
