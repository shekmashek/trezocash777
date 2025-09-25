import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
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

// ProtectedRoute
const ProtectedRoute = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { projects, loading: budgetLoading } = useBudget();
  const location = useLocation();

  // Attendre que les deux contextes soient chargés
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

  // Vérifier si projects est disponible avant d'utiliser filter
  const hasActiveProjects = projects && projects.filter(p => !p.isArchived).length > 0;

  // Si pas de projets actifs et qu'on n'est pas déjà sur l'onboarding, rediriger vers l'onboarding
  if (!hasActiveProjects && !location.pathname.includes('/onboarding')) {
    return <Navigate to="/app/onboarding" replace />;
  }

  // Si l'utilisateur a des projets mais est sur l'onboarding, rediriger vers le dashboard
  if (hasActiveProjects && location.pathname.includes('/onboarding')) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return children ? children : <Outlet />;
};

// Composant pour gérer l'affichage après connexion
const AppEntry = () => {
  const { projects, loading } = useBudget();
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier si les projets sont chargés et qu'il n'y a pas de projets actifs
    const hasActiveProjects = projects && projects.filter(p => !p.isArchived).length > 0;
    if (!hasActiveProjects) {
      navigate('/app/onboarding');
    } else {
      navigate('/app/dashboard');
    }
  }, [projects, navigate]); // Dépendre des projets pour la redirection

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // Vérifier si projects est disponible
  const hasActiveProjects = projects && projects.filter(p => !p.isArchived).length > 0;

  // Afficher l'onboarding si pas de projets, sinon le dashboard
  if (!hasActiveProjects) {
    return <OnboardingView />;
  }

  return <DashboardView />;
};

// PublicArea
const PublicArea = ({ authMode, setAuthMode }) => {
  const { user, loading: authLoading } = useAuth();
  const { projects, loading: budgetLoading } = useBudget();
  const navigate = useNavigate();

  if (authLoading || budgetLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-50">
        <Loader className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (user) {
    // Vérifier si projects est disponible
    const hasActiveProjects = projects && projects.filter(p => !p.isArchived).length > 0;

    if (!hasActiveProjects) {
      navigate('/app/dashboard');
    } else {
      navigate('/app/dashboard');
    }
    return null; // No need to render anything if we redirect
  }

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

function App() {
  const [authMode, setAuthMode] = useState({ mode: null, fromTrial: false });

  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<AppEntry />} />
          <Route path="onboarding" element={<OnboardingView />} />
          <Route path="dashboard" element={<DashboardView />} />
          {/* Ajoute tes autres routes ici */}
        </Route>
      </Route>

      <Route element={<PublicArea authMode={authMode} setAuthMode={setAuthMode} />}>
        <Route path="/" element={<HomePage onSignUp={() => setAuthMode({ mode: 'signup', fromTrial: true })} />} />
        <Route path="/a-propos" element={<AboutPage />} />
        <Route path="/cgu" element={<LegalPage type="cgu" />} />
        <Route path="/rgpd" element={<LegalPage type="rgpd" />} />
        <Route path="/cookies" element={<LegalPage type="cookies" />} />
        <Route path="/mentions-legales" element={<LegalPage type="mentions" />} />
        <Route path="/politique-de-confidentialite" element={<LegalPage type="privacy" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;