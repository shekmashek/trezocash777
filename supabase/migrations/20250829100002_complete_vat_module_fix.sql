/*
          # [Correctif Complet] Module de Gestion de la TVA
          Ce script est un correctif complet qui nettoie les potentielles tables créées par les migrations précédentes et met en place la structure finale pour le module de TVA, incluant les modifications sur les tables existantes.

          ## Query Description: [Cette opération va supprimer toutes les tables liées à la TVA si elles existent, puis les recréer proprement avec toutes les colonnes, contraintes et politiques de sécurité nécessaires. Elle ajoute également les colonnes manquantes aux tables `budget_entries` et `actual_transactions`.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Medium"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          - Tables supprimées (si existent) : vat_declaration_items, vat_declarations, vat_rates, vat_regimes.
          - Tables créées : vat_regimes, vat_rates, vat_declarations, vat_declaration_items.
          - Tables modifiées : budget_entries (ajout de project_id), actual_transactions (ajout de vat_rate_id).
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [authenticated]
          
          ## Performance Impact:
          - Indexes: [Added]
          - Triggers: [None]
          - Estimated Impact: [Faible, la création de tables et de politiques a un impact minime sur une base de données existante.]
          */

-- CLEANUP PHASE
DROP TABLE IF EXISTS public.vat_declaration_items CASCADE;
DROP TABLE IF EXISTS public.vat_declarations CASCADE;
DROP TABLE IF EXISTS public.vat_rates CASCADE;
DROP TABLE IF EXISTS public.vat_regimes CASCADE;

-- SCHEMA ALTERATIONS
ALTER TABLE public.budget_entries ADD COLUMN IF NOT EXISTS project_id uuid;
ALTER TABLE public.actual_transactions ADD COLUMN IF NOT EXISTS vat_rate_id uuid;

-- SCHEMA CREATION
CREATE TABLE public.vat_regimes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL,
    name character varying NOT NULL,
    payment_periodicity text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT vat_regimes_pkey PRIMARY KEY (id)
);

CREATE TABLE public.vat_rates (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    regime_id uuid NOT NULL,
    name character varying NOT NULL,
    rate numeric NOT NULL,
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT vat_rates_pkey PRIMARY KEY (id)
);

CREATE TABLE public.vat_declarations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL,
    period_start_date date NOT NULL,
    period_end_date date NOT NULL,
    due_date date NOT NULL,
    status text NOT NULL DEFAULT 'draft'::text,
    collected_vat numeric NOT NULL DEFAULT 0,
    deductible_vat numeric NOT NULL DEFAULT 0,
    vat_due numeric GENERATED ALWAYS AS ((collected_vat - deductible_vat)) STORED,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT vat_declarations_pkey PRIMARY KEY (id)
);

CREATE TABLE public.vat_declaration_items (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    declaration_id uuid NOT NULL,
    actual_transaction_id uuid NOT NULL,
    vat_amount numeric NOT NULL,
    type text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT vat_declaration_items_pkey PRIMARY KEY (id)
);

-- CONSTRAINTS
ALTER TABLE public.vat_regimes ADD CONSTRAINT vat_regimes_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.vat_rates ADD CONSTRAINT vat_rates_regime_id_fkey FOREIGN KEY (regime_id) REFERENCES public.vat_regimes(id) ON DELETE CASCADE;
ALTER TABLE public.vat_declarations ADD CONSTRAINT vat_declarations_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.vat_declaration_items ADD CONSTRAINT vat_declaration_items_declaration_id_fkey FOREIGN KEY (declaration_id) REFERENCES public.vat_declarations(id) ON DELETE CASCADE;
ALTER TABLE public.vat_declaration_items ADD CONSTRAINT vat_declaration_items_actual_transaction_id_fkey FOREIGN KEY (actual_transaction_id) REFERENCES public.actual_transactions(id) ON DELETE CASCADE;
ALTER TABLE public.budget_entries ADD CONSTRAINT budget_entries_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.actual_transactions ADD CONSTRAINT actual_transactions_vat_rate_id_fkey FOREIGN KEY (vat_rate_id) REFERENCES public.vat_rates(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE public.vat_regimes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vat_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vat_declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vat_declaration_items ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "Enable all for users based on project" ON public.vat_regimes
AS PERMISSIVE FOR ALL
TO authenticated
USING ((is_project_member(project_id, auth.uid()) OR is_superadmin(auth.uid())));

CREATE POLICY "Enable all for users based on project" ON public.vat_rates
AS PERMISSIVE FOR ALL
TO authenticated
USING (
    (EXISTS (
        SELECT 1
        FROM public.vat_regimes vr
        WHERE ((vr.id = vat_rates.regime_id) AND (is_project_member(vr.project_id, auth.uid()) OR is_superadmin(auth.uid())))
    ))
);

CREATE POLICY "Enable all for users based on project" ON public.vat_declarations
AS PERMISSIVE FOR ALL
TO authenticated
USING ((is_project_member(project_id, auth.uid()) OR is_superadmin(auth.uid())));

CREATE POLICY "Enable all for users based on project" ON public.vat_declaration_items
AS PERMISSIVE FOR ALL
TO authenticated
USING (
    (EXISTS (
        SELECT 1
        FROM public.vat_declarations vd
        WHERE ((vd.id = vat_declaration_items.declaration_id) AND (is_project_member(vd.project_id, auth.uid()) OR is_superadmin(auth.uid())))
    ))
);
