-- update_gu_items_updated_at() quedó huérfana: ningún trigger la usa desde que la
-- reconstrucción CCIP (ccip_01..05) recreó gu_items con fn_set_updated_at, que hace
-- exactamente lo mismo. Era el último WARN del advisor (search_path mutable).
-- RESTRICT (default): si algo dependiera de ella, esto falla en vez de romper en silencio.
-- Su definición original vive en supabase/migration_items.sql si hiciera falta reponerla.
DROP FUNCTION public.update_gu_items_updated_at();