import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext.jsx';
import { SimulationProvider } from './engine/SimulationProvider.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';

// Route-level code splitting — each chunk loads only when its route is visited.
const LandingPage   = lazy(() => import('./pages/LandingPage.jsx'));
const LoginPage     = lazy(() => import('./pages/LoginPage.jsx'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const NotFoundPage  = lazy(() => import('./pages/NotFoundPage.jsx'));

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        {/*
          SimulationProvider mounts the centralized simulationEngine — the
          single source of truth for every queue event, KPI, activity log
          entry, chart point, AI insight, and subsystem status across the
          entire app. There is exactly ONE simulation per browser tab.
        */}
        <SimulationProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <DashboardPage />
                    </PrivateRoute>
                  }
                />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </SimulationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
