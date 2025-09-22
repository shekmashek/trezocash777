/*
          # [AUTOMATION] Create User Profile on Sign Up
          [This script creates a database trigger that automatically inserts a new row into the `public.profiles` table whenever a new user signs up and is added to the `auth.users` table.]

          ## Query Description: [This operation sets up an automation to keep user authentication data and user profile data in sync. It ensures that every user has a profile, which is required for other parts of the application (like creating projects) to work correctly. It has no impact on existing data but is crucial for new user registrations. It is a safe, structural change.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Creates a function `public.handle_new_user`.
          - Creates a trigger `on_auth_user_created` on the `auth.users` table.
          
          ## Security Implications:
          - RLS Status: [Not Applicable]
          - Policy Changes: [No]
          - Auth Requirements: [The function runs with definer security to be able to write to `public.profiles`.]
          
          ## Performance Impact:
          - Indexes: [None]
          - Triggers: [Adds one trigger to `auth.users` on insert.]
          - Estimated Impact: [Negligible performance impact on user sign-up.]
          */

-- Function to create a profile for a new user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

-- Trigger to call the function when a new user signs up
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
