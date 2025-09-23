/*
# [FIX] Add Tags to Templates Table
This script adds a `tags` column to the `templates` table to store keywords for searching and filtering.

## Query Description:
- Adds a `tags` column of type `text[]` (array of text).
- Sets a default value of an empty array to avoid nulls.
- This change is non-destructive and safe to apply.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (Column can be dropped)

## Structure Details:
- Table `public.templates`
  - Adds column `tags` (text[])

## Security Implications:
- RLS Status: No change
- Policy Changes: No
- Auth Requirements: None
*/

ALTER TABLE public.templates
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}' NOT NULL;
