const translations = {
  fr: {
    nav: {
        treasury: 'Trésorerie',
        payables: 'Sorties',
        receivables: 'Entrées',
        expenseAnalysis: 'Analyse',
        budgetJournal: 'Journal du Budget',
        paymentJournal: 'Journal des Paiements',
        settingsAdvanced: 'Avancés',
    },
    sidebar: {
        settings: 'Paramètres',
        analysisUnit: "Unité d'analyse",
        horizon: 'Horizon',
        currency: 'Devise',
        unit: 'Unité',
        decimals: 'Décimales',
        language: 'Langue',
        day: 'Jour',
        week: 'Semaine',
        fortnightly: 'Quinzaine',
        month: 'Mois',
        bimonthly: 'Bimestre',
        quarterly: 'Trimestre',
        semiannually: 'Semestre',
        annually: 'Année',
        standard: 'Standard',
        thousands: 'Milliers (K)',
        millions: 'Millions (M)',
    },
    advancedSettings: {
        categories: 'Catégories',
        tiers: 'Tiers',
        accounts: 'Comptes',
        exchangeRates: 'Taux de change',
        archives: 'Archives',
    },
    common: {
        save: 'Enregistrer',
        cancel: 'Annuler',
        delete: 'Supprimer',
        edit: 'Modifier',
        add: 'Ajouter',
        new: 'Nouveau',
        confirm: 'Êtes-vous sûr ?',
        projectName: 'Nom du projet',
    },
    subHeader: {
        consolidatedBudget: 'Mes projets consolidé',
        newProject: 'Nouveau projet',
    },
    onboarding: {
        mainTitle: 'Votre Projet Trezocash',
        projectType: 'Type de projet',
        useCasePersonal: 'Suivi Personnel',
        useCaseBusiness: 'Petite Entreprise',
        projectName: 'Nom du projet',
        currency: 'Devise',
        monthlyIncomeGoal: "Objectif d'entrée mensuel",
        monthlyExpenseGoal: "Objectif de sortie mensuel",
        startingCash: 'Trésorerie de départ',
        configuredIncomes: 'Total entrées configurées',
        configuredExpenses: 'Total sorties configurées',
        canChangeLater: 'Vous pourrez modifier tous ces paramètres plus tard.',
        welcomeTitle: 'Bienvenue ! À quoi servira Trezocash ?',
        welcomePersonalTitle: 'Suivi Personnel',
        welcomePersonalDesc: 'Pour gérer mon budget, mes économies et mes dépenses du quotidien.',
        welcomeBusinessTitle: 'Petite Entreprise',
        welcomeBusinessDesc: "Pour piloter la trésorerie de mon activité, suivre les factures et anticiper.",
        projectNameTitle: "Comment s'appelle votre projet ?",
        projectNamePlaceholder: 'Ex: Mon Budget 2025, Trésorerie SARL...',
        currencyTitle: 'Quelle est la devise principale de ce projet ?',
        currencyDesc: 'Vous pourrez gérer les taux de change plus tard.',
        other: 'Autre...',
        goalsTitle: 'Quels sont vos objectifs financiers mensuels ?',
        goalsDesc: 'Indiquez vos prévisions. Cela nous aidera à configurer vos objectifs annuels.',
        goalsIncomeLabel: 'Entrée mensuelle prévue',
        goalsExpenseLabel: 'Objectif de sortie mensuelle',
        initialCashTitle: 'Votre trésorerie de départ',
        initialCashDesc: "Listez vos comptes et leur solde actuel. Vous pourrez en ajouter d'autres plus tard.",
        addAccount: 'Ajouter un compte',
        entriesTitle: "Quelles sont vos principales entrées d'argent ?",
        entriesDesc: "Ajoutez quelques éléments pour commencer. Vous pourrez tout modifier plus tard.",
        expensesTitle: 'Parlons de vos dépenses en "{categoryName}"',
        addRow: 'Ajouter une ligne',
        finishTitle: 'Tout est prêt !',
        finishDesc: 'Votre premier projet est prêt à être lancé. Vous pourrez affiner ces informations plus tard.',
        launchApp: "Lancer l'application",
        previous: 'Précédent',
        next: 'Suivant',
        finishSetup: 'Terminer la configuration',
    },
  }
};

export const t = (key, params = {}) => {
    const lang = 'fr';
    const keys = key.split('.');
    let result = translations[lang];
    for (const k of keys) {
        result = result?.[k];
        if (result === undefined) return key;
    }
    
    if (typeof result === 'string' && Object.keys(params).length > 0) {
        return Object.entries(params).reduce((str, [paramKey, paramValue]) => {
            return str.replace(`{${paramKey}}`, paramValue);
        }, result);
    }

    return result;
};
