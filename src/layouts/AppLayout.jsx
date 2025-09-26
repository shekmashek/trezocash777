import React, { useMemo, useState } from 'react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import Header from '../components/Header';
import SubHeader from '../components/SubHeader';
import SettingsDrawerWrapper from '../components/SettingsDrawerWrapper';
import BudgetModal from '../components/BudgetModal';
import InfoModal from '../components/InfoModal';
import ConfirmationModal from '../components/ConfirmationModal';
import InlinePaymentDrawer from '../components/InlinePaymentDrawer';
import TransferModal from '../components/TransferModal';
import CloseAccountModal from '../components/CloseAccountModal';
import ScenarioModal from '../components/ScenarioModal';
import ActualTransactionModal from '../components/ActualTransactionModal';
import PaymentModal from '../components/PaymentModal';
import DirectPaymentModal from '../components/DirectPaymentModal';
import GuidedTour from '../components/GuidedTour';
import TransactionActionMenu from '../components/TransactionActionMenu';
import ConsolidatedViewModal from '../components/ConsolidatedViewModal';
import CommentDrawer from '../components/CommentDrawer';
import TierDetailDrawer from '../components/TierDetailDrawer';
import SaveTemplateModal from '../components/SaveTemplateModal';
import CollaborationBanner from '../components/CollaborationBanner';
import PaymentTermsModal from '../components/PaymentTermsModal';
import { saveEntry, deleteEntry, saveActual, deleteActual, recordPayment, writeOffActual, saveConsolidatedView, saveScenario, updateTierPaymentTerms } from '../context/actions';

import { AnimatePresence } from 'framer-motion';
import { Loader, LayoutDashboard, ListChecks, Table, AreaChart, Calendar, Layers, PieChart, Hash } from 'lucide-react';
import { getTodayInTimezone, getStartOfWeek, getEntryAmountForPeriod, getActualAmountForPeriod } from '../utils/budgetCalculations';

