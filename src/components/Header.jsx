import React, { useState, useMemo } from 'react';
import { PiggyBank, Lock, FileWarning, Hourglass, Banknote, Coins, PlusCircle, ArrowRightLeft, Landmark, Smartphone, Wallet, LineChart, ChevronDown, Users, Settings } from 'lucide-react';
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

const Header = ({ isCollapsed, onToggleCollapse, periodPositions, periods }) => {
  const { dataState } = useData();
  const { uiState, uiDispatch } = useUI();
  const { settings, allCashAccounts, allActuals, allEntries, loans, consolidatedViews, projects, collaborators, allProfiles, categories } = dataState;
  const { activeProjectId } = uiState;
  const navigate = useNavigate();

  const [isBalanceDrawerOpen, setIsBalanceDrawerOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [collapsedSections, setCollapsedSections] = useState({
    balances: true,
    overdue: true,
    loans: true,
  });

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const isConsolidated = activeProjectId === 'consolidated';
  const isCustomConsolidated = activeProjectId?.startsWith('consolidated_view_');

  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleOverdueClick = (type) => {
    const view = type === 'payable' ? 'payables' : 'receivables';
    uiDispatch({ type: 'SET_ACTUALS_VIEW_FILTER', payload: { status: 'overdue' } });
    navigate(`/app/${view}`);
  };

  const userCashAccounts = useMemo(() => {
    if (isConsolidated) {
      return Object.values(allCashAccounts).flat();
    }
    if (isCustomConsolidated) {
        const viewId = activeProjectId.replace('consolidated_view_', '');
        const view = consolidatedViews.find(v => v.id === viewId);
        if (!view || !view.project_ids) return [];
        return view.project_ids.flatMap(id => allCashAccounts[id] || []);
    }
    return allCashAccounts[activeProjectId] || [];
  }, [allCashAccounts, activeProjectId, isConsolidated, isCustomConsolidated, consolidatedViews]);

  const relevantActuals = useMemo(() => {
    if (isConsolidated) {
      return Object.values(allActuals).flat();
    }
    if (isCustomConsolidated) {
        const viewId = activeProjectId.replace('consolidated_view_', '');
        const view = consolidatedViews.find(v => v.id === viewId);
        if (!view || !view.project_ids) return [];
        return view.project_ids.flatMap(id => allActuals[id] || []);
    }
    return allActuals[activeProjectId] || [];
  }, [activeProjectId, allActuals, isConsolidated, isCustomConsolidated, consolidatedViews]);

  const accountBalances = useMemo(() => {
    return userCashAccounts.map(account => {
      let currentBalance = parseFloat(account.initialBalance) || 0;
      const accountPayments = relevantActuals
        .flatMap(actual => (actual.payments || []).filter(p => p.cashAccount === account.id).map(p => ({ ...p, type: actual.type })));
      
      for (const payment of accountPayments) {
        if (payment.type === 'receivable') {
          currentBalance += payment.paidAmount;
        } else if (payment.type === 'payable') {
          currentBalance -= payment.paidAmount;
        }
      }

      const blockedForProvision = relevantActuals
        .filter(actual => actual.isProvision && actual.provisionDetails?.destinationAccountId === account.id && actual.status !== 'paid')
        .reduce((sum, actual) => {
          const paidAmount = (actual.payments || []).reduce((pSum, p) => pSum + p.paidAmount, 0);
          return sum + (actual.amount - paidAmount);
        }, 0);

      return { 
        id: account.id,
        projectId: account.projectId,
        name: account.name,
        mainCategoryId: account.mainCategoryId,
        balance: currentBalance, 
        blockedForProvision, 
        actionableBalance: currentBalance - blockedForProvision,
        isClosed: account.isClosed
      };
    });
  }, [userCashAccounts, relevantActuals]);

  const headerMetrics = useMemo(() => {
    let relevantAccounts;
    let relevantActuals;
    let relevantLoans;
    let relevantEntries;

    if (isConsolidated) {
        relevantAccounts = Object.values(allCashAccounts).flat();
        relevantActuals = Object.values(allActuals).flat();
        relevantLoans = loans || [];
        relevantEntries = Object.values(allEntries).flat();
    } else if (isCustomConsolidated) {
        const viewId = activeProjectId.replace('consolidated_view_', '');
        const view = consolidatedViews.find(v => v.id === viewId);
        const projectIds = view ? view.project_ids : [];
        
        relevantAccounts = projectIds.flatMap(id => allCashAccounts[id] || []);
        relevantActuals = projectIds.flatMap(id => allActuals[id] || []);
        relevantLoans = (loans || []).filter(l => projectIds.includes(l.projectId));
        relevantEntries = projectIds.flatMap(id => allEntries[id] || []);
    } else {
        relevantAccounts = allCashAccounts[activeProjectId] || [];
        relevantActuals = allActuals[activeProjectId] || [];
        relevantLoans = (loans || []).filter(l => l.projectId === activeProjectId);
        relevantEntries = allEntries[activeProjectId] || [];
    }

    const provisionDeposits = relevantActuals
        .filter(actual => actual.isProvision)
        .flatMap(actual => actual.payments || [])
        .reduce((sum, payment) => sum + payment.paidAmount, 0);

    const provisionPayouts = relevantActuals
        .filter(actual => actual.isFinalProvisionPayment)
        .flatMap(actual => actual.payments || [])
        .reduce((sum, payment) => sum + payment.paidAmount, 0);
    
    const totalProvisionsNet = provisionDeposits - provisionPayouts;

    let totalActionableCash = 0;

    relevantAccounts.forEach(account => {
        let currentBalance = parseFloat(account.initialBalance) || 0;
        
        const accountPayments = relevantActuals
            .flatMap(actual => (actual.payments || []).filter(p => p.cashAccount === account.id).map(p => ({ ...p, type: actual.type })));

        for (const payment of accountPayments) {
            if (payment.type === 'receivable') {
                currentBalance += payment.paidAmount;
            } else if (payment.type === 'payable') {
                currentBalance -= payment.paidAmount;
            }
        }
        
        const blockedForProvision = relevantActuals
            .filter(actual => actual.isProvision && actual.provisionDetails?.destinationAccountId === account.id && actual.status !== 'paid')
            .reduce((sum, actual) => {
                const paidAmount = (actual.payments || []).reduce((pSum, p) => pSum + p.paidAmount, 0);
                return sum + (actual.amount - paidAmount);
            }, 0);

        const actionableBalance = currentBalance - blockedForProvision;
        totalActionableCash += actionableBalance;
    });

    const totalSavings = accountBalances
        .filter(acc => acc.mainCategoryId === 'savings')
        .reduce((sum, acc) => sum + acc.balance, 0);

    const today = getTodayInTimezone(settings.timezoneOffset);
    const unpaidStatuses = ['pending', 'partially_paid', 'partially_received'];

    let totalBorrowingPrincipalRemaining = 0;
    let totalLoanPrincipalRemaining = 0;

    relevantLoans.forEach(loan => {
        const projectEntries = allEntries[loan.projectId] || [];
        const projectActuals = allActuals[loan.projectId] || [];

        const repaymentEntry = projectEntries.find(e => e.loanId === loan.id && e.type !== (loan.type === 'borrowing' ? 'revenu' : 'depense'));
        
        let remainingPrincipal = loan.principal;

        if (repaymentEntry) {
            const repaymentActuals = projectActuals.filter(a => a.budgetId === repaymentEntry.id);
            const totalRepaid = repaymentActuals.reduce((sum, actual) => {
                return sum + (actual.payments || []).reduce((pSum, p) => pSum + p.paidAmount, 0);
            }, 0);

            const totalToBePaid = loan.monthlyPayment * loan.term;
            if (totalToBePaid > 0 && totalToBePaid >= loan.principal) {
                const principalRatio = loan.principal / totalToBePaid;
                const principalRepaid = totalRepaid * principalRatio;
                remainingPrincipal = Math.max(0, loan.principal - principalRepaid);
            } else {
                 remainingPrincipal = Math.max(0, loan.principal - totalRepaid);
            }
        }

        if (loan.type === 'borrowing') {
            totalBorrowingPrincipalRemaining += remainingPrincipal;
        } else if (loan.type === 'loan') {
            totalLoanPrincipalRemaining += remainingPrincipal;
        }
    });

    let totalOverduePayables = 0;
    let totalOverdueReceivables = 0;

    relevantActuals.forEach(actual => {
        const isLoanRelated = (loans || []).some(loan => {
             const projectEntries = allEntries[loan.projectId] || [];
             const entry = projectEntries.find(e => e.id === actual.budgetId);
             return entry && entry.loanId === loan.id;
        });

        if (!isLoanRelated && unpaidStatuses.includes(actual.status)) {
            const totalPaid = (actual.payments || []).reduce((pSum, p) => pSum + p.paidAmount, 0);
            const remainingAmount = actual.amount - totalPaid;

            if (remainingAmount > 0 && new Date(actual.date) <= today) {
                if (actual.type === 'payable') {
                    totalOverduePayables += remainingAmount;
                } else if (actual.type === 'receivable') {
                    totalOverdueReceivables += remainingAmount;
                }
            }
        }
    });

    return {
        actionableCash: formatCurrency(totalActionableCash, settings),
        savings: formatCurrency(totalSavings, settings),
        provisions: formatCurrency(totalProvisionsNet, settings),
        overduePayables: formatCurrency(totalOverduePayables, settings),
        overdueReceivables: formatCurrency(totalOverdueReceivables, settings),
        totalDebts: formatCurrency(totalBorrowingPrincipalRemaining, settings),
        totalCredits: formatCurrency(totalLoanPrincipalRemaining, settings),
    };
  }, [activeProjectId, allCashAccounts, allActuals, settings, loans, allEntries, isConsolidated, isCustomConsolidated, consolidatedViews, categories, accountBalances]);

  const activeProjectName = useMemo(() => {
    if (isConsolidated) {
        return 'Consolidé';
    }
    if (isCustomConsolidated) {
        const viewId = activeProjectId.replace('consolidated_view_', '');
        const view = consolidatedViews.find(v => v.id === viewId);
        return view ? view.name : 'Vue Personnalisée';
    }
    const project = projects.find(p => p.id === activeProjectId);
    return project ? project.name : 'Projet';
  }, [activeProjectId, projects, consolidatedViews, isConsolidated, isCustomConsolidated]);

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

  const motionVariants = {
    open: { opacity: 1, height: 'auto', marginTop: '0.5rem' },
    collapsed: { opacity: 0, height: 0, marginTop: '0rem' }
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
            <div className="flex items-center justify-center px-2 py-2 border-b">
              <div className={`w-full transition-all duration-300`}>
                  <div className={`flex items-center gap-2 ${isCollapsed ? 'justify-center' : ''}`} title="Total Cash Actionnable">
                      <Wallet className="w-5 h-5 shrink-0 text-gray-500" />
                      {!isCollapsed && (
                          <div className="flex justify-between items-center w-full">
                              <span className="font-medium text-sm text-text-secondary">Cash actionnable</span>
                              <span className="font-normal text-xs truncate text-gray-500">{headerMetrics.actionableCash}</span>
                          </div>
                      )}
                  </div>
              </div>
            </div>

            {!isCollapsed && (
                <div className="px-2 py-2">
                    <div className="mt-2">
                        <button onClick={() => toggleSection('balances')} className="w-full flex justify-between items-center text-left py-1 text-gray-500 hover:text-gray-800">
                        <span className="text-xs font-bold uppercase tracking-wider">Analyse des Soldes</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${collapsedSections.balances ? '-rotate-90' : ''}`} />
                        </button>
                        <AnimatePresence>
                        {!collapsedSections.balances && (
                            <motion.div initial="collapsed" animate="open" exit="collapsed" variants={motionVariants} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden pl-2 space-y-2">
                            <div className="flex items-center gap-2" title="Total Épargne">
                                <PiggyBank className="w-5 h-5 shrink-0 text-gray-500" />
                                <div className="flex justify-between items-center w-full">
                                    <span className="font-medium text-sm text-text-secondary">Épargne</span>
                                    <span className="font-normal text-xs truncate text-gray-500">{headerMetrics.savings}</span>
                                </div>
                            </div>
                            <button onClick={() => navigate('/app/provisions')} className="w-full text-left rounded-lg transition-colors hover:bg-gray-100">
                                <div className="flex items-center gap-2" title="Total Provisions">
                                    <Lock className="w-5 h-5 shrink-0 text-gray-500" />
                                    <div className="flex justify-between items-center w-full">
                                        <span className="font-medium text-sm text-text-secondary">Provision</span>
                                        <span className="font-normal text-xs truncate text-gray-500">{headerMetrics.provisions}</span>
                                    </div>
                                </div>
                            </button>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </div>

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
                        {!isCollapsed && (
                        <div className="mt-3 px-2">
                            <button 
                            onClick={() => navigate('/app/collaborateurs')}
                            className={`w-full flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50`}
                            >
                            <Settings className="w-4 h-4 shrink-0" />
                            Gérer l'équipe
                            </button>
                        </div>
                        )}
                    </div>

                    <div className="mt-2">
                        <button onClick={() => toggleSection('overdue')} className="w-full flex justify-between items-center text-left py-1 text-gray-500 hover:text-gray-800">
                        <span className="text-xs font-bold uppercase tracking-wider">Suivi des Retards</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${collapsedSections.overdue ? '-rotate-90' : ''}`} />
                        </button>
                        <AnimatePresence>
                        {!collapsedSections.overdue && (
                            <motion.div initial="collapsed" animate="open" exit="collapsed" variants={motionVariants} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden pl-2 space-y-2">
                            <button onClick={() => handleOverdueClick('payable')} className="w-full text-left rounded-lg transition-colors hover:bg-gray-100">
                                <div className="flex items-center gap-2" title="Total des factures fournisseurs dont la date d'échéance est passée">
                                    <FileWarning className="w-5 h-5 shrink-0 text-gray-500" />
                                    <div className="flex justify-between items-center w-full">
                                        <span className="font-medium text-sm text-text-secondary">Fournisseurs</span>
                                        <span className="font-normal text-xs truncate text-gray-500">{headerMetrics.overduePayables}</span>
                                    </div>
                                </div>
                            </button>
                            <button onClick={() => handleOverdueClick('receivable')} className="w-full text-left rounded-lg transition-colors hover:bg-gray-100">
                                <div className="flex items-center gap-2" title="Total des factures clients dont la date d'échéance est passée">
                                    <Hourglass className="w-5 h-5 shrink-0 text-gray-500" />
                                    <div className="flex justify-between items-center w-full">
                                        <span className="font-medium text-sm text-text-secondary">Clients</span>
                                        <span className="font-normal text-xs truncate text-gray-500">{headerMetrics.overdueReceivables}</span>
                                    </div>
                                </div>
                            </button>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </div>
                    <div className="mt-2">
                        <button onClick={() => toggleSection('loans')} className="w-full flex justify-between items-center text-left py-1 text-gray-500 hover:text-gray-800">
                        <span className="text-xs font-bold uppercase tracking-wider">Dettes & Prêts</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${collapsedSections.loans ? '-rotate-90' : ''}`} />
                        </button>
                        <AnimatePresence>
                        {!collapsedSections.loans && (
                            <motion.div initial="collapsed" animate="open" exit="collapsed" variants={motionVariants} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden pl-2 space-y-2">
                            <button onClick={() => navigate('/app/borrowings')} className={`w-full text-left rounded-lg transition-colors hover:bg-gray-100`}>
                                <div className="flex items-center gap-2" title="Gérer vos emprunts">
                                    <Banknote className="w-5 h-5 shrink-0 text-gray-500" />
                                    <div className="flex justify-between items-center w-full">
                                        <span className="font-medium text-sm text-text-secondary">Vos emprunts</span>
                                        <span className="font-normal text-xs truncate text-gray-500">{headerMetrics.totalDebts}</span>
                                    </div>
                                </div>
                            </button>
                            <button onClick={() => navigate('/app/loans')} className={`w-full text-left rounded-lg transition-colors hover:bg-gray-100`}>
                                <div className="flex items-center gap-2" title="Gérer vos prêts">
                                    <Coins className="w-5 h-5 shrink-0 text-gray-500" />
                                    <div className="flex justify-between items-center w-full">
                                        <span className="font-medium text-sm text-text-secondary">Vos prêts</span>
                                        <span className="font-normal text-xs truncate text-gray-500">{headerMetrics.totalCredits}</span>
                                    </div>
                                </div>
                            </button>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </div>
                    <div className="pt-2">
                        <hr className="my-2 border-gray-200" />
                        <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                            <LineChart className="w-4 h-4 text-blue-600" />
                            Tendance de la Trésorerie
                        </h3>
                        <div className="-mx-2">
                            <SparklineChart
                            data={periodPositions.map(p => p.final)}
                            periods={periods}
                            currencySettings={settings}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className={`px-2 pt-2`}>
                <hr className="my-2 border-gray-200" />
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
                <div className={`mt-3 space-y-2 ${isCollapsed ? 'px-0' : 'px-2'}`}>
                <button 
                    onClick={() => navigate('/app/comptes')}
                    className={`w-full flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 disabled:text-gray-400 disabled:cursor-not-allowed ${isCollapsed ? 'justify-center' : ''}`}
                    disabled={isConsolidated || isCustomConsolidated}
                    title={isCollapsed ? 'Ajouter un compte' : ''}
                >
                    <PlusCircle className="w-4 h-4 shrink-0" />
                    {!isCollapsed && 'Ajouter un compte'}
                </button>
                <button 
                    onClick={() => uiDispatch({ type: 'OPEN_TRANSFER_MODAL' })}
                    className={`w-full flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-800 p-2 rounded-lg hover:bg-purple-50 ${isCollapsed ? 'justify-center' : ''}`}
                    title={isCollapsed ? 'Transfert entre comptes' : ''}
                >
                    <ArrowRightLeft className="w-4 h-4 shrink-0" />
                    {!isCollapsed && 'Transfert interne'}
                </button>
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
