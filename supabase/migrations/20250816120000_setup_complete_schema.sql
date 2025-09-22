/*
          # [Schema Initial] - Configuration Complète de la Base de Données
          Ce script met en place l'intégralité du schéma de base de données requis par l'application Trezocash. Il crée toutes les tables, active la sécurité au niveau des lignes (RLS), et configure les déclencheurs nécessaires pour la gestion des utilisateurs.

          ## Description de la Requête:
          Cette opération est fondamentale pour le fonctionnement de l'application. Elle va créer de nouvelles tables et configurer des règles de sécurité. Si des tables avec les mêmes noms existent déjà mais avec une structure différente, des erreurs peuvent survenir. Il est fortement recommandé d'appliquer ce script sur une base de données propre ou après avoir sauvegardé vos données existantes.

          ## Métadonnées:
          - Schéma-Catégorie: "Structural"
          - Impact-Niveau: "High"
          - Nécessite-Sauvegarde: true
          - Réversible: false

          ## Détails de la Structure:
          - Tables créées : profiles, projects, cash_accounts, tiers, loans, budget_entries, actual_transactions, payments, scenarios, scenario_entries, notes.
          - Fonctions créées : handle_new_user, delete_user_account, moddatetime.
          - Déclencheurs créés : on_auth_user_created, handle_updated_at sur plusieurs tables.

          ## Implications de Sécurité:
          - RLS Status: Activé sur toutes les tables contenant des données utilisateur.
          - Changements de Politique: Ajout de politiques RLS pour s'assurer que les utilisateurs ne peuvent accéder qu'à leurs propres données.
          - Exigences d'Authentification: Toutes les politiques sont basées sur l'UID de l'utilisateur authentifié.
*/

-- EXTENSIONS --
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- FONCTION UTILITAIRE POUR `updated_at` --
CREATE OR REPLACE FUNCTION public.moddatetime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. TABLE PROFILS --
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    subscription_status text,
    trial_ends_at timestamptz,
    plan_id text,
    subscription_id text,
    stripe_customer_id text UNIQUE,
    currency text DEFAULT '€'::text,
    display_unit text DEFAULT 'standard'::text,
    decimal_places integer DEFAULT 2,
    language text DEFAULT 'fr'::text,
    timezone_offset integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Les utilisateurs peuvent voir et modifier leur propre profil." ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.moddatetime();

-- 2. TABLE PROJETS --
CREATE TABLE IF NOT EXISTS public.projects (
    id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    start_date date NOT NULL,
    currency text,
    is_archived boolean DEFAULT false,
    annual_goals jsonb,
    expense_targets jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Les utilisateurs peuvent gérer leurs propres projets." ON public.projects FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE PROCEDURE public.moddatetime();

-- 3. TABLE COMPTES DE TRÉSORERIE --
CREATE TABLE IF NOT EXISTS public.cash_accounts (
    id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    main_category_id text,
    name text NOT NULL,
    initial_balance numeric DEFAULT 0,
    initial_balance_date date,
    is_closed boolean DEFAULT false,
    closure_date date,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.cash_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Les utilisateurs peuvent gérer leurs propres comptes." ON public.cash_accounts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.cash_accounts FOR EACH ROW EXECUTE PROCEDURE public.moddatetime();

-- 4. TABLE TIERS --
CREATE TABLE IF NOT EXISTS public.tiers (
    id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    type text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, name, type)
);
ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Les utilisateurs peuvent gérer leurs propres tiers." ON public.tiers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.tiers FOR EACH ROW EXECUTE PROCEDURE public.moddatetime();

-- 5. TABLE PRÊTS/EMPRUNTS --
CREATE TABLE IF NOT EXISTS public.loans (
    id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type text NOT NULL,
    third_party text,
    principal numeric NOT NULL,
    term integer NOT NULL,
    monthly_payment numeric NOT NULL,
    principal_date date NOT NULL,
    repayment_start_date date NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Les utilisateurs peuvent gérer leurs prêts/emprunts." ON public.loans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.loans FOR EACH ROW EXECUTE PROCEDURE public.moddatetime();

-- 6. TABLE ENTRÉES BUDGÉTAIRES --
CREATE TABLE IF NOT EXISTS public.budget_entries (
    id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    loan_id uuid REFERENCES public.loans(id) ON DELETE SET NULL,
    type text NOT NULL,
    category text NOT NULL,
    frequency text NOT NULL,
    amount numeric NOT NULL,
    date date,
    start_date date,
    end_date date,
    supplier text,
    description text,
    is_off_budget boolean DEFAULT false,
    payments jsonb,
    provision_details jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.budget_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Les utilisateurs peuvent gérer leurs entrées budgétaires." ON public.budget_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.budget_entries FOR EACH ROW EXECUTE PROCEDURE public.moddatetime();

-- 7. TABLE TRANSACTIONS RÉELLES --
CREATE TABLE IF NOT EXISTS public.actual_transactions (
    id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id uuid REFERENCES public.budget_entries(id) ON DELETE SET NULL,
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type text NOT NULL,
    category text NOT NULL,
    third_party text,
    description text,
    date date NOT NULL,
    amount numeric NOT NULL,
    status text NOT NULL,
    is_off_budget boolean DEFAULT false,
    is_provision boolean DEFAULT false,
    is_final_provision_payment boolean DEFAULT false,
    provision_details jsonb,
    is_internal_transfer boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.actual_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Les utilisateurs peuvent gérer leurs transactions réelles." ON public.actual_transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.actual_transactions FOR EACH ROW EXECUTE PROCEDURE public.moddatetime();

-- 8. TABLE PAIEMENTS --
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    actual_id uuid NOT NULL REFERENCES public.actual_transactions(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    payment_date date NOT NULL,
    paid_amount numeric NOT NULL,
    cash_account uuid REFERENCES public.cash_accounts(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Les utilisateurs peuvent gérer leurs paiements." ON public.payments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE PROCEDURE public.moddatetime();

-- 9. TABLE SCÉNARIOS --
CREATE TABLE IF NOT EXISTS public.scenarios (
    id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    color text,
    is_visible boolean DEFAULT true,
    is_archived boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Les utilisateurs peuvent gérer leurs scénarios." ON public.scenarios FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.scenarios FOR EACH ROW EXECUTE PROCEDURE public.moddatetime();

-- 10. TABLE ENTRÉES DE SCÉNARIO --
CREATE TABLE IF NOT EXISTS public.scenario_entries (
    id uuid NOT NULL,
    scenario_id uuid NOT NULL REFERENCES public.scenarios(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type text,
    category text,
    frequency text,
    amount numeric,
    date date,
    start_date date,
    end_date date,
    supplier text,
    description text,
    is_deleted boolean DEFAULT false,
    payments jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id, scenario_id)
);
ALTER TABLE public.scenario_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Les utilisateurs peuvent gérer leurs entrées de scénario." ON public.scenario_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.scenario_entries FOR EACH ROW EXECUTE PROCEDURE public.moddatetime();

-- 11. TABLE NOTES --
CREATE TABLE IF NOT EXISTS public.notes (
    id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content text,
    color text,
    x float8,
    y float8,
    is_minimized boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Les utilisateurs peuvent gérer leurs notes." ON public.notes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE PROCEDURE public.moddatetime();

-- DÉCLENCHEUR POUR LA CRÉATION DE PROFIL --
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, trial_ends_at)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', now() + interval '14 days');
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- FONCTION DE SUPPRESSION D'UTILISATEUR --
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- La suppression en cascade est gérée par les contraintes `ON DELETE CASCADE`
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
