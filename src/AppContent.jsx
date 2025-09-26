import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useData } from './context/DataContext';
import { useUI } from './context/UIContext';
import OnboardingView from './components/OnboardingView';
import AuthView from './components/AuthView';
import PublicLayout from './layouts/PublicLayout';
import AppLayout from './layouts/AppLayout';
import { supabase } from './utils/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X, Loader } from 'lucide-react';
import HomePage from './pages/HomePage';
import LegalPage from './pages/LegalPage';
import AboutPage from './pages/AboutPage';
import DashboardView from './components/DashboardView';
import TrezoPage from './pages/TrezoPage';
import BudgetPage from './pages/BudgetPage';
import CashflowView from './components/CashflowView';
import ScheduleView from './components/ScheduleView';
import ScenarioView from './components/ScenarioView';
import ExpenseAnalysisView from './components/ExpenseAnalysisView';
import JournalsView from './components/JournalsView';
import UnderConstructionView from './components/UnderConstructionView';
import ProfilePage from './pages/ProfilePage';
import SecurityPage from './pages/SecurityPage';
import SubscriptionPage from './pages/SubscriptionPage';
import DeleteAccountPage from './pages/DeleteAccountPage';
import DisplaySettingsPage from './pages/DisplaySettingsPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminLayout from './layouts/AdminLayout';
import CollaboratorsPage from './pages/CollaboratorsPage';
import CashAccountsPage from './pages/CashAccountsPage';
import CategoryManagementPage from './pages/CategoryManagementPage';
import TiersManagementPage from './pages/TiersManagementPage';
import ArchivesPage from './pages/ArchivesPage';
import MyTemplatesPage from './pages/MyTemplatesPage';
import ProvisionsPage from './pages/ProvisionsPage';
import VatManagementPage from './pages/VatManagementPage';

const toastIcons = {
  success: <CheckCircle className="w-5 h-5" />,
  error: <XCircle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
  warning: <AlertCircle className="w-5 h-5" />,
};
const toastColors = {
  success: 'bg-success-500',
  error: 'bg-danger-500',
  info: 'bg-info-500',
  warning: 'bg-warning-500',
};
const Toast = ({ toast, onRemove }) => {
  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => onRemove(toast.id), toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast, onRemove]);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={`relative flex items-start w-full max-w-sm p-4 text-white rounded-lg shadow-lg ${toastColors[toast.type]}`}
    >
      <div className="flex-shrink-0 mr-3">{toastIcons[toast.type]}</div>
      <div className="flex-1 text-sm font-medium">{toast.message}</div>
      <button onClick={() => onRemove(toast.id)} className="ml-4 p-1 rounded-full hover:bg-white/20"><X className="w-4 h-4" /></button>
      {toast.duration && <motion.div className="absolute bottom-0 left-0 h-1 bg-white/50" initial={{ width: '100%' }} animate={{ width: '0%' }} transition={{ duration: toast.duration / 1000, ease: 'linear' }} />}
    </motion.div>
  );
};
const ToastContainer = () => {
  const { uiState, uiDispatch } = useUI();
  const { toasts } = uiState;
  const handleRemove = (id) => uiDispatch({ type: 'REMOVE_TOAST', payload: id });
  return (
    <div className="fixed top-5 right-5 z-[100] space-y-2">
      <AnimatePresence>{toasts.map(toast => <Toast key={toast.id} toast={toast} onRemove={handleRemove} />)}</AnimatePresence>
    </div>
  );
};

