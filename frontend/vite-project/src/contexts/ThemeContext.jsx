// src/contexts/ThemeContext.jsx

import React, { createContext, useState, useContext, useEffect } from 'react';

const themes = {
  'neon-cyber': {
    name: 'Neon Cyber',
    preview: 'bg-gradient-to-br from-purple-600 to-pink-600 border-purple-400',
    colors: {
      // Backgrounds - Rich and vibrant
      bgPrimary: 'from-slate-900 via-purple-900 to-slate-900',
      bgCard: 'bg-gradient-to-br from-purple-500/15 to-pink-500/15',
      bgCardHover: 'hover:from-purple-500/25 hover:to-pink-500/25',
      bgGlass: 'bg-white/5',
      bgInput: 'bg-purple-900/30',
      
      // Borders - Vibrant
      border: 'border-purple-400/50',
      borderLight: 'border-purple-300/20',
      borderFocus: 'focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30',
      
      // Text - HIGH CONTRAST
      textPrimary: 'text-white',
      textSecondary: 'text-gray-200',
      textMuted: 'text-gray-400',
      textAccent: 'text-purple-300',
      
      // Buttons - Bold and clear
      btnPrimary: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/30',
      btnSecondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/20',
      btnDanger: 'bg-gradient-to-r from-red-500/30 to-red-600/30 hover:from-red-500/40 hover:to-red-600/40 text-red-200 border border-red-400/40',
      
      // Accents
      accent: 'text-purple-400',
      accentBg: 'bg-purple-500',
      
      // Shadows & Effects
      shadow: 'shadow-lg shadow-purple-500/20',
      glow: 'shadow-2xl shadow-purple-500/40',
      cardGradient: 'from-purple-600/25 to-pink-600/25',
      
      // Progress
      progressBg: 'bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400',
      progressTrack: 'bg-white/10',
      
      // Decorative
      decorativeBg1: 'bg-purple-500/25',
      decorativeBg2: 'bg-pink-500/25',
      decorativeBg3: 'bg-blue-500/15'
    }
  },
  
  'midnight-dark': {
    name: 'Midnight Dark',
    preview: 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700',
    colors: {
      // Backgrounds - Deep and elegant
      bgPrimary: 'from-slate-950 via-gray-900 to-black',
      bgCard: 'bg-gradient-to-br from-slate-800/40 to-slate-900/40',
      bgCardHover: 'hover:from-slate-700/50 hover:to-slate-800/50',
      bgGlass: 'bg-slate-800/25',
      bgInput: 'bg-slate-800/50',
      
      // Borders - Crisp steel
      border: 'border-slate-600/60',
      borderLight: 'border-slate-700/30',
      borderFocus: 'focus:border-slate-500 focus:ring-2 focus:ring-slate-500/30',
      
      // Text - BRIGHT WHITE for contrast
      textPrimary: 'text-white',
      textSecondary: 'text-gray-200',
      textMuted: 'text-gray-500',
      textAccent: 'text-slate-300',
      
      // Buttons - Clean with depth
      btnPrimary: 'bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white font-semibold shadow-xl shadow-slate-900/60',
      btnSecondary: 'bg-slate-700/50 hover:bg-slate-600/50 text-white border border-slate-600/40',
      btnDanger: 'bg-gradient-to-r from-red-900/40 to-red-800/40 hover:from-red-900/50 hover:to-red-800/50 text-red-200 border border-red-700/50',
      
      // Accents
      accent: 'text-slate-300',
      accentBg: 'bg-slate-600',
      
      // Shadows
      shadow: 'shadow-xl shadow-black/40',
      glow: 'shadow-2xl shadow-black/50',
      cardGradient: 'from-slate-700/30 to-slate-800/30',
      
      // Progress
      progressBg: 'bg-gradient-to-r from-slate-500 via-slate-400 to-slate-500',
      progressTrack: 'bg-slate-800/50',
      
      // Decorative
      decorativeBg1: 'bg-slate-600/30',
      decorativeBg2: 'bg-slate-700/30',
      decorativeBg3: 'bg-slate-500/20'
    }
  },
  
  'daylight': {
    name: 'Day Light',
    preview: 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-300',
    colors: {
      // Backgrounds - Fresh and clean
      bgPrimary: 'from-blue-50 via-indigo-50 to-purple-50',
      bgCard: 'bg-white/95',
      bgCardHover: 'hover:bg-white',
      bgGlass: 'bg-white/80',
      bgInput: 'bg-white',
      
      // Borders - Soft but visible
      border: 'border-blue-200',
      borderLight: 'border-gray-200',
      borderFocus: 'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
      
      // Text - DARK for maximum contrast on light bg
      textPrimary: 'text-gray-900',
      textSecondary: 'text-gray-700',
      textMuted: 'text-gray-500',
      textAccent: 'text-blue-600',
      
      // Buttons - Vibrant and modern
      btnPrimary: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/25',
      btnSecondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200',
      btnDanger: 'bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-700 border border-red-300',
      
      // Accents
      accent: 'text-blue-600',
      accentBg: 'bg-blue-600',
      
      // Shadows
      shadow: 'shadow-lg shadow-gray-200/50',
      glow: 'shadow-xl shadow-blue-200/30',
      cardGradient: 'from-blue-50/50 to-indigo-50/50',
      
      // Progress
      progressBg: 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500',
      progressTrack: 'bg-gray-200',
      
      // Decorative
      decorativeBg1: 'bg-blue-300/20',
      decorativeBg2: 'bg-indigo-300/20',
      decorativeBg3: 'bg-purple-300/15'
    }
  }
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('app-theme');
    return saved && themes[saved] ? saved : 'neon-cyber';
  });

  const theme = themes[currentTheme];

  useEffect(() => {
    localStorage.setItem('app-theme', currentTheme);
    console.log(`✅ Theme: ${theme.name}`);
  }, [currentTheme, theme.name]);

  const changeTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
    }
  };

  const value = {
    currentTheme,
    theme,
    themes,
    changeTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};