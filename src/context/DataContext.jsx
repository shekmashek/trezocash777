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
    // 1. RÉMUNÉRATION DU TRAVAIL
    { id: 'rev-main-1', name: 'RÉMUNÉRATION DU TRAVAIL', isFixed: true, subCategories: [
        { id: 'rev-sub-1-1', name: 'Salaires & traitements nets' },
        { id: 'rev-sub-1-2', name: 'Rémunération des dirigeants' },
        { id: 'rev-sub-1-3', name: 'Honoraires & chiffre d\'affaires (BIC/BNC)' },
        { id: 'rev-sub-1-4', name: 'Primes, bonus & commissions' },
        { id: 'rev-sub-1-5', name: 'Indemnités' },
        { id: 'rev-sub-1-6', name: 'Remboursements de frais professionnels' },
    ]},
    // 2. VENTES DE BIENS & PRODUITS
    { id: 'rev-main-2', name: 'VENTES DE BIENS & PRODUITS', isFixed: true, subCategories: [
        { id: 'rev-sub-2-1', name: 'Vente de marchandises' },
        { id: 'rev-sub-2-2', name: 'Vente de produits fabriqués' },
        { id: 'rev-sub-2-3', name: 'Vente d\'actifs immobilisés' },
        { id: 'rev-sub-2-4', name: 'Revente de biens personnels' },
    ]},
    // 3. PRESTATIONS DE SERVICES & ACTIVITÉS
    { id: 'rev-main-3', name: 'PRESTATIONS DE SERVICES & ACTIVITÉS', isFixed: true, subCategories: [
        { id: 'rev-sub-3-1', name: 'Conseil & expertise' },
        { id: 'rev-sub-3-2', name: 'Prestations artistiques ou culturelles' },
        { id: 'rev-sub-3-3', name: 'Prestations sportives' },
        { id: 'rev-sub-3-4', name: 'Recettes d\'événements' },
        { id: 'rev-sub-3-5', name: 'Locations diverses' },
    ]},
    // 4. REVENUS FINANCIERS & DE PLACEMENTS
    { id: 'rev-main-4', name: 'REVENUS FINANCIERS & DE PLACEMENTS', isFixed: true, subCategories: [
        { id: 'rev-sub-4-1', name: 'Dividendes' },
        { id: 'rev-sub-4-2', name: 'Intérêts perçus' },
        { id: 'rev-sub-4-3', name: 'Plus-values de cession' },
        { id: 'rev-sub-4-4', name: 'Revenus locatifs nets' },
    ]},
    // 5. AIDES, SUBVENTIONS & DOTATIONS
    { id: 'rev-main-5', name: 'AIDES, SUBVENTIONS & DOTATIONS', isFixed: true, subCategories: [
        { id: 'rev-sub-5-1', name: 'Aides publiques aux entreprises' },
        { id: 'rev-sub-5-2', name: 'Subventions associatives' },
        { id: 'rev-sub-5-3', name: 'Allocations & prestations sociales' },
        { id: 'rev-sub-5-4', name: 'Indemnités journalières' },
        { id: 'rev-sub-5-5', name: 'Pensions de retraite' },
        { id: 'rev-sub-5-6', name: 'Bourses & bourses d\'études' },
        { id: 'rev-sub-5-7', name: 'Crédit de TVA', isFixed: true },
    ]},
    // 6. APPORTS & FINANCEMENTS
    { id: 'rev-main-6', name: 'APPORTS & FINANCEMENTS', isFixed: true, subCategories: [
        { id: 'rev-sub-6-1', name: 'Apports en capital' },
        { id: 'rev-sub-6-2', name: 'Emprunts & prêts reçus' },
        { id: 'rev-sub-6-3', name: 'Collecte de fonds (crowdfunding)' },
        { id: 'rev-sub-6-4', name: 'Apports personnels pour projet' },
    ]},
    // 7. REVENUS DIVERS & OCCASIONNELS
    { id: 'rev-main-7', name: 'REVENUS DIVERS & OCCASIONNELS', isFixed: true, subCategories: [
        { id: 'rev-sub-7-1', name: 'Dons & cadeaux en argent' },
        { id: 'rev-sub-7-2', name: 'Gains divers' },
        { id: 'rev-sub-7-3', name: 'Remboursements personnels' },
        { id: 'rev-sub-7-4', name: 'Compensations' },
    ]},
  ],
  expense: [
    // 1. RÉMUNÉRATIONS & HONORAIRES
    { id: 'exp-main-1', name: 'RÉMUNÉRATIONS & HONORAIRES', isFixed: true, subCategories: [
        { id: 'exp-sub-1-1', name: 'Salaires, traitements et charges' },
        { id: 'exp-sub-1-2', name: 'Honoraires (freelances, experts-comptables)' },
        { id: 'exp-sub-1-3', name: 'Primes, bonus et participations' },
        { id: 'exp-sub-1-4', name: 'Indemnités (déplacement, repas, km)' },
        { id: 'exp-sub-1-5', name: 'Cotisations sociales personnelles' },
    ]},
    // 2. HEBERGEMENT & LOGEMENT
    { id: 'exp-main-2', name: 'HEBERGEMENT & LOGEMENT', isFixed: true, subCategories: [
        { id: 'exp-sub-2-1', name: 'Loyer & Charges locatives' },
        { id: 'exp-sub-2-2', name: 'Prêt immobilier (remboursement capital)' },
        { id: 'exp-sub-2-3', name: 'Charges de copropriété' },
        { id: 'exp-sub-2-4', name: 'Entretien, réparations et amélioration' },
        { id: 'exp-sub-2-5', name: 'Énergie (Électricité, Gaz, Chauffage)' },
        { id: 'exp-sub-2-6', name: 'Eau et assainissement' },
        { id: 'exp-sub-2-7', name: 'Assurance habitation/locaux' },
        { id: 'exp-sub-2-8', name: 'Taxe foncière' },
    ]},
    // 3. TRANSPORT & VÉHICULES
    { id: 'exp-main-3', name: 'TRANSPORT & VÉHICULES', isFixed: true, subCategories: [
        { id: 'exp-sub-3-1', name: 'Carburant & Recharge' },
        { id: 'exp-sub-3-2', name: 'Entretien, réparations et pièces' },
        { id: 'exp-sub-3-3', name: 'Assurance auto/moto' },
        { id: 'exp-sub-3-4', name: 'Péage, stationnement et amendes' },
        { id: 'exp-sub-3-5', name: 'Transport en commun (abonnements)' },
        { id: 'exp-sub-3-6', name: 'Taxi, VTC, location de véhicule' },
        { id: 'exp-sub-3-7', name: 'Voyages longue distance (billets de train, d\'avion)' },
    ]},
    // 4. NOURRITURE & RESTAURATION
    { id: 'exp-main-4', name: 'NOURRITURE & RESTAURATION', isFixed: true, subCategories: [
        { id: 'exp-sub-4-1', name: 'Courses alimentaires (supermarché)' },
        { id: 'exp-sub-4-2', name: 'Restaurant, café, bar' },
        { id: 'exp-sub-4-3', name: 'Livraison de repas à domicile' },
        { id: 'exp-sub-4-4', name: 'Repas en déplacement professionnel' },
    ]},
    // 5. COMMUNICATION, INTERNET & ABONNEMENTS
    { id: 'exp-main-5', name: 'COMMUNICATION, INTERNET & ABONNEMENTS', isFixed: true, subCategories: [
        { id: 'exp-sub-5-1', name: 'Téléphonie mobile et fixe' },
        { id: 'exp-sub-5-2', name: 'Internet (Box) et Abonnements TV' },
        { id: 'exp-sub-5-3', name: 'Logiciels et applications (SaaS)' },
        { id: 'exp-sub-5-4', name: 'Hébergement web, nom de domaine' },
        { id: 'exp-sub-5-5', name: 'Équipements tech (ordinateur, smartphone)' },
    ]},
    // 6. LOISIRS, CULTURE & SPORT
    { id: 'exp-main-6', name: 'LOISIRS, CULTURE & SPORT', isFixed: true, subCategories: [
        { id: 'exp-sub-6-1', name: 'Abonnements culturels (Streaming, presse, jeux vidéo)' },
        { id: 'exp-sub-6-2', name: 'Sports (Club, équipement, licence)' },
        { id: 'exp-sub-6-3', name: 'Sorties (Cinéma, concert, musée, événement)' },
        { id: 'exp-sub-6-4', name: 'Hobbies et passions' },
        { id: 'exp-sub-6-5', name: 'Vacances et week-ends' },
        { id: 'exp-sub-6-6', name: 'Cotisations associatives' },
    ]},
    // 7. SANTÉ & BIEN-ÊTRE
    { id: 'exp-main-7', name: 'SANTÉ & BIEN-ÊTRE', isFixed: true, subCategories: [
        { id: 'exp-sub-7-1', name: 'Mutuelle santé' },
        { id: 'exp-sub-7-2', name: 'Frais médicaux (consultations, pharmacie)' },
        { id: 'exp-sub-7-3', name: 'Soins (dentiste, opticien, kiné)' },
        { id: 'exp-sub-7-4', name: 'Bien-être (Coaching, yoga, cosmétiques)' },
    ]},
    // 8. PROJET IMMOBILIER & INVESTISSEMENTS
    { id: 'exp-main-8', name: 'PROJET IMMOBILIER & INVESTISSEMENTS', isFixed: true, subCategories: [
        { id: 'exp-sub-8-1', name: 'Apport personnel' },
        { id: 'exp-sub-8-2', name: 'Frais de notaire' },
        { id: 'exp-sub-8-3', name: 'Travaux d\'aménagement importants' },
        { id: 'exp-sub-8-4', name: 'Achat de mobilier durable' },
        { id: 'exp-sub-8-5', name: 'Investissements financiers (PEA, etc.)' },
    ]},
    // 9. ACTIVITÉ PROFESSIONNELLE & ENTREPRISE
    { id: 'exp-main-9', name: 'ACTIVITÉ PROFESSIONNELLE & ENTREPRISE', isFixed: true, subCategories: [
        { id: 'exp-sub-9-1', name: 'Marketing et publicité' },
        { id: 'exp-sub-9-2', name: 'Achat de marchandises / matières premières' },
        { id: 'exp-sub-9-3', name: 'Sous-traitance' },
        { id: 'exp-sub-9-4', name: 'Frais de déplacement professionnel' },
        { id: 'exp-sub-9-5', name: 'Cotisations et frais professionnels' },
        { id: 'exp-sub-9-6', name: 'Assurance responsabilité civile pro (RC Pro)' },
        { id: 'exp-sub-9-7', name: 'Fournitures de bureau' },
        { id: 'exp-sub-9-8', name: 'Petit équipement' },
    ]},
    // 10. FINANCES & ASSURANCES
    { id: 'exp-main-10', name: 'FINANCES & ASSURANCES', isFixed: true, subCategories: [
        { id: 'exp-sub-10-1', name: 'Intérêts d\'emprunts' },
        { id: 'exp-sub-10-2', name: 'Frais bancaires' },
        { id: 'exp-sub-10-3', name: 'Assurance emprunteur' },
        { id: 'exp-sub-10-4', name: 'Autres assurances (RC Familiale, etc.)' },
    ]},
    // 11. IMPÔTS & CONTRIBUTIONS
    { id: 'exp-main-11', name: 'IMPÔTS & CONTRIBUTIONS', isFixed: true, subCategories: [
        { id: 'exp-sub-11-1', name: 'Impôt sur le revenu / sur les sociétés' },
        { id: 'exp-sub-11-2', name: 'TVA collectée', isFixed: true },
        { id: 'exp-sub-11-3', name: 'TVA déductible', isFixed: true },
        { id: 'exp-sub-11-4', name: 'TVA à payer', isFixed: true },
        { id: 'exp-sub-11-5', name: 'Taxe d\'habitation' },
        { id: 'exp-sub-11-6', name: 'Cotisation Foncière des Entreprises (CFE)' },
        { id: 'exp-sub-11-7', name: 'Dons et mécénat' },
    ]},
    // 12. FAMILLE & ENFANTS
    { id: 'exp-main-12', name: 'FAMILLE & ENFANTS', isFixed: true, subCategories: [
        { id: 'exp-sub-12-1', name: 'Frais de scolarité et garde' },
        { id: 'exp-sub-12-2', name: 'Activités extrascolaires' },
        { id: 'exp-sub-12-3', name: 'Vêtements et fournitures pour enfants' },
    ]},
    // 13. ÉPARGNE & DOSSIERS
    { id: 'exp-main-13', name: 'ÉPARGNE & DOSSIERS', isFixed: true, subCategories: [
        { id: 'exp-sub-13-1', name: 'Versement épargne (Livret A, etc.)' },
        { id: 'exp-sub-13-2', name: 'Épargne retraite (PER)' },
        { id: 'exp-sub-13-3', name: 'Frais divers et imprévus' },
    ]},
    // 14. AMEUBLEMENT, ÉQUIPEMENT & DÉCORATION
    { id: 'exp-main-14', name: 'AMEUBLEMENT, ÉQUIPEMENT & DÉCORATION', isFixed: true, subCategories: [
        { id: 'exp-sub-14-1', name: 'Mobilier & Agencement' },
        { id: 'exp-sub-14-2', name: 'Électroménager' },
        { id: 'exp-sub-14-3', name: 'Décoration & Ambiance' },
        { id: 'exp-sub-14-4', name: 'Matériel et outillage' },
        { id: 'exp-sub-14-5', name: 'Location de mobilier/équipement' },
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
        case 'UPDATE_PROJECT_SETTINGS_SUCCESS': {
            const { projectId, newSettings } = action.payload;
            return {
                ...state,
                projects: state.projects.map(project =>
                    project.id === projectId
                        ? { ...project, ...newSettings }
                        : project
                ),
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
