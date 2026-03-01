"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ThemeContextType {
  primaryColor: string;
  skinMode: 'light' | 'dark';
  sidebarStyle: 'white' | 'light' | 'dark' | 'theme';
  navStyle: 'white' | 'light' | 'dark' | 'theme';
  primarySkin: 'default' | 'bluelight' | 'egyptian' | 'purple' | 'blue' | 'red';
  uiStyle: 'default' | 'softy';
  // State update garna yo function thapiyeko ho
  setThemeConfig: (config: Partial<ThemeContextType>) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Sabai state haru ya manage hunchha
  const [config, setConfig] = useState<Omit<ThemeContextType, 'setThemeConfig'>>({
    primaryColor: '#007bff',
    skinMode: 'light',
    sidebarStyle: 'white',
    navStyle: 'white',
    primarySkin: 'default',
    uiStyle: 'default',
  });

  const setThemeConfig = (newConfig: Partial<ThemeContextType>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  };

  return (
    <ThemeContext.Provider value={{ ...config, setThemeConfig }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}