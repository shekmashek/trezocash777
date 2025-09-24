-- Migration to add and populate the email column in the profiles table

/*
  # [Operation Name]
  Add Email to Profiles Table

  ## Query Description: [This operation adds an 'email' column to the 'profiles' table to store user emails, which is currently missing and causing application errors. It also updates the user creation trigger to automatically populate this new column for new users and backfills the email for all existing users to ensure data consistency.]

  ## Metadata:
  - Schema-Category: ["Structural", "Data"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]

  ## Structure Details:
  - Adds column `email` to `public.profiles`.
  - Modifies function `public.handle_new_user()` to include `email`.

  ## Security Implications:
  - RLS Status: [Enabled]
  - Policy Changes: [No]
  - Auth Requirements: [None]

  ## Performance Impact:
  - Indexes: [None]
  - Triggers: [Modified]
  - Estimated Impact: [Low. A one-time update on the profiles table.]
*/

-- Step 1: Add the email column to the profiles table.
-- This column will store the user's email, resolving the error where the app tries to access a non-existent column.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT;

-- Step 2: Update the function that handles new user creation.
-- This ensures that for every new user signing up, their email is automatically copied from the auth table to their profile.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Backfill the email column for all existing users.
-- This one-time update populates the new 'email' column for all users who signed up before this fix, ensuring data consistency.
UPDATE public.profiles
SET email = (SELECT u.email FROM auth.users u WHERE u.id = public.profiles.id)
WHERE email IS NULL;
