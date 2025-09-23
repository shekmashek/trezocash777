/*
          # [Feature] User-Created Templates
          This migration adds the capability for users to create, share, and use project templates.

          ## Query Description:
          This script creates a new `templates` table to store user-generated templates. Each template contains a name, a description, and a JSONB structure representing the template's categories and accounts. It also includes Row Level Security (RLS) policies to ensure users can only manage their own templates, while allowing all users to view public templates. This is a safe, structural change with no impact on existing data.

          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - **Table Created**: `public.templates`
            - `id`: UUID, Primary Key
            - `user_id`: UUID, Foreign Key to `auth.users`
            - `name`: TEXT, Not Null
            - `description`: TEXT
            - `structure`: JSONB, contains the template's structure (categories, accounts, etc.)
            - `is_public`: BOOLEAN, defaults to true
            - `created_at`: TIMESTAMPTZ
            - `updated_at`: TIMESTAMPTZ
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
            - **SELECT**: All users can read public templates.
            - **INSERT**: Users can only create templates for themselves.
            - **UPDATE**: Users can only update their own templates.
            - **DELETE**: Users can only delete their own templates.
          - Auth Requirements: [Authenticated Users]
          
          ## Performance Impact:
          - Indexes: [Primary Key on `id`, Foreign Key on `user_id`]
          - Triggers: [None]
          - Estimated Impact: [Low. This is a new, independent table.]
          */

CREATE TABLE public.templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    structure jsonb NOT NULL,
    is_public boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT templates_pkey PRIMARY KEY (id),
    CONSTRAINT templates_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public templates are viewable by everyone."
ON public.templates FOR SELECT
USING ( is_public = true );

CREATE POLICY "Users can view their own templates."
ON public.templates FOR SELECT
USING ( (auth.uid() = user_id) );

CREATE POLICY "Users can insert their own templates."
ON public.templates FOR INSERT
WITH CHECK ( (auth.uid() = user_id) );

CREATE POLICY "Users can update their own templates."
ON public.templates FOR UPDATE
USING ( (auth.uid() = user_id) );

CREATE POLICY "Users can delete their own templates."
ON public.templates FOR DELETE
USING ( (auth.uid() = user_id) );

-- Trigger to update `updated_at` timestamp
CREATE OR REPLACE FUNCTION public.handle_template_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_template_update
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_template_update();
