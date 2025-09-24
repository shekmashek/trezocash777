/*
# [Correctif] Contrainte Unique sur les Catégories Utilisateur
[Description de l'opération]
Ce script corrige une contrainte de base de données incorrecte sur la table `user_categories`. Une contrainte erronée empêchait un utilisateur de créer plus d'une catégorie personnalisée. Cette migration supprime la mauvaise contrainte et la remplace par des contraintes correctes qui assurent qu'un utilisateur ne peut pas avoir deux catégories (principales ou sous-catégories) avec le même nom au même niveau.

## Description de la Requête: [Cette opération corrige une erreur structurelle. Elle ne présente aucun risque pour les données existantes. Elle supprime une contrainte invalide et en crée de nouvelles, plus logiques, pour garantir l'intégrité des données à l'avenir.]
          
## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [false]
          
## Détails de la Structure:
- Table affectée: `public.user_categories`
- Contraintes supprimées: `user_categories_user_id_key`
- Index uniques créés: `user_main_categories_unique_name`, `user_sub_categories_unique_name`
          
## Implications de Sécurité:
- RLS Status: [Inchangé]
- Policy Changes: [Non]
- Auth Requirements: [Aucun]
          
## Impact sur la Performance:
- Indexes: [Suppression d'une contrainte, Ajout de deux index uniques]
- Triggers: [Aucun]
- Estimated Impact: [Positif. Améliore l'intégrité des données sans impacter négativement les performances.]
*/

-- Supprimer la contrainte unique incorrecte si elle existe
ALTER TABLE public.user_categories
DROP CONSTRAINT IF EXISTS user_categories_user_id_key;

-- Créer un index unique pour les catégories principales (parent_id est NULL)
-- Un utilisateur ne peut pas avoir deux catégories principales du même type avec le même nom.
CREATE UNIQUE INDEX IF NOT EXISTS user_main_categories_unique_name
ON public.user_categories (user_id, name, type)
WHERE (parent_id IS NULL);

-- Créer un index unique pour les sous-catégories (parent_id n'est pas NULL)
-- Un utilisateur ne peut pas avoir deux sous-catégories avec le même nom sous la même catégorie principale.
CREATE UNIQUE INDEX IF NOT EXISTS user_sub_categories_unique_name
ON public.user_categories (user_id, parent_id, name)
WHERE (parent_id IS NOT NULL);
