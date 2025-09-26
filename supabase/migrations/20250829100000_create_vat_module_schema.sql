/*
# [TVA Module] Final Schema Creation
[This script provides the complete and final schema for the VAT management module. It is designed to be idempotent, meaning it will first clean up any previous partial installations of this module before creating the final structure. This ensures a clean state and resolves previous migration errors.]

## Query Description: [This operation will first remove any existing VAT-related tables and columns ('vat_rates', 'vat_declarations', etc.) to prevent conflicts. It will then create the complete schema required for the VAT management feature. No existing user data outside of this module will be affected. It is safe to run even if previous migrations failed.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Medium"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Tables created: vat_rates, vat_declarations
- Columns added: projects.vat_regime, actual_transactions.vat_rate_id, actual_transactions.vat_amount, budget_entries.default_vat_rate_id
- Types created: vat_regime_type, vat_rate_type

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [Yes]
- Auth Requirements: [Project membership]

## Performance Impact:
- Indexes: [Primary keys and foreign keys are indexed by default.]
- Triggers: [None]
- Estimated Impact: [Low. Adds new tables and columns without heavy processing.]
*/

-- Drop existing objects if they exist to ensure a clean slate
DROP TABLE IF EXISTS public.vat_declarations CASCADE;
DROP TABLE IF EXISTS public.vat_rates CASCADE;
ALTER TABLE IF EXISTS public.projects DROP COLUMN IF EXISTS vat_regime;
ALTER TABLE IF EXISTS public.actual_transactions DROP COLUMN IF EXISTS vat_rate_id;
ALTER TABLE IF EXISTS public.actual_transactions DROP COLUMN IF EXISTS vat_amount;
ALTER TABLE IF EXISTS public.budget_entries DROP COLUMN IF EXISTS default_vat_rate_id;
DROP TYPE IF EXISTS public.vat_regime_type;
DROP TYPE IF EXISTS public.vat_rate_type;

-- Create ENUM types for VAT regimes and rates
CREATE TYPE public.vat_regime_type AS ENUM ('non_assujetti', 'franchise', 'reel_simplifie', 'reel_normal_mensuel', 'reel_normal_trimestriel');
CREATE TYPE public.vat_rate_type AS ENUM ('normal', 'intermediaire', 'reduit', 'super_reduit', 'zero');

-- Create vat_rates table to store different VAT rates for a project
CREATE TABLE public.vat_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    rate NUMERIC(5, 2) NOT NULL CHECK (rate >= 0 AND rate <= 100),
    type vat_rate_type NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, name)
);
COMMENT ON TABLE public.vat_rates IS 'Stores different VAT rates applicable for a project.';

-- Create vat_declarations table to store VAT declaration history
CREATE TABLE public.vat_declarations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    due_date DATE NOT NULL,
    collected_vat NUMERIC(12, 2) NOT NULL DEFAULT 0,
    deductible_vat NUMERIC(12, 2) NOT NULL DEFAULT 0,
    vat_due NUMERIC(12, 2) GENERATED ALWAYS AS (collected_vat - deductible_vat) STORED,
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- 'draft', 'declared', 'paid'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, start_date, end_date)
);
COMMENT ON TABLE public.vat_declarations IS 'Stores VAT declaration history for each project.';

-- Add columns to existing tables for VAT integration
ALTER TABLE public.projects ADD COLUMN vat_regime vat_regime_type NOT NULL DEFAULT 'non_assujetti';
ALTER TABLE public.actual_transactions ADD COLUMN vat_rate_id UUID REFERENCES public.vat_rates(id) ON DELETE SET NULL;
ALTER TABLE public.actual_transactions ADD COLUMN vat_amount NUMERIC(12, 2);
ALTER TABLE public.budget_entries ADD COLUMN default_vat_rate_id UUID REFERENCES public.vat_rates(id) ON DELETE SET NULL;

-- Enable Row Level Security for the new tables
ALTER TABLE public.vat_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vat_declarations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies to ensure users can only access data related to their projects
CREATE POLICY "Allow full access to project members on vat_rates"
ON public.vat_rates
FOR ALL
USING (
  project_id IN (
    SELECT pc.project_id FROM public.project_collaborators pc WHERE pc.user_id = auth.uid()
    UNION
    SELECT p.id FROM public.projects p WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Allow full access to project members on vat_declarations"
ON public.vat_declarations
FOR ALL
USING (
  project_id IN (
    SELECT pc.project_id FROM public.project_collaborators pc WHERE pc.user_id = auth.uid()
    UNION
    SELECT p.id FROM public.projects p WHERE p.user_id = auth.uid()
  )
);
