/*
# [Critical Fix] Correct Superadmin Function and RLS Policies
[This migration fixes a critical error in the `is_superadmin` function and re-establishes the necessary Row Level Security (RLS) policies for the `profiles` table. The previous function contained a syntax error that prevented migrations, and this script resolves a potential infinite recursion issue by checking user roles directly from the JWT token.]

## Query Description: [This operation will temporarily drop and then recreate security policies on the `profiles` table. It corrects a function essential for administrator access. There is a low risk of access interruption if the migration fails, but no risk of data loss.]

## Metadata:
- Schema-Category: ["Structural", "Security"]
- Impact-Level: ["Medium"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Drops and recreates function: `is_superadmin()`
- Drops and recreates policies on `public.profiles`:
  - "Superadmins can view all profiles."
  - "Superadmins can update all profiles."
  - "Users can view their own profile."
  - "Users can update their own profile."

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [Yes]
- Auth Requirements: [Superadmin role in JWT]

## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [Negligible. The function is optimized to read from the JWT, which is faster than a table query.]
*/

-- Step 1: Drop the faulty function and its dependent policies.
-- The CASCADE is crucial to remove the policies that prevent the function from being dropped.
DROP FUNCTION IF EXISTS public.is_superadmin() CASCADE;

-- Step 2: Recreate the function with the correct syntax.
-- This version checks the JWT metadata, which is the correct way to avoid recursion on the profiles table.
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (auth.jwt()->'raw_user_meta_data'->>'role') = 'superadmin';
$$;

-- Step 3: Re-enable RLS on the profiles table if it's not already enabled.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Recreate the policies for superadmins.
CREATE POLICY "Superadmins can view all profiles."
ON public.profiles FOR SELECT
TO authenticated
USING (is_superadmin());

CREATE POLICY "Superadmins can update all profiles."
ON public.profiles FOR UPDATE
TO authenticated
USING (is_superadmin())
WITH CHECK (is_superadmin());

-- Step 5: Recreate the policies for regular users to manage their own profile.
-- This ensures non-admins can still access their own data.
CREATE POLICY "Users can view their own profile."
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile."
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
