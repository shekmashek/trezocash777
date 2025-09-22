/*
# [Feature] Collaboration System
This migration sets up the database schema to support inviting and managing collaborators with different roles and project access.

## Query Description:
This script creates the `collaborators` table and updates Row Level Security (RLS) policies on existing tables to allow for shared access. It also adds a trigger to automatically accept invitations for new users. This is a structural change and is safe to apply.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: true (with a corresponding down migration)

## Structure Details:
- **New Table:** `public.collaborators` (stores invitations and collaborator info)
- **Updated RLS:** Policies on `projects`, `budget_entries`, `actual_transactions`, `cash_accounts`, `scenarios`, `notes`, `loans` will be updated to grant access to collaborators.

## Security Implications:
- RLS Status: Enabled on new tables.
- Policy Changes: Yes, existing policies are replaced to add collaborator access.
- Auth Requirements: Policies rely on `auth.uid()` to determine user roles (owner vs. collaborator).

## Performance Impact:
- Indexes: Primary keys and foreign keys on new tables will have indexes.
- Triggers: A new trigger `on_auth_user_created` is added to `auth.users`.
- Estimated Impact: Low. The changes are designed to be efficient.
*/

-- 1. Collaborators Table
CREATE TABLE IF NOT EXISTS public.collaborators (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    email text NOT NULL,
    role text NOT NULL CHECK (role IN ('viewer', 'editor')),
    status text NOT NULL DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now(),
    project_ids uuid[]
);
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;

-- 2. RLS Policies for Collaborators
DROP POLICY IF EXISTS "Owners can manage their collaborators" ON public.collaborators;
CREATE POLICY "Owners can manage their collaborators" ON public.collaborators FOR ALL
    USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Collaborators can see their own invitations" ON public.collaborators;
CREATE POLICY "Collaborators can see their own invitations" ON public.collaborators FOR SELECT
    USING (email = auth.jwt()->>'email');

-- 3. Update RLS policies for existing tables to grant access to collaborators

-- Helper function to check collaborator access
CREATE OR REPLACE FUNCTION public.has_project_access(p_project_id uuid, p_required_role text)
RETURNS boolean AS $$
DECLARE
    has_access boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM public.collaborators c
        WHERE c.user_id = auth.uid()
          AND c.status = 'accepted'
          AND p_project_id = ANY(c.project_ids)
          AND (p_required_role = 'viewer' OR c.role = 'editor')
    ) INTO has_access;
    RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Projects
DROP POLICY IF EXISTS "Users can manage their own or shared projects" ON public.projects;
DROP POLICY IF EXISTS "Users can manage their own projects." ON public.projects;
CREATE POLICY "Users can manage their own or shared projects" ON public.projects FOR ALL
    USING (
        auth.uid() = user_id OR
        id IN (
            SELECT unnest(c.project_ids)
            FROM public.collaborators c
            WHERE c.user_id = auth.uid() AND c.status = 'accepted'
        )
    )
    WITH CHECK (
        auth.uid() = user_id OR
        (
            id IN (
                SELECT unnest(c.project_ids)
                FROM public.collaborators c
                WHERE c.user_id = auth.uid() AND c.status = 'accepted' AND c.role = 'editor'
            )
        )
    );

-- Budget Entries
DROP POLICY IF EXISTS "Users can manage budget entries for their projects" ON public.budget_entries;
DROP POLICY IF EXISTS "Users can manage their own budget entries" ON public.budget_entries;
CREATE POLICY "Users can manage budget entries for their projects" ON public.budget_entries FOR ALL
    USING (
        auth.uid() = user_id OR
        has_project_access(project_id, 'viewer')
    )
    WITH CHECK (
        auth.uid() = user_id OR
        has_project_access(project_id, 'editor')
    );

