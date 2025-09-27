import React, { useMemo, useState } from 'react';
import { PiggyBank, Lock, PlusCircle, ArrowRightLeft, Landmark, Smartphone, Wallet, LineChart, ChevronDown, Users, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { formatCurrency } from '../utils/formatting';
import { getTodayInTimezone } from '../utils/budgetCalculations';
import TrezocashLogo from './TrezocashLogo';
import ActionableBalanceDrawer from './ActionableBalanceDrawer';
import SparklineChart from './SparklineChart';
import Avatar from './Avatar';
import { useNavigate } from 'react-router-dom';
import { useActiveProjectData, useAccountBalances, useHeaderMetrics } from '../utils/selectors.jsx';

const Header = ({ isCollapsed, onToggleCollapse, periodPositions, periods }) => {
  const { dataState } = useData();
  const { uiState, uiDispatch } = useUI();
  const { settings, allCashAccounts, allActuals, consolidatedViews, projects, collaborators, allProfiles } = dataState;
  const { activeProjectId } = uiState;
  const navigate = useNavigate();

  const [isBalanceDrawerOpen, setIsBalanceDrawerOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  
  const { isConsolidated, isCustomConsolidated, activeProject } = useActiveProjectData(dataState, uiState);
  const accountBalances = useAccountBalances(allCashAccounts, allActuals, activeProjectId, isConsolidated, isCustomConsolidated, consolidatedViews);
  
  const projectedCashflowData = useMemo(() => {
    if (!periods || periods.length === 0 || !periodPositions || periodPositions.length === 0) {
      return [];
    }
    const today = getTodayInTimezone(settings.timezoneOffset);
    let todayIndex = periods.findIndex(p => today >= p.startDate && today < p.endDate);

    if (todayIndex === -1) {
      if (periods.length > 0 && today < periods[0].startDate) {
        todayIndex = -1; 
      } else if (periods.length > 0 && today >= periods[periods.length - 1].endDate) {
        return []; 
      }
    }
    
    return periodPositions.map((p, i) => (i >= todayIndex ? p.final : null));

  }, [periods, periodPositions, settings.timezoneOffset]);

  const activeProjectName = useMemo(() => {
    if (isConsolidated) {
        return 'Consolidé';
    }
    if (isCustomConsolidated) {
        const viewId = activeProjectId.replace('consolidated_view_', '');
        const view = consolidatedViews.find(v => v.id === viewId);
        return view ? view.name : 'Vue Personnalisée';
    }
    return activeProject ? activeProject.name : 'Projet';
  }, [activeProjectId, projects, consolidatedViews, isConsolidated, isCustomConsolidated, activeProject]);

  const projectTeam = useMemo(() => {
    if (!activeProjectId || !allProfiles.length) return [];

    const usersMap = new Map();

    const addUser = (userId, role) => {
        if (!userId || usersMap.has(userId)) return;
        const profile = allProfiles.find(p => p.id === userId);
        if (profile) {
            usersMap.set(userId, { ...profile, role });
        }
    };

    if (isCustomConsolidated) {
        const viewId = activeProjectId.replace('consolidated_view_', '');
        const view = consolidatedViews.find(v => v.id === viewId);
        if (!view) return [];

        const projectIdsInView = view.project_ids || [];

        projectIdsInView.forEach(projectId => {
            const project = projects.find(p => p.id === projectId);
            if (project) {
                addUser(project.user_id, 'Propriétaire');
            }
        });

        collaborators.forEach(c => {
            if (c.projectIds && c.projectIds.some(pid => projectIdsInView.includes(pid))) {
                addUser(c.user_id, c.role === 'editor' ? 'Éditeur' : 'Lecteur');
            }
        });

    } else if (isConsolidated) {
        const activeProjects = projects.filter(p => !p.isArchived);
        const activeProjectIds = activeProjects.map(p => p.id);

        activeProjects.forEach(project => {
            addUser(project.user_id, 'Propriétaire');
        });

        collaborators.forEach(c => {
            if (c.projectIds && c.projectIds.some(pid => activeProjectIds.includes(pid))) {
                addUser(c.user_id, c.role === 'editor' ? 'Éditeur' : 'Lecteur');
            }
        });
    } else { // Single project
        const project = projects.find(p => p.id === activeProjectId);
        if (!project) return [];

        addUser(project.user_id, 'Propriétaire');

        collaborators.forEach(c => {
            if (c.projectIds && c.projectIds.includes(activeProjectId)) {
                addUser(c.user_id, c.role === 'editor' ? 'Éditeur' : 'Lecteur');
            }
        });
    }

    return Array.from(usersMap.values());
  }, [activeProjectId, projects, collaborators, allProfiles, consolidatedViews, isConsolidated, isCustomConsolidated]);
  
  const handleWalletClick = (accountId) => {
    setSelectedAccountId(accountId);
    setIsBalanceDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsBalanceDrawerOpen(false);
    setSelectedAccountId(null);
  };

  const groupIcons = {
      bank: Landmark,
      cash: Wallet,
      mobileMoney: Smartphone,
      savings: PiggyBank,
      provisions: Lock,
  };

  return (
    <>
      <div className="flex items-center justify-center h-20 px-4 border-b">
          <button 
            onClick={onToggleCollapse} 
            className="flex items-center justify-center w-full transition-colors rounded-lg hover:bg-gray-100 p-2"
            title={isCollapsed ? 'Agrandir le menu' : 'Réduire le menu'}
          >
            <TrezocashLogo className="w-10 h-10 shrink-0 animate-spin-y-slow" />
            <span className={`text-xl font-normal text-gray-500 transition-all duration-200 ease-in-out overflow-hidden whitespace-nowrap ${isCollapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-2'}`}>
              Trezocash
            </span>
          </button>
        </div>

        <div className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {/* Liquidités section */}
            <div className={`px-2 pt-2`}>
                <h3 className={`text-sm font-bold text-gray-800 mb-2 ${isCollapsed ? 'text-center' : 'px-2 flex items-center gap-2'}`}>
                    {isCollapsed ? '🏦' : <><Wallet className="w-4 h-4 text-teal-600" /><span>Liquidités</span></>}
                </h3>
                <div className="space-y-1">
                {accountBalances.map(account => {
                    const Icon = groupIcons[account.mainCategoryId] || Wallet;
                    return (
                    <button 
                        key={account.id} 
                        onClick={() => handleWalletClick(account.id)} 
                        className={`w-full text-left flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-100 ${isCollapsed ? 'justify-center' : ''} ${account.isClosed ? 'opacity-50' : ''}`}
                        title={isCollapsed ? `${account.name}: ${formatCurrency(account.actionableBalance, settings)}` : ''}
                    >
                        <Icon className="w-5 h-5 text-gray-500 shrink-0" />
                        {!isCollapsed && (
                        <div className="flex-grow overflow-hidden">
                            <div className="text-sm font-medium text-text-primary truncate">{account.name}</div>
                            <div className="text-xs text-text-secondary">{formatCurrency(account.actionableBalance, settings)}</div>
                        </div>
                        )}
                    </button>
                    )
                })}
                </div>
            </div>

            {/* Équipe section */}
            <div className={`px-2 pt-2`}>
                <hr className="my-2 border-gray-200" />
                <h3 className={`text-sm font-bold text-gray-800 mb-2 ${isCollapsed ? 'text-center' : 'px-2 flex items-center gap-2'}`}>
                    {isCollapsed ? '👥' : <><Users className="w-4 h-4 text-purple-600" /><span>Équipe</span></>}
                </h3>
                {!isCollapsed && (
                    <p className="px-2 text-xs text-gray-500 font-medium mb-2 truncate">{activeProjectName}</p>
                )}
                <div className="space-y-1">
                {projectTeam.map(member => (
                    <div 
                    key={member.id} 
                    className={`w-full text-left flex items-center gap-3 px-2 py-1.5 rounded-lg ${isCollapsed ? 'justify-center' : ''}`}
                    title={isCollapsed ? `${member.full_name} (${member.role})` : ''}
                    >
                    <Avatar name={member.full_name} role={member.role} />
                    {!isCollapsed && (
                        <div className="flex-grow overflow-hidden">
                        <div className="text-sm font-medium text-text-primary truncate">{member.full_name}</div>
                        <div className="text-xs text-text-secondary">{member.role}</div>
                        </div>
                    )}
                    </div>
                ))}
                </div>
            </div>
            
            {/* Tendance section */}
            <div className="pt-2">
                <hr className="my-2 border-gray-200" />
                <h3 className={`text-sm font-bold text-gray-800 mb-2 flex items-center gap-2 ${isCollapsed ? 'justify-center' : 'px-2'}`}>
                    <LineChart className="w-4 h-4 text-blue-600" />
                    {!isCollapsed && 'Tendance de la Trésorerie'}
                </h3>
                <div className="-mx-2">
                    <SparklineChart
                    data={projectedCashflowData}
                    periods={periods}
                    currencySettings={settings}
                    />
                </div>
            </div>
        </div>
      <ActionableBalanceDrawer 
        isOpen={isBalanceDrawerOpen}
        onClose={handleCloseDrawer}
        balances={accountBalances}
        selectedAccountId={selectedAccountId}
        currency={settings.currency}
      />
    </>
  );
};

export default Header;
