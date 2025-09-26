/*
# [Schema] Mise à jour des catégories de TVA
Met à jour les catégories liées à la TVA pour une gestion plus fine et correcte.

## Query Description:
- Renomme la sous-catégorie "TVA collectible" en "TVA collectée" pour utiliser la terminologie correcte.
- Ajoute la sous-catégorie fixe "TVA à payer" dans la catégorie principale "Impôts et Taxes".
- Ajoute la sous-catégorie fixe "Crédit de TVA" dans la catégorie principale "Autres Entrées".
Ces changements sont structurels et n'affectent pas les données existantes. Ils sont idempotents et peuvent être exécutés plusieurs fois sans danger.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Table affectée: `public.user_categories`
- Opérations: UPDATE, INSERT

## Security Implications:
- RLS Status: Enabled
- Policy Changes: No
- Auth Requirements: None
*/

-- Renommer "TVA collectible" en "TVA collectée"
UPDATE public.user_categories
SET name = 'TVA collectée'
WHERE id = 'exp-sub-7-2' AND name = 'TVA collectible';

-- Ajouter la sous-catégorie "TVA à payer" si elle n'existe pas
INSERT INTO public.user_categories (id, parent_id, name, type, is_fixed)
VALUES ('exp-sub-7-5', 'exp-main-7', 'TVA à payer', 'expense', true)
ON CONFLICT (id) DO NOTHING;

-- Ajouter la sous-catégorie "Crédit de TVA" si elle n'existe pas
INSERT INTO public.user_categories (id, parent_id, name, type, is_fixed)
VALUES ('rev-sub-3-3', 'rev-main-3', 'Crédit de TVA', 'revenue', true)
ON CONFLICT (id) DO NOTHING;
