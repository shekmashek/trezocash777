/*
  # [IMPORTANT] Schema Repair and VAT Module Installation
  This script addresses previous migration errors by repairing the schema and then installing the VAT module in a safe, idempotent way.
*/

-- =================================================================
-- SECTION 1: Repair Missing Core Table
-- The 'project_collaborators' table appears to be missing, causing errors.
-- This command creates it if it doesn't exist, which is crucial for the app to function.
-- =================================================================
/*
  # [Operation Name] Create Missing Collaborators Table
  Creates the 'project_collaborators' table, which is essential for the application's collaboration features and appears to be missing from your database schema. This should resolve dependency errors from the last migration attempt.
  
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: false
*/
CREATE TABLE IF NOT EXISTS public.project_collaborators (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    user_id uuid,
    email text NOT NULL,
    role text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    project_ids uuid[],
    permission_scope text DEFAULT 'all'::text
);

-- Ensure primary key exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'project_collaborators_pkey' AND conrelid = 'public.project_collaborators'::regclass
    ) THEN
        ALTER TABLE public.project_collaborators ADD CONSTRAINT project_collaborators_pkey PRIMARY KEY (id);
    END IF;
END;
$$;

-- Ensure foreign keys exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'project_collaborators_owner_id_fkey' AND conrelid = 'public.project_collaborators'::regclass
    ) THEN
        ALTER TABLE public.project_collaborators ADD CONSTRAINT project_collaborators_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'project_collaborators_user_id_fkey' AND conrelid = 'public.project_collaborators'::regclass
    ) THEN
        ALTER TABLE public.project_collaborators ADD CONSTRAINT project_collaborators_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END;
$$;

-- Ensure RLS is enabled and policies exist
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.project_collaborators;
CREATE POLICY "Enable read access for project owners and collaborators" ON public.project_collaborators FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = user_id);
CREATE POLICY "Enable insert for project owners" ON public.project_collaborators FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Enable update for project owners" ON public.project_collaborators FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Enable delete for project owners" ON public.project_collaborators FOR DELETE USING (auth.uid() = owner_id);


-- =================================================================
-- SECTION 2: Clean Up Previous Failed VAT Migrations
-- This section safely removes any partial objects from previous attempts.
-- =================================================================
/*
  # [Operation Name] Cleanup Failed VAT Migrations
  Removes any tables, types, columns, and constraints that may have been partially created by previous failed migration scripts for the VAT module. This ensures a clean state before re-installing the module.
  
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: false
*/
ALTER TABLE IF EXISTS public.budget_entries DROP CONSTRAINT IF EXISTS "budget_entries_vat_rate_id_fkey";
ALTER TABLE IF EXISTS public.actual_transactions DROP CONSTRAINT IF EXISTS "actual_transactions_vat_rate_id_fkey";
ALTER TABLE IF EXISTS public.vat_declarations DROP CONSTRAINT IF EXISTS "vat_declarations_project_id_fkey";
ALTER TABLE IF EXISTS public.vat_regimes DROP CONSTRAINT IF EXISTS "vat_regimes_project_id_fkey";
ALTER TABLE IF EXISTS public.projects DROP CONSTRAINT IF EXISTS "projects_vat_regime_id_fkey";

DROP TABLE IF EXISTS public.vat_declaration_items CASCADE;
DROP TABLE IF EXISTS public.vat_declarations CASCADE;
DROP TABLE IF EXISTS public.vat_rates CASCADE;
DROP TABLE IF EXISTS public.vat_regimes CASCADE;

DROP TYPE IF EXISTS public.vat_period_type CASCADE;
DROP TYPE IF EXISTS public.vat_regime_type CASCADE;

ALTER TABLE IF EXISTS public.projects DROP COLUMN IF EXISTS vat_regime_id;
ALTER TABLE IF EXISTS public.budget_entries DROP COLUMN IF EXISTS vat_rate_id;
ALTER TABLE IF EXISTS public.actual_transactions DROP COLUMN IF EXISTS vat_rate_id;
ALTER TABLE IF EXISTS public.actual_transactions DROP COLUMN IF EXISTS vat_amount;


