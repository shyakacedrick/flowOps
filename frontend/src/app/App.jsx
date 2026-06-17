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
import ConfirmProvider from '@/shared/components/ConfirmProvider.jsx';
import ToastProvider from '@/shared/components/ToastProvider.jsx';
import ApiErrorToaster from '@/shared/components/ApiErrorToaster.jsx';
import WakingSplash from '@/shared/components/WakingSplash.jsx';
import DemoBanner from '@/shared/components/DemoBanner.jsx';
import { AuthProvider } from '@/app/providers/AuthProvider.jsx';
import { ThemeProvider } from '@/app/providers/ThemeProvider.jsx';
import { SimulationProvider } from '@/engine/SimulationProvider.jsx';
import AppRouter from '@/app/router/index.jsx';

export default function App() {
  return (
    <ErrorBoundary>
      {/*
        WakingSplash renders a full-screen "we're starting the API" overlay
        ONLY when the first network request stalls past ~1.5 s. Sits at the
        top of the tree so it covers every route, including the public
        landing page, during a Render free-tier cold start.
      */}
      <WakingSplash />
      <DemoBanner />
      <AuthProvider>
        <ThemeProvider>
          {/*
            SimulationProvider mounts the centralized simulationEngine — the
            single source of truth for every queue event, KPI, activity log
            entry, chart point, AI insight, and subsystem status across the
            entire app. Exactly one simulation per browser tab.
          */}
          <SimulationProvider>
            <ToastProvider>
              <ApiErrorToaster />
              <ConfirmProvider>
                <BrowserRouter>
                  <AppRouter />
                </BrowserRouter>
              </ConfirmProvider>
            </ToastProvider>
          </SimulationProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
