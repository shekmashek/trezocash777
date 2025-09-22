/*
# [SECURITY] Re-secure delete_user_account Function
This migration script re-applies security settings to the `delete_user_account` function to address a persistent security warning. It explicitly sets a safe search_path to prevent potential search path hijacking attacks.

## Query Description:
This operation will replace the existing `delete_user_account` function with an updated, more secure version. This ensures the function's execution environment is properly isolated. There is no risk to existing data.

## Metadata:
- Schema-Category: ["Security", "Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true (by restoring the previous function definition)

## Structure Details:
- Functions affected: `public.delete_user_account`

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None
- Mitigates: Search Path Hijacking Vulnerability.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible.
*/

-- Recreate delete_user_account function with security settings
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = auth.uid();
  -- The following line is powerful. It bypasses RLS on auth.users because of SECURITY DEFINER.
  -- This is the intended behavior for a user to delete their own account.
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
