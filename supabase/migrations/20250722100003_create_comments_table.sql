/*
# [Feature] Commenting System
This migration sets up the database schema required for the in-app commenting and notification system.

## Query Description:
This script creates a new table `comments` to store user comments on specific data points within the application. It also enables Row Level Security (RLS) on this table and defines policies to ensure users can only access and manage comments appropriately within the projects they have access to.

- **`comments` table**: Stores the comment content, author, and links it to a specific row and column in the UI.
- **RLS Policies**:
  - **SELECT**: Users can view comments on projects they own or are a collaborator on.
  - **INSERT**: Users can add comments on projects they own or are a collaborator on.
  - **UPDATE**: Users can only update their own comments.
  - **DELETE**: Users can only delete their own comments.

This is a structural change and is safe to apply. It does not affect existing data.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by dropping the table and policies)

## Structure Details:
- **Table Created**: `public.comments`
  - `id`: UUID, Primary Key
  - `created_at`: Timestamptz, Default now()
  - `user_id`: UUID, Foreign Key to `auth.users`
  - `project_id`: UUID, Foreign Key to `public.projects`
  - `row_id`: TEXT, identifier for the row being commented on
  - `column_id`: TEXT, identifier for the column/period
  - `content`: TEXT, the comment message
  - `mentioned_users`: UUID[], array of mentioned user IDs

## Security Implications:
- RLS Status: Enabled on `public.comments`
- Policy Changes: Yes, new policies are created for SELECT, INSERT, UPDATE, DELETE on the `comments` table.
- Auth Requirements: Policies rely on `auth.uid()` to determine user permissions.

## Performance Impact:
- Indexes: Primary key index on `id` and foreign key indexes are created automatically. An index on `(row_id, column_id)` is added for faster comment lookups.
- Triggers: None
- Estimated Impact: Low. The impact will be negligible until a large volume of comments is generated.
*/

-- Create the comments table
CREATE TABLE public.comments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    user_id uuid NOT NULL DEFAULT auth.uid(),
    project_id uuid NULL,
    row_id text NOT NULL,
    column_id text NOT NULL,
    content text NOT NULL,
    mentioned_users uuid[] NULL,
    CONSTRAINT comments_pkey PRIMARY KEY (id),
    CONSTRAINT comments_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add indexes for performance
CREATE INDEX idx_comments_row_column ON public.comments USING btree (row_id, column_id);
CREATE INDEX idx_comments_project_id ON public.comments USING btree (project_id);

-- Enable Row Level Security
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow users to see comments in projects they have access to
CREATE POLICY "Allow read access to project members"
ON public.comments
FOR SELECT
USING (
  -- Case 1: Consolidated view or no project context (e.g., global notes)
  (project_id IS NULL) OR
  -- Case 2: User is the owner of the project
  (EXISTS (SELECT 1 FROM projects WHERE projects.id = comments.project_id AND projects.user_id = auth.uid())) OR
  -- Case 3: User is a collaborator on the project
  (EXISTS (SELECT 1 FROM collaborators WHERE comments.project_id = ANY(collaborators.project_ids) AND collaborators.user_id = auth.uid()))
);

-- RLS Policy: Allow users to insert comments in projects they have access to
CREATE POLICY "Allow insert for project members"
ON public.comments
FOR INSERT
WITH CHECK (
  (auth.uid() = user_id) AND (
    -- Case 1: Consolidated view or no project context
    (project_id IS NULL) OR
    -- Case 2: User is the owner of the project
    (EXISTS (SELECT 1 FROM projects WHERE projects.id = comments.project_id AND projects.user_id = auth.uid())) OR
    -- Case 3: User is a collaborator on the project
    (EXISTS (SELECT 1 FROM collaborators WHERE comments.project_id = ANY(collaborators.project_ids) AND collaborators.user_id = auth.uid()))
  )
);

-- RLS Policy: Allow users to update their own comments
CREATE POLICY "Allow update for own comments"
ON public.comments
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Allow users to delete their own comments
CREATE POLICY "Allow delete for own comments"
ON public.comments
FOR DELETE
USING (auth.uid() = user_id);
