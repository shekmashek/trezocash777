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
    { id: 'rev-main-1', name: 'RÉMUNÉRATION DU TRAVAIL', isFixed: true, subCategories: [
        { id: 'rev-sub-1-1', name: 'Salaires & traitements nets' },
        { id: 'rev-sub-1-2', name: 'Rémunération des dirigeants' },
        { id: 'rev-sub-1-3', name: 'Honoraires & chiffre d\'affaires (BIC/BNC)' },
        { id: 'rev-sub-1-4', name: 'Primes, bonus & commissions' },
        { id: 'rev-sub-1-5', name: 'Indemnités' },
        { id: 'rev-sub-1-6', name: 'Remboursements de frais professionnels' },
    ]},
    { id: 'rev-main-2', name: 'VENTES DE BIENS & PRODUITS', isFixed: true, subCategories: [
        { id: 'rev-sub-2-1', name: 'Vente de marchandises' },
        { id: 'rev-sub-2-2', name: 'Vente de produits fabriqués' },
        { id: 'rev-sub-2-3', name: 'Vente d\'actifs immobilisés' },
        { id: 'rev-sub-2-4', name: 'Revente de biens personnels' },
    ]},
    { id: 'rev-main-3', name: 'PRESTATIONS DE SERVICES & ACTIVITÉS', isFixed: true, subCategories: [
        { id: 'rev-sub-3-1', name: 'Conseil & expertise' },
        { id: 'rev-sub-3-2', name: 'Prestations artistiques ou culturelles' },
        { id: 'rev-sub-3-3', name: 'Prestations sportives' },
        { id: 'rev-sub-3-4', name: 'Recettes d\'événements' },
        { id: 'rev-sub-3-5', name: 'Locations diverses' },
    ]},
    { id: 'rev-main-4', name: 'REVENUS FINANCIERS & DE PLACEMENTS', isFixed: true, subCategories: [
        { id: 'rev-sub-4-1', name: 'Dividendes' },
        { id: 'rev-sub-4-2', name: 'Intérêts perçus' },
        { id: 'rev-sub-4-3', name: 'Plus-values de cession' },
        { id: 'rev-sub-4-4', name: 'Revenus locatifs nets' },
    ]},
    { id: 'rev-main-5', name: 'AIDES, SUBVENTIONS & DOTATIONS', isFixed: true, subCategories: [
        { id: 'rev-sub-5-1', name: 'Aides publiques aux entreprises' },
        { id: 'rev-sub-5-2', name: 'Subventions associatives' },
        { id: 'rev-sub-5-3', name: 'Allocations & prestations sociales' },
        { id: 'rev-sub-5-4', name: 'Indemnités journalières' },
        { id: 'rev-sub-5-5', name: 'Pensions de retraite' },
        { id: 'rev-sub-5-6', name: 'Bourses & bourses d\'études' },
        { id: 'rev-sub-5-7', name: 'Crédit de TVA', isFixed: true },
    ]},
    { id: 'rev-main-6', name: 'APPORTS & FINANCEMENTS', isFixed: true, subCategories: [
        { id: 'rev-sub-6-1', name: 'Apports en capital' },
        { id: 'rev-sub-6-2', name: 'Emprunts & prêts reçus' },
        { id: 'rev-sub-6-3', name: 'Collecte de fonds (crowdfunding)' },
        { id: 'rev-sub-6-4', name: 'Apports personnels pour projet' },
    ]},
    { id: 'rev-main-7', name: 'REVENUS DIVERS & OCCASIONNELS', isFixed: true, subCategories: [
        { id: 'rev-sub-7-1', name: 'Dons & cadeaux en argent' },
        { id: 'rev-sub-7-2', name: 'Gains divers' },
        { id: 'rev-sub-7-3', name: 'Remboursements personnels' },
        { id: 'rev-sub-7-4', name: 'Compensations' },
    ]},
  ],
  expense: [
    { id: 'exp-main-1', name: 'RÉMUNÉRATIONS & HONORAIRES', isFixed: true, subCategories: [
        { id: 'exp-sub-1-1', name: 'Salaires, traitements et charges', criticality: 'critical' },
        { id: 'exp-sub-1-2', name: 'Honoraires (freelances, experts-comptables)', criticality: 'essential' },
        { id: 'exp-sub-1-3', name: 'Primes, bonus et participations', criticality: 'discretionary' },
        { id: 'exp-sub-1-4', name: 'Indemnités (déplacement, repas, km)', criticality: 'essential' },
        { id: 'exp-sub-1-5', name: 'Cotisations sociales personnelles', criticality: 'critical' },
    ]},
    { id: 'exp-main-2', name: 'HEBERGEMENT & LOGEMENT', isFixed: true, subCategories: [
        { id: 'exp-sub-2-1', name: 'Loyer & Charges locatives', criticality: 'critical' },
        { id: 'exp-sub-2-2', name: 'Prêt immobilier (remboursement capital)', criticality: 'critical' },
        { id: 'exp-sub-2-3', name: 'Charges de copropriété', criticality: 'critical' },
        { id: 'exp-sub-2-4', name: 'Entretien, réparations et amélioration', criticality: 'essential' },
        { id: 'exp-sub-2-5', name: 'Énergie (Électricité, Gaz, Chauffage)', criticality: 'critical' },
        { id: 'exp-sub-2-6', name: 'Eau et assainissement', criticality: 'critical' },
        { id: 'exp-sub-2-7', name: 'Assurance habitation/locaux', criticality: 'critical' },
        { id: 'exp-sub-2-8', name: 'Taxe foncière', criticality: 'critical' },
    ]},
    { id: 'exp-main-3', name: 'TRANSPORT & VÉHICULES', isFixed: true, subCategories: [
        { id: 'exp-sub-3-1', name: 'Carburant & Recharge', criticality: 'essential' },
        { id: 'exp-sub-3-2', name: 'Entretien, réparations et pièces', criticality: 'essential' },
        { id: 'exp-sub-3-3', name: 'Assurance auto/moto', criticality: 'critical' },
        { id: 'exp-sub-3-4', name: 'Péage, stationnement et amendes', criticality: 'critical' },
        { id: 'exp-sub-3-5', name: 'Transport en commun (abonnements)', criticality: 'essential' },
        { id: 'exp-sub-3-6', name: 'Taxi, VTC, location de véhicule', criticality: 'discretionary' },
        { id: 'exp-sub-3-7', name: 'Voyages longue distance (billets de train, d\'avion)', criticality: 'discretionary' },
    ]},
    { id: 'exp-main-4', name: 'NOURRITURE & RESTAURATION', isFixed: true, subCategories: [
        { id: 'exp-sub-4-1', name: 'Courses alimentaires (supermarché)', criticality: 'essential' },
        { id: 'exp-sub-4-2', name: 'Restaurant, café, bar', criticality: 'discretionary' },
        { id: 'exp-sub-4-3', name: 'Livraison de repas à domicile', criticality: 'discretionary' },
        { id: 'exp-sub-4-4', name: 'Repas en déplacement professionnel', criticality: 'essential' },
    ]},
    { id: 'exp-main-5', name: 'COMMUNICATION, INTERNET & ABONNEMENTS', isFixed: true, subCategories: [
        { id: 'exp-sub-5-1', name: 'Téléphonie mobile et fixe', criticality: 'essential' },
        { id: 'exp-sub-5-2', name: 'Internet (Box) et Abonnements TV', criticality: 'essential' },
        { id: 'exp-sub-5-3', name: 'Logiciels et applications (SaaS)', criticality: 'essential' },
        { id: 'exp-sub-5-4', name: 'Hébergement web, nom de domaine', criticality: 'essential' },
        { id: 'exp-sub-5-5', name: 'Équipements tech (ordinateur, smartphone)', criticality: 'discretionary' },
    ]},
    { id: 'exp-main-6', name: 'LOISIRS, CULTURE & SPORT', isFixed: true, subCategories: [
        { id: 'exp-sub-6-1', name: 'Abonnements culturels (Streaming, presse, jeux vidéo)', criticality: 'discretionary' },
        { id: 'exp-sub-6-2', name: 'Sports (Club, équipement, licence)', criticality: 'discretionary' },
        { id: 'exp-sub-6-3', name: 'Sorties (Cinéma, concert, musée, événement)', criticality: 'discretionary' },
        { id: 'exp-sub-6-4', name: 'Hobbies et passions', criticality: 'discretionary' },
        { id: 'exp-sub-6-5', name: 'Vacances et week-ends', criticality: 'discretionary' },
        { id: 'exp-sub-6-6', name: 'Cotisations associatives', criticality: 'discretionary' },
    ]},
    { id: 'exp-main-7', name: 'SANTÉ & BIEN-ÊTRE', isFixed: true, subCategories: [
        { id: 'exp-sub-7-1', name: 'Mutuelle santé', criticality: 'critical' },
        { id: 'exp-sub-7-2', name: 'Frais médicaux (consultations, pharmacie)', criticality: 'critical' },
        { id: 'exp-sub-7-3', name: 'Soins (dentiste, opticien, kiné)', criticality: 'essential' },
        { id: 'exp-sub-7-4', name: 'Bien-être (Coaching, yoga, cosmétiques)', criticality: 'discretionary' },
    ]},
    { id: 'exp-main-8', name: 'PROJET IMMOBILIER & INVESTISSEMENTS', isFixed: true, subCategories: [
        { id: 'exp-sub-8-1', name: 'Apport personnel', criticality: 'discretionary' },
        { id: 'exp-sub-8-2', name: 'Frais de notaire', criticality: 'critical' },
        { id: 'exp-sub-8-3', name: 'Travaux d\'aménagement importants', criticality: 'discretionary' },
        { id: 'exp-sub-8-4', name: 'Achat de mobilier durable', criticality: 'discretionary' },
        { id: 'exp-sub-8-5', name: 'Investissements financiers (PEA, etc.)', criticality: 'discretionary' },
    ]},
    { id: 'exp-main-9', name: 'ACTIVITÉ PROFESSIONNELLE & ENTREPRISE', isFixed: true, subCategories: [
        { id: 'exp-sub-9-1', name: 'Marketing et publicité', criticality: 'discretionary' },
        { id: 'exp-sub-9-2', name: 'Achat de marchandises / matières premières', criticality: 'essential' },
        { id: 'exp-sub-9-3', name: 'Sous-traitance', criticality: 'essential' },
        { id: 'exp-sub-9-4', name: 'Frais de déplacement professionnel', criticality: 'essential' },
        { id: 'exp-sub-9-5', name: 'Cotisations et frais professionnels', criticality: 'critical' },
        { id: 'exp-sub-9-6', name: 'Assurance responsabilité civile pro (RC Pro)', criticality: 'critical' },
        { id: 'exp-sub-9-7', name: 'Fournitures de bureau', criticality: 'essential' },
        { id: 'exp-sub-9-8', name: 'Petit équipement', criticality: 'discretionary' },
    ]},
    { id: 'exp-main-10', name: 'FINANCES & ASSURANCES', isFixed: true, subCategories: [
        { id: 'exp-sub-10-1', name: 'Intérêts d\'emprunts', criticality: 'critical' },
        { id: 'exp-sub-10-2', name: 'Frais bancaires', criticality: 'essential' },
        { id: 'exp-sub-10-3', name: 'Assurance emprunteur', criticality: 'critical' },
        { id: 'exp-sub-10-4', name: 'Autres assurances (RC Familiale, etc.)', criticality: 'critical' },
    ]},
    { id: 'exp-main-11', name: 'IMPÔTS & CONTRIBUTIONS', isFixed: true, subCategories: [
        { id: 'exp-sub-11-1', name: 'Impôt sur le revenu / sur les sociétés', criticality: 'critical' },
        { id: 'exp-sub-11-2', name: 'TVA collectée', isFixed: true, criticality: 'critical' },
        { id: 'exp-sub-11-3', name: 'TVA déductible', isFixed: true, criticality: 'critical' },
        { id: 'exp-sub-11-4', name: 'TVA à payer', isFixed: true, criticality: 'critical' },
        { id: 'exp-sub-11-5', name: 'Taxe d\'habitation', criticality: 'critical' },
        { id: 'exp-sub-11-6', name: 'Cotisation Foncière des Entreprises (CFE)', criticality: 'critical' },
        { id: 'exp-sub-11-7', name: 'Dons et mécénat', criticality: 'discretionary' },
    ]},
    { id: 'exp-main-12', name: 'FAMILLE & ENFANTS', isFixed: true, subCategories: [
        { id: 'exp-sub-12-1', name: 'Frais de scolarité et garde', criticality: 'critical' },
        { id: 'exp-sub-12-2', name: 'Activités extrascolaires', criticality: 'discretionary' },
        { id: 'exp-sub-12-3', name: 'Vêtements et fournitures pour enfants', criticality: 'essential' },
    ]},
    { id: 'exp-main-13', name: 'ÉPARGNE & DOSSIERS', isFixed: true, subCategories: [
        { id: 'exp-sub-13-1', name: 'Versement épargne (Livret A, etc.)', criticality: 'discretionary' },
        { id: 'exp-sub-13-2', name: 'Épargne retraite (PER)', criticality: 'discretionary' },
        { id: 'exp-sub-13-3', name: 'Frais divers et imprévus', criticality: 'essential' },
    ]},
    { id: 'exp-main-14', name: 'AMEUBLEMENT, ÉQUIPEMENT & DÉCORATION', isFixed: true, subCategories: [
        { id: 'exp-sub-14-1', name: 'Mobilier & Agencement', criticality: 'discretionary' },
        { id: 'exp-sub-14-2', name: 'Électroménager', criticality: 'discretionary' },
        { id: 'exp-sub-14-3', name: 'Décoration & Ambiance', criticality: 'discretionary' },
        { id: 'exp-sub-14-4', name: 'Matériel et outillage', criticality: 'discretionary' },
        { id: 'exp-sub-14-5', name: 'Location de mobilier/équipement', criticality: 'discretionary' },
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
        case 'SET_INITIAL_DATA': {
            const { customCategoriesRes, ...restPayload } = action.payload;
            const fetchedCategories = customCategoriesRes || [];
            const customMain = fetchedCategories.filter(c => !c.parent_id);
            const customSubs = fetchedCategories.filter(c => c.parent_id);
            const finalCategories = JSON.parse(JSON.stringify(initialCategories));

            // Merge default and custom main categories
            customMain.forEach(main => {
                if (!finalCategories[main.type].some(m => m.id === main.id)) {
                    finalCategories[main.type].push({ id: main.id, name: main.name, isFixed: main.is_fixed, subCategories: [] });
                }
            });

            // Merge default and custom sub-categories
            customSubs.forEach(sub => {
                let parent = finalCategories.revenue.find(m => m.id === sub.parent_id) || finalCategories.expense.find(m => m.id === sub.parent_id);
                if (parent && !parent.subCategories.some(s => s.id === sub.id)) {
                    parent.subCategories.push({ id: sub.id, name: sub.name, isFixed: sub.is_fixed, criticality: sub.criticality || 'essential' });
                }
            });

            return {
                ...state,
                ...restPayload,
                categories: finalCategories,
                allProfiles: action.payload.allProfiles || [],
            };
        }
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
        case 'UPDATE_SUB_CATEGORY_CRITICALITY_SUCCESS': {
            const { subCategoryId, criticality } = action.payload;
            const newCategories = JSON.parse(JSON.stringify(state.categories));
            let found = false;
            for (const type of ['revenue', 'expense']) {
                for (const mainCat of newCategories[type]) {
                    const subCatIndex = mainCat.subCategories.findIndex(sc => sc.id === subCategoryId);
                    if (subCatIndex > -1) {
                        mainCat.subCategories[subCatIndex].criticality = criticality;
                        found = true;
                        break;
                    }
                }
                if(found) break;
            }
            return { ...state, categories: newCategories };
        }
        case 'ADD_SUB_CATEGORY_SUCCESS': {
            const { type, mainCategoryId, newSubCategory, oldMainCategoryId } = action.payload;
            const newCategories = JSON.parse(JSON.stringify(state.categories));
            
            const idToFind = oldMainCategoryId || mainCategoryId; 

            const mainCat = newCategories[type].find(mc => mc.id === idToFind);
            
            if (mainCat) {
                if (oldMainCategoryId) {
                    mainCat.id = mainCategoryId;
                }
                if (!mainCat.subCategories.some(sc => sc.id === newSubCategory.id)) {
                    mainCat.subCategories.push(newSubCategory);
                }
            }
            return { ...state, categories: newCategories };
        }
        case 'ADD_USER_CASH_ACCOUNT_SUCCESS': {
            const { projectId, newAccount } = action.payload;
            const newAllCashAccounts = { ...state.allCashAccounts };
            if (!newAllCashAccounts[projectId]) {
                newAllCashAccounts[projectId] = [];
            }
            newAllCashAccounts[projectId] = [...newAllCashAccounts[projectId], newAccount];
            return { ...state, allCashAccounts: newAllCashAccounts };
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
