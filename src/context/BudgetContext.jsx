import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../utils/supabase';
import { saveEntry, updateSettings, updateUserCashAccount, recordPayment } from '../context/actions';

// --- Helper Functions & Constants ---

// --- Initial State Definition ---
const getDefaultExpenseTargets = () => ({
  'exp-main-1': 20, // Exploitation (le reste, calculé)
  'exp-main-2': 35, // Masse Salariale
  'exp-main-3': 10, // Investissement
  'exp-main-4': 0,  // Financement
  'exp-main-5': 10, // Épargne
  'exp-main-6': 5,  // Exceptionnel
  'exp-main-7': 10, // Impôts et Taxes
  'exp-main-8': 5,  // Formation
  'exp-main-9': 5,  // Innovation, Recherche et développement
  'exp-main-10': 0, // Personnel
});

const createDefaultCashAccount = (projectId) => ({
    id: uuidv4(),
    projectId,
    mainCategoryId: 'cash',
    name: 'Caisse Espèce',
    initialBalance: 0,
    initialBalanceDate: new Date().toISOString().split('T')[0],
    isClosed: false,
    closureDate: null,
});

const initialCategories = {
  revenue: [
    { id: 'rev-main-1', name: 'Entrées des Ventes', isFixed: true, subCategories: [{ id: 'rev-sub-1-1', name: 'Ventes de produits' }, { id: 'rev-sub-1-2', name: 'Ventes de services' }] },
    { id: 'rev-main-2', name: 'Entrées Financières', isFixed: true, subCategories: [
        { id: 'rev-sub-2-1', name: 'Intérêts perçus' }, 
        { id: 'rev-sub-2-2', name: 'Réception Emprunt' },
        { id: 'rev-sub-2-3', name: 'Remboursement de prêt reçu' },
        { id: 'rev-sub-2-4', name: 'Intérêts de prêt reçus' },
    ] },
    { id: 'rev-main-3', name: 'Autres Entrées', isFixed: true, subCategories: [
        { id: 'rev-sub-3-1', name: 'Subventions' }, 
        { id: 'rev-sub-3-2', name: 'Revenus Exceptionnels'},
        { id: 'rev-sub-3-3', name: 'Crédit de TVA', isFixed: true }
    ] },
  ],
  expense: [
    { id: 'exp-main-1', name: 'Exploitation', isFixed: true, subCategories: [
        { id: 'exp-sub-1-1', name: 'Loyer et charges' }, 
        { id: 'exp-sub-1-2', name: 'Fournitures de bureau' }, 
        { id: 'exp-sub-1-3', name: 'Marketing et publicité' }, 
        { id: 'exp-sub-1-4', name: 'Frais de déplacement' },
        { id: 'exp-sub-1-5', name: 'Frais administratives et de gestion' },
        { id: 'exp-sub-1-6', name: 'Frais de transport' },
        { id: 'exp-sub-1-7', name: 'Entretien, réparation et maintenance' },
        { id: 'exp-sub-1-8', name: 'Recherche et développement' },
        { id: 'exp-sub-1-9', name: 'Petit équipement' }
    ] },
    { id: 'exp-main-2', name: 'Masse Salariale', isFixed: true, subCategories: [{ id: 'exp-sub-2-1', name: 'Salaires et traitements' }, { id: 'exp-sub-2-2', name: 'Charges sociales' }] },
    { id: 'exp-main-3', name: 'Investissement', isFixed: true, subCategories: [
        { id: 'exp-sub-3-1', name: 'Investissements financiers' },
        { id: 'exp-sub-3-2', name: 'Investissements immobiliers' },
        { id: 'exp-sub-3-3', name: 'Investissement dans sa propre entreprise' },
        { id: 'exp-sub-3-4', name: 'Autres investissements' }
    ] },
    { id: 'exp-main-4', name: 'Financement', isFixed: true, subCategories: [
        { id: 'exp-sub-4-1', name: 'Octroi de Prêt' },
        { id: 'exp-sub-4-2', name: "Remboursement d'emprunt" }, 
        { id: 'exp-sub-4-3', name: "Intérêts d'emprunt" },
    ] },
    { id: 'exp-main-5', name: 'Épargne', isFixed: true, subCategories: [
        { id: 'exp-sub-5-1', name: 'Provision pour risques' },
        { id: 'exp-sub-5-2', name: "Fond d'urgence" },
        { id: 'exp-sub-5-3', name: 'Epargne Projet à court et moyen termes' },
        { id: 'exp-sub-5-4', name: 'Epargne retraite' },
    ] },
    { id: 'exp-main-6', name: 'Exceptionnel', isFixed: true, subCategories: [{ id: 'exp-sub-6-1', name: 'Amendes' }] },
    { id: 'exp-main-7', name: 'Impôts et Taxes', isFixed: true, subCategories: [
        { id: 'exp-sub-7-1', name: 'Impôt sur les sociétés', isFixed: false },
        { id: 'exp-sub-7-2', name: 'TVA collectée', isFixed: true },
        { id: 'exp-sub-7-3', name: 'TVA déductible', isFixed: true },
        { id: 'exp-sub-7-4', name: 'Autres taxes', isFixed: false },
        { id: 'exp-sub-7-5', name: 'TVA à payer', isFixed: true }
    ] },
    { id: 'exp-main-8', name: 'Formation', isFixed: true, subCategories: [
        { id: 'exp-sub-8-1', name: 'Matériel' },
        { id: 'exp-sub-8-2', name: 'Livres' },
        { id: 'exp-sub-8-3', name: 'Logiciels' },
        { id: 'exp-sub-8-4', name: 'Abonnement' },
        { id: 'exp-sub-8-5', name: 'Ateliers pratiques' },
        { id: 'exp-sub-8-6', name: 'Formations certifiantes' },
        { id: 'exp-sub-8-7', name: 'Stage' },
    ] },
    { id: 'exp-main-9', name: 'Innovation, Recherche et développement', isFixed: true, subCategories: [] },
    { id: 'exp-main-10', name: 'Personnel', isFixed: true, subCategories: [
        { id: 'exp-sub-10-1', name: 'Logement' },
        { id: 'exp-sub-10-2', name: 'Eau et Electricité' },
        { id: 'exp-sub-10-3', name: 'Frais de réparation et entretien' },
        { id: 'exp-sub-10-4', name: 'Décoration et ameublement' },
        { id: 'exp-sub-10-5', name: 'Frais de nettoyage' },
        { id: 'exp-sub-10-6', name: 'Nourriture & alimentation' },
        { id: 'exp-sub-10-7', name: 'Transports et déplacement' },
        { id: 'exp-sub-10-8', name: 'Santé et bien etre' },
        { id: 'exp-sub-10-9', name: 'Communication et divertissement' },
        { id: 'exp-sub-10-10', name: 'Enfant et education' },
        { id: 'exp-sub-10-11', name: 'Habillement & Textile' },
        { id: 'exp-sub-10-12', name: 'Assurance divers' },
        { id: 'exp-sub-10-13', name: 'Impots & obligation fiscales' },
        { id: 'exp-sub-10-14', name: 'DIvers et imprévus' },
    ] },
    { id: 'exp-main-11', name: 'Loisirs et plaisirs', isFixed: true, subCategories: [
        { id: 'exp-sub-11-1', name: 'Sorties et restaurants' },
        { id: 'exp-sub-11-2', name: 'Abonnement digitaux' },
        { id: 'exp-sub-11-3', name: 'Hobbies et passion' },
        { id: 'exp-sub-11-4', name: 'Shopping' },
        { id: 'exp-sub-11-5', name: 'Soins personnel' },
    ]},
    { id: 'exp-main-12', name: 'Dons et cadeaux', isFixed: true, subCategories: [
        { id: 'exp-sub-12-1', name: 'Cadeaux pour occasions' },
        { id: 'exp-sub-12-2', name: 'Célébration' },
        { id: 'exp-sub-12-3', name: 'Charité' },
    ]},
    { id: 'exp-main-13', name: 'Achat pour revente', isFixed: true, subCategories: [
        { id: 'exp-sub-13-1', name: 'Matière premiere' },
        { id: 'exp-sub-13-2', name: 'Marchandises' },
        { id: 'exp-sub-13-3', name: 'Emballage' },
        { id: 'exp-sub-13-4', name: 'Etude et prestation de service' },
        { id: 'exp-sub-13-5', name: 'Equipement et travaux' },
    ]},
  ]
};

