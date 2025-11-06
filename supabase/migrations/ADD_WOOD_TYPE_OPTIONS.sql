-- ============================================================================
-- ADD WOOD TYPE OPTIONS FOR SOFA CATEGORY
-- ============================================================================
-- This migration ensures wood_type dropdown options exist for the sofa category
-- Options: Pine (Default) and Neem

INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'wood_type', 'Pine', 'Pine (Default)', 1, true, '{"default": true}'),
('sofa', 'wood_type', 'Neem', 'Neem', 2, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;

-- Verify the insertion
SELECT 
  field_name, 
  option_value, 
  display_label, 
  sort_order, 
  is_active
FROM dropdown_options 
WHERE category = 'sofa' AND field_name = 'wood_type'
ORDER BY sort_order;

