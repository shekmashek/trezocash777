/*
# [Correctif Final] Mise à jour des catégories de TVA
Ce script corrige les erreurs de la migration précédente en mettant à jour les catégories de TVA de manière sécurisée, sans utiliser d'identifiants incorrects.
Il renomme "TVA collectible" en "TVA collectée" et s'assure que les catégories "TVA à payer" et "Crédit de TVA" existent.

## Query Description:
- Renomme la sous-catégorie "TVA collectible" en "TVA collectée".
- Ajoute la sous-catégorie "TVA à payer" sous "Impôts et Taxes" si elle n'existe pas.
- Ajoute la sous-catégorie "Crédit de TVA" sous "Autres Entrées" si elle n'existe pas.
- Ces opérations sont sûres et n'affectent pas les données existantes.

## Metadata:
- Schema-Category: ["Data"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true (manuellement)

## Structure Details:
- Affecte la table `public.user_categories`.

## Security Implications:
- RLS Status: Enabled
- Policy Changes: No
- Auth Requirements: User must be authenticated.
*/
DO $$
DECLARE
    impots_taxes_id uuid;
    autres_entrees_id uuid;
BEGIN
    -- Find the UUID of the main category 'Impôts et Taxes'
    SELECT id INTO impots_taxes_id FROM public.user_categories WHERE name = 'Impôts et Taxes' AND parent_id IS NULL AND type = 'expense' LIMIT 1;

    -- Find the UUID of the main category 'Autres Entrées'
    SELECT id INTO autres_entrees_id FROM public.user_categories WHERE name = 'Autres Entrées' AND parent_id IS NULL AND type = 'revenue' LIMIT 1;

    -- 1. Rename 'TVA collectible' to 'TVA collectée' if it exists under 'Impôts et Taxes'
    IF impots_taxes_id IS NOT NULL THEN
        UPDATE public.user_categories
        SET name = 'TVA collectée'
        WHERE name = 'TVA collectible' AND parent_id = impots_taxes_id;
    END IF;

    -- 2. Add 'TVA à payer' under 'Impôts et Taxes' if it doesn't exist
    IF impots_taxes_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.user_categories WHERE name = 'TVA à payer' AND parent_id = impots_taxes_id) THEN
        INSERT INTO public.user_categories (name, type, parent_id, is_fixed)
        VALUES ('TVA à payer', 'expense', impots_taxes_id, true);
    END IF;

    -- 3. Add 'Crédit de TVA' under 'Autres Entrées' if it doesn't exist
    IF autres_entrees_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.user_categories WHERE name = 'Crédit de TVA' AND parent_id = autres_entrees_id) THEN
        INSERT INTO public.user_categories (name, type, parent_id, is_fixed)
        VALUES ('Crédit de TVA', 'revenue', autres_entrees_id, true);
    END IF;
END $$;
