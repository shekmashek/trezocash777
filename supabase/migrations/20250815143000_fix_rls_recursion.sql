-- Migration to fix 'profiles' RLS recursion

-- 1. Clean slate: Drop existing policies and function
DROP POLICY IF EXISTS "Superadmins can view all profiles." ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can update all profiles." ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Profiles RLS" ON public.profiles;
DROP POLICY IF EXISTS "Enable all access for superadmins" ON public.profiles;
DROP POLICY IF EXISTS "Enable access for users to their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable access for users to their own profile and superadmins to all" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users on their own profile and superadmins on all" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins have full access to all profiles." ON public.profiles;


DROP FUNCTION IF EXISTS public.is_superadmin();

-- 2. Create the helper function with SECURITY DEFINER
-- This function runs with the permissions of the user who created it (the 'postgres' user in the dashboard),
-- bypassing the RLS of the user calling it. This breaks the recursive loop.
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Important for security
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- This function needs to query the profiles table to get the role.
  -- Because it's SECURITY DEFINER, this query bypasses the user's RLS policies.
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN user_role = 'superadmin';
END;
$$;

-- 3. Ensure RLS is enabled on the table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create new, simplified policies

-- Policy for SELECT access
CREATE POLICY "Enable read access for users on their own profile and superadmins"
ON public.profiles
FOR SELECT
USING (
  -- A user can see their own profile
  auth.uid() = id
  -- OR a superadmin can see any profile
  OR public.is_superadmin()
);

-- Policy for UPDATE access
CREATE POLICY "Enable update for users on their own profile and superadmins"
ON public.profiles
FOR UPDATE
USING (
  -- A user can update their own profile
  auth.uid() = id
  -- OR a superadmin can update any profile
  OR public.is_superadmin()
);
