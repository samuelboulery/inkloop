export const theme = {
  BG: 'hsl(222, 20%, 8%)',
  SURFACE: 'hsl(222, 18%, 11%)',
  SURFACE_HOVER: 'hsl(222, 18%, 14%)',
  BORDER: 'hsl(222, 15%, 18%)',
  TEXT: 'hsl(210, 20%, 94%)',
  TEXT_MUTED: 'hsl(215, 12%, 50%)',
  ACCENT: 'hsl(235, 80%, 62%)',
  ACCENT_GLOW: 'hsl(235, 80%, 62%, 0.35)',
  DANGER: 'hsl(0, 70%, 55%)',
  SUCCESS: 'hsl(145, 55%, 50%)',
  WARNING: 'hsl(38, 85%, 58%)',
} as const

export type ThemeToken = keyof typeof theme
