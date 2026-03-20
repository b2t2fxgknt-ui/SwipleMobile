// Design system Swiple Mobile
// Même DA que le web : fond noir, violet, marketplace pro

export const COLORS = {
  // Gradient principal
  gradientStart: '#4F46E5',
  gradientEnd: '#7C3AED',

  // Violet
  primary: '#7C3AED',
  primaryLight: '#8B5CF6',
  primaryDark: '#5B21B6',

  // Rôles
  acheteur: '#3B82F6',
  acheteurBg: 'rgba(59,130,246,0.10)',
  prestataire: '#10B981',
  prestataireBg: 'rgba(16,185,129,0.10)',

  // Backgrounds — dark comme le web
  bg: '#131319',
  card: '#1D1D2B',
  cardElevated: '#252534',
  inputBg: '#131319',

  // Text
  text: '#F8F8FF',
  textMuted: '#9090B0',
  textLight: '#6B6B8A',
  textWhite: '#FFFFFF',

  // Borders
  border: '#2A2A40',
  borderFocus: '#7C3AED',

  // Feedback
  error: '#EF4444',
  errorBg: 'rgba(239,68,68,0.10)',
  success: '#22C55E',
  successBg: 'rgba(34,197,94,0.10)',

  // Overlay
  overlay: 'rgba(0,0,0,0.6)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FONT = {
  regular: { fontWeight: '400' },
  medium: { fontWeight: '500' },
  semibold: { fontWeight: '600' },
  bold: { fontWeight: '700' },
  extrabold: { fontWeight: '800' },
};

export const SHADOW = {
  sm: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};
