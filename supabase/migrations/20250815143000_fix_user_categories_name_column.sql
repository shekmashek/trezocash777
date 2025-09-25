/*
  # [Schema Correction] Add 'name' column
  [This script adds the missing 'name' column to the 'user_categories' table. This is required to store the names of custom categories and will resolve the error encountered when trying to create a new main category.]

  ## Query Description: [This is a safe, non-destructive operation that alters the table structure. It adds a new 'name' column without affecting any existing data.]
  
  ## Metadata:
  - Schema-Category: ["Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Table: public.user_categories
  - Column Added: name (text)
  
  ## Security Implications:
  - RLS Status: [No Change]
  - Policy Changes: [No]
  - Auth Requirements: [None]
  
  ## Performance Impact:
  - Indexes: [None]
  - Triggers: [None]
  - Estimated Impact: [Negligible impact on performance.]
*/
ALTER TABLE public.user_categories ADD COLUMN IF NOT EXISTS name text;
