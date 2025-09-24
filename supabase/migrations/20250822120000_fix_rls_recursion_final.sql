/*
# [CRITICAL] Fix RLS Infinite Recursion
This migration script addresses a critical infinite recursion error in the Row Level Security (RLS) policies for the 'profiles' table. It replaces the problematic security function with a safer, non-recursive pattern recommended by apiService.

## Query Description:
This operation will first drop all existing policies on the `public.profiles` table to ensure a clean state. It then creates a new helper function `get_my_role()` that safely retrieves the current user's role from `auth.users` without causing recursion. Finally, it re-creates the necessary SELECT, INSERT, UPDATE, and DELETE policies using this new function. This change is essential for the application to load user data correctly and for the admin panel to function.

## Metadata:
- Schema-Category: ["Structural", "Security"]
- Impact-Level: ["High"]
- Requires-Backup: false
- Reversible: false

## Structure Details:
- Drops all policies on `public.profiles`.
- Drops function `public.is_superadmin()`.
- Creates function `public.get_my_role()`.
- Creates new policies on `public.profiles`.

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes. This fixes a broken RLS configuration. The new policies correctly allow users to access their own profile and superadmins to access all profiles.
- Auth Requirements: JWT authentication is required.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Positive. Resolves a blocking database error, allowing the application to function.
*/

-- Step 1: Drop all existing policies on the profiles table to ensure a clean state.
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can view all profiles." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can update all profiles." ON public.profiles;
DROP POLICY IF EXISTS "Superadmins have full access to all profiles." ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Users can access their own profile, and admins can access all." ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile, and admins can view all." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile, and admins can update all." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles." ON public.profiles;


-- Step 2: Drop the old, problematic function. CASCADE is needed if policies still depend on it.
DROP FUNCTION IF EXISTS public.is_superadmin() CASCADE;

-- Step 3: Create a new, safe function to get the user's role from auth.users, not public.profiles.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select raw_user_meta_data->>'role' from auth.users where id = auth.uid();
$$;

-- Step 4: Re-create the policies using the new, safe function.
CREATE POLICY "Users can view their own profile, and admins can view all."
ON public.profiles FOR SELECT
USING (auth.uid() = id OR (public.get_my_role() = 'superadmin'));

CREATE POLICY "Users can update their own profile, and admins can update all."
ON public.profiles FOR UPDATE
USING (auth.uid() = id OR (public.get_my_role() = 'superadmin'))
WITH CHECK (auth.uid() = id OR (public.get_my_role() = 'superadmin'));

CREATE POLICY "Users can insert their own profile."
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can delete profiles."
ON public.profiles FOR DELETE
USING (public.get_my_role() = 'superadmin');
