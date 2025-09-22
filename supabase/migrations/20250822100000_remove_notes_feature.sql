/*
# [Operation Name]
Suppression de la table des notes (post-it)

## Query Description: [Cette opération supprime définitivement la table `notes` et toutes les données qu'elle contient. Cette action est irréversible et entraînera la perte de toutes les notes créées par les utilisateurs.]

## Metadata:
- Schema-Category: ["Dangerous"]
- Impact-Level: ["High"]
- Requires-Backup: [true]
- Reversible: [false]

## Structure Details:
- Table `public.notes` sera supprimée.

## Security Implications:
- RLS Status: [N/A]
- Policy Changes: [No]
- Auth Requirements: [N/A]

## Performance Impact:
- Indexes: [Removed]
- Triggers: [N/A]
- Estimated Impact: [Low]
*/

DROP TABLE IF EXISTS public.notes;
