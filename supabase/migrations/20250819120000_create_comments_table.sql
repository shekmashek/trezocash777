/*
          # Create Comments Table and Policies
          This script creates the `comments` table to store user discussions on transactions and sets up Row Level Security (RLS) policies to control access.

          ## Query Description:
          - Creates the `comments` table with columns for content, user references, and links to projects/transactions.
          - Enables RLS on the new table to ensure data privacy.
          - Adds policies to allow users to read comments on projects they can access, and to insert, update, or delete their own comments.
          - This is a structural change and is safe to run on existing databases as it only adds new objects.

          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true (by dropping the table and policies)
          
          ## Structure Details:
          - Table added: `public.comments`
          - Columns: `id`, `project_id`, `user_id`, `row_id`, `column_id`, `content`, `mentioned_users`, `created_at`
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes (4 new policies added for `comments` table)
          - Auth Requirements: Policies rely on `auth.uid()` to determine user access.
          
          ## Performance Impact:
          - Indexes: Primary key index on `id` is created automatically. Consider adding indexes on `project_id`, `row_id`, and `column_id` if performance becomes an issue.
          - Triggers: None
          - Estimated Impact: Low. The impact will be negligible until a large volume of comments is generated.
          */
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    row_id TEXT NOT NULL,
    column_id TEXT NOT NULL,
    content TEXT NOT NULL,
    mentioned_users UUID[],
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Allow users to see comments on projects they have access to
CREATE POLICY "Allow read access to comments on accessible projects"
ON public.comments
FOR SELECT
USING (
    project_id IS NULL OR -- For consolidated view comments
    EXISTS (
        SELECT 1 FROM projects WHERE id = comments.project_id AND user_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM collaborators WHERE user_id = auth.uid() AND comments.project_id = ANY(project_ids)
    )
);

-- Allow users to insert comments on projects they have access to
CREATE POLICY "Allow insert access to comments on accessible projects"
ON public.comments
FOR INSERT
WITH CHECK (
    user_id = auth.uid() AND
    (
        project_id IS NULL OR
        EXISTS (
            SELECT 1 FROM projects WHERE id = comments.project_id AND user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM collaborators WHERE user_id = auth.uid() AND comments.project_id = ANY(project_ids)
        )
    )
);

-- Allow users to update their own comments
CREATE POLICY "Allow users to update their own comments"
ON public.comments
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow users to delete their own comments
CREATE POLICY "Allow users to delete their own comments"
ON public.comments
FOR DELETE
USING (user_id = auth.uid());
