/*
# [FEATURE] Enhance Templates with Icons and Purpose
This migration adds 'icon' and 'purpose' columns to the 'templates' table to allow for better categorization and visual representation of user-created templates.

## Query Description:
- Adds a new 'icon' column of type TEXT to store an icon identifier.
- Adds a new 'purpose' column of type TEXT to categorize templates (e.g., 'personal', 'professional').
- These are non-destructive, structural changes. Existing rows will have NULL values, which is handled by the application.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (DROP COLUMN icon, DROP COLUMN purpose)

## Structure Details:
- Table Affected: public.templates
- Columns Added: icon (TEXT), purpose (TEXT)

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible.
*/

ALTER TABLE public.templates
ADD COLUMN IF NOT EXISTS icon TEXT,
ADD COLUMN IF NOT EXISTS purpose TEXT;
