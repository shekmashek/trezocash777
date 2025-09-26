import React, { createContext, useContext, useReducer } from 'react';
import { v4 as uuidv4 } from 'uuid';

const UIContext = createContext();

const getInitialUIState = () => ({
    activeProjectId: null,
    activeTrezoView: sessionStorage.getItem('activeTrezoView') || 'tableau',
    displayYear: new Date().getFullYear(),
    timeUnit: 'week',
    horizonLength: 6,
    periodOffset: 0,
    activeQuickSelect: null,
    activeSettingsDrawer: null,
    isBudgetModalOpen: false,
    editingEntry: null,
    isOnboarding: false,
    actualsSearchTerm: '',
    actualsViewFilter: null,
    isTourActive: false,
    tourHighlightId: null,
    isLoading: true,
    toasts: [],
    infoModal: { isOpen: false, title: '', message: '' },
    confirmationModal: { isOpen: false, title: '', message: '', onConfirm: () => {} },
    inlinePaymentDrawer: { isOpen: false, actuals: [], entry: null, period: null, periodLabel: '' },
    isTransferModalOpen: false,
    isCloseAccountModalOpen: false,
    accountToClose: null,
    isScenarioModalOpen: false,
    editingScenario: null,
    isActualTransactionModalOpen: false,
    editingActual: null,
    isPaymentModalOpen: false,
    payingActual: null,
    isDirectPaymentModalOpen: false,
    directPaymentType: null,
    isActionPriorityModalOpen: false,
    actionPriorityTransaction: null,
    transactionMenu: { isOpen: false, x: 0, y: 0, transaction: null },
    isConsolidatedViewModalOpen: false,
    editingConsolidatedView: null,
    isCommentDrawerOpen: false,
    commentDrawerContext: null,
    isTierDetailDrawerOpen: false,
    tierDetailContext: null,
    isSaveTemplateModalOpen: false,
    editingTemplate: null,
});

