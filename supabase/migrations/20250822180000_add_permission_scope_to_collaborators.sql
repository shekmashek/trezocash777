/*
          # [Structural] Add Permission Scope to Collaborators
          [This migration adds a new column `permission_scope` to the `collaborators` table to allow for more granular control over user permissions (all, income_only, expense_only).]

          ## Query Description: [This operation adds a new `permission_scope` column to the `collaborators` table. It will default to 'all' for existing collaborators, ensuring no loss of access. This change is non-destructive.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Table: `public.collaborators`
          - Column Added: `permission_scope` (text, NOT NULL, DEFAULT 'all')
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: No
          - Auth Requirements: None
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Low. Adding a column with a default value might take some time on very large tables, but it's generally a fast operation.
          */

ALTER TABLE public.collaborators
ADD COLUMN IF NOT EXISTS permission_scope text NOT NULL DEFAULT 'all';

COMMENT ON COLUMN public.collaborators.permission_scope IS 'Defines the scope of permissions (all, income_only, expense_only).';
