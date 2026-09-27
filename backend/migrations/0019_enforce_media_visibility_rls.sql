-- Migration 0019: Enforce public media visibility check on catalog_item_media
-- Anonymous users may only SELECT media when:
-- 1. The media record itself has status = 'published'
-- 2. The parent catalog_items record exists and has status = 'published'

DROP POLICY IF EXISTS catalog_media_public_read ON catalog_item_media;
CREATE POLICY catalog_media_public_read ON catalog_item_media
    FOR SELECT
    USING (
      status = 'published' AND EXISTS (
        SELECT 1 FROM catalog_items ci
        WHERE ci.id = catalog_item_media.catalog_item_id
        AND ci.status = 'published'
      )
    );
