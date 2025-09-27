/*
          # [Opération d'Ajout de Criticité]
          Ajoute une colonne `criticality` à la table `user_categories` et initialise les valeurs par défaut pour les catégories existantes.

          ## Query Description: "Cette opération ajoute une nouvelle dimension d'analyse à vos catégories de dépenses. Elle est non destructive et entièrement réversible. Aucune donnée existante ne sera perdue. Les valeurs par défaut sont basées sur les standards comptables français et peuvent être modifiées depuis l'application."
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Ajoute la colonne `criticality` de type `TEXT` à la table `public.user_categories`.
          - Met à jour les valeurs de cette nouvelle colonne pour les catégories existantes.
          
          ## Security Implications:
          - RLS Status: Inchangé
          - Policy Changes: Non
          - Auth Requirements: Non
          
          ## Performance Impact:
          - Indexes: Aucun
          - Triggers: Aucun
          - Estimated Impact: Faible. L'opération peut prendre quelques secondes sur une table très volumineuse.
          */

-- Ajoute la colonne `criticality` si elle n'existe pas déjà
ALTER TABLE public.user_categories
ADD COLUMN IF NOT EXISTS criticality TEXT;

-- Met à jour les catégories CRITIQUES
UPDATE public.user_categories
SET criticality = 'critical'
WHERE name IN (
    'Salaires, traitements et charges',
    'Cotisations sociales personnelles',
    'Loyer & Charges locatives',
    'Prêt immobilier (remboursement capital)',
    'Charges de copropriété',
    'Énergie (Électricité, Gaz, Chauffage)',
    'Eau et assainissement',
    'Assurance habitation/locaux',
    'Taxe foncière',
    'Assurance auto/moto',
    'Péage, stationnement et amendes',
    'Mutuelle santé',
    'Frais médicaux (consultations, pharmacie)',
    'Frais de notaire',
    'Intérêts d''emprunts',
    'Assurance emprunteur',
    'Autres assurances (RC Familiale, etc.)',
    'Impôt sur le revenu / sur les sociétés',
    'TVA collectée',
    'TVA déductible',
    'TVA à payer',
    'Taxe d''habitation',
    'Cotisation Foncière des Entreprises (CFE)',
    'Frais de scolarité et garde',
    'Assurance responsabilité civile pro (RC Pro)',
    'Cotisations et frais professionnels'
);

-- Met à jour les catégories ESSENTIELLES
UPDATE public.user_categories
SET criticality = 'essential'
WHERE name IN (
    'Honoraires (freelances, experts-comptables)',
    'Indemnités (déplacement, repas, km)',
    'Entretien, réparations et amélioration',
    'Carburant & Recharge',
    'Entretien, réparations et pièces',
    'Transport en commun (abonnements)',
    'Courses alimentaires (supermarché)',
    'Repas en déplacement professionnel',
    'Téléphonie mobile et fixe',
    'Internet (Box) et Abonnements TV',
    'Logiciels et applications (SaaS)',
    'Hébergement web, nom de domaine',
    'Soins (dentiste, opticien, kiné)',
    'Achat de marchandises / matières premières',
    'Sous-traitance',
    'Frais de déplacement professionnel',
    'Frais bancaires',
    'Vêtements et fournitures pour enfants',
    'Frais divers et imprévus',
    'Fournitures de bureau'
);

-- Met à jour les catégories DISCRÉTIONNAIRES
UPDATE public.user_categories
SET criticality = 'discretionary'
WHERE name IN (
    'Primes, bonus et participations',
    'Taxi, VTC, location de véhicule',
    'Voyages longue distance (billets de train, d''avion)',
    'Restaurant, café, bar',
    'Livraison de repas à domicile',
    'Équipements tech (ordinateur, smartphone)',
    'Abonnements culturels (Streaming, presse, jeux vidéo)',
    'Sports (Club, équipement, licence)',
    'Sorties (Cinéma, concert, musée, événement)',
    'Hobbies et passions',
    'Vacances et week-ends',
    'Cotisations associatives',
    'Bien-être (Coaching, yoga, cosmétiques)',
    'Apport personnel',
    'Travaux d''aménagement importants',
    'Achat de mobilier durable',
    'Investissements financiers (PEA, etc.)',
    'Marketing et publicité',
    'Dons et mécénat',
    'Versement épargne (Livret A, etc.)',
    'Épargne retraite (PER)',
    'Petit équipement',
    'Mobilier & Agencement',
    'Électroménager',
    'Décoration & Ambiance',
    'Matériel et outillage',
    'Location de mobilier/équipement'
);
