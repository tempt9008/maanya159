-- Migration to add parent_folder_id to the folders table

-- Add the column, allowing NULL values for top-level folders
-- ON DELETE SET NULL: If a parent folder is deleted, its children become top-level folders.
-- Alternatively, use ON DELETE CASCADE if you want deleting a parent to delete all its children.
ALTER TABLE public.folders
ADD COLUMN parent_folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL;

-- Optional: Add an index for faster querying of child folders
CREATE INDEX IF NOT EXISTS idx_folders_parent_folder_id ON public.folders (parent_folder_id);

-- Grant usage permissions if necessary (adjust role names as needed)
-- GRANT REFERENCES ON TABLE public.folders TO your_api_user_role;
-- GRANT SELECT ON TABLE public.folders TO your_api_user_role;

COMMENT ON COLUMN public.folders.parent_folder_id IS 'References the parent folder, if this is a subfolder.';