const initialSettings = { 
  displayUnit: 'standard',
  decimalPlaces: 2,
  currency: '€',
  exchangeRates: {},
  timezoneOffset: 0,
};

export const mainCashAccountCategories = [
  { id: 'bank', name: 'Comptes Bancaires' },
  { id: 'cash', name: 'Cash / Espèce' },
  { id: 'mobileMoney', name: 'Mobile Money' },
  { id: 'savings', name: 'Épargne' },
  { id: 'provisions', name: 'Provisions' },
];

const CONSOLIDATED_PROJECT_ID = 'consolidated';
const SCENARIO_COLORS = ['#8b5cf6', '#f97316', '#d946ef']; // violet, orange, fuchsia

const getInitialState = () => ({
    session: null,
    profile: null,
    allProfiles: [],
    projects: [],
    categories: initialCategories,
    allEntries: {},
    allActuals: {},
    allCashAccounts: {},
    tiers: [],
    settings: initialSettings,
    scenarios: [],
    scenarioEntries: {},
    loans: [],
    allComments: {},
    isCommentDrawerOpen: false,
    commentDrawerContext: null,
    isTierDetailDrawerOpen: false,
    tierDetailContext: null,
    consolidatedViews: [],
    collaborators: [],
    templates: [],
    vatRates: {},
    vatRegimes: {},
    isSaveTemplateModalOpen: false,
    editingTemplate: null,
    infoModal: { isOpen: false, title: '', message: '' },
    confirmationModal: { isOpen: false, title: '', message: '', onConfirm: () => {} },
    inlinePaymentDrawer: { isOpen: false, actuals: [], entry: null, period: null, periodLabel: '' },
    toasts: [],
    isTransferModalOpen: false,
    isCloseAccountModalOpen: false,
    accountToClose: null,
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
    activeProjectId: null,
    activeTrezoView: sessionStorage.getItem('activeTrezoView') || 'tableau',
    displayYear: new Date().getFullYear(),
    timeUnit: 'week',
    horizonLength: 6,
    periodOffset: 0,
    activeSettingsDrawer: null,
    isBudgetModalOpen: false,
    editingEntry: null,
    isOnboarding: false,
    actualsSearchTerm: '',
    actualsViewFilter: null,
    activeQuickSelect: null,
    isTourActive: false,
    tourHighlightId: null,
    isLoading: true,
});

