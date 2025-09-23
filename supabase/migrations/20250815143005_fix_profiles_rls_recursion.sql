/*
# [Fix] RLS Recursion on Profiles Table
[This migration fixes an infinite recursion error in the Row Level Security (RLS) policies for the `profiles` table. The previous policies created a loop by trying to read from the `profiles` table to authorize a read on the same table.]

## Query Description: [This operation replaces the existing RLS policies on the `public.profiles` table with a new, safe set of policies. It introduces a `SECURITY DEFINER` function to securely check a user's role without causing recursion. This change is critical for the application to function correctly, as the current error blocks all data loading for users.]

## Metadata:
- Schema-Category: ["Structural", "Security"]
- Impact-Level: ["High"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Drops all existing policies on `public.profiles`.
- Creates a new function: `public.get_user_role(uuid)`.
- Creates new policies on `public.profiles` for `SELECT`, `UPDATE`, `INSERT`, and `DELETE`.

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [Yes]
- This fixes a critical RLS misconfiguration, making the security posture stronger and resolving a denial-of-service-like error.

## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [Low. The function call is lightweight and should not introduce performance issues.]
*/

-- Drop existing policies to prevent conflicts and ensure a clean state.
DROP POLICY IF EXISTS "Allow individual user access to their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow superadmin access to all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual user to update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow superadmin to update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable all access for superadmins" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow user to insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow superadmin to delete profiles" ON public.profiles;


-- Drop the potentially problematic old function.
DROP FUNCTION IF EXISTS public.is_superadmin();

-- Create a helper function to get a user's role securely, bypassing RLS.
-- This function runs with the permissions of the owner, preventing recursion.
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
-- Set a secure search_path to prevent hijacking
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- Bypasses RLS because of SECURITY DEFINER
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
  RETURN user_role;
END;
$$;

-- Re-enable RLS on the table, just in case it was disabled.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create new, safe policies.

-- 1. SELECT policies
CREATE POLICY "Allow individual user access to their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Allow superadmin access to all profiles"
ON public.profiles
FOR SELECT
USING (get_user_role(auth.uid()) = 'superadmin');

-- 2. UPDATE policies
CREATE POLICY "Allow individual user to update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow superadmin to update all profiles"
ON public.profiles
FOR UPDATE
USING (get_user_role(auth.uid()) = 'superadmin');

-- 3. INSERT policy (usually handled by a trigger, but good to have)
-- This allows a user to create their own profile row if the trigger fails for some reason.
CREATE POLICY "Allow user to insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 4. DELETE policy
-- Generally, users should not be able to delete their own profile row directly.
-- This should be handled by a dedicated function. Superadmins can.
CREATE POLICY "Allow superadmin to delete profiles"
ON public.profiles
FOR DELETE
USING (get_user_role(auth.uid()) = 'superadmin');
