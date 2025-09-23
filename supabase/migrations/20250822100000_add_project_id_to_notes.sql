/*
  # [Structural] Add project scoping to notes
  This migration adds a `project_id` column to the `notes` table, allowing notes to be associated with specific projects.

  ## Query Description:
  - Adds a `project_id` column of type `uuid` to the `notes` table.
  - This column is nullable, allowing notes to exist without a project association (e.g., for a consolidated view).
  - Adds a foreign key constraint to link `project_id` to the `projects` table's `id`.
  - Sets `ON DELETE CASCADE` so that if a project is deleted, all its associated notes are also deleted automatically.
  - This change is non-destructive to existing data. Existing notes will have a `NULL` `project_id`.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (Can be reversed by dropping the column and constraint)

  ## Structure Details:
  - Table Modified: `public.notes`
  - Column Added: `project_id` (uuid, nullable)
  - Constraint Added: `notes_project_id_fkey`

  ## Security Implications:
  - RLS Status: Unchanged. Existing RLS policies on `notes` based on `user_id` remain in effect.
  - Policy Changes: No
  - Auth Requirements: None for this migration.

  ## Performance Impact:
  - Indexes: A foreign key constraint typically creates an index on the `project_id` column, which will improve performance for queries filtering by project.
  - Triggers: No
  - Estimated Impact: Low. The operation should be fast on tables of small to medium size.
*/

ALTER TABLE public.notes
ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;

COMMENT ON COLUMN public.notes.project_id IS 'The project this note belongs to. NULL for consolidated/global notes.';
