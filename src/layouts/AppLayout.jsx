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
import TransactionActionMenu from '../components/TransactionActionMenu';
import ConsolidatedViewModal from '../components/ConsolidatedViewModal';
import CommentDrawer from '../components/CommentDrawer';
import TierDetailDrawer from '../components/TierDetailDrawer';
import SaveTemplateModal from '../components/SaveTemplateModal';
import CollaborationBanner from '../components/CollaborationBanner';
import PaymentTermsModal from '../components/PaymentTermsModal';
import { saveEntry, deleteEntry, saveActual, deleteActual, recordPayment, writeOffActual, saveConsolidatedView, saveScenario, updateTierPaymentTerms } from '../context/actions';
import { Loader, Hash } from 'lucide-react';
import { getTodayInTimezone, getStartOfWeek } from '../utils/budgetCalculations';
import { useActiveProjectData, useProcessedEntries, useGroupedData, usePeriodPositions } from '../utils/selectors.jsx';

const NavItem = ({ item, isCollapsed }) => {
    const location = useLocation();
    const isActive = location.pathname === item.path;
    
    return (
        <NavLink
            to={item.path}
            className={`flex items-center gap-3 h-10 px-4 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
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
        projects, allEntries, allActuals, allCashAccounts, session, tiers, categories, scenarios, settings, vatRegimes 
    } = dataState;
    
    const { 
        isLoading, activeProjectId, activeSettingsDrawer, isBudgetModalOpen, editingEntry, 
        infoModal, confirmationModal, inlinePaymentDrawer, isTransferModalOpen, 
        isCloseAccountModalOpen, accountToClose, isScenarioModalOpen, editingScenario, 
        isActualTransactionModalOpen, editingActual, isPaymentModalOpen, payingActual, 
        isDirectPaymentModalOpen, directPaymentType, timeUnit, horizonLength, periodOffset, 
        activeQuickSelect, transactionMenu, isConsolidatedViewModalOpen, 
        editingConsolidatedView, isCommentDrawerOpen, commentDrawerContext, isTierDetailDrawerOpen, 
        tierDetailContext, isSaveTemplateModalOpen, editingTemplate
    } = uiState;
    
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isPaymentTermsModalOpen, setIsPaymentTermsModalOpen] = useState(false);
    const [editingTierForTerms, setEditingTierForTerms] = useState(null);

    const { budgetEntries, actualTransactions, cashAccounts, isConsolidated, isCustomConsolidated } = useActiveProjectData(dataState, uiState);
    
    const periods = useMemo(() => {
        const today = getTodayInTimezone(settings.timezoneOffset);
        let baseDate;
        switch (timeUnit) {
            case 'day': baseDate = new Date(today); baseDate.setHours(0,0,0,0); break;
            case 'week': baseDate = getStartOfWeek(today); break;
            case 'fortnightly': const day = today.getDate(); baseDate = new Date(today.getFullYear(), today.getMonth(), day <= 15 ? 1 : 16); break;
            case 'month': baseDate = new Date(today.getFullYear(), today.getMonth(), 1); break;
            case 'bimonthly': const bimonthStartMonth = Math.floor(today.getMonth() / 2) * 2; baseDate = new Date(today.getFullYear(), bimonthStartMonth, 1); break;
            case 'quarterly': const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3; baseDate = new Date(today.getFullYear(), quarterStartMonth, 1); break;
            case 'semiannually': const semiAnnualStartMonth = Math.floor(today.getMonth() / 6) * 6; baseDate = new Date(today.getFullYear(), semiAnnualStartMonth, 1); break;
            case 'annually': baseDate = new Date(today.getFullYear(), 0, 1); break;
            default: baseDate = getStartOfWeek(today);
        }

        const periodList = [];
        for (let i = 0; i < horizonLength; i++) {
            const periodIndex = i + periodOffset;
            const periodStart = new Date(baseDate);
            switch (timeUnit) {
                case 'day': periodStart.setDate(periodStart.getDate() + periodIndex); break;
                case 'week': periodStart.setDate(periodStart.getDate() + periodIndex * 7); break;
                case 'fortnightly': {
                    const d = new Date(baseDate);
                    let numFortnights = periodIndex;
                    let currentMonth = d.getMonth();
                    let isFirstHalf = d.getDate() === 1;
                    const monthsToAdd = Math.floor(((isFirstHalf ? 0 : 1) + numFortnights) / 2);
                    d.setMonth(currentMonth + monthsToAdd);
                    const newIsFirstHalf = (((isFirstHalf ? 0 : 1) + numFortnights) % 2 + 2) % 2 === 0;
                    d.setDate(newIsFirstHalf ? 1 : 16);
                    periodStart.setTime(d.getTime());
                    break;
                }
                case 'month': periodStart.setMonth(periodStart.getMonth() + periodIndex); break;
                case 'bimonthly': periodStart.setMonth(periodStart.getMonth() + periodIndex * 2); break;
                case 'quarterly': periodStart.setMonth(periodStart.getMonth() + periodIndex * 3); break;
                case 'semiannually': periodStart.setMonth(periodStart.getMonth() + periodIndex * 6); break;
                case 'annually': periodStart.setFullYear(periodStart.getFullYear() + periodIndex); break;
            }
            periodList.push(periodStart);
        }

        return periodList.map((periodStart) => {
            const periodEnd = new Date(periodStart);
            switch (timeUnit) {
                case 'day': periodEnd.setDate(periodEnd.getDate() + 1); break;
                case 'week': periodEnd.setDate(periodEnd.getDate() + 7); break;
                case 'fortnightly': if (periodStart.getDate() === 1) { periodEnd.setDate(16); } else { periodEnd.setMonth(periodEnd.getMonth() + 1); periodEnd.setDate(1); } break;
                case 'month': periodEnd.setMonth(periodEnd.getMonth() + 1); break;
                case 'bimonthly': periodEnd.setMonth(periodEnd.getMonth() + 2); break;
                case 'quarterly': periodEnd.setMonth(periodEnd.getMonth() + 3); break;
                case 'semiannually': periodEnd.setMonth(periodEnd.getMonth() + 6); break;
                case 'annually': periodEnd.setFullYear(periodEnd.getFullYear() + 1); break;
            }
            const year = periodStart.toLocaleDateString('fr-FR', { year: '2-digit' });
            const monthsShort = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
            let label = '';
            switch (timeUnit) {
                case 'day':
                    if (activeQuickSelect === 'week') {
                        const dayLabel = periodStart.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
                        label = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);
                    } else {
                        label = periodStart.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
                    }
                    break;
                case 'week': label = `S ${periodStart.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}`; break;
                case 'fortnightly': const fortnightNum = periodStart.getDate() === 1 ? '1' : '2'; label = `${fortnightNum}Q-${monthsShort[periodStart.getMonth()]}'${year}`; break;
                case 'month': label = `${periodStart.toLocaleString('fr-FR', { month: 'short' })} '${year}`; break;
                case 'bimonthly': const startMonthB = monthsShort[periodStart.getMonth()]; const endMonthB = monthsShort[(periodStart.getMonth() + 1) % 12]; label = `${startMonthB}-${endMonthB}`; break;
                case 'quarterly': const quarter = Math.floor(periodStart.getMonth() / 3) + 1; label = `T${quarter} '${year}`; break;
                case 'semiannually': const semester = Math.floor(periodStart.getMonth() / 6) + 1; label = `S${semester} '${year}`; break;
                case 'annually': label = String(periodStart.getFullYear()); break;
            }
            return { label, startDate: periodStart, endDate: periodEnd };
        });
    }, [timeUnit, horizonLength, periodOffset, activeQuickSelect, settings.timezoneOffset]);

    const processedEntries = useProcessedEntries(budgetEntries, categories, vatRegimes, activeProjectId, periods, isConsolidated, isCustomConsolidated);
    const groupedData = useGroupedData(processedEntries, categories);
    const hasOffBudgetRevenues = useMemo(() => processedEntries.some(e => e.isOffBudget && e.type === 'revenu'), [processedEntries]);
    const hasOffBudgetExpenses = useMemo(() => processedEntries.some(e => e.isOffBudget && e.type === 'depense'), [processedEntries]);
    const periodPositions = usePeriodPositions(periods, cashAccounts, actualTransactions, groupedData, hasOffBudgetRevenues, hasOffBudgetExpenses, settings, processedEntries);

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
        const targetProjectId = entryData.projectId || activeProjectId;
        const cashAccountsForEntry = allCashAccounts[targetProjectId] || [];
        saveEntry({dataDispatch, uiDispatch}, { 
            entryData: { ...entryData, user_id: user.id }, 
            editingEntry, 
            activeProjectId: targetProjectId, 
            tiers,
            user,
            cashAccounts: cashAccountsForEntry
        });
    };
    
    const handleDeleteEntryWrapper = (entryId) => {
        const entryToDelete = budgetEntries.find(e => e.id === entryId);
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
    
    const fiscalNavItems = [
        { id: 'tva', label: 'Gestion TVA', icon: Hash, path: '/app/tva' },
    ];

    return (
        <div className="flex min-h-screen bg-background">
            <div className={`flex flex-col bg-white shadow-lg transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
                <Header 
                    isCollapsed={isSidebarCollapsed} 
                    onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
                    periodPositions={periodPositions}
                    periods={periods}
                />
                <div className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
                    <div className="border-t border-gray-200 pt-4">
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
