/*
# [SECURITY] Secure delete_user_account function
This migration secures the `delete_user_account` function by setting a fixed `search_path`. This prevents potential security vulnerabilities related to search path hijacking.

## Query Description: 
- This operation modifies an existing function's configuration.
- It does not alter any data or table structures.
- It is a safe, non-destructive operation that enhances security.

## Metadata:
- Schema-Category: ["Security", "Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true (by altering the function again to remove the search_path setting)

## Structure Details:
- Function affected: `public.delete_user_account()`

## Security Implications:
- RLS Status: Not applicable
- Policy Changes: No
- Auth Requirements: Function is `security definer`.
- Mitigates: Search path hijacking vulnerability.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible performance impact.
*/

ALTER FUNCTION public.delete_user_account() SET search_path = public;
