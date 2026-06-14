/*
  # Seed Sample Data for Siena Home

  1. Sample Content Blocks
    - Hero section content in both languages
    - Features section content
    - About section content
    - Contact section content
    - Products section content

  2. Sample Products
    - 6 bathroom furniture products
    - Complete specifications and images
    - Proper categorization

  3. Admin User Profile
    - Creates admin profile if user exists
*/

-- Insert sample content blocks
INSERT INTO content_blocks (key, section, language, content, content_type, is_published) VALUES
-- Hero section
('title', 'hero', 'mk', 'Фабрика за производство на 100% водоотпорен мебел за бања и додатоци за вашиот дом!', 'text', true),
('title', 'hero', 'en', 'Family-Crafted Waterproof Bathroom Furniture', 'text', true),
('subtitle', 'hero', 'mk', 'Мебелот е изработен од PVC, достапен во повеќе бои и димензии!', 'text', true),
('subtitle', 'hero', 'en', 'A family-owned factory specializing in 100% waterproof PVC bathroom furniture. Custom designs, bulk orders, and made-to-measure solutions available.', 'text', true),

-- Features section
('title', 'features', 'mk', 'Зошто да го изберете нашиот PVC мебел за бања', 'text', true),
('title', 'features', 'en', 'Why Choose Our PVC Bathroom Furniture', 'text', true),
('subtitle', 'features', 'mk', 'Откријте ги предностите на водоотпорен мебел, дизајнирана специјално за предизвикувачката околина во бањата.', 'text', true),
('subtitle', 'features', 'en', 'Discover the advantages of our premium waterproof furniture collection, designed specifically for the challenging bathroom environment.', 'text', true),

-- About section
('title', 'about', 'mk', 'Кои сме ние?', 'text', true),
('title', 'about', 'en', 'Who We Are', 'text', true),
('subtitle', 'about', 'mk', 'Наследство на иновации во водоотпорен мебел за бања од 2005 година', 'text', true),
('subtitle', 'about', 'en', 'A legacy of innovation in waterproof bathroom furniture since 2005', 'text', true),

-- Products section
('title', 'products', 'mk', 'Нашата Колекција', 'text', true),
('title', 'products', 'en', 'Our Collection', 'text', true),
('subtitle', 'products', 'mk', 'Истражете ја нашата понуда на премиум водоотпорен PVC мебел за бања, дизајниран за стил и издржливост.', 'text', true),
('subtitle', 'products', 'en', 'Explore our range of premium waterproof PVC bathroom furniture, designed for style and durability.', 'text', true),

-- Contact section
('title', 'contact', 'mk', 'Контактирајте не', 'text', true),
('title', 'contact', 'en', 'Get In Touch', 'text', true),
('subtitle', 'contact', 'mk', 'Имате прашања за нашите производи или сакате да закажете консултација? Јавете ни се.', 'text', true),
('subtitle', 'contact', 'en', 'Have questions about our products or want to schedule a consultation? Reach out to us.', 'text', true)

ON CONFLICT (key, section, language) DO UPDATE SET
  content = EXCLUDED.content,
  updated_at = now();

