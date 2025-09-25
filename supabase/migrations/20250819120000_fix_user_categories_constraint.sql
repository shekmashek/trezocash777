/*
# [Correctif] Réparation des contraintes sur les catégories utilisateur

## Description de la requête :
Cette requête corrige un problème fondamental dans la base de données qui vous empêchait de créer plus d'une catégorie personnalisée (principale ou sous-catégorie). Une règle de sécurité incorrecte était en place. Ce script va nettoyer la structure en supprimant toutes les anciennes règles conflictuelles et en les remplaçant par des règles saines et robustes.

Cela garantira que :
1. Vous pouvez créer autant de catégories principales que vous le souhaitez.
2. Vous ne pouvez pas avoir deux catégories principales avec le même nom.
3. Vous pouvez créer autant de sous-catégories que vous le souhaitez sous une catégorie principale.
4. Vous ne pouvez pas avoir deux sous-catégories avec le même nom sous la même catégorie principale.

Cette opération est sûre et ne supprime aucune de vos données.

## Métadonnées :
- Catégorie-Schéma : "Structural"
- Niveau d'impact : "Low"
- Sauvegarde requise : false
- Réversible : true (en recréant les anciennes contraintes, mais non souhaitable)

## Détails de la structure :
- Affecte les contraintes et index sur la table `public.user_categories`.

## Implications de sécurité :
- Statut RLS : Inchangé
- Changements de politique : Non
- Exigences d'authentification : Admin

## Impact sur les performances :
- Index : Modification des index pour améliorer l'intégrité des données.
- Déclencheurs : Aucun
- Impact estimé : Faible, amélioration de la fiabilité.
*/

-- Étape 1 : Supprimer l'ancienne contrainte unique incorrecte sur user_id.
ALTER TABLE public.user_categories DROP CONSTRAINT IF EXISTS user_categories_user_id_key;

-- Étape 2 : Supprimer les contraintes potentiellement existantes des tentatives précédentes pour repartir à zéro.
DROP INDEX IF EXISTS public.user_categories_unique_main_category_name;
ALTER TABLE public.user_categories DROP CONSTRAINT IF EXISTS user_categories_unique_name_per_parent;

-- Étape 3 : Créer une contrainte unique pour les sous-catégories.
-- Un utilisateur ne peut pas avoir deux sous-catégories avec le même nom sous le même parent.
ALTER TABLE public.user_categories
ADD CONSTRAINT user_categories_unique_name_per_parent UNIQUE (user_id, parent_id, name);

-- Étape 4 : Créer un index unique pour les catégories principales.
-- Un utilisateur ne peut pas avoir deux catégories principales avec le même nom.
CREATE UNIQUE INDEX user_categories_unique_main_category_name
ON public.user_categories (user_id, name)
WHERE (parent_id IS NULL);