function AppContent() {
  const { dataState, dataDispatch } = useData();
  const { uiState, uiDispatch } = useUI();
  const { session, profile, projects } = dataState;
  const { isLoading } = uiState;
  const [authMode, setAuthMode] = useState({ mode: null, fromTrial: false });

  useEffect(() => {
    if (session && !profile) {
      const fetchInitialData = async () => {
        uiDispatch({ type: 'SET_LOADING', payload: true });
        try {
          const user = session.user;
          const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          
          if (profileError && profileError.code !== 'PGRST116') throw profileError;
          
          const fetchedProfile = profileData ? {
            id: profileData.id,
            fullName: profileData.full_name,
            subscriptionStatus: profileData.subscription_status,
            trialEndsAt: profileData.trial_ends_at,
            planId: profileData.plan_id,
            role: profileData.role,
            notifications: profileData.notifications || [],
          } : null;

          dataDispatch({ type: 'SET_PROFILE', payload: fetchedProfile });

          if (!profileData) {
             uiDispatch({ type: 'SET_LOADING', payload: false });
             uiDispatch({ type: 'START_ONBOARDING' });
             return;
          }
          
          const settings = {
            currency: profileData.currency || '€',
            displayUnit: profileData.display_unit || 'standard',
            decimalPlaces: profileData.decimal_places ?? 2,
            timezoneOffset: profileData.timezone_offset ?? 0,
          };

          const [
            projectsRes, tiersRes, loansRes, scenariosRes, 
            entriesRes, actualsRes, paymentsRes, cashAccountsRes, 
            scenarioEntriesRes, consolidatedViewsRes, collaboratorsRes, commentsRes, templatesRes, customCategoriesRes,
            vatRatesRes, vatRegimesRes,
          ] = await Promise.all([
            supabase.from('projects').select('*'), supabase.from('tiers').select('*'), supabase.from('loans').select('*'),
            supabase.from('scenarios').select('*'), supabase.from('budget_entries').select('*'), supabase.from('actual_transactions').select('*'),
            supabase.from('payments').select('*'), supabase.from('cash_accounts').select('*'), supabase.from('scenario_entries').select('*'),
            supabase.from('consolidated_views').select('*'), supabase.from('collaborators').select('*'), supabase.from('comments').select('*'),
            supabase.from('templates').select('*'), supabase.from('user_categories').select('*'), supabase.from('vat_rates').select('*'),
            supabase.from('vat_regimes').select('*'),
          ]);

          const responses = { projectsRes, tiersRes, loansRes, scenariosRes, entriesRes, actualsRes, paymentsRes, cashAccountsRes, scenarioEntriesRes, consolidatedViewsRes, collaboratorsRes, commentsRes, templatesRes, customCategoriesRes, vatRatesRes, vatRegimesRes };
          for (const key in responses) {
            if (responses[key].error) throw responses[key].error;
          }

          const userIds = new Set();
          userIds.add(user.id);
          if (projectsRes.data) { projectsRes.data.forEach(p => userIds.add(p.user_id)); }
          if (collaboratorsRes.data) { collaboratorsRes.data.forEach(c => { userIds.add(c.owner_id); if (c.user_id) userIds.add(c.user_id); }); }
          if (commentsRes.data) { commentsRes.data.forEach(c => userIds.add(c.user_id)); }
          if (templatesRes.data) { templatesRes.data.forEach(t => userIds.add(t.user_id)); }

          const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('id, full_name, email').in('id', Array.from(userIds));
          if (profilesError) throw profilesError;

          const projects = (projectsRes.data || []).map(p => ({ id: p.id, name: p.name, currency: p.currency, startDate: p.start_date, endDate: p.end_date, isArchived: p.is_archived, user_id: p.user_id, annualGoals: p.annual_goals, expenseTargets: p.expense_targets }));
          const tiers = (tiersRes.data || []).map(t => ({ id: t.id, name: t.name, type: t.type, payment_terms: t.payment_terms }));
          const loans = (loansRes.data || []).map(l => ({ id: l.id, projectId: l.project_id, type: l.type, thirdParty: l.third_party, principal: l.principal, term: l.term, monthlyPayment: l.monthly_payment, principalDate: l.principal_date, repaymentStartDate: l.repayment_start_date }));
          const scenarios = (scenariosRes.data || []).map(s => ({ id: s.id, projectId: s.project_id, name: s.name, description: s.description, color: s.color, isVisible: s.is_visible, isArchived: s.is_archived }));
          const consolidatedViews = (consolidatedViewsRes.data || []).map(v => ({ id: v.id, name: v.name, project_ids: v.project_ids }));
          const collaborators = (collaboratorsRes.data || []).map(c => ({ id: c.id, ownerId: c.owner_id, userId: c.user_id, email: c.email, role: c.role, status: c.status, projectIds: c.project_ids, permissionScope: c.permission_scope }));
          const templates = (templatesRes.data || []).map(t => ({ id: t.id, userId: t.user_id, name: t.name, description: t.description, structure: t.structure, isPublic: t.is_public, tags: t.tags, icon: t.icon, color: t.color, purpose: t.purpose }));

          const allEntries = (entriesRes.data || []).reduce((acc, entry) => {
            const e = { id: entry.id, loanId: entry.loan_id, type: entry.type, category: entry.category, frequency: entry.frequency, amount: entry.amount, date: entry.date, startDate: entry.start_date, endDate: entry.end_date, supplier: entry.supplier, description: entry.description, isOffBudget: entry.is_off_budget, payments: entry.payments, provisionDetails: entry.provision_details, isProvision: entry.is_provision, amount_type: entry.amount_type, vat_rate_id: entry.vat_rate_id, ht_amount: entry.ht_amount, ttc_amount: entry.ttc_amount, };
            if (!acc[entry.project_id]) acc[entry.project_id] = [];
            acc[entry.project_id].push(e);
            return acc;
          }, {});

          const allActuals = (actualsRes.data || []).reduce((acc, actual) => {
            const a = { id: actual.id, budgetId: actual.budget_id, projectId: actual.project_id, type: actual.type, category: actual.category, thirdParty: actual.third_party, description: actual.description, date: actual.date, amount: actual.amount, status: actual.status, isOffBudget: actual.is_off_budget, isProvision: actual.is_provision, isFinalProvisionPayment: actual.is_final_provision_payment, provisionDetails: actual.provision_details, isInternalTransfer: actual.is_internal_transfer, amount_type: actual.amount_type, vat_rate_id: actual.vat_rate_id, ht_amount: actual.ht_amount, ttc_amount: actual.ttc_amount, payments: (paymentsRes.data || []).filter(p => p.actual_id === actual.id).map(p => ({ id: p.id, paymentDate: p.payment_date, paidAmount: p.paid_amount, cashAccount: p.cash_account })) };
            if (!acc[actual.project_id]) acc[actual.project_id] = [];
            acc[actual.project_id].push(a);
            return acc;
          }, {});

          const allCashAccounts = (cashAccountsRes.data || []).reduce((acc, account) => {
            const a = { id: account.id, projectId: account.project_id, mainCategoryId: account.main_category_id, name: account.name, initialBalance: account.initial_balance, initialBalanceDate: account.initial_balance_date, isClosed: account.is_closed, closureDate: account.closure_date };
            if (!acc[account.project_id]) acc[account.project_id] = [];
            acc[account.project_id].push(a);
            return acc;
          }, {});

          const scenarioEntries = (scenarioEntriesRes.data || []).reduce((acc, entry) => {
             const e = { id: entry.id, type: entry.type, category: entry.category, frequency: entry.frequency, amount: entry.amount, date: entry.date, startDate: entry.start_date, endDate: entry.end_date, supplier: entry.supplier, description: entry.description, isDeleted: entry.is_deleted, payments: entry.payments, };
            if (!acc[entry.scenario_id]) acc[entry.scenario_id] = [];
            acc[entry.scenario_id].push(e);
            return acc;
          }, {});

          const allComments = (commentsRes.data || []).reduce((acc, comment) => {
              const projectId = comment.project_id || 'global';
              if (!acc[projectId]) acc[projectId] = [];
              acc[projectId].push({ id: comment.id, projectId: comment.project_id, userId: comment.user_id, rowId: comment.row_id, columnId: comment.column_id, content: comment.content, createdAt: comment.created_at, mentionedUsers: comment.mentioned_users, });
              return acc;
          }, {});

          const fetchedCategories = customCategoriesRes.data || [];
          const customMain = fetchedCategories.filter(c => !c.parent_id);
          const customSubs = fetchedCategories.filter(c => c.parent_id);
          const finalCategories = JSON.parse(JSON.stringify(dataState.categories));
          
          customMain.forEach(main => {
              if (!finalCategories[main.type].some(m => m.id === main.id)) {
                  finalCategories[main.type].push({ id: main.id, name: main.name, isFixed: main.is_fixed, subCategories: [] });
              }
          });

          customSubs.forEach(sub => {
              let parent = finalCategories.revenue.find(m => m.id === sub.parent_id) || finalCategories.expense.find(m => m.id === sub.parent_id);
              if (parent && !parent.subCategories.some(s => s.id === sub.id)) {
                  parent.subCategories.push({ id: sub.id, name: sub.name, isFixed: sub.is_fixed });
              }
          });

          const vatRates = (vatRatesRes.data || []).reduce((acc, rate) => {
              if (!acc[rate.project_id]) acc[rate.project_id] = [];
              acc[rate.project_id].push(rate);
              return acc;
          }, {});

          const vatRegimes = (vatRegimesRes.data || []).reduce((acc, regime) => {
              acc[regime.project_id] = regime;
              return acc;
          }, {});

          dataDispatch({
            type: 'SET_INITIAL_DATA',
            payload: {
              allProfiles: profilesData || [], settings, projects, tiers, loans, scenarios, consolidatedViews, collaborators, allComments, templates, vatRates, vatRegimes,
              allEntries, allActuals, allCashAccounts, scenarioEntries, categories: finalCategories,
            },
          });
          
          if (projects.length > 0) {
            uiDispatch({ type: 'SET_ACTIVE_PROJECT', payload: 'consolidated' });
          } else {
            uiDispatch({ type: 'START_ONBOARDING' });
          }
          uiDispatch({ type: 'SET_LOADING', payload: false });

        } catch (error) {
          uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
          uiDispatch({ type: 'SET_LOADING', payload: false });
        }
      };
      fetchInitialData();
    } else if (!session) {
      dataDispatch({ type: 'RESET_DATA_STATE' });
      uiDispatch({ type: 'RESET_UI_STATE' });
    }
  }, [session, dataDispatch, uiDispatch]);

  const ProtectedRoute = () => {
    const location = useLocation();
    
    if (isLoading) {
        return (
            <div className="w-screen h-screen flex items-center justify-center bg-gray-50">
                <Loader className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!session) {
      return <Navigate to="/" replace />;
    }

    if (profile?.role === 'superadmin' && !location.pathname.startsWith('/admin')) {
        return <Navigate to="/admin" replace />;
    }
    
    if (profile?.role !== 'superadmin' && location.pathname.startsWith('/admin')) {
        return <Navigate to="/app" replace />;
    }

    if (!location.pathname.startsWith('/admin') && (uiState.isOnboarding || projects.length === 0)) {
      return <OnboardingView />;
    }

    return <Outlet />;
  };

  const PublicArea = () => {
    if (isLoading) return <div className="w-screen h-screen flex items-center justify-center bg-gray-50"><Loader className="w-12 h-12 text-blue-600 animate-spin" /></div>;
    
    if (session) {
      if (profile?.role === 'superadmin') return <Navigate to="/admin" replace />;
      return <Navigate to="/app" replace />;
    }

    if (authMode.mode) {
      return <AuthView 
        initialMode={authMode.mode}
        fromTrial={authMode.fromTrial}
        onBack={() => setAuthMode({ mode: null, fromTrial: false })}
      />;
    }
    return <PublicLayout 
      onLogin={() => setAuthMode({ mode: 'login', fromTrial: false })} 
      onSignUp={() => setAuthMode({ mode: 'signup', fromTrial: true })}
    />;
  };
  
  const HomePageWithAuthTrigger = () => {
      return <HomePage onSignUp={() => setAuthMode({ mode: 'signup', fromTrial: true })} />;
  };

  return (
    <>
      <ToastContainer />
      <Routes>
          <Route element={<ProtectedRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboardPage />} />
                  <Route path="users" element={<AdminUsersPage />} />
              </Route>
              <Route path="/app" element={<AppLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<DashboardView />} />
                <Route path="budget" element={<BudgetPage />} />
                <Route path="trezo" element={<TrezoPage />} />
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
                <Route path="templates" element={<MyTemplatesPage />} />
                <Route path="provisions" element={<ProvisionsPage />} />
                <Route path="tva" element={<VatManagementPage />} />
                <Route path="display-settings" element={<DisplaySettingsPage />} />
                <Route path="delete-account" element={<DeleteAccountPage />} />
                <Route path="factures" element={<UnderConstructionView title="Factures" />} />
                <Route path="aide" element={<UnderConstructionView title="Centre d'aide" />} />
              </Route>
          </Route>

          <Route path="/admin/login" element={<AdminLoginPage />} />
          
          <Route element={<PublicArea />}>
            <Route path="/" element={<HomePageWithAuthTrigger />} />
            <Route path="/a-propos" element={<AboutPage />} />
            <Route path="/cgu" element={<LegalPage type="cgu" />} />
            <Route path="/rgpd" element={<LegalPage type="rgpd" />} />
            <Route path="/cookies" element={<LegalPage type="cookies" />} />
            <Route path="/mentions-legales" element={<LegalPage type="mentions" />} />
            <Route path="/politique-de-confidentialite" element={<LegalPage type="privacy" />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
      </Routes>
    </>
  );
}

export default AppContent;
