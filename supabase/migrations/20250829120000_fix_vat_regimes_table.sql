/*
# [Correctif] Ajout de colonnes manquantes à la table vat_regimes
Ce script corrige une erreur où des colonnes essentielles n'ont pas été ajoutées à la table des régimes de TVA.

## Description de la Requête:
- Cette opération ajoute les colonnes `collection_periodicity` et `payment_delay_months` à la table `vat_regimes` si elles n'existent pas déjà.
- Elle est sûre et n'affectera pas les données existantes dans les autres tables.

## Metadata:
- Schema-Category: ["Structural", "Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true

## Security Implications:
- RLS Status: Inchangé
- Policy Changes: Non
- Auth Requirements: Admin
*/

ALTER TABLE public.vat_regimes ADD COLUMN IF NOT EXISTS collection_periodicity text NOT NULL DEFAULT 'monthly'::text;
ALTER TABLE public.vat_regimes ADD COLUMN IF NOT EXISTS payment_delay_months integer NOT NULL DEFAULT 1;
