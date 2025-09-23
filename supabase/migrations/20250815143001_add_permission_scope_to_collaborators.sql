/*
# [Structural] Add Permission Scope to Collaborators
This migration adds a new column `permission_scope` to the `collaborators` table to allow for more granular control over user permissions.

## Query Description:
- **Adds `permission_scope` column**: A new `TEXT` column is added to the `collaborators` table. It will store the scope of permissions ('all', 'income_only', 'expense_only').
- **Sets a default value**: The column defaults to 'all' to ensure existing collaborators maintain full access.
- **Adds a check constraint**: Ensures that only valid, expected values can be inserted into this column, maintaining data integrity.

This change is non-destructive and backward-compatible with existing data.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (The column can be dropped)

## Structure Details:
- **Table Affected**: `public.collaborators`
- **Column Added**: `permission_scope` (TEXT, NOT NULL, DEFAULT 'all')
- **Constraint Added**: `valid_permission_scope` (CHECK constraint)

## Security Implications:
- RLS Status: Enabled
- Policy Changes: No
- Auth Requirements: None for this migration, but the new column will be used by RLS policies later.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible. Adding a column with a default value to an existing table may require a brief table lock, but the impact is minimal on small to medium-sized tables.
*/

ALTER TABLE public.collaborators
ADD COLUMN IF NOT EXISTS permission_scope TEXT NOT NULL DEFAULT 'all';

ALTER TABLE public.collaborators
DROP CONSTRAINT IF EXISTS valid_permission_scope;

ALTER TABLE public.collaborators
ADD CONSTRAINT valid_permission_scope CHECK (permission_scope IN ('all', 'income_only', 'expense_only'));