const uiReducer = (state, action) => {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'RESET_UI_STATE':
            const trezoView = state.activeTrezoView;
            return { ...getInitialUIState(), isLoading: false, activeTrezoView: trezoView };
        case 'SET_ACTIVE_PROJECT':
            return { ...state, activeProjectId: action.payload, periodOffset: 0 };
        case 'SET_ACTIVE_TREZO_VIEW':
            sessionStorage.setItem('activeTrezoView', action.payload);
            return { ...state, activeTrezoView: action.payload };
        case 'ADD_TOAST':
            return { ...state, toasts: [...state.toasts, { ...action.payload, id: action.payload.id || uuidv4() }] };
        case 'REMOVE_TOAST':
            return { ...state, toasts: state.toasts.filter(toast => toast.id !== action.payload) };
        case 'OPEN_BUDGET_MODAL':
            return { ...state, isBudgetModalOpen: true, editingEntry: action.payload };
        case 'CLOSE_BUDGET_MODAL':
            return { ...state, isBudgetModalOpen: false, editingEntry: null };
        case 'OPEN_CONFIRMATION_MODAL':
            return { ...state, confirmationModal: { isOpen: true, ...action.payload } };
        case 'CLOSE_CONFIRMATION_MODAL':
            return { ...state, confirmationModal: { ...state.confirmationModal, isOpen: false } };
        case 'START_ONBOARDING':
            return { ...state, isOnboarding: true };
        case 'CANCEL_ONBOARDING':
            return { ...state, isOnboarding: false };
        case 'SET_DISPLAY_YEAR':
            return { ...state, displayYear: action.payload, periodOffset: 0 };
        case 'SET_TIME_UNIT':
            return { ...state, timeUnit: action.payload, periodOffset: 0, activeQuickSelect: null };
        case 'SET_HORIZON_LENGTH':
            return { ...state, horizonLength: action.payload, activeQuickSelect: null };
        case 'SET_PERIOD_OFFSET':
            return { ...state, periodOffset: action.payload, activeQuickSelect: null };
        case 'SET_QUICK_PERIOD': {
            const { timeUnit, horizonLength, periodOffset, activeQuickSelect } = action.payload;
            return { ...state, timeUnit, horizonLength, periodOffset, activeQuickSelect };
        }
        case 'SET_ACTIVE_SETTINGS_DRAWER':
            return { ...state, activeSettingsDrawer: action.payload };
        case 'OPEN_INFO_MODAL':
            return { ...state, infoModal: { isOpen: true, ...action.payload } };
        case 'CLOSE_INFO_MODAL':
            return { ...state, infoModal: { isOpen: false, title: '', message: '' } };
        case 'OPEN_INLINE_PAYMENT_DRAWER':
            return { ...state, inlinePaymentDrawer: { isOpen: true, ...action.payload } };
        case 'CLOSE_INLINE_PAYMENT_DRAWER':
            return { ...state, inlinePaymentDrawer: { ...state.inlinePaymentDrawer, isOpen: false } };
        case 'OPEN_TRANSFER_MODAL':
            return { ...state, isTransferModalOpen: true };
        case 'CLOSE_TRANSFER_MODAL':
            return { ...state, isTransferModalOpen: false };
        case 'OPEN_CLOSE_ACCOUNT_MODAL':
            return { ...state, isCloseAccountModalOpen: true, accountToClose: action.payload };
        case 'CLOSE_CLOSE_ACCOUNT_MODAL':
            return { ...state, isCloseAccountModalOpen: false, accountToClose: null };
        case 'OPEN_SCENARIO_MODAL':
            return { ...state, isScenarioModalOpen: true, editingScenario: action.payload };
        case 'CLOSE_SCENARIO_MODAL':
            return { ...state, isScenarioModalOpen: false, editingScenario: null };
        case 'OPEN_ACTUAL_TRANSACTION_MODAL':
            return { ...state, isActualTransactionModalOpen: true, editingActual: action.payload };
        case 'CLOSE_ACTUAL_TRANSACTION_MODAL':
            return { ...state, isActualTransactionModalOpen: false, editingActual: null };
        case 'OPEN_PAYMENT_MODAL':
            return { ...state, isPaymentModalOpen: true, payingActual: action.payload };
        case 'CLOSE_PAYMENT_MODAL':
            return { ...state, isPaymentModalOpen: false, payingActual: null };
        case 'OPEN_DIRECT_PAYMENT_MODAL':
            return { ...state, isDirectPaymentModalOpen: true, directPaymentType: action.payload };
        case 'CLOSE_DIRECT_PAYMENT_MODAL':
            return { ...state, isDirectPaymentModalOpen: false, directPaymentType: null };
        case 'OPEN_ACTION_PRIORITY_MODAL':
            return { ...state, isActionPriorityModalOpen: true, actionPriorityTransaction: action.payload };
        case 'CLOSE_ACTION_PRIORITY_MODAL':
            return { ...state, isActionPriorityModalOpen: false, actionPriorityTransaction: null };
        case 'OPEN_TRANSACTION_ACTION_MENU':
            return { ...state, transactionMenu: { isOpen: true, ...action.payload } };
        case 'CLOSE_TRANSACTION_ACTION_MENU':
            return { ...state, transactionMenu: { ...state.transactionMenu, isOpen: false } };
        case 'SET_ACTUALS_SEARCH_TERM':
            return { ...state, actualsSearchTerm: action.payload };
        case 'SET_ACTUALS_VIEW_FILTER':
            return { ...state, actualsViewFilter: action.payload };
        case 'START_TOUR':
            return { ...state, isTourActive: true };
        case 'END_TOUR':
            return { ...state, isTourActive: false, tourHighlightId: null };
        case 'SET_TOUR_HIGHLIGHT':
            return { ...state, tourHighlightId: action.payload };
        case 'OPEN_CONSOLIDATED_VIEW_MODAL':
            return { ...state, isConsolidatedViewModalOpen: true, editingConsolidatedView: action.payload };
        case 'CLOSE_CONSOLIDATED_VIEW_MODAL':
            return { ...state, isConsolidatedViewModalOpen: false, editingConsolidatedView: null };
        case 'OPEN_COMMENT_DRAWER':
            return { ...state, isCommentDrawerOpen: true, commentDrawerContext: action.payload };
        case 'CLOSE_COMMENT_DRAWER':
            return { ...state, isCommentDrawerOpen: false, commentDrawerContext: null };
        case 'OPEN_TIER_DETAIL_DRAWER':
            return { ...state, isTierDetailDrawerOpen: true, tierDetailContext: action.payload };
        case 'CLOSE_TIER_DETAIL_DRAWER':
            return { ...state, isTierDetailDrawerOpen: false, tierDetailContext: null };
        case 'OPEN_SAVE_TEMPLATE_MODAL':
            return { ...state, isSaveTemplateModalOpen: true, editingTemplate: action.payload };
        case 'CLOSE_SAVE_TEMPLATE_MODAL':
            return { ...state, isSaveTemplateModalOpen: false, editingTemplate: null };
        case 'TOGGLE_SCENARIO_VISIBILITY':
            // This action modifies data, so it should be in DataContext.
            // For now, leaving it here to avoid breaking things, but it's a candidate for moving.
            // A better approach would be to dispatch a data action from the component.
            return state;
        default:
            return state;
    }
};

export const UIProvider = ({ children }) => {
    const [state, dispatch] = useReducer(uiReducer, getInitialUIState());
    return (
        <UIContext.Provider value={{ uiState: state, uiDispatch: dispatch }}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => useContext(UIContext);
