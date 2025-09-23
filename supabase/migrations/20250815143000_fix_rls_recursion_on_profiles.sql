/*
# [CRITICAL FIX] Resolve RLS Infinite Recursion
[This migration fixes a critical database error causing the application to fail on startup. It replaces a faulty security rule with a secure, standard pattern to prevent infinite recursion.]

## Query Description: [This operation rebuilds the security policies on the user profiles table. It drops all existing, potentially conflicting policies and replaces them with a new, stable set. This is a safe operation that corrects an access control loop and does not affect user data.]

## Metadata:
- Schema-Category: ["Structural", "Security"]
- Impact-Level: ["High"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Drops all policies on `public.profiles`.
- Drops the function `public.is_superadmin()`.
- Creates a new function `public.get_user_role(uuid)`.
- Creates new, non-recursive policies on `public.profiles`.

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [Yes]
- Auth Requirements: [This fix is essential for the authentication system to function correctly.]

## Performance Impact:
- Indexes: [No change]
- Triggers: [No change]
- Estimated Impact: [Positive. Resolves an infinite loop that was preventing data from being loaded.]
*/

-- Step 1: Clean up old, conflicting policies and functions to ensure a fresh start.
-- Using CASCADE to handle dependencies from previous failed attempts.
DROP POLICY IF EXISTS "Superadmins have full access to all profiles." ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins have full access" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can view all profiles." ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can update all profiles." ON public.profiles;
DROP FUNCTION IF EXISTS public.is_superadmin() CASCADE;

-- Step 2: Create a secure function to get a user's role without causing recursion.
-- SECURITY DEFINER is the key to breaking the loop, as it bypasses the caller's RLS for this specific query.
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
-- Set a secure search_path to prevent hijacking
SET search_path = public, pg_temp;
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- This SELECT can now read from public.profiles without causing a recursive loop
  -- because the function runs with the permissions of its owner, not the caller.
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
  RETURN user_role;
END;
$$;

-- Step 3: Ensure RLS is enabled on the profiles table.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Re-create the policies using the new, safe function.
-- Policy for users to manage their own profile.
CREATE POLICY "Users can manage their own profile"
ON public.profiles
FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy for superadmins to have full access.
CREATE POLICY "Superadmins have full access"
ON public.profiles
FOR ALL
USING (public.get_user_role(auth.uid()) = 'superadmin')
WITH CHECK (public.get_user_role(auth.uid()) = 'superadmin');
