/*
  # [Feature] Add Criticality Level to Categories
  Adds a `criticality` level to user-defined categories to allow for better budget prioritization and analysis.

  ## Query Description:
  This operation adds a new column to the `user_categories` table to store the criticality of a spending category. It introduces a new `enum` type to ensure data consistency. A default value of 'essential' is set for new categories. This change is non-destructive and fully reversible.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - Table `public.user_categories`: Adds a new column `criticality`.
  - Type `public.criticality_level`: A new ENUM type is created.

  ## Security Implications:
  - RLS Status: Unchanged
  - Policy Changes: No
  - Auth Requirements: None

  ## Performance Impact:
  - Indexes: None
  - Triggers: None
  - Estimated Impact: Negligible performance impact.
*/

-- Create the ENUM type for criticality levels if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'criticality_level') THEN
        CREATE TYPE public.criticality_level AS ENUM ('critical', 'essential', 'discretionary');
    END IF;
END$$;

-- Add the new column to the user_categories table if it doesn't exist
ALTER TABLE public.user_categories
ADD COLUMN IF NOT EXISTS criticality public.criticality_level DEFAULT 'essential';

-- Set default values for existing categories based on their ID
-- This makes the feature immediately useful for existing users with default categories.

-- Critique
UPDATE public.user_categories SET criticality = 'critical' WHERE id IN (
    'exp-sub-1-1', 'exp-sub-1-5', 'exp-sub-2-1', 'exp-sub-2-2', 'exp-sub-2-3', 'exp-sub-2-5', 'exp-sub-2-6', 'exp-sub-2-7', 'exp-sub-2-8',
    'exp-sub-3-3', 'exp-sub-3-4', 'exp-sub-7-1', 'exp-sub-7-2', 'exp-sub-8-2', 'exp-sub-9-5', 'exp-sub-9-6', 'exp-sub-10-1',
    'exp-sub-10-3', 'exp-sub-10-4', 'exp-sub-11-1', 'exp-sub-11-2', 'exp-sub-11-3', 'exp-sub-11-4', 'exp-sub-11-5', 'exp-sub-11-6', 'exp-sub-12-1'
);

-- Essentiel
UPDATE public.user_categories SET criticality = 'essential' WHERE id IN (
    'exp-sub-1-2', 'exp-sub-1-4', 'exp-sub-2-4', 'exp-sub-3-1', 'exp-sub-3-2', 'exp-sub-3-5', 'exp-sub-4-1', 'exp-sub-4-4',
    'exp-sub-5-1', 'exp-sub-5-2', 'exp-sub-5-3', 'exp-sub-5-4', 'exp-sub-9-2', 'exp-sub-9-3', 'exp-sub-9-4', 'exp-sub-9-7',
    'exp-sub-10-2', 'exp-sub-12-3', 'exp-sub-13-3'
);

-- Discrétionnaire (all others will be set by this)
UPDATE public.user_categories SET criticality = 'discretionary' WHERE 
    type = 'expense' AND 
    criticality IS NULL AND
    id NOT IN (
        'exp-sub-1-1', 'exp-sub-1-5', 'exp-sub-2-1', 'exp-sub-2-2', 'exp-sub-2-3', 'exp-sub-2-5', 'exp-sub-2-6', 'exp-sub-2-7', 'exp-sub-2-8',
        'exp-sub-3-3', 'exp-sub-3-4', 'exp-sub-7-1', 'exp-sub-7-2', 'exp-sub-8-2', 'exp-sub-9-5', 'exp-sub-9-6', 'exp-sub-10-1',
        'exp-sub-10-3', 'exp-sub-10-4', 'exp-sub-11-1', 'exp-sub-11-2', 'exp-sub-11-3', 'exp-sub-11-4', 'exp-sub-11-5', 'exp-sub-11-6', 'exp-sub-12-1',
        'exp-sub-1-2', 'exp-sub-1-4', 'exp-sub-2-4', 'exp-sub-3-1', 'exp-sub-3-2', 'exp-sub-3-5', 'exp-sub-4-1', 'exp-sub-4-4',
        'exp-sub-5-1', 'exp-sub-5-2', 'exp-sub-5-3', 'exp-sub-5-4', 'exp-sub-9-2', 'exp-sub-9-3', 'exp-sub-9-4', 'exp-sub-9-7',
        'exp-sub-10-2', 'exp-sub-12-3', 'exp-sub-13-3'
    );
