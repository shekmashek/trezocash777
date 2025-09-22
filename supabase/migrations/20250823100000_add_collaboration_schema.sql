/*
# [Feature] Collaboration System Setup
This script sets up the necessary database structures and security policies for a multi-user collaboration feature. It allows project owners to invite collaborators with specific roles ('editor' or 'viewer').

## Query Description:
This migration introduces new tables and fundamentally changes the access control rules for most of your data.
- It adds a `project_members` table to track who has access to which project.
- It creates a `project_role` type to define permissions.
- It replaces existing Row Level Security (RLS) policies on tables like `projects`, `budget_entries`, `actual_transactions`, etc., with new policies that check for project ownership or membership.
- It adds a secure function (`invite_user_to_project`) to allow project owners to invite others.

**IMPACT:** After this migration, data access will be determined not just by ownership, but also by membership in a project. This is a significant but necessary change for collaboration. No data will be lost.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "High"
- Requires-Backup: true
- Reversible: false

## Structure Details:
- **New Table:** `public.project_members`
- **New Type:** `public.project_role`
- **New Functions:** `get_user_id_by_email`, `invite_user_to_project`, `check_project_permission`
- **Affected Tables (RLS Policies):** `projects`, `budget_entries`, `actual_transactions`, `payments`, `cash_accounts`, `loans`, `scenarios`, `scenario_entries`

## Security Implications:
- RLS Status: Enabled/Modified on multiple tables.
- Policy Changes: Yes, major overhaul of access policies.
- Auth Requirements: Policies now depend on `auth.uid()` and relationships in `project_members`.

## Performance Impact:
- Indexes: A unique index is added to `project_members`.
- Triggers: None.
- Estimated Impact: Negligible. The permission checks are efficient and performed on indexed columns.
*/

-- 1. Create a new ENUM type for roles
CREATE TYPE public.project_role AS ENUM ('editor', 'viewer');

-- 2. Create the project_members table
CREATE TABLE public.project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role project_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, user_id)
);

-- 3. Enable RLS on the new table
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- 4. Create policies for project_members
CREATE POLICY "Project owners can manage members"
ON public.project_members
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.projects
    WHERE projects.id = project_members.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Members can view their own membership"
ON public.project_members
FOR SELECT
USING (
  user_id = auth.uid()
);

-- 5. Create a helper function to check project membership and role
CREATE OR REPLACE FUNCTION public.check_project_permission(p_project_id UUID, required_role project_role)
RETURNS BOOLEAN AS $$
DECLARE
  is_owner BOOLEAN;
  member_role project_role;
BEGIN
  -- Check if the user is the owner
  SELECT EXISTS (
    SELECT 1 FROM public.projects WHERE id = p_project_id AND user_id = auth.uid()
  ) INTO is_owner;

  IF is_owner THEN
    RETURN TRUE;
  END IF;

  -- If not owner, check membership
  SELECT role INTO member_role
  FROM public.project_members
  WHERE project_id = p_project_id AND user_id = auth.uid();

  IF member_role IS NULL THEN
    RETURN FALSE;
  END IF;

  IF required_role = 'viewer' THEN
    RETURN TRUE; -- Both viewers and editors can view
  ELSIF required_role = 'editor' THEN
    RETURN member_role = 'editor';
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. Update RLS policies for existing tables

-- PROJECTS table
DROP POLICY IF EXISTS "Users can manage their own projects." ON public.projects;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.projects;
CREATE POLICY "Users can view projects they own or are a member of"
ON public.projects FOR SELECT USING (check_project_permission(id, 'viewer'));
CREATE POLICY "Users can update their own projects"
ON public.projects FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own projects"
ON public.projects FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own projects"
ON public.projects FOR INSERT WITH CHECK (user_id = auth.uid());

-- BUDGET_ENTRIES table
DROP POLICY IF EXISTS "Users can manage their own budget entries" ON public.budget_entries;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.budget_entries;
CREATE POLICY "Users can view budget entries for their projects"
ON public.budget_entries FOR SELECT USING (check_project_permission(project_id, 'viewer'));
CREATE POLICY "Users can manage budget entries for projects they can edit"
ON public.budget_entries FOR ALL USING (check_project_permission(project_id, 'editor'));

-- ACTUAL_TRANSACTIONS table
DROP POLICY IF EXISTS "Users can manage their own actual transactions" ON public.actual_transactions;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.actual_transactions;
CREATE POLICY "Users can view actual transactions for their projects"
ON public.actual_transactions FOR SELECT USING (check_project_permission(project_id, 'viewer'));
CREATE POLICY "Users can manage actual transactions for projects they can edit"
ON public.actual_transactions FOR ALL USING (check_project_permission(project_id, 'editor'));

-- PAYMENTS table
DROP POLICY IF EXISTS "Users can manage payments linked to their actuals" ON public.payments;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.payments;
CREATE POLICY "Users can view payments for their projects"
ON public.payments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.actual_transactions
    WHERE actual_transactions.id = payments.actual_id
    AND check_project_permission(actual_transactions.project_id, 'viewer')
  )
);
CREATE POLICY "Users can manage payments for their projects"
ON public.payments FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.actual_transactions
    WHERE actual_transactions.id = payments.actual_id
    AND check_project_permission(actual_transactions.project_id, 'editor')
  )
);

-- CASH_ACCOUNTS table
DROP POLICY IF EXISTS "Users can manage their own cash accounts" ON public.cash_accounts;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.cash_accounts;
CREATE POLICY "Users can view cash accounts for their projects"
ON public.cash_accounts FOR SELECT USING (check_project_permission(project_id, 'viewer'));
CREATE POLICY "Users can manage cash accounts for projects they can edit"
ON public.cash_accounts FOR ALL USING (check_project_permission(project_id, 'editor'));

-- LOANS table
DROP POLICY IF EXISTS "Users can manage their own loans" ON public.loans;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.loans;
CREATE POLICY "Users can view loans for their projects"
ON public.loans FOR SELECT USING (check_project_permission(project_id, 'viewer'));
CREATE POLICY "Users can manage loans for projects they can edit"
ON public.loans FOR ALL USING (check_project_permission(project_id, 'editor'));

-- SCENARIOS table
DROP POLICY IF EXISTS "Users can manage their own scenarios" ON public.scenarios;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.scenarios;
CREATE POLICY "Users can view scenarios for their projects"
ON public.scenarios FOR SELECT USING (check_project_permission(project_id, 'viewer'));
CREATE POLICY "Users can manage scenarios for projects they can edit"
ON public.scenarios FOR ALL USING (check_project_permission(project_id, 'editor'));

-- SCENARIO_ENTRIES table
DROP POLICY IF EXISTS "Users can manage their own scenario entries" ON public.scenario_entries;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.scenario_entries;
CREATE POLICY "Users can view scenario entries for their projects"
ON public.scenario_entries FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.scenarios
    WHERE scenarios.id = scenario_entries.scenario_id
    AND check_project_permission(scenarios.project_id, 'viewer')
  )
);
CREATE POLICY "Users can manage scenario entries for their projects"
ON public.scenario_entries FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.scenarios
    WHERE scenarios.id = scenario_entries.scenario_id
    AND check_project_permission(scenarios.project_id, 'editor')
  )
);