-- =================================================================
-- SECTION 3: Create Full VAT Module Schema
-- This section creates all necessary tables, types, and relations for the VAT module.
-- =================================================================
/*
  # [Operation Name] Create VAT Module Schema
  Creates the complete database schema required for the new VAT management module, including tables for regimes, rates, and declarations, and adds necessary columns to existing tables.
  
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Medium"
  - Requires-Backup: true
  - Reversible: false
*/

-- 1. Create custom types for VAT
CREATE TYPE public.vat_period_type AS ENUM ('monthly', 'quarterly', 'yearly');
CREATE TYPE public.vat_regime_type AS ENUM ('standard', 'simplified');

-- 2. Create vat_regimes table
CREATE TABLE public.vat_regimes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    regime_type public.vat_regime_type NOT NULL,
    payment_period public.vat_period_type NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.vat_regimes ADD CONSTRAINT vat_regimes_pkey PRIMARY KEY (id);
ALTER TABLE public.vat_regimes ADD CONSTRAINT vat_regimes_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- 3. Create vat_rates table
CREATE TABLE public.vat_rates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    name text NOT NULL,
    rate numeric(5,2) NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.vat_rates ADD CONSTRAINT vat_rates_pkey PRIMARY KEY (id);
ALTER TABLE public.vat_rates ADD CONSTRAINT vat_rates_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.vat_rates ADD CONSTRAINT vat_rates_project_id_name_key UNIQUE (project_id, name);

-- 4. Create vat_declarations table
CREATE TABLE public.vat_declarations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    period_start_date date NOT NULL,
    period_end_date date NOT NULL,
    due_date date NOT NULL,
    collected_vat numeric DEFAULT 0 NOT NULL,
    deductible_vat numeric DEFAULT 0 NOT NULL,
    vat_due numeric GENERATED ALWAYS AS (collected_vat - deductible_vat) STORED,
    status text DEFAULT 'draft'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.vat_declarations ADD CONSTRAINT vat_declarations_pkey PRIMARY KEY (id);
ALTER TABLE public.vat_declarations ADD CONSTRAINT vat_declarations_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- 5. Add columns to existing tables
ALTER TABLE public.projects ADD COLUMN vat_regime_id uuid;
ALTER TABLE public.budget_entries ADD COLUMN vat_rate_id uuid;
ALTER TABLE public.actual_transactions ADD COLUMN vat_rate_id uuid;
ALTER TABLE public.actual_transactions ADD COLUMN vat_amount numeric;

-- 6. Add foreign key constraints
ALTER TABLE public.projects ADD CONSTRAINT projects_vat_regime_id_fkey FOREIGN KEY (vat_regime_id) REFERENCES public.vat_regimes(id) ON DELETE SET NULL;
ALTER TABLE public.budget_entries ADD CONSTRAINT budget_entries_vat_rate_id_fkey FOREIGN KEY (vat_rate_id) REFERENCES public.vat_rates(id) ON DELETE SET NULL;
ALTER TABLE public.actual_transactions ADD CONSTRAINT actual_transactions_vat_rate_id_fkey FOREIGN KEY (vat_rate_id) REFERENCES public.vat_rates(id) ON DELETE SET NULL;

-- 7. Enable RLS and define policies
ALTER TABLE public.vat_regimes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vat_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vat_declarations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable access for project members" ON public.vat_regimes FOR ALL USING (
    (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())) OR
    (project_id IN (SELECT unnest(project_ids) FROM public.project_collaborators WHERE user_id = auth.uid()))
);
CREATE POLICY "Enable access for project members" ON public.vat_rates FOR ALL USING (
    (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())) OR
    (project_id IN (SELECT unnest(project_ids) FROM public.project_collaborators WHERE user_id = auth.uid()))
);
CREATE POLICY "Enable access for project members" ON public.vat_declarations FOR ALL USING (
    (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())) OR
    (project_id IN (SELECT unnest(project_ids) FROM public.project_collaborators WHERE user_id = auth.uid()))
);
