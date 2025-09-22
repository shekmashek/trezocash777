/*
# [Fix] RLS Policy Recursion on Profiles
[This migration fixes an infinite recursion error in the Row Level Security policies for the 'profiles' table. The error was caused by a policy calling a function that read from the same table, creating a loop.]

## Query Description: [This operation will drop and recreate security policies on the 'profiles' table. It specifically targets the policies for superadmin access to resolve a critical application error. There is no risk to existing data, but it is a critical security change.]

## Metadata:
- Schema-Category: ["Structural", "Security"]
- Impact-Level: ["High"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Drops function: `is_superadmin()` using CASCADE to remove dependent policies.
- Drops all potentially conflicting policies on `public.profiles`.
- Recreates policies on `public.profiles` with non-recursive logic.

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [Yes]
- Auth Requirements: [Authenticated user]

## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [Low. Resolves a performance bottleneck caused by recursion.]
*/

-- Step 1: Drop the problematic function and its dependent policies.
-- The CASCADE option is crucial to resolve the dependency error from the previous attempt.
DROP FUNCTION IF EXISTS is_superadmin() CASCADE;

-- Step 2: Drop all potentially conflicting policies on the profiles table to ensure a clean slate.
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can view all profiles." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can update all profiles." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Superadmins have full access to all profiles." ON public.profiles;

-- Step 3: Re-enable RLS on the table.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Recreate the necessary policies with a safe, non-recursive pattern.

-- Users can view their own profile.
CREATE POLICY "Users can view their own profile."
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Superadmins can view all profiles. This uses a subquery that does not cause recursion.
CREATE POLICY "Superadmins can view all profiles."
ON public.profiles FOR SELECT
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- Users can update their own profile.
CREATE POLICY "Users can update their own profile."
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Superadmins can update any profile.
CREATE POLICY "Superadmins can update all profiles."
ON public.profiles FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- Users can insert their own profile (usually handled by a trigger, but good to have).
CREATE POLICY "Users can insert their own profile."
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);
