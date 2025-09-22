/*
# [Function Security] Secure `delete_storage_object`
This operation secures the `delete_storage_object` function by setting its `search_path` to prevent potential security vulnerabilities like search path hijacking.

## Query Description: [This is a safe security enhancement. It modifies the function's configuration to restrict its execution scope, which is a recommended best practice for SECURITY DEFINER functions. It does not alter the function's logic or impact any data.]

## Metadata:
- Schema-Category: ["Security", "Safe"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Function: `public.delete_storage_object(text, text)`

## Security Implications:
- RLS Status: [Not Applicable]
- Policy Changes: [No]
- Auth Requirements: [Not Applicable]

## Performance Impact:
- Indexes: [Not Modified]
- Triggers: [Not Modified]
- Estimated Impact: [None]
*/
ALTER FUNCTION public.delete_storage_object(text, text) SET search_path = '';
