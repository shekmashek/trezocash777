/*
  # [Schema-Update] Add Icon, Color, and Purpose to Templates
  [This operation adds new columns to the `templates` table to support customization with icons and colors, and to categorize them by purpose.]

  ## Query Description: [This is a safe, non-destructive operation that adds `icon`, `color`, and `purpose` columns to the `templates` table. It will not affect existing data and is fully reversible.]
  
  ## Metadata:
  - Schema-Category: ["Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Table 'templates':
    - Adds column 'icon' (TEXT)
    - Adds column 'color' (TEXT)
    - Adds column 'purpose' (TEXT)
  
  ## Security Implications:
  - RLS Status: [No change]
  - Policy Changes: [No]
  - Auth Requirements: [None]
  
  ## Performance Impact:
  - Indexes: [None]
  - Triggers: [None]
  - Estimated Impact: [Negligible. Adding nullable columns is a fast metadata change.]
*/

ALTER TABLE public.templates
ADD COLUMN IF NOT EXISTS icon TEXT,
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS purpose TEXT;
