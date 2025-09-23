/*
# [Fix] Résolution de la récursion infinie dans la politique de sécurité des profils

Ce script corrige une erreur de "récursion infinie" causée par une politique de sécurité (RLS) mal configurée sur la table des profils. L'ancienne politique, en essayant de vérifier le rôle d'un administrateur, se référait à elle-même, créant une boucle sans fin.

## Description de la requête :
1.  **Création d'une fonction `get_my_role()`** : Nous créons une fonction sécurisée qui récupère le rôle de l'utilisateur actuellement connecté. En utilisant `SECURITY DEFINER`, cette fonction s'exécute avec des privilèges élevés, ce qui lui permet de contourner la politique de sécurité de la table `profiles` pour sa propre exécution, évitant ainsi la boucle récursive.
2.  **Suppression de l'ancienne politique** : Nous supprimons la politique défectueuse nommée "Allow admin full access".
3.  **Création de la nouvelle politique** : Nous recréons la politique pour les administrateurs en utilisant la nouvelle fonction `get_my_role()`. Cette nouvelle approche est sûre et ne provoquera pas de récursion.

## Métadonnées :
- Schéma-Catégorie : "Structural"
- Impact-Level : "Low"
- Requires-Backup : false
- Reversible : true (en restaurant l'ancienne politique, bien que non recommandé)

## Détails de la structure :
- Affecte : Politiques RLS sur la table `public.profiles`
- Ajoute : Fonction `public.get_my_role()`

## Implications de sécurité :
- Statut RLS : Activé
- Changements de politique : Oui
- Exigences d'authentification : La fonction `get_my_role()` dépend de `auth.uid()`.

## Impact sur les performances :
- Impact estimé : Faible. L'appel à une fonction peut avoir une légère surcharge par rapport à une sous-requête directe, mais il est négligeable et nécessaire pour la correction.
*/

-- 1. Créer une fonction pour obtenir le rôle de l'utilisateur actuel de manière sécurisée
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
-- Définir un search_path sécurisé pour la fonction
SET search_path = public
AS $$
BEGIN
  -- Vérifier si l'utilisateur est authentifié
  IF auth.uid() IS NULL THEN
    RETURN 'anon';
  END IF;
  
  -- Retourner le rôle de l'utilisateur depuis la table des profils
  RETURN (
    SELECT role
    FROM public.profiles
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$;

-- 2. Supprimer l'ancienne politique défectueuse
DROP POLICY IF EXISTS "Allow admin full access" ON public.profiles;

-- 3. Recréer la politique pour les administrateurs en utilisant la nouvelle fonction
CREATE POLICY "Allow admin full access"
ON public.profiles FOR ALL
USING (public.get_my_role() = 'superadmin');

-- 4. S'assurer que la politique pour les utilisateurs individuels est toujours en place et correcte
-- (Elle ne devrait pas avoir été affectée, mais c'est une bonne pratique de vérifier)
-- La politique "Allow individual user access to their own profile" devrait déjà exister et est correcte.
-- Si elle a été supprimée par erreur, la voici pour la recréer :
-- CREATE POLICY "Allow individual user access to their own profile"
-- ON public.profiles FOR ALL
-- USING (auth.uid() = id);