-- Insert sample products
INSERT INTO products (
  name, slug, category, price, description, features, colors, dimensions, specifications,
  main_image_url, additional_images, in_stock, is_published, sort_order
) VALUES
(
  'Mini',
  'mini',
  'Vanities',
  799.00,
  'A sleek, wall-mounted vanity unit with double sinks and ample storage space. Made from high-quality waterproof PVC.',
  '["100% Waterproof PVC construction", "Wall-mounted design", "Soft-close drawers and doors", "Pre-drilled for faucets", "Integrated LED lighting"]'::jsonb,
  '[{"name": "Matte White", "value": "#ffffff"}, {"name": "Matte Black", "value": "#202020"}, {"name": "Oak Finish", "value": "#D4B483"}]'::jsonb,
  '{"width": 120, "height": 60, "depth": 45, "weight": 35}'::jsonb,
  '{"material": "Waterproof PVC", "finish": "Matte", "handleType": "Push-to-open", "hingeType": "Soft-close", "mountingType": "Wall-mounted"}'::jsonb,
  'https://raw.githubusercontent.com/todorovskib/css-exercises/refs/heads/main/3S0A1280%20copy.jpg',
  '["https://raw.githubusercontent.com/todorovskib/css-exercises/refs/heads/main/3S0A1281%20copy.jpg", "https://raw.githubusercontent.com/todorovskib/css-exercises/refs/heads/main/3S0A1292%20copy.jpg", "https://raw.githubusercontent.com/todorovskib/css-exercises/refs/heads/main/3S0A1297.jpg"]'::jsonb,
  true,
  true,
  1
),
(
  'Silver',
  'silver',
  'Storage',
  449.00,
  'A versatile bathroom storage cabinet with adjustable shelves and moisture-resistant finish.',
  '["Waterproof PVC material", "Adjustable shelving", "Soft-close hinges", "Wall-mountable design", "Available in multiple finishes"]'::jsonb,
  '[{"name": "Matte White", "value": "#ffffff"}, {"name": "Matte Black", "value": "#202020"}, {"name": "Walnut Finish", "value": "#795C34"}]'::jsonb,
  '{"width": 40, "height": 160, "depth": 35, "weight": 25}'::jsonb,
  '{"material": "Waterproof PVC", "finish": "Textured", "handleType": "Integrated", "hingeType": "Soft-close", "mountingType": "Wall-mounted/Freestanding"}'::jsonb,
  'https://raw.githubusercontent.com/todorovskib/css-exercises/refs/heads/main/3S0A1281%20copy.jpg',
  '["https://raw.githubusercontent.com/todorovskib/css-exercises/refs/heads/main/3S0A1280%20copy.jpg", "https://raw.githubusercontent.com/todorovskib/css-exercises/refs/heads/main/3S0A1292%20copy.jpg", "https://raw.githubusercontent.com/todorovskib/css-exercises/refs/heads/main/3S0A1378%20copy.jpg"]'::jsonb,
  true,
  true,
  2
),
(
  'Classic',
  'classic',
  'Accessories',
  129.00,
  'Set of three floating shelves perfect for displaying décor or storing bathroom essentials.',
  '["100% Waterproof PVC", "Easy installation", "Hidden mounting hardware", "High weight capacity", "Seamless design"]'::jsonb,
  '[{"name": "Matte White", "value": "#ffffff"}, {"name": "Matte Black", "value": "#202020"}, {"name": "Teak Effect", "value": "#B68D40"}]'::jsonb,
  '{"width": 80, "height": 5, "depth": 20, "weight": 5}'::jsonb,
  '{"material": "Waterproof PVC", "finish": "Matte", "handleType": "N/A", "hingeType": "N/A", "mountingType": "Wall-mounted"}'::jsonb,
  'https://raw.githubusercontent.com/todorovskib/css-exercises/refs/heads/main/3S0A1292%20copy.jpg',
  '["https://raw.githubusercontent.com/todorovskib/css-exercises/refs/heads/main/3S0A1280%20copy.jpg", "https://raw.githubusercontent.com/todorovskib/css-exercises/refs/heads/main/3S0A1281%20copy.jpg", "https://raw.githubusercontent.com/todorovskib/css-exercises/refs/heads/main/3S0A1297.jpg"]'::jsonb,
  true,
  true,
  3
),
(
  'Lila',
  'lila',
  'Vanities',
  499.00,
  'Space-saving vanity unit perfect for small bathrooms with integrated sink and storage.',
  '["Space-saving design", "Integrated ceramic sink", "Soft-close drawer", "Anti-fog mirror cabinet", "Waterproof construction"]'::jsonb,
  '[{"name": "Matte White", "value": "#ffffff"}, {"name": "Sage Green", "value": "#9CAF88"}, {"name": "Navy Blue", "value": "#394C6A"}]'::jsonb,
  '{"width": 60, "height": 80, "depth": 40, "weight": 30}'::jsonb,
  '{"material": "Waterproof PVC", "finish": "Matte", "handleType": "Push-to-open", "hingeType": "Soft-close", "mountingType": "Floor-standing"}'::jsonb,
  'https://raw.githubusercontent.com/todorovskib/css-exercises/refs/heads/main/3S0A1297.jpg',
  '["https://raw.githubusercontent.com/todorovskib/css-exercises/refs/heads/main/3S0A1280%20copy.jpg", "https://raw.githubusercontent.com/todorovskib/css-exercises/refs/heads/main/3S0A1281%20copy.jpg", "https://raw.githubusercontent.com/todorovskib/css-exercises/refs/heads/main/3S0A1292%20copy.jpg"]'::jsonb,
  false,
  true,
  4
),
(
  'Style',
  'style',
  'Accessories',
  89.00,
  'Corner shower caddy with multiple shelves, made from waterproof PVC with chrome accents.',
  '["Rust-proof construction", "Multiple shelving levels", "Easy-clean surfaces", "No drilling required", "Anti-slip design"]'::jsonb,
  '[{"name": "White", "value": "#ffffff"}, {"name": "Black", "value": "#202020"}]'::jsonb,
  '{"width": 30, "height": 70, "depth": 20, "weight": 3}'::jsonb,
  '{"material": "Waterproof PVC with Chrome Accents", "finish": "Glossy", "handleType": "N/A", "hingeType": "N/A", "mountingType": "Corner-mounted"}'::jsonb,
  'https://raw.githubusercontent.com/todorovskib/css-exercises/refs/heads/main/3S0A1378%20copy.jpg',
  '["https://raw.githubusercontent.com/todorovskib/css-exercises/refs/heads/main/3S0A1280%20copy.jpg", "https://raw.githubusercontent.com/todorovskib/css-exercises/refs/heads/main/3S0A1281%20copy.jpg", "https://raw.githubusercontent.com/todorovskib/css-exercises/refs/heads/main/3S0A1292%20copy.jpg"]'::jsonb,
  true,
  true,
  5
),
(
  'Prestige',
  'prestige',
  'Mirrors',
  349.00,
  'Modern mirror cabinet with integrated LED lighting and defogging technology.',
  '["LED illumination", "Defogging technology", "Soft-close doors", "Multiple shelves", "Waterproof construction"]'::jsonb,
  '[{"name": "White Frame", "value": "#ffffff"}, {"name": "Black Frame", "value": "#202020"}, {"name": "Aluminum", "value": "#D0D0D0"}]'::jsonb,
  '{"width": 80, "height": 60, "depth": 15, "weight": 15}'::jsonb,
  '{"material": "Waterproof PVC Frame", "finish": "Mirror/Matte", "handleType": "Edge-grip", "hingeType": "Soft-close", "mountingType": "Wall-mounted"}'::jsonb,
  'https://raw.githubusercontent.com/todorovskib/css-exercises/refs/heads/main/flamingo%2065%20cm%20kar%C5%9F%C4%B1.jpg',
  '["https://raw.githubusercontent.com/todorovskib/css-exercises/refs/heads/main/3S0A1280%20copy.jpg", "https://raw.githubusercontent.com/todorovskib/css-exercises/refs/heads/main/3S0A1281%20copy.jpg", "https://raw.githubusercontent.com/todorovskib/css-exercises/refs/heads/main/3S0A1292%20copy.jpg"]'::jsonb,
  true,
  true,
  6
)

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  colors = EXCLUDED.colors,
  dimensions = EXCLUDED.dimensions,
  specifications = EXCLUDED.specifications,
  main_image_url = EXCLUDED.main_image_url,
  additional_images = EXCLUDED.additional_images,
  in_stock = EXCLUDED.in_stock,
  is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- Admin roles are assigned manually in Supabase after the auth user exists.
