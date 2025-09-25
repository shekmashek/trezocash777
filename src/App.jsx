import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useBudget } from './context/BudgetContext';
import { useAuth } from './context/AuthContext';
import AuthView from './components/AuthView';
import PublicLayout from './layouts/PublicLayout';
import AppLayout from './layouts/AppLayout';
import OnboardingView from './components/OnboardingView';
import DashboardView from './components/DashboardView';
import HomePage from './pages/HomePage';
import LegalPage from './pages/LegalPage';
import AboutPage from './pages/AboutPage';
import { Loader } from 'lucide-react';
import SubscriptionPage from './pages/SubscriptionPage';
import BudgetTracker from './components/BudgetTracker';
import CashflowView from './components/CashflowView';
import ScheduleView from './components/ScheduleView';
import ScenarioView from './components/ScenarioView';
import ExpenseAnalysisView from './components/ExpenseAnalysisView';
import JournalsView from './components/JournalsView';
import ProfilePage from './pages/ProfilePage';
import SecurityPage from './pages/SecurityPage';
import CollaboratorsPage from './pages/CollaboratorsPage';
import CashAccountsPage from './pages/CashAccountsPage';
import CategoryManagementPage from './pages/CategoryManagementPage';
import TiersManagementPage from './pages/TiersManagementPage';
import ArchivesPage from './pages/ArchivesPage';
import DisplaySettingsPage from './pages/DisplaySettingsPage';
import DeleteAccountPage from './pages/DeleteAccountPage';
import UnderConstructionView from './components/UnderConstructionView';
import BudgetPage from './pages/BudgetPage';

console.log("🚀 App.jsx: Chargement du composant App");

// ---------------- ProtectedRoute ----------------
const ProtectedRoute = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { state: budgetState, loading: budgetLoading } = useBudget();
  const { projects } = budgetState;
  const location = useLocation();

  if (authLoading || budgetLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-50">
        <Loader className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  const hasActiveProjects = projects && projects.filter(p => !p.isArchived).length > 0;

  if (!hasActiveProjects && !location.pathname.includes('/onboarding')) {
    return <Navigate to="/app/onboarding" replace />;
  }

  if (hasActiveProjects && location.pathname.includes('/onboarding')) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return children ? children : <Outlet />;
};

// ---------------- PublicArea ----------------
const PublicArea = ({ authMode, setAuthMode }) => {
  const { user, loading: authLoading } = useAuth();
  const { loading: budgetLoading } = useBudget();

  if (authLoading || budgetLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-50">
        <Loader className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  // 👉 Si user est connecté, on ne rend rien (ProtectedRoute s’en charge)
  if (user) return null;

  if (authMode.mode) {
    return (
      <AuthView
        initialMode={authMode.mode}
        fromTrial={authMode.fromTrial}
        onBack={() => setAuthMode({ mode: null, fromTrial: false })}
      />
    );
  }

  return (
    <PublicLayout
      onLogin={() => setAuthMode({ mode: 'login', fromTrial: false })}
      onSignUp={() => setAuthMode({ mode: 'signup', fromTrial: true })}
    />
  );
};

// ---------------- App Component ----------------
function App() {
  const [authMode, setAuthMode] = useState({ mode: null, fromTrial: false });
  const { loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-50">
        <Loader className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Routes protégées */}
      <Route path="/app" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardView />} />
        <Route path="onboarding" element={<OnboardingView />} />
        <Route path="trezo" element={<BudgetTracker />} />
        <Route path="budget" element={<BudgetPage />} />
        <Route path="flux" element={<CashflowView />} />
        <Route path="echeancier" element={<ScheduleView />} />
        <Route path="scenarios" element={<ScenarioView />} />
        <Route path="analyse" element={<ExpenseAnalysisView />} />
        <Route path="journal-budget" element={<JournalsView type="budget" />} />
        <Route path="journal-paiements" element={<JournalsView type="payment" />} />
        <Route path="profil" element={<ProfilePage />} />
        <Route path="securite" element={<SecurityPage />} />
        <Route path="abonnement" element={<SubscriptionPage />} />
        <Route path="collaborateurs" element={<CollaboratorsPage />} />
        <Route path="comptes" element={<CashAccountsPage />} />
        <Route path="categories" element={<CategoryManagementPage />} />
        <Route path="tiers" element={<TiersManagementPage />} />
        <Route path="archives" element={<ArchivesPage />} />
        <Route path="display-settings" element={<DisplaySettingsPage />} />
        <Route path="delete-account" element={<DeleteAccountPage />} />
        <Route path="factures" element={<UnderConstructionView title="Factures" />} />
        <Route path="aide" element={<UnderConstructionView title="Centre d'aide" />} />
      </Route>

      {/* Routes publiques */}
      <Route path="*" element={<PublicArea authMode={authMode} setAuthMode={setAuthMode} />}>
        <Route index element={<HomePage onSignUp={() => setAuthMode({ mode: 'signup', fromTrial: true })} />} />
        <Route path="a-propos" element={<AboutPage />} />
        <Route path="cgu" element={<LegalPage type="cgu" />} />
        <Route path="rgpd" element={<LegalPage type="rgpd" />} />
        <Route path="cookies" element={<LegalPage type="cookies" />} />
        <Route path="mentions-legales" element={<LegalPage type="mentions" />} />
        <Route path="politique-de-confidentialite" element={<LegalPage type="privacy" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
