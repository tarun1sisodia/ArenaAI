-- 0027_fix_dossier_signoffs_approved_by_fkey.sql
-- Allow dossier_signoffs approved_by to reference auth.users(id) instead of requiring a customer profile row

ALTER TABLE dossier_signoffs DROP CONSTRAINT IF EXISTS dossier_signoffs_approved_by_fkey;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    ALTER TABLE dossier_signoffs
      ADD CONSTRAINT dossier_signoffs_approved_by_fkey
      FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  ELSE
    ALTER TABLE dossier_signoffs
      ADD CONSTRAINT dossier_signoffs_approved_by_fkey
      FOREIGN KEY (approved_by) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;
