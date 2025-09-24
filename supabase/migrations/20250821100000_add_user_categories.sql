/*
          # [Operation Name]
          Création de la table pour les catégories utilisateur

          ## Query Description: [Cette opération ajoute une nouvelle table `user_categories` pour stocker la structure des catégories de revenus et de dépenses propre à chaque utilisateur. Cela permet de sauvegarder les modifications et les nouvelles catégories de manière permanente. Cette opération est sûre et n'affecte aucune donnée existante.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Table `user_categories` créée avec les colonnes : `id`, `user_id`, `categories` (jsonb), `created_at`, `updated_at`.
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes (Ajout de politiques pour que chaque utilisateur ne puisse gérer que ses propres catégories).
          - Auth Requirements: User authentication (auth.uid()).
          
          ## Performance Impact:
          - Indexes: Ajout d'une clé primaire et d'une contrainte unique.
          - Triggers: Ajout d'un trigger pour mettre à jour le champ `updated_at`.
          - Estimated Impact: Faible.
          */
CREATE TABLE public.user_categories (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    categories jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT user_categories_pkey PRIMARY KEY (id),
    CONSTRAINT user_categories_user_id_key UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.user_categories ENABLE ROW LEVEL SECURITY;

-- Policies for user_categories
CREATE POLICY "Users can view their own categories"
ON public.user_categories
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
ON public.user_categories
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
ON public.user_categories
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users cannot delete their categories"
ON public.user_categories
FOR DELETE USING (false);

-- Function and trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_categories_updated
BEFORE UPDATE ON public.user_categories
FOR EACH ROW
EXECUTE PROCEDURE public.handle_updated_at();