// --- Reducer Function ---
const budgetReducer = (state, action) => {
  switch (action.type) {
    case 'SET_SESSION':
      if (!action.payload) { // If session is null (logout)
        return { ...getInitialState(), isLoading: false, session: null };
      }
      return { ...state, session: action.payload };
    case 'SET_PROFILE':
      return { ...state, profile: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'RESET_STATE':
        return { ...getInitialState(), isLoading: false };
    case 'SET_INITIAL_DATA':
        return {
            ...state,
            ...action.payload,
            allProfiles: action.payload.allProfiles || [],
            isLoading: false,
            isOnboarding: action.payload.projects.length === 0,
            activeProjectId: state.activeProjectId || (action.payload.projects.length > 0 ? 'consolidated' : null),
        };
    case 'SET_ACTIVE_TREZO_VIEW':
        sessionStorage.setItem('activeTrezoView', action.payload);
        return { ...state, activeTrezoView: action.payload };
    case 'SET_PROJECT_VAT_RATES': {
        const { projectId, rates } = action.payload;
        const newVatRates = { ...state.vatRates };
        newVatRates[projectId] = rates;
        return {
            ...state,
            vatRates: newVatRates,
        };
    }
    case 'SET_PROJECT_VAT_REGIME': {
        const { projectId, regime } = action.payload;
        const newVatRegimes = { ...state.vatRegimes };
        newVatRegimes[projectId] = regime;
        return {
            ...state,
            vatRegimes: newVatRegimes,
        };
    }
    case 'OPEN_COMMENT_DRAWER':
        return { ...state, isCommentDrawerOpen: true, commentDrawerContext: action.payload };
    case 'CLOSE_COMMENT_DRAWER':
        return { ...state, isCommentDrawerOpen: false, commentDrawerContext: null };
    case 'OPEN_TIER_DETAIL_DRAWER':
        return { ...state, isTierDetailDrawerOpen: true, tierDetailContext: action.payload };
    case 'CLOSE_TIER_DETAIL_DRAWER':
        return { ...state, isTierDetailDrawerOpen: false, tierDetailContext: null };
    case 'ADD_COMMENT_SUCCESS': {
        const { newComment } = action.payload;
        const projectId = newComment.projectId === null ? state.activeProjectId : newComment.projectId;
        const oldProjectComments = state.allComments[projectId] || [];
        const newProjectComments = [...oldProjectComments, newComment];
        return {
            ...state,
            allComments: {
                ...state.allComments,
                [projectId]: newProjectComments,
            }
        };
    }
    case 'INVITE_COLLABORATOR_SUCCESS':
        return { ...state, collaborators: [...state.collaborators, action.payload] };
    case 'REVOKE_COLLABORATOR_SUCCESS':
        return { ...state, collaborators: state.collaborators.filter(c => c.id !== action.payload) };
    case 'ACCEPT_INVITE_SUCCESS': {
        const acceptedInvite = action.payload;
        return {
            ...state,
            collaborators: state.collaborators.map(c => 
                c.id === acceptedInvite.id ? acceptedInvite : c
            ),
        };
    }
    case 'UPDATE_PROFILE_NOTIFICATIONS':
        return {
            ...state,
            profile: {
                ...state.profile,
                notifications: action.payload,
            },
        };
    case 'OPEN_TRANSACTION_ACTION_MENU':
      return { ...state, transactionMenu: { isOpen: true, ...action.payload } };
    case 'CLOSE_TRANSACTION_ACTION_MENU':
      return { ...state, transactionMenu: { ...state.transactionMenu, isOpen: false } };
    case 'OPEN_ACTION_PRIORITY_MODAL':
      return { ...state, isActionPriorityModalOpen: true, actionPriorityTransaction: action.payload };
    case 'CLOSE_ACTION_PRIORITY_MODAL':
      return { ...state, isActionPriorityModalOpen: false, actionPriorityTransaction: null };
    case 'START_TOUR':
      return { ...state, isTourActive: true };
    case 'END_TOUR':
      return { ...state, isTourActive: false, tourHighlightId: null };
    case 'SET_TOUR_HIGHLIGHT':
      return { ...state, tourHighlightId: action.payload };
    case 'OPEN_DIRECT_PAYMENT_MODAL':
      return { ...state, isDirectPaymentModalOpen: true, directPaymentType: action.payload };
    case 'CLOSE_DIRECT_PAYMENT_MODAL':
      return { ...state, isDirectPaymentModalOpen: false, directPaymentType: null };
    case 'RECORD_BATCH_PAYMENT_SUCCESS': {
        const updatedActuals = action.payload;
        const newAllActuals = JSON.parse(JSON.stringify(state.allActuals));

        updatedActuals.forEach(updatedActual => {
            const projectActuals = newAllActuals[updatedActual.project_id];
            if (projectActuals) {
                const index = projectActuals.findIndex(a => a.id === updatedActual.id);
                if (index > -1) {
                    projectActuals[index].status = updatedActual.status;
                    projectActuals[index].payments = updatedActual.payments;
                }
            }
        });
        
        return {
            ...state,
            allActuals: newAllActuals,
        };
    }
    case 'OPEN_ACTUAL_TRANSACTION_MODAL':
      return { ...state, isActualTransactionModalOpen: true, editingActual: action.payload };
    case 'CLOSE_ACTUAL_TRANSACTION_MODAL':
      return { ...state, isActualTransactionModalOpen: false, editingActual: null };
    case 'OPEN_PAYMENT_MODAL':
      return { ...state, isPaymentModalOpen: true, payingActual: action.payload };
    case 'CLOSE_PAYMENT_MODAL':
      return { ...state, isPaymentModalOpen: false, payingActual: null };
    case 'WRITE_OFF_ACTUAL_SUCCESS': {
        const updatedActual = action.payload;
        const newAllActuals = JSON.parse(JSON.stringify(state.allActuals));
        const projectActuals = newAllActuals[updatedActual.project_id];
        if(projectActuals) {
            const index = projectActuals.findIndex(a => a.id === updatedActual.id);
            if (index > -1) {
                projectActuals[index] = {
                    ...projectActuals[index],
                    status: updatedActual.status,
                    description: updatedActual.description,
                };
            }
        }
        return { ...state, allActuals: newAllActuals };
    }
    case 'OPEN_SCENARIO_MODAL':
      return { ...state, isScenarioModalOpen: true, editingScenario: action.payload };
    case 'CLOSE_SCENARIO_MODAL':
      return { ...state, isScenarioModalOpen: false, editingScenario: null };
    case 'SET_ACTUALS_VIEW_FILTER':
      return { ...state, actualsViewFilter: action.payload };
    case 'ADD_LOAN_SUCCESS': {
        const { newLoan, principalEntry, repaymentEntry, principalActuals, repaymentActuals, newTier } = action.payload;
        const projectId = newLoan.projectId;

        const newAllEntries = JSON.parse(JSON.stringify(state.allEntries));
        if (!newAllEntries[projectId]) newAllEntries[projectId] = [];
        newAllEntries[projectId].push(principalEntry, repaymentEntry);
        
        const newAllActuals = JSON.parse(JSON.stringify(state.allActuals));
        if (!newAllActuals[projectId]) newAllActuals[projectId] = [];
        newAllActuals[projectId].push(...principalActuals, ...repaymentActuals);

        let newTiers = state.tiers;
        if (newTier) {
            if (!state.tiers.some(t => t.id === newTier.id)) {
                newTiers = [...state.tiers, newTier];
            }
        }

        return {
            ...state,
            loans: [...state.loans, newLoan],
            allEntries: newAllEntries,
            allActuals: newAllActuals,
            tiers: newTiers,
        };
    }
    case 'UPDATE_LOAN_SUCCESS': {
        const { updatedLoan, principalEntry, repaymentEntry, principalActuals, repaymentActuals } = action.payload;
        const projectId = updatedLoan.projectId;

        const tempLoans = state.loans.filter(l => l.id !== updatedLoan.id);
        
        const tempAllEntries = { ...state.allEntries };
        tempAllEntries[projectId] = (tempAllEntries[projectId] || []).filter(e => e.loanId !== updatedLoan.id);
        tempAllEntries[projectId].push(principalEntry, repaymentEntry);

        const tempAllActuals = { ...state.allActuals };
        tempAllActuals[projectId] = (tempAllEntries[projectId] || []).filter(a => {
            const entry = (state.allEntries[projectId] || []).find(e => e.id === a.budgetId);
            return !entry || entry.loanId !== updatedLoan.id;
        });
        tempAllActuals[projectId].push(...principalActuals, ...repaymentActuals);

        return {
            ...state,
            loans: [...tempLoans, updatedLoan],
            allEntries: tempAllEntries,
            allActuals: tempAllActuals,
        };
    }
    case 'DELETE_LOAN_SUCCESS': {
        const loanId = action.payload;
        const loanToDelete = state.loans.find(l => l.id === loanId);
        if (!loanToDelete) return state;

        const projectId = loanToDelete.projectId;
        const newLoans = state.loans.filter(l => l.id !== loanId);
        
        const newAllEntries = { ...state.allEntries };
        newAllEntries[projectId] = (newAllEntries[projectId] || []).filter(e => e.loanId !== loanId);

        const newAllActuals = { ...state.allActuals };
        newAllActuals[projectId] = (newAllActuals[projectId] || []).filter(a => {
            const entry = (state.allEntries[projectId] || []).find(e => e.id === a.budgetId);
            return !entry || entry.loanId !== loanId;
        });

        return {
            ...state,
            loans: newLoans,
            allEntries: newAllEntries,
            allActuals: newAllActuals,
        };
    }
    case 'OPEN_CLOSE_ACCOUNT_MODAL':
      return { ...state, isCloseAccountModalOpen: true, accountToClose: action.payload };
    case 'CLOSE_CLOSE_ACCOUNT_MODAL':
      return { ...state, isCloseAccountModalOpen: false, accountToClose: null };
    case 'OPEN_TRANSFER_MODAL':
      return { ...state, isTransferModalOpen: true };
    case 'CLOSE_TRANSFER_MODAL':
      return { ...state, isTransferModalOpen: false };
    case 'TRANSFER_FUNDS_SUCCESS': {
      const { debitActual, creditActual } = action.payload;
      const newAllActuals = JSON.parse(JSON.stringify(state.allActuals));

      if (!newAllActuals[debitActual.projectId]) newAllActuals[debitActual.projectId] = [];
      newAllActuals[debitActual.projectId].push(debitActual);

      if (!newAllActuals[creditActual.projectId]) newAllActuals[creditActual.projectId] = [];
      newAllActuals[creditActual.projectId].push(creditActual);

      return {
        ...state,
        allActuals: newAllActuals,
        isTransferModalOpen: false,
      };
    }
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [...state.toasts, { ...action.payload, id: action.payload.id || uuidv4() }],
      };
    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter(toast => toast.id !== action.payload),
      };
    case 'SET_ACTUALS_SEARCH_TERM':
      return { ...state, actualsSearchTerm: action.payload };
    case 'SET_ACTIVE_PROJECT': {
      const newProjectId = action.payload;
      return { 
        ...state, 
        activeProjectId: newProjectId, 
        periodOffset: 0,
      };
    }
    case 'SET_ACTIVE_SETTINGS_DRAWER':
      return { ...state, activeSettingsDrawer: action.payload };
    case 'OPEN_BUDGET_MODAL':
      return { ...state, isBudgetModalOpen: true, editingEntry: action.payload };
    case 'CLOSE_BUDGET_MODAL':
      return { ...state, isBudgetModalOpen: false, editingEntry: null };
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
    
    // --- Onboarding ---
    case 'START_ONBOARDING':
      return { ...state, isOnboarding: true };
    case 'CANCEL_ONBOARDING':
      return { ...state, isOnboarding: false };

    // --- Info Modal ---
    case 'OPEN_INFO_MODAL':
      return { ...state, infoModal: { isOpen: true, ...action.payload } };
    case 'CLOSE_INFO_MODAL':
      return { ...state, infoModal: { isOpen: false, title: '', message: '' } };

    // --- Confirmation Modal ---
    case 'OPEN_CONFIRMATION_MODAL':
      return {
        ...state,
        confirmationModal: {
          isOpen: true,
          title: action.payload.title,
          message: action.payload.message,
          onConfirm: action.payload.onConfirm,
        },
      };
    case 'CLOSE_CONFIRMATION_MODAL':
      return {
        ...state,
        confirmationModal: {
          isOpen: false,
          title: '',
          message: '',
          onConfirm: () => {},
        },
      };

    // --- Scenarios ---
    case 'OPEN_CONSOLIDATED_VIEW_MODAL':
      return { ...state, isConsolidatedViewModalOpen: true, editingConsolidatedView: action.payload };
    case 'CLOSE_CONSOLIDATED_VIEW_MODAL':
      return { ...state, isConsolidatedViewModalOpen: false, editingConsolidatedView: null };
    case 'ADD_CONSOLIDATED_VIEW_SUCCESS':
      return { ...state, consolidatedViews: [...state.consolidatedViews, action.payload] };
    case 'UPDATE_CONSOLIDATED_VIEW_SUCCESS':
      return {
        ...state,
        consolidatedViews: state.consolidatedViews.map(v => v.id === action.payload.id ? action.payload : v),
      };
    case 'DELETE_CONSOLIDATED_VIEW_SUCCESS':
      return {
        ...state,
        consolidatedViews: state.consolidatedViews.filter(v => v.id !== action.payload),
      };
    case 'ADD_SCENARIO_SUCCESS': {
        const newScenario = action.payload;
        return {
            ...state,
            scenarios: [...state.scenarios, newScenario],
            scenarioEntries: { ...state.scenarioEntries, [newScenario.id]: [] },
        };
    }
    case 'UPDATE_SCENARIO_SUCCESS': {
      const updatedScenario = action.payload;
      return {
        ...state,
        scenarios: state.scenarios.map(s => s.id === updatedScenario.id ? updatedScenario : s),
      };
    }
    case 'TOGGLE_SCENARIO_VISIBILITY': {
      const scenarioId = action.payload;
      return {
        ...state,
        scenarios: state.scenarios.map(s =>
          s.id === scenarioId ? { ...s, isVisible: !s.isVisible } : s
        ),
      };
    }
    case 'ARCHIVE_SCENARIO_SUCCESS': {
      const scenarioId = action.payload;
      return {
        ...state,
        scenarios: state.scenarios.map(s => s.id === scenarioId ? { ...s, isArchived: true } : s),
      };
    }
    case 'RESTORE_SCENARIO_SUCCESS': {
      const scenarioId = action.payload;
      return {
        ...state,
        scenarios: state.scenarios.map(s => s.id === scenarioId ? { ...s, isArchived: false } : s),
      };
    }
    case 'DELETE_SCENARIO_SUCCESS': {
      const scenarioId = action.payload;
      const newScenarios = state.scenarios.filter(s => s.id !== scenarioId);
      const newScenarioEntries = { ...state.scenarioEntries };
      delete newScenarioEntries[scenarioId];
      return { ...state, scenarios: newScenarios, scenarioEntries: newScenarioEntries };
    }
    case 'SAVE_SCENARIO_ENTRY_SUCCESS': {
      const { scenarioId, savedEntry } = action.payload;
      const newScenarioEntries = JSON.parse(JSON.stringify(state.scenarioEntries));
      const scenarioDeltas = newScenarioEntries[scenarioId] || [];
      const index = scenarioDeltas.findIndex(e => e.id === savedEntry.id);
      if (index > -1) {
        scenarioDeltas[index] = savedEntry;
      } else {
        scenarioDeltas.push(savedEntry);
      }
      newScenarioEntries[scenarioId] = scenarioDeltas;
      return { ...state, scenarioEntries: newScenarioEntries };
    }
    case 'DELETE_SCENARIO_ENTRY_SUCCESS': {
      const { scenarioId, entryId } = action.payload;
      const newScenarioEntries = { ...state.scenarioEntries };
      const scenarioDeltas = newScenarioEntries[scenarioId] || [];
      newScenarioEntries[scenarioId] = scenarioDeltas.filter(e => e.id !== entryId);
      return { ...state, scenarioEntries: newScenarioEntries };
    }

    case 'INITIALIZE_PROJECT_SUCCESS': {
        const { newProject, finalCashAccounts, newAllEntries, newAllActuals, newTiers, newLoans, newCategories } = action.payload;
        return {
            ...state,
            projects: [...state.projects, newProject],
            allEntries: { ...state.allEntries, [newProject.id]: newAllEntries },
            allActuals: { ...state.allActuals, [newProject.id]: newAllActuals },
            allCashAccounts: { ...state.allCashAccounts, [newProject.id]: finalCashAccounts },
            tiers: newTiers,
            loans: [...state.loans, ...newLoans],
            categories: newCategories || state.categories,
            activeProjectId: newProject.id,
            isOnboarding: false,
        };
    }
    
    case 'UPDATE_PROJECT_SETTINGS_SUCCESS': {
      const { projectId, newSettings } = action.payload;
      return {
        ...state,
        projects: state.projects.map(p => p.id === projectId ? { ...p, ...newSettings } : p),
      };
    }
    case 'ARCHIVE_PROJECT_SUCCESS': {
      const projectId = action.payload;
      return {
        ...state,
        projects: state.projects.map(p => p.id === projectId ? { ...p, isArchived: true } : p),
        activeProjectId: state.activeProjectId === projectId ? CONSOLIDATED_PROJECT_ID : state.activeProjectId,
      };
    }
    case 'DELETE_PROJECT_SUCCESS': {
      const projectId = action.payload;
      const remainingProjects = state.projects.filter(p => p.id !== projectId);
      const newEntries = { ...state.allEntries };
      delete newEntries[projectId];
      const newActuals = { ...state.allActuals };
      delete newActuals[projectId];
      const newAllCashAccounts = { ...state.allCashAccounts };
      delete newAllCashAccounts[projectId];
      const newScenarios = state.scenarios.filter(s => s.projectId !== projectId);
      const newScenarioEntries = { ...state.scenarioEntries };
      state.scenarios.forEach(s => {
        if (s.projectId === projectId) {
          delete newScenarioEntries[s.id];
        }
      });
      
      let newActiveProjectId = state.activeProjectId;
      if (remainingProjects.length === 0) {
          newActiveProjectId = null;
      } else if (state.activeProjectId === projectId) {
          newActiveProjectId = CONSOLIDATED_PROJECT_ID;
      }

      return {
        ...state,
        projects: remainingProjects,
        allEntries: newEntries,
        allActuals: newActuals,
        allCashAccounts: newAllCashAccounts,
        scenarios: newScenarios,
        scenarioEntries: newScenarioEntries,
        activeProjectId: newActiveProjectId,
      };
    }

    case 'ADD_TIER_SUCCESS': {
      return { ...state, tiers: [...state.tiers, action.payload] };
    }
    case 'UPDATE_TIER_SUCCESS': {
      const { tierId, newName, oldName } = action.payload;
      const newTiers = state.tiers.map(t => t.id === tierId ? { ...t, name: newName } : t);
      const updateItemsTier = (items) => {
        const newItems = { ...items };
        for (const projId in newItems) {
          newItems[projId] = newItems[projId].map(item => {
            if (item.supplier === oldName) return { ...item, supplier: newName };
            if (item.thirdParty === oldName) return { ...item, thirdParty: newName };
            return item;
          });
        }
        return newItems;
      };
      return {
        ...state,
        tiers: newTiers,
        allEntries: updateItemsTier(state.allEntries),
        allActuals: updateItemsTier(state.allActuals),
      };
    }
    case 'DELETE_TIER_SUCCESS': {
      const tierId = action.payload;
      return { ...state, tiers: state.tiers.filter(t => t.id !== tierId) };
    }
    case 'UPDATE_TIER_PAYMENT_TERMS_SUCCESS': {
        const { tierId, payment_terms } = action.payload;
        return {
            ...state,
            tiers: state.tiers.map(t => 
                t.id === tierId ? { ...t, payment_terms } : t
            ),
        };
    }

    case 'ADD_MAIN_CATEGORY_SUCCESS': {
        const { type, newMainCategory } = action.payload;
        const newCategories = JSON.parse(JSON.stringify(state.categories));
        newCategories[type].push(newMainCategory);
        return { ...state, categories: newCategories };
    }
    case 'UPDATE_MAIN_CATEGORY_SUCCESS': {
        const { type, mainCategoryId, newName } = action.payload;
        const newCategories = JSON.parse(JSON.stringify(state.categories));
        const mainCat = newCategories[type]?.find(mc => mc.id === mainCategoryId);
        if (mainCat) mainCat.name = newName;
        return { ...state, categories: newCategories };
    }
    case 'DELETE_MAIN_CATEGORY_SUCCESS': {
        const { type, mainCategoryId } = action.payload;
        const newCategories = JSON.parse(JSON.stringify(state.categories));
        newCategories[type] = newCategories[type].filter(mc => mc.id !== mainCategoryId);
        return { ...state, categories: newCategories };
    }
    case 'ADD_SUB_CATEGORY_SUCCESS': {
        const { type, mainCategoryId, newSubCategory } = action.payload;
        const newCategories = JSON.parse(JSON.stringify(state.categories));
        const mainCat = newCategories[type]?.find(mc => mc.id === mainCategoryId);
        if (mainCat) {
            mainCat.subCategories.push(newSubCategory);
        }
        return { ...state, categories: newCategories };
    }
    case 'UPDATE_SUB_CATEGORY_SUCCESS': {
        const { type, mainCategoryId, subCategoryId, newName, oldName } = action.payload;
        const newCategories = JSON.parse(JSON.stringify(state.categories));
        const mainCat = newCategories[type]?.find(mc => mc.id === mainCategoryId);
        if (mainCat) {
            const subCat = mainCat.subCategories.find(sc => sc.id === subCategoryId);
            if (subCat) subCat.name = newName;
        }

        const updateItemsCategory = (items) => {
            const newItems = { ...items };
            for (const projId in newItems) {
                newItems[projId] = newItems[projId].map(item =>
                    (item.category === oldName) ? { ...item, category: newName } : item
                );
            }
            return newItems;
        };

        return {
            ...state,
            categories: newCategories,
            allEntries: updateItemsCategory(state.allEntries),
            allActuals: updateItemsCategory(state.allActuals),
        };
    }
    case 'DELETE_SUB_CATEGORY_SUCCESS': {
        const { type, mainId, subId } = action.payload;
        const newCategories = JSON.parse(JSON.stringify(state.categories));
        const mainCat = newCategories[type]?.find(mc => mc.id === mainId);
        if (mainCat) {
            mainCat.subCategories = mainCat.subCategories.filter(sc => sc.id !== subId);
        }
        return { ...state, categories: newCategories };
    }

    case 'ADD_USER_CASH_ACCOUNT_SUCCESS': {
      const { projectId, newAccount } = action.payload;
      const newAllCashAccounts = { ...state.allCashAccounts };
      newAllCashAccounts[projectId] = [...(newAllCashAccounts[projectId] || []), newAccount];
      return { ...state, allCashAccounts: newAllCashAccounts };
    }
    case 'UPDATE_USER_CASH_ACCOUNT_SUCCESS': {
      const { projectId, accountId, accountData } = action.payload;
      const newAllCashAccounts = JSON.parse(JSON.stringify(state.allCashAccounts));
      const projectAccounts = (newAllCashAccounts[projectId] || []).map(acc => 
        acc.id === accountId ? { ...acc, ...accountData } : acc
      );
      newAllCashAccounts[projectId] = projectAccounts;
      return { ...state, allCashAccounts: newAllCashAccounts };
    }
    case 'DELETE_USER_CASH_ACCOUNT_SUCCESS': {
      const { projectId, accountId } = action.payload;
      const newAllCashAccounts = { ...state.allCashAccounts };
      newAllCashAccounts[projectId] = (newAllCashAccounts[projectId] || []).filter(acc => acc.id !== accountId);
      return { ...state, allCashAccounts: newAllCashAccounts };
    }
    case 'CLOSE_CASH_ACCOUNT_SUCCESS': {
      const { projectId, accountId, closureDate } = action.payload;
      const newAllCashAccounts = { ...state.allCashAccounts };
      const projectAccounts = (newAllCashAccounts[projectId] || []).map(acc => 
        acc.id === accountId ? { ...acc, isClosed: true, closureDate } : acc
      );
      newAllCashAccounts[projectId] = projectAccounts;
      return { ...state, allCashAccounts: newAllCashAccounts, isCloseAccountModalOpen: false, accountToClose: null };
    }
    case 'REOPEN_CASH_ACCOUNT_SUCCESS': {
      const { projectId, accountId } = action.payload;
      const newAllCashAccounts = { ...state.allCashAccounts };
      const projectAccounts = (newAllCashAccounts[projectId] || []).map(acc => 
        acc.id === accountId ? { ...acc, isClosed: false, closureDate: null } : acc
      );
      newAllCashAccounts[projectId] = projectAccounts;
      return { ...state, allCashAccounts: newAllCashAccounts };
    }
    
    case 'UPDATE_ANNUAL_GOALS_SUCCESS': {
        const { projectId, year, updatedGoals } = action.payload;
        return {
            ...state,
            projects: state.projects.map(p => {
                if (p.id === projectId) {
                    const newProjectData = { ...p };
                    if (!newProjectData.annualGoals) newProjectData.annualGoals = {};
                    newProjectData.annualGoals[year] = updatedGoals;
                    return newProjectData;
                }
                return p;
            }),
        };
    }
    
    case 'SAVE_ENTRY_SUCCESS': {
        const { savedEntry, newActuals, targetProjectId, newTier } = action.payload;
        let newState = { ...state };
        if (newTier) {
            if (!newState.tiers.some(t => t.id === newTier.id)) {
                newState.tiers = [...newState.tiers, newTier];
            }
        }

        const updatedAllEntries = { ...newState.allEntries };
        const projectEntries = [...(updatedAllEntries[targetProjectId] || [])];
        const entryIndex = projectEntries.findIndex(e => e.id === savedEntry.id);
        if (entryIndex > -1) {
            projectEntries[entryIndex] = savedEntry;
        } else {
            projectEntries.push(savedEntry);
        }
        updatedAllEntries[targetProjectId] = projectEntries;
        newState.allEntries = updatedAllEntries;

        const newAllActuals = { ...newState.allActuals };
        const unsettledStatuses = ['pending', 'partially_paid', 'partially_received'];
        let projectActuals = (newAllActuals[targetProjectId] || []).filter(actual => 
            !(actual.budgetId === savedEntry.id && unsettledStatuses.includes(actual.status))
        );
        projectActuals.push(...newActuals);
        newAllActuals[targetProjectId] = projectActuals;
        newState.allActuals = newAllActuals;

        return { ...newState, isBudgetModalOpen: false, editingEntry: null };
    }
    case 'DELETE_ENTRY_SUCCESS': {
        const { entryId, entryProjectId } = action.payload;
        if (!entryProjectId || entryProjectId === CONSOLIDATED_PROJECT_ID) return state;

        const newAllEntries = { ...state.allEntries };
        newAllEntries[entryProjectId] = (newAllEntries[entryProjectId] || []).filter(e => e.id !== entryId);

        const unsettledStatuses = ['pending', 'partially_paid', 'partially_received'];
        const newAllActuals = { ...state.allActuals };
        newAllActuals[entryProjectId] = (newAllActuals[entryProjectId] || []).filter(actual => 
            !(actual.budgetId === entryId && unsettledStatuses.includes(actual.status))
        );

        return { ...state, allEntries: newAllEntries, allActuals: newAllActuals, isBudgetModalOpen: false, editingEntry: null };
    }
    
    case 'SAVE_ACTUAL_SUCCESS': {
        const { finalActualData, newTier } = action.payload;
        let newState = { ...state };
        if (newTier) {
            newState = { ...newState, tiers: [...newState.tiers, newTier] };
        }
        
        const newAllActuals = { ...newState.allActuals };
        const projectActuals = [...(newAllActuals[finalActualData.projectId] || [])];
        const index = projectActuals.findIndex(a => a.id === finalActualData.id);
        if (index > -1) {
            projectActuals[index] = finalActualData;
        } else {
            projectActuals.push(finalActualData);
        }
        newAllActuals[finalActualData.projectId] = projectActuals;

        return { ...newState, allActuals: newAllActuals, isActualTransactionModalOpen: false, editingActual: null };
    }
    case 'DELETE_ACTUAL_SUCCESS': {
        const actualId = action.payload;
        const newAllActuals = { ...state.allActuals };
        for (const projectId in newAllActuals) {
            const initialLength = newAllActuals[projectId].length;
            newAllActuals[projectId] = (newAllActuals[projectId] || []).filter(a => a.id !== actualId);
            if (newAllActuals[projectId].length < initialLength) break;
        }
        return { ...state, allActuals: newAllActuals };
    }
    case 'RECORD_PAYMENT_SUCCESS': {
        const { updatedActual } = action.payload;
        const newAllActuals = JSON.parse(JSON.stringify(state.allActuals));
        const projectActuals = newAllActuals[updatedActual.project_id];
        const index = projectActuals.findIndex(a => a.id === updatedActual.id);
        if (index > -1) {
            projectActuals[index] = {
                ...projectActuals[index],
                status: updatedActual.status,
                payments: updatedActual.payments
            };
        }
        
        let nextState = { ...state, allActuals: newAllActuals, isPaymentModalOpen: false, payingActual: null };
        
        if (updatedActual.is_provision && updatedActual.status === 'paid') {
            const allProvisionsForBudget = projectActuals.filter(a => a.budgetId === updatedActual.budget_id && a.isProvision);
            const allProvisionsPaid = allProvisionsForBudget.every(p => p.status === 'paid');
            if (allProvisionsPaid) {
                const finalPaymentActual = projectActuals.find(a => a.budgetId === updatedActual.budget_id && a.isFinalProvisionPayment);
                if (finalPaymentActual) {
                    nextState = {
                        ...nextState,
                        infoModal: {
                            isOpen: true,
                            title: 'Provision Terminée !',
                            message: `La provision pour "${finalPaymentActual.description.replace('Paiement final pour: ', '')}" est maintenant complète. Vous pouvez procéder au paiement final auprès de ${finalPaymentActual.third_party}.`
                        }
                    };
                }
            }
        }
        return nextState;
    }
    case 'UPDATE_PAYMENT_SUCCESS':
    case 'DELETE_PAYMENT_SUCCESS': {
        const updatedActual = action.payload;
        const newAllActuals = JSON.parse(JSON.stringify(state.allActuals));
        const projectActuals = newAllActuals[updatedActual.project_id];
        const index = projectActuals.findIndex(a => a.id === updatedActual.id);
        if (index > -1) {
            projectActuals[index] = {
                ...projectActuals[index],
                status: updatedActual.status,
                payments: updatedActual.payments
            };
        }
        return { ...state, allActuals: newAllActuals };
    }
    case 'UPDATE_SETTINGS_SUCCESS': {
        const newSettings = action.payload;
        return { ...state, settings: { ...state.settings, ...newSettings } };
    }
    case 'OPEN_SAVE_TEMPLATE_MODAL':
      return { ...state, isSaveTemplateModalOpen: true, editingTemplate: action.payload };
    case 'CLOSE_SAVE_TEMPLATE_MODAL':
      return { ...state, isSaveTemplateModalOpen: false, editingTemplate: null };
    case 'SAVE_TEMPLATE_SUCCESS':
      return { ...state, templates: [...state.templates, action.payload] };
    case 'UPDATE_TEMPLATE_SUCCESS':
      return {
        ...state,
        templates: state.templates.map(t => t.id === action.payload.id ? action.payload : t),
      };
    case 'DELETE_TEMPLATE_SUCCESS':
      return {
        ...state,
        templates: state.templates.filter(t => t.id !== action.payload),
      };

    default:
      return state;
  }
};

