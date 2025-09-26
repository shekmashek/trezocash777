/*
          # [Operation Name]
          Ajout de la colonne payment_terms à la table tiers

          ## Query Description: [Cette opération ajoute une colonne `payment_terms` de type JSONB à la table `tiers` pour stocker les échéanciers de paiement personnalisés. Elle est non destructive et essentielle pour la nouvelle fonctionnalité.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Table affectée: public.tiers
          - Colonne ajoutée: payment_terms (jsonb)
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [None]
          - Triggers: [None]
          - Estimated Impact: [Négligeable]
          */
ALTER TABLE public.tiers
ADD COLUMN IF NOT EXISTS payment_terms jsonb;
