/*
  # [Operation Name]
  Fix user profile creation for existing user

  ## Query Description:
  This script inserts a profile record for the currently authenticated user if one does not already exist. This is a one-time fix for users created before the automatic profile creation trigger was in place. It ensures that the user's profile exists, which is necessary for creating projects and other user-specific data. This operation is safe and will not affect existing data.

  ## Metadata:
  - Schema-Category: ["Data"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [false]
  
  ## Structure Details:
  - Affects table: public.profiles
  
  ## Security Implications:
  - RLS Status: [Enabled]
  - Policy Changes: [No]
  - Auth Requirements: [User must be authenticated]
  
  ## Performance Impact:
  - Indexes: [None]
  - Triggers: [None]
  - Estimated Impact: [Low, affects a single row.]
*/
INSERT INTO public.profiles (id, full_name)
SELECT
    id,
    raw_user_meta_data->>'full_name'
FROM
    auth.users
WHERE
    id = auth.uid()
ON CONFLICT (id) DO NOTHING;