// --- Context and Provider ---
const BudgetContext = createContext();

export const BudgetProvider = ({ children }) => {
  const [state, dispatch] = useReducer(budgetReducer, getInitialState());

  useEffect(() => {
    if (state.session && !state.profile) {
      const fetchInitialData = async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
          const user = state.session.user;
          
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, subscription_status, trial_ends_at, plan_id, currency, display_unit, decimal_places, timezone_offset, role, email, notifications')
            .eq('id', user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') throw profileError;

          const profile = profileData ? {
            id: profileData.id,
            fullName: profileData.full_name,
            subscriptionStatus: profileData.subscription_status,
            trialEndsAt: profileData.trial_ends_at,
            planId: profileData.plan_id,
            role: profileData.role,
            notifications: profileData.notifications || [],
          } : null;

          if (!profile) {
             console.warn("Profile not found for user, might be a new user.");
             dispatch({ type: 'SET_LOADING', payload: false });
             dispatch({ type: 'SET_INITIAL_DATA', payload: { profile: null, projects: [], settings: initialSettings, allEntries: {}, allActuals: {}, allCashAccounts: {}, tiers: [], loans: [], scenarios: [], scenarioEntries: {}, consolidatedViews: [], collaborators: [], allComments: {}, templates: [], vatRates: {}, vatRegimes: {} } });
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
            supabase.from('projects').select('*'),
            supabase.from('tiers').select('*'),
            supabase.from('loans').select('*'),
            supabase.from('scenarios').select('*'),
            supabase.from('budget_entries').select('*'),
            supabase.from('actual_transactions').select('*'),
            supabase.from('payments').select('*'),
            supabase.from('cash_accounts').select('*'),
            supabase.from('scenario_entries').select('*'),
            supabase.from('consolidated_views').select('*'),
            supabase.from('collaborators').select('*'),
            supabase.from('comments').select('*'),
            supabase.from('templates').select('*'),
            supabase.from('user_categories').select('*'),
            supabase.from('vat_rates').select('*'),
            supabase.from('vat_regimes').select('*'),
          ]);

          const responses = { projectsRes, tiersRes, loansRes, scenariosRes, entriesRes, actualsRes, paymentsRes, cashAccountsRes, scenarioEntriesRes, consolidatedViewsRes, collaboratorsRes, commentsRes, templatesRes, customCategoriesRes, vatRatesRes, vatRegimesRes };
          for (const key in responses) {
            if (responses[key].error) throw responses[key].error;
          }

          const userIds = new Set();
          userIds.add(user.id);
          if (projectsRes.data) {
              projectsRes.data.forEach(p => userIds.add(p.user_id));
          }
          if (collaboratorsRes.data) {
              collaboratorsRes.data.forEach(c => {
                  userIds.add(c.owner_id);
                  if (c.user_id) userIds.add(c.user_id);
              });
          }
           if (commentsRes.data) {
              commentsRes.data.forEach(c => userIds.add(c.user_id));
          }
          if (templatesRes.data) {
              templatesRes.data.forEach(t => userIds.add(t.user_id));
          }

          const { data: profilesData, error: profilesError } = await supabase
              .from('profiles')
              .select('id, full_name, email')
              .in('id', Array.from(userIds));

          if (profilesError) throw profilesError;

          const projects = (projectsRes.data || []).map(p => ({
            id: p.id, name: p.name, currency: p.currency, startDate: p.start_date, endDate: p.end_date, isArchived: p.is_archived, user_id: p.user_id,
            annualGoals: p.annual_goals, expenseTargets: p.expense_targets
          }));
          
          const tiers = (tiersRes.data || []).map(t => ({ id: t.id, name: t.name, type: t.type, payment_terms: t.payment_terms }));
          const loans = (loansRes.data || []).map(l => ({
            id: l.id, projectId: l.project_id, type: l.type, thirdParty: l.third_party, principal: l.principal, term: l.term,
            monthlyPayment: l.monthly_payment, principalDate: l.principal_date, repaymentStartDate: l.repayment_start_date
          }));
          const scenarios = (scenariosRes.data || []).map(s => ({
            id: s.id, projectId: s.project_id, name: s.name, description: s.description, color: s.color, isVisible: s.is_visible, isArchived: s.is_archived
          }));
          const consolidatedViews = (consolidatedViewsRes.data || []).map(v => ({
            id: v.id, name: v.name, project_ids: v.project_ids
          }));
          const collaborators = (collaboratorsRes.data || []).map(c => ({
            id: c.id, ownerId: c.owner_id, userId: c.user_id, email: c.email, role: c.role, status: c.status, projectIds: c.project_ids, permissionScope: c.permission_scope
          }));
          const templates = (templatesRes.data || []).map(t => ({
            id: t.id, userId: t.user_id, name: t.name, description: t.description, structure: t.structure, isPublic: t.is_public, tags: t.tags, icon: t.icon, color: t.color, purpose: t.purpose
          }));

          const allEntries = (entriesRes.data || []).reduce((acc, entry) => {
            const e = {
              id: entry.id, loanId: entry.loan_id, type: entry.type, category: entry.category, frequency: entry.frequency,
              amount: entry.amount, date: entry.date, startDate: entry.start_date, endDate: entry.end_date,
              supplier: entry.supplier, description: entry.description, isOffBudget: entry.is_off_budget,
              payments: entry.payments,
              provisionDetails: entry.provision_details,
              isProvision: entry.is_provision,
              amount_type: entry.amount_type,
              vat_rate_id: entry.vat_rate_id,
              ht_amount: entry.ht_amount,
              ttc_amount: entry.ttc_amount,
            };
            if (!acc[entry.project_id]) acc[entry.project_id] = [];
            acc[entry.project_id].push(e);
            return acc;
          }, {});

          const allActuals = (actualsRes.data || []).reduce((acc, actual) => {
            const a = {
              id: actual.id, budgetId: actual.budget_id, projectId: actual.project_id, type: actual.type,
              category: actual.category, thirdParty: actual.third_party, description: actual.description,
              date: actual.date, amount: actual.amount, status: actual.status, isOffBudget: actual.is_off_budget,
              isProvision: actual.is_provision, isFinalProvisionPayment: actual.is_final_provision_payment,
              provisionDetails: actual.provision_details, isInternalTransfer: actual.is_internal_transfer,
              amount_type: actual.amount_type,
              vat_rate_id: actual.vat_rate_id,
              ht_amount: actual.ht_amount,
              ttc_amount: actual.ttc_amount,
              payments: (paymentsRes.data || []).filter(p => p.actual_id === actual.id).map(p => ({
                id: p.id, paymentDate: p.payment_date, paidAmount: p.paid_amount, cashAccount: p.cash_account
              }))
            };
            if (!acc[actual.project_id]) acc[actual.project_id] = [];
            acc[actual.project_id].push(a);
            return acc;
          }, {});

          const allCashAccounts = (cashAccountsRes.data || []).reduce((acc, account) => {
            const a = {
              id: account.id, projectId: account.project_id, mainCategoryId: account.main_category_id,
              name: account.name, initialBalance: account.initial_balance, initialBalanceDate: account.initial_balance_date,
              isClosed: account.is_closed, closureDate: account.closure_date
            };
            if (!acc[account.project_id]) acc[account.project_id] = [];
            acc[account.project_id].push(a);
            return acc;
          }, {});

          const scenarioEntries = (scenarioEntriesRes.data || []).reduce((acc, entry) => {
             const e = {
              id: entry.id, type: entry.type, category: entry.category, frequency: entry.frequency,
              amount: entry.amount, date: entry.date, startDate: entry.start_date, endDate: entry.end_date,
              supplier: entry.supplier, description: entry.description, isDeleted: entry.is_deleted,
              payments: entry.payments,
            };
            if (!acc[entry.scenario_id]) acc[entry.scenario_id] = [];
            acc[entry.scenario_id].push(e);
            return acc;
          }, {});

          const allComments = (commentsRes.data || []).reduce((acc, comment) => {
              const projectId = comment.project_id || state.activeProjectId || 'consolidated';
              if (!acc[projectId]) acc[projectId] = [];
              acc[projectId].push({
                  id: comment.id,
                  projectId: comment.project_id,
                  userId: comment.user_id,
                  rowId: comment.row_id,
                  columnId: comment.column_id,
                  content: comment.content,
                  createdAt: comment.created_at,
                  mentionedUsers: comment.mentioned_users,
              });
              return acc;
          }, {});

          const fetchedCategories = customCategoriesRes.data || [];
          const customMain = fetchedCategories.filter(c => !c.parent_id);
          const customSubs = fetchedCategories.filter(c => c.parent_id);
          const finalCategories = JSON.parse(JSON.stringify(initialCategories));
          
          customMain.forEach(main => {
              if (!finalCategories[main.type].some(m => m.id === main.id)) {
                  finalCategories[main.type].push({
                      id: main.id,
                      name: main.name,
                      isFixed: main.is_fixed,
                      subCategories: []
                  });
              }
          });

          customSubs.forEach(sub => {
              let parent = finalCategories.revenue.find(m => m.id === sub.parent_id);
              if (!parent) {
                  parent = finalCategories.expense.find(m => m.id === sub.parent_id);
              }
              if (parent && !parent.subCategories.some(s => s.id === sub.id)) {
                  parent.subCategories.push({ id: sub.id, name: sub.name, isFixed: sub.is_fixed });
              }
          });

          // --- Data Migration for VAT categories ---
          const taxMainCategory = finalCategories.expense.find(mc => mc.id === 'exp-main-7');
          if (taxMainCategory) {
              const subCategoriesToUpsert = [];
              const subCategoriesToEnsure = [
                  { id: 'exp-sub-7-2', name: 'TVA collectée', isFixed: true },
                  { id: 'exp-sub-7-3', name: 'TVA déductible', isFixed: true },
                  { id: 'exp-sub-7-5', name: 'TVA à payer', isFixed: true }
              ];
              
              const otherRevenueCategory = finalCategories.revenue.find(mc => mc.id === 'rev-main-3');
              if (otherRevenueCategory) {
                  subCategoriesToEnsure.push({ id: 'rev-sub-3-3', name: 'Crédit de TVA', isFixed: true, parent_id: 'rev-main-3', type: 'revenue' });
              }

              // Remove old "TVA" category if it exists in the local state object
              taxMainCategory.subCategories = taxMainCategory.subCategories.filter(sc => sc.name.toLowerCase() !== 'tva' && sc.name.toLowerCase() !== 'tva collectible');
              
              // Check and add new VAT categories if they don't exist
              subCategoriesToEnsure.forEach(ensureSub => {
                  const parentCat = ensureSub.type === 'revenue' ? otherRevenueCategory : taxMainCategory;
                  if (parentCat) {
                      const exists = parentCat.subCategories.some(sc => sc.id === ensureSub.id);
                      if (!exists) {
                          parentCat.subCategories.push({id: ensureSub.id, name: ensureSub.name, isFixed: ensureSub.isFixed});
                          subCategoriesToUpsert.push({
                              id: ensureSub.id,
                              user_id: user.id,
                              parent_id: ensureSub.parent_id || taxMainCategory.id,
                              name: ensureSub.name,
                              type: ensureSub.type || 'expense',
                              is_fixed: ensureSub.isFixed,
                          });
                      }
                  }
              });

              if (subCategoriesToUpsert.length > 0) {
                  const { error: upsertError } = await supabase
                      .from('user_categories')
                      .upsert(subCategoriesToUpsert, { onConflict: 'id' });

                  if (upsertError) {
                      console.error("Error ensuring VAT subcategories:", upsertError);
                  }
              }
          }
          // --- End of Data Migration ---

          const vatRates = (vatRatesRes.data || []).reduce((acc, rate) => {
              if (!acc[rate.project_id]) acc[rate.project_id] = [];
              acc[rate.project_id].push(rate);
              return acc;
          }, {});

          const vatRegimes = (vatRegimesRes.data || []).reduce((acc, regime) => {
              acc[regime.project_id] = regime;
              return acc;
          }, {});

          dispatch({
            type: 'SET_INITIAL_DATA',
            payload: {
              profile,
              allProfiles: profilesData || [],
              settings,
              projects, tiers, loans, scenarios, consolidatedViews, collaborators, allComments, templates, vatRates, vatRegimes,
              allEntries, allActuals, allCashAccounts, scenarioEntries, categories: finalCategories,
            },
          });

        } catch (error) {
          console.error("Error fetching initial data:", error);
          if (error instanceof TypeError && error.message === 'Failed to fetch') {
              dispatch({ type: 'ADD_TOAST', payload: { message: 'Problème de session détecté. Déconnexion pour réinitialiser.', type: 'error', duration: 5000 } });
              await supabase.auth.signOut();
          } else {
              dispatch({ type: 'ADD_TOAST', payload: { message: `Erreur de chargement des données: ${error.message}`, type: 'error' } });
          }
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      };
      fetchInitialData();
    } else if (!state.session && state.profile) {
      dispatch({ type: 'RESET_STATE' });
    }
  }, [state.session]);

  return (
    <BudgetContext.Provider value={{ state, dispatch }}>
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
};
