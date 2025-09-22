/*
          # [Data Patch] Ensure User Profile Exists
          This script ensures that a profile exists for the currently authenticated user. It's a data patch to fix accounts created before the automatic profile creation trigger was implemented.

          ## Query Description: 
          - It attempts to insert the current user's ID and email from the `auth.users` table into the `public.profiles` table.
          - If a profile for the user already exists, the `ON CONFLICT (id) DO NOTHING` clause ensures that no action is taken and no error occurs.
          - This is a safe, idempotent operation. It will only add a profile if one is missing.

          ## Metadata:
          - Schema-Category: ["Data"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [Must be run by the authenticated user]
          
          ## Performance Impact:
          - Indexes: [No change]
          - Triggers: [No change]
          - Estimated Impact: [Negligible. Affects at most one row.]
          */
INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users WHERE id = auth.uid()
ON CONFLICT (id) DO NOTHING;
