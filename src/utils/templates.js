import { v4 as uuidv4 } from 'uuid';

export const templates = {
  personal: [
    {
      id: 'family',
      name: 'Budget Familial',
      description: 'Suivez les revenus, les dépenses courantes, l\'épargne et les projets de votre famille.',
      icon: 'Home',
      color: 'blue',
      data: {
        cashAccounts: [
          { id: uuidv4(), mainCategoryId: 'bank', name: 'Compte Courant Joint', initialBalance: 1500 },
          { id: uuidv4(), mainCategoryId: 'savings', name: 'Livret A', initialBalance: 5000 },
        ],
        entries: [
          { id: uuidv4(), type: 'revenu', category: 'Salaires et traitements', supplier: 'Salaire Principal', amount: 2500, frequency: 'mensuel' },
          { id: uuidv4(), type: 'revenu', category: 'Salaires et traitements', supplier: 'Salaire Conjoint(e)', amount: 1800, frequency: 'mensuel' },
          { id: uuidv4(), type: 'depense', category: 'Logement', supplier: 'Loyer / Crédit Immobilier', amount: 1200, frequency: 'mensuel' },
          { id: uuidv4(), type: 'depense', category: 'Eau et Electricité', supplier: 'Facture Énergie (EDF, etc.)', amount: 150, frequency: 'mensuel' },
          { id: uuidv4(), type: 'depense', category: 'Communication et divertissement', supplier: 'Abonnement Internet/Mobile', amount: 50, frequency: 'mensuel' },
          { id: uuidv4(), type: 'depense', category: 'Assurance divers', supplier: 'Assurance Habitation', amount: 30, frequency: 'mensuel' },
          { id: uuidv4(), type: 'depense', category: 'Nourriture & alimentation', supplier: 'Courses Alimentaires', amount: 600, frequency: 'mensuel' },
          { id: uuidv4(), type: 'depense', category: 'Transports et déplacement', supplier: 'Carburant / Transports en commun', amount: 150, frequency: 'mensuel' },
          { id: uuidv4(), type: 'depense', category: 'Sorties et restaurants', supplier: 'Restaurants & Loisirs', amount: 200, frequency: 'mensuel' },
          { id: uuidv4(), type: 'depense', category: 'Epargne Projet à court et moyen termes', supplier: 'Épargne Mensuelle', amount: 250, frequency: 'mensuel' },
        ],
        tiers: [], loans: [], borrowings: [],
      }
    },
    {
      id: 'vacation',
      name: 'Projet Vacances',
      description: 'Planifiez le budget pour votre prochain grand voyage.',
      icon: 'Plane',
      color: 'teal',
      data: {
        cashAccounts: [
          { id: uuidv4(), mainCategoryId: 'savings', name: 'Cagnotte Vacances', initialBalance: 500 },
        ],
        entries: [
          { id: uuidv4(), type: 'revenu', category: 'Autres Entrées', supplier: 'Apport personnel', amount: 500, frequency: 'ponctuel' },
          { id: uuidv4(), type: 'depense', category: 'Transports et déplacement', supplier: 'Billets d\'avion/train', amount: 800, frequency: 'ponctuel' },
          { id: uuidv4(), type: 'depense', category: 'Logement', supplier: 'Hébergement (Hôtel, Airbnb)', amount: 1200, frequency: 'ponctuel' },
          { id: uuidv4(), type: 'depense', category: 'Nourriture & alimentation', supplier: 'Restaurants sur place', amount: 600, frequency: 'ponctuel' },
          { id: uuidv4(), type: 'depense', category: 'Sorties et restaurants', supplier: 'Activités et visites', amount: 400, frequency: 'ponctuel' },
        ],
        tiers: [], loans: [], borrowings: [],
      }
    },
    {
        id: 'wedding',
        name: 'Projet Mariage',
        description: 'Organisez le budget du plus beau jour de votre vie.',
        icon: 'Heart',
        color: 'pink',
        data: {
            cashAccounts: [
                { id: uuidv4(), mainCategoryId: 'bank', name: 'Compte Mariage', initialBalance: 2000 },
            ],
            entries: [
                { id: uuidv4(), type: 'revenu', category: 'Autres Entrées', supplier: 'Participation Familles', amount: 5000, frequency: 'ponctuel' },
                { id: uuidv4(), type: 'depense', category: 'Célébration', supplier: 'Lieu de réception', amount: 4000, frequency: 'ponctuel' },
                { id: uuidv4(), type: 'depense', category: 'Célébration', supplier: 'Traiteur', amount: 6000, frequency: 'ponctuel' },
                { id: uuidv4(), type: 'depense', category: 'Habillement & Textile', supplier: 'Robes et Costumes', amount: 2500, frequency: 'ponctuel' },
                { id: uuidv4(), type: 'depense', category: 'Célébration', supplier: 'Photographe / Vidéaste', amount: 2000, frequency: 'ponctuel' },
            ],
            tiers: [], loans: [], borrowings: [],
        }
    }
  ],
  professional: [
    {
      id: 'freelance',
      name: 'Freelance / Auto-entrepreneur',
      description: 'Un modèle simple pour suivre vos missions, charges sociales et frais professionnels.',
      icon: 'User',
      color: 'indigo',
      data: {
        cashAccounts: [
          { id: uuidv4(), mainCategoryId: 'bank', name: 'Compte Professionnel', initialBalance: 1000 },
        ],
        entries: [
          { id: uuidv4(), type: 'revenu', category: 'Ventes de services', supplier: 'Mission Client A', amount: 2500, frequency: 'mensuel' },
          { id: uuidv4(), type: 'revenu', category: 'Ventes de services', supplier: 'Mission Client B', amount: 1500, frequency: 'ponctuel' },
          { id: uuidv4(), type: 'depense', category: 'Charges sociales', supplier: 'URSSAF', amount: 800, frequency: 'trimestriel' },
          { id: uuidv4(), type: 'depense', category: 'Impôt sur les sociétés', supplier: 'Impôt sur le revenu', amount: 300, frequency: 'mensuel' },
          { id: uuidv4(), type: 'depense', category: 'Abonnement', supplier: 'Abonnement Logiciel (Adobe, etc.)', amount: 60, frequency: 'mensuel' },
          { id: uuidv4(), type: 'depense', category: 'Frais administratives et de gestion', supplier: 'Frais bancaires Pro', amount: 20, frequency: 'mensuel' },
        ],
        tiers: [], loans: [], borrowings: [],
      }
    },
    {
      id: 'tpe',
      name: 'TPE / Artisan',
      description: 'Suivez vos chantiers, vos achats de matières premières et vos charges fixes.',
      icon: 'Briefcase',
      color: 'amber',
      data: {
        cashAccounts: [
          { id: uuidv4(), mainCategoryId: 'bank', name: 'Compte Principal TPE', initialBalance: 5000 },
        ],
        entries: [
          { id: uuidv4(), type: 'revenu', category: 'Ventes de services', supplier: 'Chantier A', amount: 15000, frequency: 'ponctuel' },
          { id: uuidv4(), type: 'revenu', category: 'Ventes de services', supplier: 'Petit travaux Client B', amount: 2000, frequency: 'ponctuel' },
          { id: uuidv4(), type: 'depense', category: 'Matière premiere', supplier: 'Fournisseur Matériaux', amount: 7000, frequency: 'ponctuel' },
          { id: uuidv4(), type: 'depense', category: 'Salaires et traitements', supplier: 'Salaire Employé 1', amount: 1800, frequency: 'mensuel' },
          { id: uuidv4(), type: 'depense', category: 'Charges sociales', supplier: 'Charges Sociales', amount: 900, frequency: 'mensuel' },
          { id: uuidv4(), type: 'depense', category: 'Loyer et charges', supplier: 'Loyer Atelier', amount: 800, frequency: 'mensuel' },
        ],
        tiers: [], loans: [], borrowings: [],
      }
    },
    {
        id: 'restaurant',
        name: 'Restaurant / Café',
        description: 'Gérez vos achats de denrées, salaires, et revenus journaliers.',
        icon: 'Coffee',
        color: 'orange',
        data: {
          cashAccounts: [
            { id: uuidv4(), mainCategoryId: 'bank', name: 'Compte Bancaire Pro', initialBalance: 3000 },
            { id: uuidv4(), mainCategoryId: 'cash', name: 'Caisse Journalière', initialBalance: 200 },
          ],
          entries: [
            { id: uuidv4(), type: 'revenu', category: 'Ventes de produits', supplier: 'Recettes Journalières', amount: 500, frequency: 'journalier' },
            { id: uuidv4(), type: 'depense', category: 'Matière premiere', supplier: 'Fournisseur Boissons', amount: 1500, frequency: 'mensuel' },
            { id: uuidv4(), type: 'depense', category: 'Matière premiere', supplier: 'Fournisseur Nourriture', amount: 3000, frequency: 'mensuel' },
            { id: uuidv4(), type: 'depense', category: 'Salaires et traitements', supplier: 'Salaires Équipe', amount: 4000, frequency: 'mensuel' },
            { id: uuidv4(), type: 'depense', category: 'Loyer et charges', supplier: 'Loyer du local', amount: 2000, frequency: 'mensuel' },
          ],
          tiers: [], loans: [], borrowings: [],
        }
    },
    {
        id: 'association',
        name: 'Association',
        description: 'Suivez les cotisations, les subventions et les dépenses de fonctionnement.',
        icon: 'HeartHandshake',
        color: 'rose',
        data: {
          cashAccounts: [
            { id: uuidv4(), mainCategoryId: 'bank', name: 'Compte Association', initialBalance: 1200 },
          ],
          entries: [
            { id: uuidv4(), type: 'revenu', category: 'Autres Entrées', supplier: 'Cotisations des membres', amount: 500, frequency: 'annuel' },
            { id: uuidv4(), type: 'revenu', category: 'Subventions', supplier: 'Subvention Mairie', amount: 2000, frequency: 'ponctuel' },
            { id: uuidv4(), type: 'depense', category: 'Frais administratives et de gestion', supplier: 'Frais de fonctionnement', amount: 100, frequency: 'mensuel' },
            { id: uuidv4(), type: 'depense', category: 'Marketing et publicité', supplier: 'Organisation événement', amount: 800, frequency: 'ponctuel' },
          ],
          tiers: [], loans: [], borrowings: [],
        }
    }
  ]
};