-- Actual Transactions
DROP POLICY IF EXISTS "Users can manage actuals for their projects" ON public.actual_transactions;
DROP POLICY IF EXISTS "Users can manage their own actual transactions" ON public.actual_transactions;
CREATE POLICY "Users can manage actuals for their projects" ON public.actual_transactions FOR ALL
    USING (
        auth.uid() = user_id OR
        has_project_access(project_id, 'viewer')
    )
    WITH CHECK (
        auth.uid() = user_id OR
        has_project_access(project_id, 'editor')
    );

-- Payments
DROP POLICY IF EXISTS "Users can manage payments for their projects" ON public.payments;
DROP POLICY IF EXISTS "Users can manage their own payments" ON public.payments;
CREATE POLICY "Users can manage payments for their projects" ON public.payments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.actual_transactions a
            WHERE a.id = actual_id AND (a.user_id = auth.uid() OR has_project_access(a.project_id, 'viewer'))
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.actual_transactions a
            WHERE a.id = actual_id AND (a.user_id = auth.uid() OR has_project_access(a.project_id, 'editor'))
        )
    );

-- Cash Accounts
DROP POLICY IF EXISTS "Users can manage cash accounts for their projects" ON public.cash_accounts;
DROP POLICY IF EXISTS "Users can manage their own cash accounts" ON public.cash_accounts;
CREATE POLICY "Users can manage cash accounts for their projects" ON public.cash_accounts FOR ALL
    USING (
        auth.uid() = user_id OR
        has_project_access(project_id, 'viewer')
    )
    WITH CHECK (
        auth.uid() = user_id OR
        has_project_access(project_id, 'editor')
    );

-- Tiers
DROP POLICY IF EXISTS "Users can manage their own tiers" ON public.tiers;
CREATE POLICY "Users can manage their own tiers" ON public.tiers FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Scenarios
DROP POLICY IF EXISTS "Users can manage scenarios for their projects" ON public.scenarios;
DROP POLICY IF EXISTS "Users can manage their own scenarios" ON public.scenarios;
CREATE POLICY "Users can manage scenarios for their projects" ON public.scenarios FOR ALL
    USING (
        auth.uid() = user_id OR
        has_project_access(project_id, 'viewer')
    )
    WITH CHECK (
        auth.uid() = user_id OR
        has_project_access(project_id, 'editor')
    );

-- Scenario Entries
DROP POLICY IF EXISTS "Users can manage scenario entries for their projects" ON public.scenario_entries;
DROP POLICY IF EXISTS "Users can manage their own scenario entries" ON public.scenario_entries;
CREATE POLICY "Users can manage scenario entries for their projects" ON public.scenario_entries FOR ALL
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.scenarios s
            WHERE s.id = scenario_id AND has_project_access(s.project_id, 'viewer')
        )
    )
    WITH CHECK (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.scenarios s
            WHERE s.id = scenario_id AND has_project_access(s.project_id, 'editor')
        )
    );

-- Loans
DROP POLICY IF EXISTS "Users can manage loans for their projects" ON public.loans;
DROP POLICY IF EXISTS "Users can manage their own loans" ON public.loans;
CREATE POLICY "Users can manage loans for their projects" ON public.loans FOR ALL
    USING (
        auth.uid() = user_id OR
        has_project_access(project_id, 'viewer')
    )
    WITH CHECK (
        auth.uid() = user_id OR
        has_project_access(project_id, 'editor')
    );

-- Notes
DROP POLICY IF EXISTS "Users can manage their own notes" ON public.notes;
CREATE POLICY "Users can manage their own notes" ON public.notes FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Consolidated Views
DROP POLICY IF EXISTS "Users can manage their own consolidated views" ON public.consolidated_views;
CREATE POLICY "Users can manage their own consolidated views" ON public.consolidated_views FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. Trigger to accept invitations on sign up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a profile for the new user if it doesn't exist
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;

  -- Accept pending invitations
  UPDATE public.collaborators
  SET user_id = new.id, status = 'accepted'
  WHERE email = new.email AND status = 'pending';
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
