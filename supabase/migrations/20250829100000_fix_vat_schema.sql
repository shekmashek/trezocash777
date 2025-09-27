/*
# [Correctif] Réinitialisation du Schéma TVA
Ce script va réinitialiser les tables et types liés au régime de TVA pour corriger les incohérences.

## Description de la Requête:
- **Risque :** Faible. Seules les configurations de régime de TVA existantes (qui sont actuellement en erreur) seront supprimées et recréées. Aucune donnée de transaction n'est affectée.
- **Action :** Supprime et recrée la table `vat_regimes` et le type `vat_regime_type` avec des valeurs cohérentes en français.

## Métadonnées:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: false (la configuration de régime spécifique sera perdue, mais elle est déjà en erreur)

## Détails de la Structure:
- Supprime : `public.vat_regimes`, `public.vat_regime_type`
- Crée : `public.vat_regime_type` (avec 'reel_normal', 'reel_simplifie', 'franchise_de_base'), `public.vat_regimes`

## Implications de Sécurité:
- RLS Status: RLS est ré-activé sur la nouvelle table.
- Policy Changes: La politique d'accès est recréée.
- Auth Requirements: Aucun changement.

## Impact sur la Performance:
- Indexes: Les index sur la table `vat_regimes` sont recréés.
- Estimated Impact: Nul.
*/

-- Drop existing objects to ensure a clean state
DROP TABLE IF EXISTS public.vat_regimes CASCADE;
DROP TYPE IF EXISTS public.vat_regime_type;

-- Create the enum type with French values
CREATE TYPE public.vat_regime_type AS ENUM (
  'reel_normal',
  'reel_simplifie',
  'franchise_de_base'
);

-- Recreate the vat_regimes table
CREATE TABLE public.vat_regimes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
    regime_type public.vat_regime_type NOT NULL DEFAULT 'reel_normal',
    collection_periodicity text NOT NULL DEFAULT 'monthly' CHECK (collection_periodicity IN ('monthly', 'quarterly', 'annually')),
    payment_delay_months integer NOT NULL DEFAULT 1 CHECK (payment_delay_months >= 0),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS and set policies
ALTER TABLE public.vat_regimes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for users based on project ownership"
ON public.vat_regimes
FOR ALL
USING (
  (auth.uid() IN ( SELECT p.user_id FROM public.projects p WHERE (p.id = vat_regimes.project_id) ))
);

COMMENT ON TABLE public.vat_regimes IS 'Stores the VAT regime settings for each project.';
COMMENT ON COLUMN public.vat_regimes.regime_type IS 'Type of VAT regime (e.g., normal, simplified).';
COMMENT ON COLUMN public.vat_regimes.collection_periodicity IS 'How often VAT is declared (monthly, quarterly, annually).';
COMMENT ON COLUMN public.vat_regimes.payment_delay_months IS 'Delay in months for paying the declared VAT.';
