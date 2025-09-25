-- The user wants to see provision transfers in the treasury, but not the final payout.
-- The final payout should, however, appear in the schedule.
-- To do this, we add a flag to distinguish a provision transfer from a provision payout.

/*
  # [Schema Update] Refine Provisioning System
  [This migration adds a flag to distinguish provision transfers from final expense payouts, improving cash flow accuracy.]

  ## Query Description: [This operation adds a new 'is_provision_payout' column to the 'actual_transactions' table to better track provisioned expenses. It is a non-destructive change.]

  ## Metadata:
  - Schema-Category: ["Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]

  ## Structure Details:
  - Table 'actual_transactions':
    - Adds column 'is_provision_payout' (BOOLEAN, default FALSE)

  ## Security Implications:
  - RLS Status: [Enabled]
  - Policy Changes: [No]
  - Auth Requirements: [None]

  ## Performance Impact:
  - Indexes: [None]
  - Triggers: [None]
  - Estimated Impact: [Low. Adding a column with a default value can be slow on very large tables, but is generally safe.]
*/
ALTER TABLE public.actual_transactions
ADD COLUMN is_provision_payout BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.actual_transactions.is_provision_payout IS 'Indicates if this transaction is the final payout of a provisioned expense, not a provision transfer itself.';