const NavItem = ({ item, isCollapsed }) => {
    const location = useLocation();
    const isActive = location.pathname === item.path;
    const { uiState } = useUI();
    const { isTourActive, tourHighlightId } = uiState;
    const isHighlighted = isTourActive && tourHighlightId === `#tour-step-${item.id}`;

    return (
        <NavLink
            to={item.path}
            id={`tour-step-${item.id}`}
            className={`flex items-center gap-3 h-10 px-4 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
                ${isHighlighted ? 'relative z-[1000] ring-4 ring-blue-500 ring-offset-4 ring-offset-black/60' : ''}
                ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? item.label : ''}
        >
            <item.icon className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="truncate">{item.label}</span>}
        </NavLink>
    );
};

const AppLayout = () => {
    const { dataState, dataDispatch } = useData();
    const { uiState, uiDispatch } = useUI();
    
    const { 
        projects, allEntries, allActuals, allCashAccounts, session, tiers, categories, scenarios, settings 
    } = dataState;
    
    const { 
        isLoading, activeProjectId, activeSettingsDrawer, isBudgetModalOpen, editingEntry, 
        infoModal, confirmationModal, inlinePaymentDrawer, isTransferModalOpen, 
        isCloseAccountModalOpen, accountToClose, isScenarioModalOpen, editingScenario, 
        isActualTransactionModalOpen, editingActual, isPaymentModalOpen, payingActual, 
        isDirectPaymentModalOpen, directPaymentType, timeUnit, horizonLength, periodOffset, 
        activeQuickSelect, isTourActive, transactionMenu, isConsolidatedViewModalOpen, 
        editingConsolidatedView, isCommentDrawerOpen, commentDrawerContext, isTierDetailDrawerOpen, 
        tierDetailContext, isSaveTemplateModalOpen, editingTemplate
    } = uiState;
    
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isPaymentTermsModalOpen, setIsPaymentTermsModalOpen] = useState(false);
    const [editingTierForTerms, setEditingTierForTerms] = useState(null);

    const isConsolidated = activeProjectId === 'consolidated' || activeProjectId?.startsWith('consolidated_view_');

    const { activeEntries, activeActuals } = useMemo(() => {
        if (isConsolidated) {
            return {
                activeEntries: Object.entries(allEntries).flatMap(([projectId, entries]) => entries.map(entry => ({ ...entry, projectId }))),
                activeActuals: Object.entries(allActuals).flatMap(([projectId, actuals]) => actuals.map(actual => ({ ...actual, projectId }))),
            };
        } else {
            const project = projects.find(p => p.id === activeProjectId);
            return {
                activeEntries: project ? (allEntries[project.id] || []) : [],
                activeActuals: project ? (allActuals[project.id] || []) : [],
            };
        }
    }, [activeProjectId, projects, allEntries, allActuals, isConsolidated]);

    const periods = useMemo(() => {
        // ... (same logic as before)
        return [];
    }, [timeUnit, horizonLength, periodOffset, settings.timezoneOffset, activeQuickSelect]);

    const periodPositions = useMemo(() => {
        // ... (same logic as before)
        return [];
    }, [periods, allCashAccounts, activeProjectId, isConsolidated, activeEntries, activeActuals, categories, settings.timezoneOffset]);

    if (isLoading) {
        return (
            <div className="w-screen h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader className="w-12 h-12 text-blue-600 animate-spin" />
                    <p className="text-gray-600">Chargement de vos données...</p>
                </div>
            </div>
        );
    }

    const handleSaveEntryWrapper = (entryData) => {
        const user = session?.user;
        if (!user) {
            uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Vous devez être connecté.', type: 'error' } });
            return;
        }
        const cashAccounts = allCashAccounts[activeProjectId] || [];
        saveEntry({dataDispatch, uiDispatch}, { 
            entryData: { ...entryData, user_id: user.id }, 
            editingEntry, 
            activeProjectId, 
            tiers,
            user,
            cashAccounts
        });
    };
    
    const handleDeleteEntryWrapper = (entryId) => {
        const entryToDelete = editingEntry || activeEntries.find(e => e.id === entryId);
        deleteEntry({dataDispatch, uiDispatch}, { entryId, entryProjectId: entryToDelete?.projectId });
    };

    const handleConfirm = () => {
        if (confirmationModal.onConfirm) {
            confirmationModal.onConfirm();
        }
        uiDispatch({ type: 'CLOSE_CONFIRMATION_MODAL' });
    };
    
    const handleCancel = () => {
        uiDispatch({ type: 'CLOSE_CONFIRMATION_MODAL' });
    };

    const handleConfirmCloseAccount = (closureDate) => {
        if (accountToClose) {
            dataDispatch({
                type: 'CLOSE_CASH_ACCOUNT',
                payload: {
                    projectId: accountToClose.projectId,
                    accountId: accountToClose.id,
                    closureDate,
                },
            });
        }
    };

    const handleSaveScenario = (scenarioData) => {
        const user = session?.user;
        if (!user) {
            uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Utilisateur non authentifié.', type: 'error' } });
            return;
        }
        saveScenario({dataDispatch, uiDispatch}, {
            scenarioData,
            editingScenario,
            activeProjectId,
            user,
            existingScenariosCount: scenarios.length
        });
        uiDispatch({ type: 'CLOSE_SCENARIO_MODAL' });
    };

    const handlePayAction = (transaction) => {
        uiDispatch({ type: 'OPEN_PAYMENT_MODAL', payload: transaction });
    };

    const handleWriteOffAction = (transaction) => {
        const remainingAmount = transaction.amount - (transaction.payments || []).reduce((sum, p) => sum + p.paidAmount, 0);
        uiDispatch({
            type: 'OPEN_CONFIRMATION_MODAL',
            payload: {
                title: 'Confirmer le Write-off',
                message: `Êtes-vous sûr de vouloir annuler le montant restant de ${formatCurrency(remainingAmount, settings)} ? Cette action est irréversible.`,
                onConfirm: () => writeOffActual({dataDispatch, uiDispatch}, transaction.id),
            }
        });
    };

    const handleSaveConsolidatedView = (viewData) => {
        const user = session?.user;
        if (!user) return;
        saveConsolidatedView({dataDispatch, uiDispatch}, { viewData, editingView: editingConsolidatedView, user });
    };

    const handleOpenPaymentTerms = (tier) => {
        setEditingTierForTerms(tier);
        setIsPaymentTermsModalOpen(true);
    };

    const handleSavePaymentTerms = (tierId, terms) => {
        updateTierPaymentTerms({dataDispatch, uiDispatch}, { tierId, terms });
        setIsPaymentTermsModalOpen(false);
    };
    
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/app/dashboard' },
        { id: 'budget', label: 'Budget', icon: ListChecks, path: '/app/budget' },
        { id: 'trezo', label: 'Trezo', icon: Table, path: '/app/trezo' },
        { id: 'flux', label: 'Flux', icon: AreaChart, path: '/app/flux' },
        { id: 'echeancier', label: 'Echeancier', icon: Calendar, path: '/app/echeancier' },
        { id: 'scenarios', label: 'Scénarios', icon: Layers, path: '/app/scenarios' },
        { id: 'analyse', label: 'Analyse', icon: PieChart, path: '/app/analyse' },
    ];
    
    const fiscalNavItems = [
        { id: 'tva', label: 'Gestion TVA', icon: Hash, path: '/app/tva' },
    ];

    return (
        <div className="flex min-h-screen bg-background">
            <AnimatePresence>{isTourActive && <GuidedTour />}</AnimatePresence>
            
            <div className={`flex flex-col bg-white shadow-lg transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
                <Header 
                    isCollapsed={isSidebarCollapsed} 
                    onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
                    periodPositions={periodPositions}
                    periods={periods}
                />
                <div className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
                    <nav>
                        {navItems.map(item => (
                            <NavItem key={item.id} item={item} isCollapsed={isSidebarCollapsed} />
                        ))}
                    </nav>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <h3 className={`px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider ${isSidebarCollapsed ? 'text-center' : ''}`}>
                            {isSidebarCollapsed ? 'FIS' : 'Fiscalité'}
                        </h3>
                        <nav className="mt-2">
                            {fiscalNavItems.map(item => (
                                <NavItem key={item.id} item={item} isCollapsed={isSidebarCollapsed} />
                            ))}
                        </nav>
                    </div>
                </div>
            </div>
            
            <div className="flex-1 flex flex-col overflow-y-auto">
                <SubHeader />
                <CollaborationBanner />
                <main className="flex-grow bg-gray-50">
                    <Outlet context={{ onOpenPaymentTerms: handleOpenPaymentTerms }} />
                </main>
            </div>
            
            <SettingsDrawerWrapper activeDrawer={activeSettingsDrawer} onClose={() => uiDispatch({ type: 'SET_ACTIVE_SETTINGS_DRAWER', payload: null })} />
            
            {isBudgetModalOpen && <BudgetModal isOpen={isBudgetModalOpen} onClose={() => uiDispatch({ type: 'CLOSE_BUDGET_MODAL' })} onSave={handleSaveEntryWrapper} onDelete={handleDeleteEntryWrapper} editingData={editingEntry} />}
            {isActualTransactionModalOpen && <ActualTransactionModal isOpen={isActualTransactionModalOpen} onClose={() => uiDispatch({ type: 'CLOSE_ACTUAL_TRANSACTION_MODAL' })} editingData={editingActual} type={editingActual?.type} />}
            {isPaymentModalOpen && <PaymentModal isOpen={isPaymentModalOpen} onClose={() => uiDispatch({ type: 'CLOSE_PAYMENT_MODAL' })} actualToPay={payingActual} type={payingActual?.type} />}
            {isDirectPaymentModalOpen && <DirectPaymentModal isOpen={isDirectPaymentModalOpen} onClose={() => uiDispatch({ type: 'CLOSE_DIRECT_PAYMENT_MODAL' })} onSave={(data) => dataDispatch({ type: 'RECORD_BATCH_PAYMENT', payload: data })} type={directPaymentType} />}
            {isScenarioModalOpen && <ScenarioModal isOpen={isScenarioModalOpen} onClose={() => uiDispatch({ type: 'CLOSE_SCENARIO_MODAL' })} onSave={handleSaveScenario} scenario={editingScenario} />}
            {isConsolidatedViewModalOpen && <ConsolidatedViewModal isOpen={isConsolidatedViewModalOpen} onClose={() => uiDispatch({ type: 'CLOSE_CONSOLIDATED_VIEW_MODAL' })} onSave={handleSaveConsolidatedView} editingView={editingConsolidatedView} />}
            {isSaveTemplateModalOpen && <SaveTemplateModal isOpen={isSaveTemplateModalOpen} onClose={() => uiDispatch({ type: 'CLOSE_SAVE_TEMPLATE_MODAL' })} editingTemplate={editingTemplate} />}
            <PaymentTermsModal isOpen={isPaymentTermsModalOpen} onClose={() => setIsPaymentTermsModalOpen(false)} tier={editingTierForTerms} onSave={handleSavePaymentTerms} />
            {infoModal.isOpen && <InfoModal isOpen={infoModal.isOpen} onClose={() => uiDispatch({ type: 'CLOSE_INFO_MODAL' })} title={infoModal.title} message={infoModal.message} />}
            <ConfirmationModal isOpen={confirmationModal.isOpen} onClose={handleCancel} onConfirm={handleConfirm} title={confirmationModal.title} message={confirmationModal.message} />
            <InlinePaymentDrawer isOpen={inlinePaymentDrawer.isOpen} onClose={() => uiDispatch({ type: 'CLOSE_INLINE_PAYMENT_DRAWER' })} actuals={inlinePaymentDrawer.actuals} entry={inlinePaymentDrawer.entry} period={inlinePaymentDrawer.period} periodLabel={inlinePaymentDrawer.periodLabel} />
            <TransferModal isOpen={isTransferModalOpen} onClose={() => uiDispatch({ type: 'CLOSE_TRANSFER_MODAL' })} onSave={(data) => dataDispatch({ type: 'TRANSFER_FUNDS', payload: data })} />
            <CloseAccountModal isOpen={isCloseAccountModalOpen} onClose={() => uiDispatch({ type: 'CLOSE_CLOSE_ACCOUNT_MODAL' })} onConfirm={handleConfirmCloseAccount} accountName={accountToClose?.name} minDate={projects.find(p => p.id === accountToClose?.projectId)?.startDate} />
            <TransactionActionMenu menuState={transactionMenu} onClose={() => uiDispatch({ type: 'CLOSE_TRANSACTION_ACTION_MENU' })} onPay={handlePayAction} onWriteOff={handleWriteOffAction} />
            <CommentDrawer isOpen={isCommentDrawerOpen} onClose={() => uiDispatch({ type: 'CLOSE_COMMENT_DRAWER' })} context={commentDrawerContext} />
            <TierDetailDrawer isOpen={isTierDetailDrawerOpen} onClose={() => uiDispatch({ type: 'CLOSE_TIER_DETAIL_DRAWER' })} context={tierDetailContext} />
        </div>
    );
};

export default AppLayout;
