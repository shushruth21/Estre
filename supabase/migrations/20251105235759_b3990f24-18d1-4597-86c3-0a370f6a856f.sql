-- Fix NULL prices in sofa_database
UPDATE sofa_database
SET 
  strike_price_1seater_rs = ROUND(adjusted_bom_rs * (1 + markup_percent/100), 2),
  net_price_rs = ROUND(adjusted_bom_rs * (1 + markup_percent/100) - COALESCE(discount_rs, 0), 2)
WHERE is_active = true 
  AND (net_price_rs IS NULL OR strike_price_1seater_rs IS NULL)
  AND adjusted_bom_rs IS NOT NULL 
  AND markup_percent IS NOT NULL;

-- Fix NULL prices in cinema_chairs_database
UPDATE cinema_chairs_database
SET 
  strike_price_1seater_rs = ROUND(adjusted_bom_rs * (1 + markup_percent/100), 2),
  net_price_rs = ROUND(adjusted_bom_rs * (1 + markup_percent/100) - COALESCE(discount_rs, 0), 2)
WHERE is_active = true 
  AND net_price_rs IS NULL
  AND adjusted_bom_rs IS NOT NULL 
  AND markup_percent IS NOT NULL;

-- Fix NULL prices in dining_chairs_database
UPDATE dining_chairs_database
SET 
  strike_price_1seater_rs = ROUND(adjusted_bom_rs * (1 + markup_percent/100), 2),
  net_price_rs = ROUND(adjusted_bom_rs * (1 + markup_percent/100) - COALESCE(discount_rs, 0), 2)
WHERE is_active = true 
  AND (strike_price_1seater_rs IS NULL OR net_price_rs IS NULL)
  AND adjusted_bom_rs IS NOT NULL 
  AND markup_percent IS NOT NULL;

-- Fix NULL prices in benches_database
UPDATE benches_database
SET 
  strike_price_1seater_rs = ROUND(adjusted_bom_rs * (1 + markup_percent/100), 2),
  net_price_rs = ROUND(adjusted_bom_rs * (1 + markup_percent/100) - COALESCE(discount_rs, 0), 2)
WHERE is_active = true 
  AND net_price_rs IS NULL
  AND adjusted_bom_rs IS NOT NULL 
  AND markup_percent IS NOT NULL;