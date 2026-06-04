import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext.jsx';
import { SimulationProvider } from './engine/SimulationProvider.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

export default function App() {
  return (
    <AuthProvider>
      {/*
        SimulationProvider mounts the centralized simulationEngine — the
        single source of truth for every queue event, KPI, activity log
        entry, chart point, AI insight, and subsystem status across the
        entire app. There is exactly ONE simulation per browser tab.
      */}
      <SimulationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </BrowserRouter>
      </SimulationProvider>
    </AuthProvider>
  );
}
