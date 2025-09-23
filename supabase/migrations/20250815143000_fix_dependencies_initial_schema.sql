-- Step 1: Clean up previous, potentially broken RLS policies and functions for profiles.
-- We use CASCADE to remove dependent policies, as suggested by a previous error hint.
DROP FUNCTION IF EXISTS public.is_superadmin() CASCADE;

-- Drop all policies on profiles to ensure a clean slate.
-- An error "policy ... already exists" happened before, so this is important.
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN
        SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.profiles;';
    END LOOP;
END;
$$;


-- Step 2: Recreate the helper function to check for 'superadmin' role from JWT.
-- This version is simplified and avoids table access, preventing recursion.
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt() -> 'raw_user_meta_data' ->> 'role') = 'superadmin';
$$;


-- Step 3: Ensure RLS is enabled on the profiles table.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;


-- Step 4: Recreate all policies for the 'profiles' table with the correct logic.

-- Users can manage their own profile.
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Superadmins have full access.
CREATE POLICY "Superadmins have full access to profiles"
  ON public.profiles FOR ALL
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());
