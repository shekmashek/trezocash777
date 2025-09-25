/*
          # [Operation Name]
          Ajout des colonnes pour la gestion des provisions

          ## Query Description: [Cette opération ajoute les colonnes nécessaires à la table `budget_entries` pour permettre la gestion des fonds provisionnés. Elle n'affecte pas les données existantes et est sûre à exécuter.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Table affectée: `public.budget_entries`
          - Colonnes ajoutées: `is_provision`, `provision_details`, `payments`
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [None]
          - Triggers: [None]
          - Estimated Impact: [Négligeable]
          */

ALTER TABLE public.budget_entries
ADD COLUMN IF NOT EXISTS is_provision BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS provision_details JSONB,
ADD COLUMN IF NOT EXISTS payments JSONB;
