/*
# [Schema Upgrade] Add Display Settings to Projects
This migration adds columns to the `projects` table to store individual display preferences for currency, number formatting, and decimal places.

## Query Description:
This is a non-destructive operation that adds new columns with default values to the `projects` table. Existing projects will automatically receive the default settings ('€', standard unit, 2 decimal places) and will not be affected otherwise.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by dropping the columns)

## Structure Details:
- Table `public.projects`:
  - Adds `currency` (TEXT, default '€')
  - Adds `display_unit` (TEXT, default 'standard')
  - Adds `decimal_places` (INT, default 2)

## Security Implications:
- RLS Status: Unchanged. Existing policies on the `projects` table will apply to these new columns.
- Policy Changes: No
- Auth Requirements: Requires permissions to alter the `projects` table.

## Performance Impact:
- Indexes: None added.
- Triggers: None added.
- Estimated Impact: Negligible. Adding columns with default values to a table of moderate size is a fast operation in PostgreSQL.
*/

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT '€',
ADD COLUMN IF NOT EXISTS display_unit TEXT NOT NULL DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS decimal_places INTEGER NOT NULL DEFAULT 2;
