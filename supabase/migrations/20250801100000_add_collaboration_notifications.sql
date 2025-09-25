-- Add a column to track if the owner has been notified of the collaborator's response.
ALTER TABLE public.collaborators
ADD COLUMN IF NOT EXISTS owner_notified BOOLEAN NOT NULL DEFAULT FALSE;

-- Allow owners to update the notification status for their own invitations.
DROP POLICY IF EXISTS "Owners can update their own collaborations" ON public.collaborators;
CREATE POLICY "Owners can update their own collaborations"
ON public.collaborators
FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);
