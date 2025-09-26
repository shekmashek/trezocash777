/*
# [Feature] Add Payment Terms to Tiers
This migration adds a `payment_terms` column to the `tiers` table to allow defining custom payment schedules for each third-party.

## Query Description:
This operation adds a new JSONB column to the `tiers` table. It is non-destructive and will not affect existing data. A check constraint is also added to ensure data integrity for new payment terms.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (The column can be dropped)

## Structure Details:
- Table `tiers`:
  - Adds column `payment_terms` (jsonb, nullable)
  - Adds constraint `payment_terms_percentage_sum_check`

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible.
*/

-- Add payment_terms column to tiers table
ALTER TABLE public.tiers
ADD COLUMN payment_terms jsonb;

-- Add a check constraint to ensure the sum of percentages is 100 if terms are defined
-- This ensures that the payment schedule for a tier always accounts for 100% of the amount.
ALTER TABLE public.tiers
ADD CONSTRAINT payment_terms_percentage_sum_check
CHECK (
  payment_terms IS NULL OR
  (
    SELECT SUM((term->>'percentage')::numeric)
    FROM jsonb_array_elements(payment_terms) AS term
  ) = 100
);
