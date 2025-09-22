/*
  # [Feature] Custom Consolidated Views
  Adds a new table to store user-defined consolidated views, allowing users to group specific projects.

  ## Query Description: [This migration creates a new 'consolidated_views' table and sets up its security policies. This is a non-destructive structural change and is safe to apply. It enables the new custom consolidation feature.]

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (by dropping the table and policies)

  ## Structure Details:
  - Adds table: public.consolidated_views
  - Columns: id, user_id, name, project_ids, created_at

  ## Security Implications:
  - RLS Status: Enabled
  - Policy Changes: Yes (new policies for the 'consolidated_views' table)
  - Auth Requirements: Users can only manage their own consolidated views.
  
  ## Performance Impact:
  - Indexes: Adds primary key and foreign key indexes.
  - Triggers: None
  - Estimated Impact: Low. This is a new table and will not impact existing queries until the feature is used.
*/

-- Create the table for consolidated views
CREATE TABLE public.consolidated_views (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    name text NOT NULL,
    project_ids jsonb NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT consolidated_views_pkey PRIMARY KEY (id),
    CONSTRAINT consolidated_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.consolidated_views ENABLE ROW LEVEL SECURITY;

-- Create policies for consolidated_views
CREATE POLICY "Users can view their own consolidated views"
ON public.consolidated_views FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consolidated views"
ON public.consolidated_views FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consolidated views"
ON public.consolidated_views FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own consolidated views"
ON public.consolidated_views FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
