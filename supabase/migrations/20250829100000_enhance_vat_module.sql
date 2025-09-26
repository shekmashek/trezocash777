/*
          # [Enhancement] Amélioration du Module TVA
          Ce script ajoute les colonnes nécessaires pour gérer les taux de TVA par transaction et stocker les résultats des déclarations.

          ## Query Description:
          Cette opération ajoute de nouvelles colonnes aux tables `actual_transactions` et `vat_declarations`. Elle n'affecte aucune donnée existante et est considérée comme sûre. Les nouvelles colonnes auront des valeurs `NULL` pour les enregistrements existants.

          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Ajoute la colonne `vat_rate` à la table `actual_transactions`.
          - Ajoute les colonnes `collected_vat`, `deductible_vat`, et `vat_due` à la table `vat_declarations`.
          
          ## Security Implications:
          - RLS Status: Pas de changement.
          - Policy Changes: Non.
          - Auth Requirements: Non.
          
          ## Performance Impact:
          - Indexes: Aucun ajout.
          - Triggers: Aucun ajout.
          - Estimated Impact: Faible. L'ajout de colonnes avec des valeurs par défaut `NULL` est une opération rapide.
          */

-- Ajoute un champ pour le taux de TVA sur chaque transaction réelle
ALTER TABLE public.actual_transactions
ADD COLUMN vat_rate NUMERIC(5, 2);

COMMENT ON COLUMN public.actual_transactions.vat_rate IS 'Taux de TVA appliqué à la transaction (ex: 20.00 pour 20%).';

-- Ajoute les champs pour les montants calculés dans les déclarations
ALTER TABLE public.vat_declarations
ADD COLUMN collected_vat NUMERIC,
ADD COLUMN deductible_vat NUMERIC,
ADD COLUMN vat_due NUMERIC;

COMMENT ON COLUMN public.vat_declarations.collected_vat IS 'Montant total de la TVA collectée pour la période.';
COMMENT ON COLUMN public.vat_declarations.deductible_vat IS 'Montant total de la TVA déductible pour la période.';
COMMENT ON COLUMN public.vat_declarations.vat_due IS 'Montant de la TVA à payer (collectée - déductible).';
