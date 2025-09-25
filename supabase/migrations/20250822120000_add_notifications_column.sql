/*
          # Add Notifications Column to Profiles
          This operation adds a 'notifications' column to the 'profiles' table to store user notifications.

          ## Query Description: 
          - This is a safe, non-destructive operation.
          - It adds a new column `notifications` of type `jsonb[]` with a default empty array value.
          - No existing data will be affected.
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true (the column can be dropped)
          
          ## Structure Details:
          - Table: `public.profiles`
          - Column Added: `notifications` (type: `jsonb[]`)
          
          ## Security Implications:
          - RLS Status: Unchanged
          - Policy Changes: No
          - Auth Requirements: None
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Negligible
          */
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notifications jsonb[] DEFAULT ARRAY[]::jsonb[];
