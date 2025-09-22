/*
# [CRITICAL] Fix RLS Policies for Superadmin with CASCADE
[This migration corrects a critical issue with database security policies that was causing an infinite recursion error. It forcefully drops the problematic function and its dependent policies, then recreates them correctly.]

## Query Description: [This operation will temporarily drop and then recreate security policies on the 'profiles' table. This is a safe operation designed to fix a bug and will not result in data loss. It is essential for restoring normal application functionality.]

## Metadata:
- Schema-Category: ["Structural", "Security"]
- Impact-Level: ["Medium"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Drops function: `is_superadmin()` using CASCADE
- Drops policies on `public.profiles`
- Recreates function: `is_superadmin()`
- Recreates policies on `public.profiles`

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [Yes]
- Auth Requirements: [Authentication Required]

## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [Low. The changes are to metadata and security definitions, not data itself.]
*/

-- Step 1: Drop the problematic function and its dependent policies using CASCADE.
-- This is the key fix suggested by the database error message.
DROP FUNCTION IF EXISTS public.is_superadmin() CASCADE;

-- Step 2: Recreate the function with the correct logic to avoid recursion.
-- This function checks the role from the user's JWT metadata.
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (auth.jwt()->>'raw_user_meta_data')::jsonb->>'role' = 'superadmin';
$$;

-- Step 3: Re-enable RLS on the profiles table if it was disabled.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Recreate the policies for the profiles table.
-- We drop them first to ensure a clean state, in case CASCADE didn't catch everything.
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
CREATE POLICY "Users can view their own profile." ON public.profiles
FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles
FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Superadmins have full access to all profiles." ON public.profiles;
CREATE POLICY "Superadmins have full access to all profiles." ON public.profiles
FOR ALL USING (public.is_superadmin());
