import React, { useMemo, useState, useEffect } from 'react';
import { useBudget } from '../context/BudgetContext';
import { useAuth } from '../context/AuthContext'; // <-- AuthContext
import Axios from 'axios';
import { formatCurrency } from '../utils/formatting';
import { Wallet, TrendingDown, HandCoins, AlertTriangle, PieChart, LineChart, Compass, ArrowUp, ArrowDown } from 'lucide-react';
import { getTodayInTimezone, getEntryAmountForPeriod } from '../utils/budgetCalculations';
import SparklineChart from './SparklineChart';
import MonthlyBudgetSummary from './MonthlyBudgetSummary';
import { motion, AnimatePresence } from 'framer-motion';

const DashboardView = () => {
  const { state, dispatch } = useBudget();
  const { user, token } = useAuth(); // <-- récupérer user et token
  const { activeProjectId, allActuals, allCashAccounts, settings, categories, allEntries, projects } = state;

  const [activeTab, setActiveTab] = useState('overview');
  const [overdueItems, setOverdueItems] = useState([]);

  const isConsolidated = activeProjectId === 'consolidated';

  // --- Axios sécurisé avec token ---
  const api = Axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    withCredentials: true,
  });

  // --- Récupérer les actions en retard depuis l'API ---
  useEffect(() => {
    const fetchOverdueItems = async () => {
      if (!token) return;
      try {
        const response = await api.get('/auth/overdue-items'); // endpoint Laravel qui renvoie les actions prioritaires
        setOverdueItems(response.data.overdueItems || []);
      } catch (err) {
        console.error('Erreur récupération overdueItems:', err);
      }
    };
    fetchOverdueItems();
  }, [token, activeProjectId]);

  // --- Memoized Calculations ---
  const activeProjectName = useMemo(() => {
    if (isConsolidated) return 'Consolidé';
    const project = projects.find(p => p.id === activeProjectId);
    return project ? project.name : '';
  }, [activeProjectId, projects, isConsolidated]);

  const relevantActuals = useMemo(() => {
    return isConsolidated
      ? Object.entries(allActuals).flatMap(([projectId, actuals]) => actuals.map(actual => ({ ...actual, projectId })))
      : (allActuals[activeProjectId] || []).map(actual => ({ ...actual, projectId: activeProjectId }));
  }, [activeProjectId, allActuals, isConsolidated]);

  const userCashAccounts = useMemo(() => {
    return isConsolidated
      ? Object.values(allCashAccounts).flat()
      : allCashAccounts[activeProjectId] || [];
  }, [allCashAccounts, activeProjectId, isConsolidated]);

  const totalActionableBalance = useMemo(() => {
    return userCashAccounts.reduce((sum, account) => {
      let currentBalance = parseFloat(account.initialBalance) || 0;
      const accountPayments = relevantActuals
        .flatMap(actual => (actual.payments || []).filter(p => p.cashAccount === account.id).map(p => ({ ...p, type: actual.type })));
      
      for (const payment of accountPayments) {
        if (payment.type === 'receivable') currentBalance += payment.paidAmount;
        else if (payment.type === 'payable') currentBalance -= payment.paidAmount;
      }

      const blockedForProvision = relevantActuals
        .filter(actual => actual.isProvision && actual.provisionDetails?.destinationAccountId === account.id && actual.status !== 'paid')
        .reduce((sum, actual) => {
          const paidAmount = (actual.payments || []).reduce((pSum, p) => pSum + p.paidAmount, 0);
          return sum + (actual.amount - paidAmount);
        }, 0);
      
      return sum + (currentBalance - blockedForProvision);
    }, 0);
  }, [userCashAccounts, relevantActuals]);

  const totalOverduePayables = overdueItems.filter(i => i.type === 'payable').reduce((sum, i) => sum + i.remainingAmount, 0);
  const totalOverdueReceivables = overdueItems.filter(i => i.type === 'receivable').reduce((sum, i) => sum + i.remainingAmount, 0);

  // --- Chart Data ---
  const dashboardSparklineData = useMemo(() => {
    // Ici tu peux garder ton code existant pour générer les balances et périodes
    return { balances: [], periods: [] }; // temporaire pour simplifier
  }, []);

  const expenseDistributionData = useMemo(() => {
    // idem, garder ton code actuel
    return [];
  }, []);

  const chartTitle = useMemo(() => {
    const today = new Date();
    const monthName = today.toLocaleString('fr-FR', { month: 'long' });
    const year = today.getFullYear();
    return `Sorties ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
  }, []);

  const getDonutChartOptions = () => ({
    tooltip: { trigger: 'item', formatter: '{b}: {c}€ ({d}%)' },
    legend: { show: false },
    series: [{
      name: 'Sorties',
      type: 'pie',
      radius: ['50%', '70%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: true,
      label: { show: true, formatter: '{b}: {d}%', fontSize: 11, color: '#4b5563' },
      labelLine: { show: true, length: 10, length2: 15 },
      emphasis: { label: { show: true, fontSize: '12', fontWeight: 'bold' } },
      data: expenseDistributionData,
    }]
  });

  const handleActionClick = (e, item) => {
    dispatch({ type: 'OPEN_TRANSACTION_ACTION_MENU', payload: { x: e.clientX, y: e.clientY, transaction: item } });
  };

  const greetingMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return `Bonjour ${user?.name || ''}`;
    if (hour < 18) return `Bon après-midi ${user?.name || ''}`;
    return `Bonsoir ${user?.name || ''}`;
  };

  const startTour = () => dispatch({ type: 'START_TOUR' });

  const tabContentVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };

  return (
    <div className="container mx-auto p-6 max-w-full space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{greetingMessage()} !</h1>
          <p className="text-gray-600">Bienvenue sur votre tableau de bord. Voici un aperçu de votre situation.</p>
        </div>
        <button onClick={startTour} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors">
            <Compass className="w-4 h-4" />
            Faire une visite guidée
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border flex items-start gap-4">
          <div className="bg-green-100 p-3 rounded-full"><Wallet className="w-6 h-6 text-green-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Trésorerie Actionnable</p>
            <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalActionableBalance, settings)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border flex items-start gap-4">
          <div className="bg-red-100 p-3 rounded-full"><TrendingDown className="w-6 h-6 text-red-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Dettes en Retard</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalOverduePayables, settings)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border flex items-start gap-4">
          <div className="bg-yellow-100 p-3 rounded-full"><HandCoins className="w-6 h-6 text-yellow-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Créances en Retard</p>
            <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totalOverdueReceivables, settings)}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button onClick={() => setActiveTab('overview')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Vue d'ensemble</button>
          <button onClick={() => setActiveTab('budget')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'budget' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Budget Annuel</button>
          <button onClick={() => setActiveTab('analysis')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'analysis' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Analyse des Dépenses</button>
        </nav>
      </div>

      <div className="mt-8">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
            {activeTab === 'overview' && (
              <div className="bg-white p-6 rounded-lg shadow-sm border flex flex-col lg:col-span-3">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2 flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  Actions Prioritaires <span className="text-gray-500 font-medium">- {activeProjectName}</span>
                </h2>
                {overdueItems.length > 0 ? (
                  <div className="space-y-3 overflow-y-auto custom-scrollbar" style={{ height: '28rem' }}>
                    {overdueItems.map(item => {
                      const project = isConsolidated ? projects.find(p => p.id === item.projectId) : null;
                      return (
                        <button key={item.id} onClick={(e) => handleActionClick(e, item)} className="w-full text-left p-2 rounded-lg border border-gray-200 bg-white transition-colors hover:bg-gray-50">
                          <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                  <div className={`flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full ${item.type === 'payable' ? 'bg-red-100' : 'bg-green-100'}`}>
                                      {item.type === 'payable' ? <ArrowDown className="w-4 h-4 text-red-600" /> : <ArrowUp className="w-4 h-4 text-green-600" />}
                                  </div>
                                  <div className="flex flex-col">
                                      <span className="font-medium text-gray-700">{item.name}</span>
                                      {project && <span className="text-xs text-gray-400">{project.name}</span>}
                                  </div>
                              </div>
                              <span className="text-gray-900 font-semibold">{formatCurrency(item.remainingAmount, settings)}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500">Aucune action prioritaire pour le moment.</p>
                )}
              </div>
            )}

            {activeTab === 'budget' && <MonthlyBudgetSummary />}
            {activeTab === 'analysis' && <SparklineChart balances={dashboardSparklineData.balances} periods={dashboardSparklineData.periods} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DashboardView;
