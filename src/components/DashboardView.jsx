import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { formatCurrency } from '../utils/formatting';
import { Wallet, TrendingDown, HandCoins, AlertTriangle, PieChart, LineChart, Calendar, ArrowUp, ArrowDown, BookOpen } from 'lucide-react';
import { useActiveProjectData, useDashboardKpis, useExpenseDistributionForMonth } from '../utils/selectors.jsx';
import SparklineChart from './SparklineChart';
import ReactECharts from 'echarts-for-react';
import MonthlyBudgetSummary from './MonthlyBudgetSummary';
import { motion, AnimatePresence } from 'framer-motion';

const DashboardView = () => {
  const { dataState } = useData();
  const { uiState, uiDispatch } = useUI();
  const { settings, projects, profile } = dataState;
  
  const [activeTab, setActiveTab] = useState('overview');

  const { actualTransactions, cashAccounts, activeProject, isConsolidated } = useActiveProjectData(dataState, uiState);
  const { totalActionableBalance, totalOverduePayables, totalOverdueReceivables, overdueItems } = useDashboardKpis(cashAccounts, actualTransactions, settings);
  const expenseDistributionData = useExpenseDistributionForMonth(actualTransactions, dataState.categories, settings);

  const activeProjectName = activeProject?.name || '';

  const monthlyPeriods = useMemo(() => {
    // This calculation is simple and specific to this component's sparkline, so it can stay.
    const today = new Date();
    const baseDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const periods = [];
    for (let i = 0; i < 12; i++) {
        const periodStart = new Date(baseDate);
        periodStart.setMonth(periodStart.getMonth() + i);
        const periodEnd = new Date(periodStart);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        const label = periodStart.toLocaleString('fr-FR', { month: 'short' });
        periods.push({ label, startDate: periodStart, endDate: periodEnd });
    }
    return periods;
  }, []);

  const chartTitle = useMemo(() => {
    const today = new Date();
    const monthName = today.toLocaleString('fr-FR', { month: 'long' });
    const year = today.getFullYear();
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    return `Sorties ${capitalizedMonth} ${year}`;
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
    uiDispatch({ type: 'OPEN_TRANSACTION_ACTION_MENU', payload: { x: e.clientX, y: e.clientY, transaction: item } });
  };
  
  const greetingMessage = () => {
    const hour = new Date().getHours();
    const name = profile?.fullName?.split(' ')[0] || 'Utilisateur';
    if (hour < 12) return `Bonjour ${name}`;
    if (hour < 18) return `Bon après-midi ${name}`;
    return `Bonsoir ${name}`;
  }

  const tabContentVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };

  const tutorials = [
    { id: 'L_jWHffIx5E', title: 'Prise en main de Trezocash' },
    { id: '3qHkcs3kG44', title: 'Créer votre premier projet' },
    { id: 'g_t-s23-4U4', title: 'Maîtriser le tableau de trésorerie' },
    { id: 'm_u6m3-L0gA', title: 'Utiliser les scénarios pour anticiper' },
    { id: 'a_p5-VvF-sI', title: 'Analyser vos dépenses efficacement' },
    { id: 'k-rN9t_g-iA', title: 'Gérer vos comptes de trésorerie' },
    { id: 'r6-p_c-3_sI', title: 'Collaborer en équipe sur un projet' },
    { id: 's_k9-t_g-iA', title: 'Comprendre l\'échéancier' },
    { id: 't_g-iA_r6-p', title: 'Créer et utiliser des modèles' },
    { id: 'u_sI-k-rN9t', title: 'Gérer les fonds à provisionner' },
    { id: 'v_m3-L0gA_a', title: 'Consolider plusieurs projets' },
    { id: 'w_4U4-s23-g', title: 'Personnaliser vos catégories' },
    { id: 'x_g-iA_k-rN', title: 'Suivre vos dettes et prêts' },
    { id: 'y_p5-VvF-sI', title: 'Astuces pour le mode "État des lieux"' },
    { id: 'z_L0gA_m_u6', title: 'Paramètres avancés et personnalisation' },
    { id: 'A_k-rN9t_g-i', title: 'Comprendre l\'analyse des soldes' }
  ];

  return (
    <div className="container mx-auto p-6 max-w-full space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{greetingMessage()} !</h1>
          <p className="text-gray-600">Bienvenue sur votre tableau de bord. Voici un aperçu de votre situation.</p>
        </div>
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

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button onClick={() => setActiveTab('overview')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            Vue d'ensemble
          </button>
          <button onClick={() => setActiveTab('budget')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'budget' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            Budget Annuel
          </button>
          <button onClick={() => setActiveTab('analysis')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'analysis' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            Analyse des Dépenses
          </button>
        </nav>
      </div>

      <div className="mt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
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
                                    <div className="overflow-hidden">
                                        <p className="font-semibold truncate text-gray-800" title={item.thirdParty}>
                                          {item.thirdParty}
                                          {isConsolidated && project && <span className="text-xs font-normal text-gray-500 ml-1">({project.name})</span>}
                                        </p>
                                        <div className="text-xs text-gray-500 flex items-center gap-1.5">
                                            <span>{new Date(item.date).toLocaleDateString('fr-FR')}</span>
                                            <span className="text-gray-500">({Math.floor((new Date() - new Date(item.date)) / (1000 * 60 * 60 * 24))}j en retard)</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-base font-normal whitespace-nowrap pl-2 text-gray-600">{formatCurrency(item.remainingAmount, settings)}</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="h-[28rem] flex items-center justify-center">
                        <div className="text-center text-gray-500 py-10">
                            <p>Aucune action prioritaire. Tout est à jour !</p>
                        </div>
                    </div>
                  )}
                </div>
            )}

            {activeTab === 'budget' && (
              <MonthlyBudgetSummary />
            )}

            {activeTab === 'analysis' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <LineChart className="w-5 h-5 text-blue-600" />
                      Tendance de la Trésorerie (12 mois)
                    </h3>
                    <SparklineChart
                      data={[]}
                      periods={monthlyPeriods}
                      currencySettings={settings}
                      showXAxis={true}
                      xAxisLabels={monthlyPeriods.map(p => p.label.charAt(0))}
                    />
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-purple-600" />
                      {chartTitle}
                    </h3>
                    {expenseDistributionData.length > 0 ? (
                      <ReactECharts option={getDonutChartOptions()} style={{ height: '250px' }} />
                    ) : (
                      <div className="text-center text-gray-500 py-16">
                        <p>Aucune sortie ce mois-ci.</p>
                      </div>
                    )}
                  </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <section id="tutoriels" className="pt-8">
        <div className="text-left mb-8">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-blue-600" />
            Tutoriels Vidéo
          </h2>
          <p className="mt-2 text-gray-600">Apprenez à maîtriser Trezocash avec nos guides pas à pas.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tutorials.map((video) => (
            <div key={video.id} className="bg-white rounded-lg shadow-sm border overflow-hidden group">
              <div className="w-full h-40 bg-black flex items-center justify-center">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${video.id}`}
                  title={video.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <div className="p-4">
                <h4 className="font-semibold text-sm text-gray-800 truncate group-hover:text-blue-600 transition-colors">{video.title}</h4>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default DashboardView;
