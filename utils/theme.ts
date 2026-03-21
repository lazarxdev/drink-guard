export const THEME_COLORS = {
  green: { primary: '#4CAF50', gradient: ['#0a0a0a', '#1a1a1a'] as const },
  pink: { primary: '#FF4081', gradient: ['#1a0a14', '#2a1428'] as const },
  blue: { primary: '#2196F3', gradient: ['#0a1420', '#14283c'] as const },
  white: { primary: '#FFFFFF', gradient: ['#f5f5f5', '#e0e0e0'] as const },
};

export type ThemeColor = keyof typeof THEME_COLORS;

export function getTheme(color: string) {
  return THEME_COLORS[color as ThemeColor] || THEME_COLORS.green;
}

export function isDarkTheme(color: string) {
  return color !== 'white';
}
