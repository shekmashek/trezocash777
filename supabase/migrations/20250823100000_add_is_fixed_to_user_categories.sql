/*
          # Add is_fixed column to user_categories
          This operation adds the 'is_fixed' column to the 'user_categories' table to support custom category management.

          ## Query Description:
          This is a non-destructive operation that adds a new column with a default value. It will not affect existing data and is safe to run.

          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true

          ## Structure Details:
          - Table: public.user_categories
          - Column Added: is_fixed (BOOLEAN, NOT NULL, DEFAULT false)

          ## Security Implications:
          - RLS Status: Unchanged
          - Policy Changes: No
          - Auth Requirements: None

          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Negligible. Adding a column with a default value is a fast metadata change on modern PostgreSQL versions.
          */
ALTER TABLE public.user_categories
ADD COLUMN IF NOT EXISTS is_fixed BOOLEAN NOT NULL DEFAULT false;
