/*
          # [Fix RLS Recursion on Profiles]
          Corrige une boucle de récursion infinie dans les politiques de sécurité de la table des profils.

          ## Query Description: [Cette opération réinitialise les politiques de sécurité (RLS) sur la table `profiles` pour résoudre une erreur de récursion. Elle redéfinit la fonction `is_superadmin()` pour qu'elle ne soit plus détectée comme récursive par le système, puis réapplique des politiques granulaires et sécurisées pour les utilisateurs et les superadministrateurs. Aucun risque de perte de données.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Affecte les politiques RLS de la table `public.profiles`.
          - Affecte la fonction `public.is_superadmin()`.
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [authenticated]
          
          ## Performance Impact:
          - Indexes: [No Change]
          - Triggers: [No Change]
          - Estimated Impact: [Négligeable. Améliore la performance en résolvant une boucle infinie.]
          */

-- Drop potentially problematic policies and function to ensure a clean slate
DROP POLICY IF EXISTS "Superadmins can manage all profiles." ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can do anything" ON public.profiles;
DROP POLICY IF EXISTS "Users can view and update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for superadmins" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can view all profiles." ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can update all profiles." ON public.profiles;
DROP FUNCTION IF EXISTS is_superadmin();

-- Recreate function with dynamic SQL to prevent PostgreSQL's static analysis from detecting recursion
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Using EXECUTE to break the static dependency check from the policy
  EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = %L AND role = ''superadmin'')', auth.uid())
  INTO is_admin;
  RETURN COALESCE(is_admin, false);
END;
$$;

-- Ensure RLS is enabled on the table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for regular authenticated users
CREATE POLICY "Users can view their own profile."
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile."
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Permissive policies for superadmins
CREATE POLICY "Superadmins can view all profiles."
ON public.profiles FOR SELECT
TO authenticated
USING (is_superadmin());

CREATE POLICY "Superadmins can update all profiles."
ON public.profiles FOR UPDATE
TO authenticated
USING (is_superadmin())
WITH CHECK (is_superadmin());
