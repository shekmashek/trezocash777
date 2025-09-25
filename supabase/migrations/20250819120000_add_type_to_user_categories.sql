/*
          # Add Type Column to User Categories
          This operation adds a 'type' column to the 'user_categories' table to distinguish between revenue and expense categories.

          ## Query Description: 
          This is a non-destructive structural change. It adds a new column to an existing table. No data will be lost.

          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true (by dropping the column)
          
          ## Structure Details:
          - Table: user_categories
          - Column Added: type (text)
          
          ## Security Implications:
          - RLS Status: Unchanged
          - Policy Changes: No
          - Auth Requirements: None
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Negligible.
          */
ALTER TABLE public.user_categories ADD COLUMN type text;
