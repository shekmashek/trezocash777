/*
# [VAT Module] Complete Schema Setup
This script creates all necessary tables, columns, and security policies for the VAT management module. It is designed to be idempotent and can be run safely even if parts of the schema already exist.

## Query Description:
This migration sets up the foundational database structure for VAT tracking. It adds tables for VAT regimes, rates, and declarations. It also links VAT information to existing transactions and payments tables. Row Level Security is enabled to ensure users can only access data related to their own projects.

- **vat_regimes**: Stores different VAT payment schedules (e.g., monthly, quarterly).
- **vat_rates**: Stores different VAT rates (e.g., normal, reduced).
- **vat_declarations**: Stores the calculated VAT declarations for specific periods.
- **actual_transactions**: A `vat_rate_id` column is added to link expenses/revenues to a VAT rate.
- **payments**: A `vat_declaration_id` column is added to link a payment to a specific VAT declaration (e.g., when paying the VAT due).

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: true
- Reversible: false

## Security Implications:
- RLS Status: Enabled on all new tables (`vat_regimes`, `vat_rates`, `vat_declarations`).
- Policy Changes: Yes, new policies are created to restrict access to project members.
- Auth Requirements: Policies rely on `auth.uid()` to identify the current user.
*/

-- Helper function to check project membership
CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.projects
        WHERE id = p_project_id AND user_id = auth.uid()
    ) OR EXISTS (
        SELECT 1
        FROM public.collaborators
        WHERE user_id = auth.uid() AND p_project_id = ANY(project_ids) AND status = 'accepted'
    );
$$;

-- Create vat_regimes table
CREATE TABLE IF NOT EXISTS public.vat_regimes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name text NOT NULL,
    payment_frequency interval NOT NULL, -- '1 month', '2 months', '3 months'
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (project_id, name)
);

-- Create vat_rates table
CREATE TABLE IF NOT EXISTS public.vat_rates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name text NOT NULL, -- e.g., "Taux normal", "Taux réduit"
    rate numeric NOT NULL CHECK (rate >= 0 AND rate <= 100),
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (project_id, name),
    UNIQUE (project_id, rate)
);

-- Create vat_declarations table
CREATE TABLE IF NOT EXISTS public.vat_declarations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    regime_id uuid NOT NULL REFERENCES public.vat_regimes(id) ON DELETE CASCADE,
    period_start_date date NOT NULL,
    period_end_date date NOT NULL,
    due_date date NOT NULL,
    status text NOT NULL DEFAULT 'pending', -- pending, paid, cancelled
    collected_vat numeric NOT NULL DEFAULT 0,
    deductible_vat numeric NOT NULL DEFAULT 0,
    vat_credit numeric NOT NULL DEFAULT 0,
    vat_due numeric NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (project_id, regime_id, period_start_date)
);

-- Add columns to existing tables if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='actual_transactions' AND column_name='vat_rate_id') THEN
        ALTER TABLE public.actual_transactions ADD COLUMN vat_rate_id uuid REFERENCES public.vat_rates(id) ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='payments' AND column_name='vat_declaration_id') THEN
        ALTER TABLE public.payments ADD COLUMN vat_declaration_id uuid REFERENCES public.vat_declarations(id) ON DELETE SET NULL;
    END IF;
END $$;


-- Enable RLS for new tables
ALTER TABLE public.vat_regimes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vat_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vat_declarations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to prevent errors on re-run
DROP POLICY IF EXISTS "Allow full access to project members on vat_regimes" ON public.vat_regimes;
DROP POLICY IF EXISTS "Allow full access to project members on vat_rates" ON public.vat_rates;
DROP POLICY IF EXISTS "Allow full access to project members on vat_declarations" ON public.vat_declarations;

-- Policies for vat_regimes
CREATE POLICY "Allow full access to project members on vat_regimes"
ON public.vat_regimes
FOR ALL
USING ( public.is_project_member(project_id) )
WITH CHECK ( public.is_project_member(project_id) );

-- Policies for vat_rates
CREATE POLICY "Allow full access to project members on vat_rates"
ON public.vat_rates
FOR ALL
USING ( public.is_project_member(project_id) )
WITH CHECK ( public.is_project_member(project_id) );

-- Policies for vat_declarations
CREATE POLICY "Allow full access to project members on vat_declarations"
ON public.vat_declarations
FOR ALL
USING ( public.is_project_member(project_id) )
WITH CHECK ( public.is_project_member(project_id) );
