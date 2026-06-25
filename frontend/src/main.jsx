import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/app/App.jsx';
import { initSentry } from '@/observability/sentry.js';
import '@/index.css';

// Initialize Sentry as early as possible so any error during App boot is
// captured. No-op when VITE_SENTRY_DSN is unset (dev / CI).
initSentry();

ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
);
