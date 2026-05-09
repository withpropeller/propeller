import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProviders } from '@/providers/AppProviders';

// Auth pages
import LoginPage from '@/pages/auth/LoginPage';
import MfaPage from '@/pages/auth/MfaPage';
import SignupPage from '@/pages/auth/SignupPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';

// Dashboard
import DashboardIndexPage from '@/pages/dashboard/DashboardIndexPage';
import DashboardLayout from '@/pages/dashboard/DashboardLayout';

// Settings
import SettingsLayout from '@/pages/dashboard/settings/SettingsLayout';
import SettingsIndexPage from '@/pages/dashboard/settings/SettingsIndexPage';
import BusinessSettingsPage from '@/pages/dashboard/settings/BusinessSettingsPage';

// Issuing
import IssuingLayout from '@/pages/dashboard/issuing/IssuingLayout';
import IssuingIndexPage from '@/pages/dashboard/issuing/IssuingIndexPage';

// Root redirect
import RootPage from '@/pages/RootPage';

/**
 * Propeller Issuing Dashboard — React Router route tree.
 *
 * Mirrors the old Next.js App Router structure:
 *   /               → RootPage (redirect based on auth)
 *   /auth/login     → LoginPage
 *   /auth/mfa       → MfaPage
 *   /auth/signup    → SignupPage
 *   /auth/reset     → ForgotPasswordPage
 *   /dashboard/*    → DashboardLayout (protected) wrapping nested routes
 */
export function App() {
  return (
    <AppProviders>
      <Routes>
        {/* Root — redirects to /dashboard or /auth/login */}
        <Route path="/" element={<RootPage />} />

        {/* Auth routes (unauthenticated) */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/mfa" element={<MfaPage />} />
        <Route path="/auth/signup" element={<SignupPage />} />
        <Route path="/auth/reset" element={<ForgotPasswordPage />} />

        {/* Dashboard (authenticated + shell) */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardIndexPage />} />

          {/* Settings */}
          <Route path="settings" element={<SettingsLayout />}>
            <Route index element={<SettingsIndexPage />} />
            <Route path="business" element={<BusinessSettingsPage />} />
            {/* TODO: add remaining settings sub-routes */}
          </Route>

          {/* Issuing */}
          <Route path="issuing" element={<IssuingLayout />}>
            <Route index element={<IssuingIndexPage />} />
            {/* TODO: add remaining issuing sub-routes */}
          </Route>

          {/* TODO: add remaining dashboard sub-routes (accounts, customers, disputes, payments, etc.) */}
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppProviders>
  );
}
