import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase } from '../utils/supabase';

const DataContext = createContext();

export const mainCashAccountCategories = [
  { id: 'bank', name: 'Comptes Bancaires' },
  { id: 'cash', name: 'Cash / Espèce' },
  { id: 'mobileMoney', name: 'Mobile Money' },
  { id: 'savings', name: 'Épargne' },
  { id: 'provisions', name: 'Provisions' },
];

const initialCategories = {
  revenue: [
    { id: 'rev-main-1', name: 'Entrées des Ventes', isFixed: true, subCategories: [{ id: 'rev-sub-1-1', name: 'Ventes de produits' }, { id: 'rev-sub-1-2', name: 'Ventes de services' }] },
    { id: 'rev-main-2', name: 'Entrées Financières', isFixed: true, subCategories: [
        { id: 'rev-sub-2-1', name: 'Intérêts perçus' }, { id: 'rev-sub-2-2', name: 'Réception Emprunt' },
        { id: 'rev-sub-2-3', name: 'Remboursement de prêt reçu' }, { id: 'rev-sub-2-4', name: 'Intérêts de prêt reçus' },
    ] },
    { id: 'rev-main-3', name: 'Autres Entrées', isFixed: true, subCategories: [
        { id: 'rev-sub-3-1', name: 'Subventions' }, { id: 'rev-sub-3-2', name: 'Revenus Exceptionnels'},
        { id: 'rev-sub-3-3', name: 'Crédit de TVA', isFixed: true }
    ] },
  ],
  expense: [
    { id: 'exp-main-1', name: 'Exploitation', isFixed: true, subCategories: [
        { id: 'exp-sub-1-1', name: 'Loyer et charges' }, { id: 'exp-sub-1-2', name: 'Fournitures de bureau' }, { id: 'exp-sub-1-3', name: 'Marketing et publicité' }, 
        { id: 'exp-sub-1-4', name: 'Frais de déplacement' },{ id: 'exp-sub-1-5', name: 'Frais administratives et de gestion' }, { id: 'exp-sub-1-6', name: 'Frais de transport' },
        { id: 'exp-sub-1-7', name: 'Entretien, réparation et maintenance' }, { id: 'exp-sub-1-8', name: 'Recherche et développement' }, { id: 'exp-sub-1-9', name: 'Petit équipement' }
    ] },
    { id: 'exp-main-2', name: 'Masse Salariale', isFixed: true, subCategories: [{ id: 'exp-sub-2-1', name: 'Salaires et traitements' }, { id: 'exp-sub-2-2', name: 'Charges sociales' }] },
    { id: 'exp-main-3', name: 'Investissement', isFixed: true, subCategories: [
        { id: 'exp-sub-3-1', name: 'Investissements financiers' }, { id: 'exp-sub-3-2', name: 'Investissements immobiliers' },
        { id: 'exp-sub-3-3', name: 'Investissement dans sa propre entreprise' }, { id: 'exp-sub-3-4', name: 'Autres investissements' }
    ] },
    { id: 'exp-main-4', name: 'Financement', isFixed: true, subCategories: [
        { id: 'exp-sub-4-1', name: 'Octroi de Prêt' }, { id: 'exp-sub-4-2', name: "Remboursement d'emprunt" }, { id: 'exp-sub-4-3', name: "Intérêts d'emprunt" },
    ] },
    { id: 'exp-main-5', name: 'Épargne', isFixed: true, subCategories: [
        { id: 'exp-sub-5-1', name: 'Provision pour risques' }, { id: 'exp-sub-5-2', name: "Fond d'urgence" },
        { id: 'exp-sub-5-3', name: 'Epargne Projet à court et moyen termes' }, { id: 'exp-sub-5-4', name: 'Epargne retraite' },
    ] },
    { id: 'exp-main-6', name: 'Exceptionnel', isFixed: true, subCategories: [{ id: 'exp-sub-6-1', name: 'Amendes' }] },
    { id: 'exp-main-7', name: 'Impôts et Taxes', isFixed: true, subCategories: [
        { id: 'exp-sub-7-1', name: 'Impôt sur les sociétés', isFixed: false }, { id: 'exp-sub-7-2', name: 'TVA collectée', isFixed: true },
        { id: 'exp-sub-7-3', name: 'TVA déductible', isFixed: true }, { id: 'exp-sub-7-4', name: 'Autres taxes', isFixed: false },
        { id: 'exp-sub-7-5', name: 'TVA à payer', isFixed: true }
    ] },
    { id: 'exp-main-8', name: 'Formation', isFixed: true, subCategories: [
        { id: 'exp-sub-8-1', name: 'Matériel' }, { id: 'exp-sub-8-2', name: 'Livres' }, { id: 'exp-sub-8-3', name: 'Logiciels' },
        { id: 'exp-sub-8-4', name: 'Abonnement' }, { id: 'exp-sub-8-5', name: 'Ateliers pratiques' }, { id: 'exp-sub-8-6', name: 'Formations certifiantes' }, { id: 'exp-sub-8-7', name: 'Stage' },
    ] },
    { id: 'exp-main-9', name: 'Innovation, Recherche et développement', isFixed: true, subCategories: [] },
    { id: 'exp-main-10', name: 'Personnel', isFixed: true, subCategories: [
        { id: 'exp-sub-10-1', name: 'Logement' }, { id: 'exp-sub-10-2', name: 'Eau et Electricité' }, { id: 'exp-sub-10-3', name: 'Frais de réparation et entretien' },
        { id: 'exp-sub-10-4', name: 'Décoration et ameublement' }, { id: 'exp-sub-10-5', name: 'Frais de nettoyage' }, { id: 'exp-sub-10-6', name: 'Nourriture & alimentation' },
        { id: 'exp-sub-10-7', name: 'Transports et déplacement' }, { id: 'exp-sub-10-8', name: 'Santé et bien etre' }, { id: 'exp-sub-10-9', name: 'Communication et divertissement' },
        { id: 'exp-sub-10-10', name: 'Enfant et education' }, { id: 'exp-sub-10-11', name: 'Habillement & Textile' }, { id: 'exp-sub-10-12', name: 'Assurance divers' },
        { id: 'exp-sub-10-13', name: 'Impots & obligation fiscales' }, { id: 'exp-sub-10-14', name: 'DIvers et imprévus' },
    ] },
    { id: 'exp-main-11', name: 'Loisirs et plaisirs', isFixed: true, subCategories: [
        { id: 'exp-sub-11-1', name: 'Sorties et restaurants' }, { id: 'exp-sub-11-2', name: 'Abonnement digitaux' }, { id: 'exp-sub-11-3', name: 'Hobbies et passion' },
        { id: 'exp-sub-11-4', name: 'Shopping' }, { id: 'exp-sub-11-5', name: 'Soins personnel' },
    ]},
    { id: 'exp-main-12', name: 'Dons et cadeaux', isFixed: true, subCategories: [
        { id: 'exp-sub-12-1', name: 'Cadeaux pour occasions' }, { id: 'exp-sub-12-2', name: 'Célébration' }, { id: 'exp-sub-12-3', name: 'Charité' },
    ]},
    { id: 'exp-main-13', name: 'Achat pour revente', isFixed: true, subCategories: [
        { id: 'exp-sub-13-1', name: 'Matière premiere' }, { id: 'exp-sub-13-2', name: 'Marchandises' }, { id: 'exp-sub-13-3', name: 'Emballage' },
        { id: 'exp-sub-13-4', name: 'Etude et prestation de service' }, { id: 'exp-sub-13-5', name: 'Equipement et travaux' },
    ]},
  ]
};

