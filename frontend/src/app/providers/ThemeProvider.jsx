// ============================================================================
//  ThemeProvider — design-token surface
// ----------------------------------------------------------------------------
//  FlowOps is dark-only today. This provider exists as a stable insertion
//  point so the day a light theme is added, only one file changes. Consumers
//  use `useTheme()` to read the active theme name.
// ============================================================================

import { createContext, useContext, useMemo } from 'react';

const ThemeContext = createContext({ theme: 'dark' });

export function ThemeProvider({ children, theme = 'dark' }) {
  const value = useMemo(() => ({ theme }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
