/*
# [Function Security Hardening]
This migration secures existing database functions by explicitly setting the `search_path`. This is a critical security best practice that mitigates the risk of certain types of attacks, such as those involving malicious functions being placed in other schemas.

## Query Description:
- **`delete_user_account()`**: The search path is set to empty (`''`), ensuring that only objects in the `public` schema (or those explicitly schema-qualified) are resolved. This prevents a malicious user from creating a function in their own schema that could be executed with the definer's elevated privileges.
- **`handle_new_user()`**: Same as above, the search path is restricted to prevent hijacking and ensure the function operates only on intended tables.

These changes do not alter the logic of the functions but significantly improve their security posture.

## Metadata:
- Schema-Category: ["Security", "Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Modifies `public.delete_user_account` function.
- Modifies `public.handle_new_user` function.

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None
- **Key Improvement**: This directly addresses the "Function Search Path Mutable" security advisory by hardening the functions against search path hijacking attacks.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible. This is a security and correctness fix, not a performance optimization.
*/

-- Secure the delete_user_account function
create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- First, delete from public tables that don't cascade from projects
  delete from public.notes where user_id = auth.uid();
  delete from public.tiers where user_id = auth.uid();
  
  -- Delete projects, which will cascade to related tables
  delete from public.projects where user_id = auth.uid();
  
  -- Finally, delete the user from auth.users. The trigger on auth.users will delete the profile.
  delete from auth.users where id = auth.uid();
end;
$$;

-- Secure the handle_new_user function
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;
