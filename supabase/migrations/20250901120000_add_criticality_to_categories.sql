/*
          # [Operation Name]
          Ajout et mise à jour de la criticité des catégories

          ## Query Description: "Cette opération ajoute une colonne `criticality` à la table des catégories et assigne un niveau de criticité (Critique, Essentiel, Discrétionnaire) à chaque sous-catégorie de dépense existante. Elle est conçue pour être sûre et n'affecte pas les données existantes de manière destructive."
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Table affectée: `public.user_categories`
          - Colonne ajoutée: `criticality` (type TEXT)
          
          ## Security Implications:
          - RLS Status: Inchangé
          - Policy Changes: Non
          - Auth Requirements: Non
          
          ## Performance Impact:
          - Indexes: Aucun ajout ou suppression.
          - Triggers: Aucun.
          - Estimated Impact: Faible. L'opération peut prendre quelques secondes sur une base de données très volumineuse.
          */
ALTER TABLE public.user_categories
ADD COLUMN IF NOT EXISTS criticality TEXT;

UPDATE public.user_categories
SET criticality = 'essential'
WHERE parent_id IS NOT NULL AND criticality IS NULL;

UPDATE public.user_categories
SET criticality = 'critical'
WHERE name IN (
    'Salaires, traitements et charges', 'Cotisations sociales personnelles', 'Loyer & Charges locatives', 
    'Prêt immobilier (remboursement capital)', 'Charges de copropriété', 'Énergie (Électricité, Gaz, Chauffage)', 
    'Eau et assainissement', 'Assurance habitation/locaux', 'Taxe foncière', 'Assurance auto/moto', 
    'Péage, stationnement et amendes', 'Mutuelle santé', 'Frais médicaux (consultations, pharmacie)', 
    'Frais de notaire', 'Cotisations et frais professionnels', 'Assurance responsabilité civile pro (RC Pro)', 
    'Intérêts d''emprunts', 'Assurance emprunteur', 'Autres assurances (RC Familiale, etc.)', 
    'Impôt sur le revenu / sur les sociétés', 'Taxe d''habitation', 'Cotisation Foncière des Entreprises (CFE)', 
    'Frais de scolarité et garde', 'TVA à payer'
);

UPDATE public.user_categories
SET criticality = 'essential'
WHERE name IN (
    'Honoraires (freelances, experts-comptables)', 'Indemnités (déplacement, repas, km)', 'Entretien, réparations et amélioration', 
    'Carburant & Recharge', 'Entretien, réparations et pièces', 'Transport en commun (abonnements)', 
    'Courses alimentaires (supermarché)', 'Repas en déplacement professionnel', 'Téléphonie mobile et fixe', 
    'Internet (Box) et Abonnements TV', 'Logiciels et applications (SaaS)', 'Hébergement web, nom de domaine', 
    'Soins (dentiste, opticien, kiné)', 'Achat de marchandises / matières premières', 'Sous-traitance', 
    'Frais de déplacement professionnel', 'Fournitures de bureau', 'Frais bancaires', 
    'Vêtements et fournitures pour enfants', 'Frais divers et imprévus'
);

UPDATE public.user_categories
SET criticality = 'discretionary'
WHERE name IN (
    'Primes, bonus et participations', 'Taxi, VTC, location de véhicule', 'Voyages longue distance (billets de train, d''avion)', 
    'Restaurant, café, bar', 'Livraison de repas à domicile', 'Équipements tech (ordinateur, smartphone)', 
    'Abonnements culturels (Streaming, presse, jeux vidéo)', 'Sports (Club, équipement, licence)', 
    'Sorties (Cinéma, concert, musée, événement)', 'Hobbies et passions', 'Vacances et week-ends', 
    'Cotisations associatives', 'Bien-être (Coaching, yoga, cosmétiques)', 'Apport personnel', 
    'Travaux d''aménagement importants', 'Achat de mobilier durable', 'Investissements financiers (PEA, etc.)', 
    'Marketing et publicité', 'Petit équipement', 'Dons et mécénat', 'Activités extrascolaires', 
    'Versement épargne (Livret A, etc.)', 'Épargne retraite (PER)', 'Mobilier & Agencement', 
    'Électroménager', 'Décoration & Ambiance', 'Matériel et outillage', 'Location de mobilier/équipement'
);
