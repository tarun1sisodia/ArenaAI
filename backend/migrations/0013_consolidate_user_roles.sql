-- Migration: 0013_consolidate_user_roles.sql
-- Role Model Consolidation: Support only 'customer' and 'super_admin' roles.
-- Maps all legacy operational staff roles (dispatcher, content_editor, review_moderator, finance_operator)
-- to 'super_admin' with full operations desk capabilities.

DO $$
BEGIN
    -- Update existing profile records if any legacy roles exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        UPDATE profiles
        SET role = 'super_admin'
        WHERE role::text IN ('dispatcher', 'content_editor', 'review_moderator', 'finance_operator');
    END IF;
END $$;
