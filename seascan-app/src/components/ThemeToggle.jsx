// src/components/ThemeToggle.jsx
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme, toggleTheme } from '../lib/theme';

/** Switches between light and dark mode. `withLabel` adds text (portal sidebars). */
export default function ThemeToggle({ withLabel = false, className = '' }) {
  const theme = useTheme();
  const next = theme === 'light' ? 'dark' : 'light';
  const Icon = theme === 'light' ? Moon : Sun;
  const label = `Switch to ${next} mode`;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`flex items-center gap-2 rounded-full text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors ${
        withLabel ? 'w-full px-3 py-2 rounded-xl text-xs font-semibold' : 'p-2'
      } ${className}`}
    >
      <Icon className="w-4 h-4" />
      {withLabel && <span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>}
    </button>
  );
}
