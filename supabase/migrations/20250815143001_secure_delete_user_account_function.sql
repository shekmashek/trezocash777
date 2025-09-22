/*
          # [SECURITY] Secure delete_user_account function
          [This operation secures the `delete_user_account` function by setting a fixed `search_path` to prevent potential search path hijacking vulnerabilities.]

          ## Query Description: [This operation modifies the `delete_user_account` function to explicitly set its search path. This is a crucial security enhancement that ensures the function calls objects from the intended schemas (`public`, `auth`) only, mitigating the risk of search path hijacking. This change does not affect existing data or the function's core logic but significantly hardens its security posture.]
          
          ## Metadata:
          - Schema-Category: ["Security", "Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Function: `public.delete_user_account()`
          
          ## Security Implications:
          - RLS Status: [Not Applicable]
          - Policy Changes: [No]
          - Auth Requirements: [Requires `security definer` privileges, which the function already has.]
          
          ## Performance Impact:
          - Indexes: [Not Applicable]
          - Triggers: [Not Applicable]
          - Estimated Impact: [None. This is a metadata change for security and does not affect query performance.]
          */
ALTER FUNCTION public.delete_user_account() SET search_path = public, auth;
