/*
          # [Operation Name]
          Ajout des fonctionnalités de Super Administrateur

          ## Query Description: [Ce script ajoute les colonnes 'role' et 'is_blocked' à la table des profils utilisateurs. Il met également en place une politique de sécurité (RLS) qui accorde des permissions complètes aux utilisateurs ayant le rôle 'superadmin', leur permettant de voir et de gérer tous les autres utilisateurs. Les utilisateurs normaux conservent leurs permissions existantes.]

          ## Metadata:
          - Schema-Category: ["Structural", "Security"]
          - Impact-Level: ["Medium"]
          - Requires-Backup: [false]
          - Reversible: [true]

          ## Structure Details:
          - Table affectée: public.profiles
          - Colonnes ajoutées: role (TEXT), is_blocked (BOOLEAN)
          - Politiques RLS ajoutées: "Enable superadmin to manage all profiles"

          ## Security Implications:
          - RLS Status: [Modifié]
          - Policy Changes: [Oui]
          - Auth Requirements: [Un utilisateur doit avoir le rôle 'superadmin' pour bénéficier des nouveaux droits.]

          ## Performance Impact:
          - Indexes: [Aucun]
          - Triggers: [Aucun]
          - Estimated Impact: [Faible. L'impact sur les performances des requêtes existantes devrait être négligeable.]
          */

-- Ajouter les colonnes 'role' et 'is_blocked' à la table des profils
-- Cette opération est idempotente et ne s'exécutera que si les colonnes n'existent pas déjà.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;

-- Politique de sécurité pour les Super Admins
-- Cette politique autorise les utilisateurs avec le rôle 'superadmin' à effectuer toutes les opérations (SELECT, INSERT, UPDATE, DELETE) sur la table des profils.
-- Elle s'ajoute aux politiques existantes, donnant des droits étendus aux administrateurs sans retirer les droits des utilisateurs normaux.
CREATE POLICY "Enable superadmin to manage all profiles"
ON public.profiles
FOR ALL
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin'
);
