/*
  # [Fix] RLS Policy for Profiles (Recursion)
  [This migration fixes a critical infinite recursion issue in the Row Level Security (RLS) policy for the 'profiles' table. It replaces the problematic policy with a robust, non-recursive version that uses JWT claims.]

  ## Query Description: [This operation overhauls the security policy for viewing user profiles. It introduces helper functions and a trigger to store a user's 'role' in their authentication token (JWT). The RLS policy is then updated to read this role from the token instead of re-querying the database, which eliminates the infinite loop. This is a standard and secure pattern for this type of check.]
  
  ## Metadata:
  - Schema-Category: ["Structural", "Security", "Safe"]
  - Impact-Level: ["Medium"]
  - Requires-Backup: [false]
  - Reversible: [false]
  
  ## Structure Details:
  - Creates function: `get_my_claim`
  - Creates function: `update_user_claims`
  - Creates trigger: `on_profile_updated` on `public.profiles`
  - Drops and recreates all RLS policies on `public.profiles` for consistency.
  
  ## Security Implications:
  - RLS Status: [Enabled]
  - Policy Changes: [Yes]
  - Auth Requirements: [Authenticated users]
  
  ## Performance Impact:
  - Indexes: [No change]
  - Triggers: [Adds one trigger on profile role updates]
  - Estimated Impact: [Positive. Removes a recursive query, significantly improving performance and resolving application crashes.]
*/

-- Step 1: Create a helper function to safely get a claim from the current user's JWT.
CREATE OR REPLACE FUNCTION get_my_claim(claim TEXT)
RETURNS JSONB
LANGUAGE sql STABLE
AS $$
  SELECT coalesce(current_setting('request.jwt.claims', true)::jsonb ->> claim, null)::jsonb;
$$;

-- Step 2: Create a function that will be triggered to update the user's claims in auth.users.
-- This function is SECURITY DEFINER, allowing it to modify the protected auth.users table.
CREATE OR REPLACE FUNCTION update_user_claims()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- Step 3: Create a trigger on the profiles table.
-- This trigger will fire the update_user_claims function whenever a user's role is changed.
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE update_user_claims();

-- Step 4: Recreate all policies for the profiles table for consistency and to fix the recursion.

-- 1. Users can view their own profile.
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- 2. Users can update their own profile.
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Superadmins can view all profiles. (The fix)
DROP POLICY IF EXISTS "Superadmins can view all profiles" ON public.profiles;
CREATE POLICY "Superadmins can view all profiles"
  ON public.profiles FOR SELECT
  USING (((get_my_claim('role'::text) ->> 'role'::text) = 'superadmin'::text));

-- 4. Superadmins can update all profiles.
DROP POLICY IF EXISTS "Superadmins can update all profiles" ON public.profiles;
CREATE POLICY "Superadmins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (((get_my_claim('role'::text) ->> 'role'::text) = 'superadmin'::text))
  WITH CHECK (((get_my_claim('role'::text) ->> 'role'::text) = 'superadmin'::text));
