-- Step 1: Add missing 'parent_id' column to user_categories if it doesn't exist.
-- This makes the script idempotent.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_categories' AND column_name='parent_id') THEN
        ALTER TABLE public.user_categories ADD COLUMN parent_id UUID REFERENCES public.user_categories(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 2: Clean up old policies and re-create them correctly.
DROP POLICY IF EXISTS "Users can view their own categories" ON public.user_categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON public.user_categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON public.user_categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON public.user_categories;

-- Ensure RLS is enabled before creating policies
ALTER TABLE public.user_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own categories"
ON public.user_categories FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
ON public.user_categories FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
ON public.user_categories FOR UPDATE
USING (auth.uid() = user_id AND is_fixed = false)
WITH CHECK (auth.uid() = user_id AND is_fixed = false);

CREATE POLICY "Users can delete their own categories"
ON public.user_categories FOR DELETE
USING (auth.uid() = user_id AND is_fixed = false);
