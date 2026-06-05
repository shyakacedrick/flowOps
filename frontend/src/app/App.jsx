// ============================================================================
//  App — application composition root
// ----------------------------------------------------------------------------
//  Wires the global provider stack around the router:
//
//    <ErrorBoundary>
//      <AuthProvider>             → who is signed in
//        <ThemeProvider>          → design tokens (dark today)
//          <SimulationProvider>   → single in-memory queue/KPI engine
//            <BrowserRouter>
//              <AppRouter />      → all URLs in one file
// ============================================================================

import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from '@/shared/components/ErrorBoundary.jsx';
import { AuthProvider } from '@/app/providers/AuthProvider.jsx';
import { ThemeProvider } from '@/app/providers/ThemeProvider.jsx';
import { SimulationProvider } from '@/engine/SimulationProvider.jsx';
import AppRouter from '@/app/router/index.jsx';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          {/*
            SimulationProvider mounts the centralized simulationEngine — the
            single source of truth for every queue event, KPI, activity log
            entry, chart point, AI insight, and subsystem status across the
            entire app. Exactly one simulation per browser tab.
          */}
          <SimulationProvider>
            <BrowserRouter>
              <AppRouter />
            </BrowserRouter>
          </SimulationProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
