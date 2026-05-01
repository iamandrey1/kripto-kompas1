import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  colors: ThemeColors;
}

interface ThemeColors {
  bg: string;
  bgSecondary: string;
  bgCard: string;
  text: string;
  textSecondary: string;
  accent: string;
  accentHover: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
  whale: string;
  exchange: string;
  defi: string;
  dao: string;
  gradient: string;
}

const darkColors: ThemeColors = {
  bg: '#050508',
  bgSecondary: '#0a0a12',
  bgCard: '#12121a',
  text: '#ffffff',
  textSecondary: '#8b8b9a',
  accent: '#6366f1',
  accentHover: '#818cf8',
  border: '#1e1e2e',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  whale: '#f59e0b',
  exchange: '#3b82f6',
  defi: '#8b5cf6',
  dao: '#06b6d4',
  gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)'
};

const lightColors: ThemeColors = {
  bg: '#ffffff',
  bgSecondary: '#f8fafc',
  bgCard: '#ffffff',
  text: '#0f172a',
  textSecondary: '#64748b',
  accent: '#6366f1',
  accentHover: '#4f46e5',
  border: '#e2e8f0',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  whale: '#d97706',
  exchange: '#2563eb',
  defi: '#7c3aed',
  dao: '#0891b2',
  gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)'
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const colors = theme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, colors }}>
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

// CSS variables updater
export function useThemeColors() {
  const { colors } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
  }, [colors]);

  return colors;
}