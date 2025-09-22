/*
# [Feature] Add Access Level to Collaborators
This migration adds a new `access_level` column to the `collaborators` table to allow for more granular permissions.

## Query Description:
This operation adds a new column `access_level` to the `public.collaborators` table.
- The column will store text values: 'inflow', 'outflow', or 'both'.
- It defaults to 'both' for existing and new collaborators, ensuring backward compatibility.
- A CHECK constraint is added to enforce data integrity.
This change is non-destructive and should not impact existing data.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Table affected: `public.collaborators`
- Column added: `access_level` (type: TEXT, default: 'both')
- Constraint added: `collaborators_access_level_check`

## Security Implications:
- RLS Status: Enabled (on collaborators table)
- Policy Changes: No
- Auth Requirements: This change will be used by application logic to enforce more granular access control, but does not change RLS policies directly in this migration.

## Performance Impact:
- Indexes: None added.
- Triggers: None added.
- Estimated Impact: Negligible. Adding a column with a default value to a small table has minimal performance impact.
*/

-- Add the new column with a default value
ALTER TABLE public.collaborators
ADD COLUMN access_level TEXT NOT NULL DEFAULT 'both';

-- Add a check constraint to ensure data integrity
ALTER TABLE public.collaborators
ADD CONSTRAINT collaborators_access_level_check CHECK (access_level IN ('inflow', 'outflow', 'both'));
