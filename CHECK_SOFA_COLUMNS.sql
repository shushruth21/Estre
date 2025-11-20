-- ============================================
-- CHECK SOFA DATABASE COLUMNS
-- ============================================
-- Run this to see what columns actually exist

SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sofa_database'
AND (
    column_name LIKE '%price%' OR
    column_name LIKE '%strike%' OR
    column_name IN ('id', 'title', 'images', 'discount_percent', 'discount_rs', 'bom_rs', 'is_active')
)
ORDER BY column_name;

-- Also check a sample row to see what data looks like
SELECT 
    id,
    title,
    net_price_rs,
    strike_price_rs,
    strike_price_1seater_rs,
    strike_price_2seater_rs,
    strike_price_3seater_rs,
    discount_percent,
    discount_rs,
    bom_rs,
    is_active
FROM sofa_database
LIMIT 1;

