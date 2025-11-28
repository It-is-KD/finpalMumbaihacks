import { MD3LightTheme } from 'react-native-paper';

export const colors = {
  primary: '#1d8973',
  secondary: '#286098',
  text: '#424343',
  background: '#fefffe',
  surface: '#ffffff',
  error: '#B00020',
  success: '#4CAF50',
  warning: '#FF9800',
  info: '#2196F3',
  lightGray: '#f5f5f5',
  gray: '#9e9e9e',
  darkGray: '#616161',
  white: '#ffffff',
  black: '#000000',
  accent: '#1d8973',
  primaryLight: '#4db6a0',
  primaryDark: '#146b5a',
  secondaryLight: '#5a8fc7',
  secondaryDark: '#1e4a74',
};

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background,
    surface: colors.surface,
    error: colors.error,
    onPrimary: colors.white,
    onSecondary: colors.white,
    onBackground: colors.text,
    onSurface: colors.text,
  },
  roundness: 12,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  h1: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  body: {
    fontSize: 16,
    color: colors.text,
  },
  caption: {
    fontSize: 14,
    color: colors.gray,
  },
  small: {
    fontSize: 12,
    color: colors.gray,
  },
};
