/*
# [Security Enhancement] Grant Superadmin Full Access
This migration grants full CRUD (Create, Read, Update, Delete) access to superadministrators across all key data tables.

## Query Description:
This operation adds new Row-Level Security (RLS) policies to several tables. These policies check if the currently authenticated user has the 'superadmin' role in their profile. If they do, they are granted unrestricted access to the data in that table. This is a critical step for enabling the superadministrator dashboard and management features. This change is safe and does not affect regular users' permissions.

## Metadata:
- Schema-Category: ["Security", "Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true (by dropping the policies)

## Structure Details:
Adds new RLS policies to the following tables:
- projects
- collaborators
- tiers
- loans
- scenarios
- budget_entries
- actual_transactions
- payments
- cash_accounts
- scenario_entries
- consolidated_views
- comments
- templates

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes. Adds new policies to allow superadmin access.
- Auth Requirements: Authenticated users with 'superadmin' role.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible. The subquery to check the user's role is efficient.
*/

-- Grant full access to superadmins on all tables
CREATE POLICY "Superadmins can access all projects." ON public.projects FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin') WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin');
CREATE POLICY "Superadmins can access all collaborator entries." ON public.collaborators FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin') WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin');
CREATE POLICY "Superadmins can access all tiers." ON public.tiers FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin') WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin');
CREATE POLICY "Superadmins can access all loans." ON public.loans FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin') WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin');
CREATE POLICY "Superadmins can access all scenarios." ON public.scenarios FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin') WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin');
CREATE POLICY "Superadmins can access all budget entries." ON public.budget_entries FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin') WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin');
CREATE POLICY "Superadmins can access all actual transactions." ON public.actual_transactions FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin') WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin');
CREATE POLICY "Superadmins can access all payments." ON public.payments FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin') WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin');
CREATE POLICY "Superadmins can access all cash accounts." ON public.cash_accounts FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin') WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin');
CREATE POLICY "Superadmins can access all scenario entries." ON public.scenario_entries FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin') WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin');
CREATE POLICY "Superadmins can access all consolidated views." ON public.consolidated_views FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin') WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin');
CREATE POLICY "Superadmins can access all comments." ON public.comments FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin') WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin');
CREATE POLICY "Superadmins can access all templates." ON public.templates FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin') WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin');
