/*
# [Function Security Update]
Set a secure search_path for the delete_user_account function.

## Query Description:
This operation enhances security by explicitly setting the `search_path` for the `delete_user_account` function. This prevents potential "search path hijacking" attacks where a malicious user could create objects in a public schema that trick the function into executing unintended code. This change does not affect existing data or functionality but hardens the function against specific security vulnerabilities.

## Metadata:
- Schema-Category: ["Security", "Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Function affected: `public.delete_user_account()`

## Security Implications:
- RLS Status: Not applicable
- Policy Changes: No
- Auth Requirements: Admin privileges to alter function.
- Mitigates: Search path hijacking vulnerability.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible performance impact.
*/

ALTER FUNCTION public.delete_user_account() SET search_path = public;
