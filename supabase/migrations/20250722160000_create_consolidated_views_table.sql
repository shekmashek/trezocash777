/*
  # Create Consolidated Views Table
  This operation creates a new table `consolidated_views` to store user-defined project consolidations.

  ## Query Description:
  - Creates the `consolidated_views` table.
  - Adds columns for `id`, `user_id`, `created_at`, `name`, and `project_ids`.
  - Sets up a foreign key relationship to `auth.users`.
  - Enables Row Level Security (RLS) and defines policies to ensure users can only access their own consolidated views.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (the table can be dropped)

  ## Structure Details:
  - Table created: `public.consolidated_views`
  - Columns: `id`, `user_id`, `created_at`, `name`, `project_ids`

  ## Security Implications:
  - RLS Status: Enabled
  - Policy Changes: Yes (new policies for `consolidated_views`)
  - Auth Requirements: Users must be authenticated to interact with the table.
*/

-- Create the consolidated_views table
CREATE TABLE public.consolidated_views (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    name text NOT NULL,
    project_ids uuid[] NOT NULL,
    CONSTRAINT consolidated_views_pkey PRIMARY KEY (id),
    CONSTRAINT consolidated_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add comments to the table and columns
COMMENT ON TABLE public.consolidated_views IS 'Stores user-defined consolidated views of multiple projects.';
COMMENT ON COLUMN public.consolidated_views.name IS 'The name of the consolidated view.';
COMMENT ON COLUMN public.consolidated_views.project_ids IS 'An array of project UUIDs included in this view.';

-- Enable Row Level Security
ALTER TABLE public.consolidated_views ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own consolidated views"
ON public.consolidated_views
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consolidated views"
ON public.consolidated_views
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consolidated views"
ON public.consolidated_views
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own consolidated views"
ON public.consolidated_views
FOR DELETE
USING (auth.uid() = user_id);
