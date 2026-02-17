// src/components/shared/Loader.jsx

import React from "react";
import { useTheme } from "../../contexts/ThemeContext";

const Loader = () => {
  const { theme } = useTheme();
  
  return (
    <div className="flex items-center justify-center gap-2">
      <div className={`w-2 h-2 ${theme.colors.accentBg} rounded-full animate-bounce`} style={{ animationDelay: '0s' }}></div>
      <div className={`w-2 h-2 ${theme.colors.accentBg} rounded-full animate-bounce`} style={{ animationDelay: '0.2s' }}></div>
      <div className={`w-2 h-2 ${theme.colors.accentBg} rounded-full animate-bounce`} style={{ animationDelay: '0.4s' }}></div>
    </div>
  );
};

export default Loader;