const initialSettings = { 
  displayUnit: 'standard', decimalPlaces: 2, currency: '€', exchangeRates: {}, timezoneOffset: 0,
};

const getInitialDataState = () => ({
    session: null, profile: null, allProfiles: [], projects: [], categories: initialCategories, allEntries: {},
    allActuals: {}, allCashAccounts: {}, tiers: [], settings: initialSettings, scenarios: [], scenarioEntries: {},
    loans: [], allComments: {}, consolidatedViews: [], collaborators: [], templates: [], vatRates: {}, vatRegimes: {},
});

const dataReducer = (state, action) => {
    switch (action.type) {
        case 'SET_SESSION':
            return { ...state, session: action.payload };
        case 'SET_PROFILE':
            return { ...state, profile: action.payload };
        case 'SET_INITIAL_DATA':
            return {
                ...state,
                ...action.payload,
                allProfiles: action.payload.allProfiles || [],
            };
        case 'RESET_DATA_STATE':
            return getInitialDataState();
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

            return newState;
        }
        case 'DELETE_ENTRY_SUCCESS': {
            const { entryId, entryProjectId } = action.payload;
            if (!entryProjectId) return state;

            const newAllEntries = { ...state.allEntries };
            newAllEntries[entryProjectId] = (newAllEntries[entryProjectId] || []).filter(e => e.id !== entryId);

            const unsettledStatuses = ['pending', 'partially_paid', 'partially_received'];
            const newAllActuals = { ...state.allActuals };
            newAllActuals[entryProjectId] = (newAllActuals[entryProjectId] || []).filter(actual => 
                !(actual.budgetId === entryId && unsettledStatuses.includes(actual.status))
            );

            return { ...state, allEntries: newAllEntries, allActuals: newAllActuals };
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
            
            return {
                ...state,
                projects: remainingProjects,
                allEntries: newEntries,
                allActuals: newActuals,
                allCashAccounts: newAllCashAccounts,
                scenarios: newScenarios,
                scenarioEntries: newScenarioEntries,
            };
        }
        case 'UPDATE_SETTINGS_SUCCESS': {
            const newSettings = action.payload;
            return { ...state, settings: { ...state.settings, ...newSettings } };
        }
        case 'ADD_COMMENT_SUCCESS': {
            const { newComment } = action.payload;
            const projectId = newComment.projectId || state.activeProjectId || 'global';
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
        // Add other data-related cases here
        default:
            return state;
    }
};

export const DataProvider = ({ children }) => {
    const [state, dispatch] = useReducer(dataReducer, getInitialDataState());

    useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            dispatch({ type: 'SET_SESSION', payload: session });
        });
        return () => authListener.subscription.unsubscribe();
    }, []);

    return (
        <DataContext.Provider value={{ dataState: state, dataDispatch: dispatch }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => useContext(DataContext);
