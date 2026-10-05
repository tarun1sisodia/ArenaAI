-- 0030_tour_packages_gallery.sql
-- Add image_url and gallery support to tour_packages for rich visual showcase

ALTER TABLE tour_packages
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS gallery JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Populate default image_url and gallery for existing tour packages
UPDATE tour_packages
SET
  image_url = '/assets/packages/taj-dawn.webp',
  gallery = '[
    {"url": "/assets/places/gallery/taj-mahal-01.jpg", "caption": "Iconic reflection pool at golden dawn", "alt": "Taj Mahal reflection pool at dawn in Agra"},
    {"url": "/assets/places/gallery/agra-fort-01.jpg", "caption": "Grand Amar Singh Gate at Agra Red Fort", "alt": "Agra Fort red sandstone entrance gate"},
    {"url": "/assets/places/gallery/mehtab-bagh-01.jpg", "caption": "Sunset vantage point over Yamuna", "alt": "Mehtab Bagh sunset over Taj Mahal"},
    {"url": "/assets/places/gallery/taj-mahal-02.jpg", "caption": "Intricate marble archways & minarets", "alt": "Taj Mahal minarets and dome details"}
  ]'::jsonb
WHERE package_code = 'agra-sightseeing' AND (image_url IS NULL OR gallery = '[]'::jsonb);

UPDATE tour_packages
SET
  image_url = '/assets/packages/taj-dawn.webp',
  gallery = '[
    {"url": "/assets/places/gallery/taj-mahal-02.jpg", "caption": "Dawn glow across ivory marble", "alt": "Taj Mahal at sunrise"},
    {"url": "/assets/places/gallery/mehtab-bagh-02.jpg", "caption": "Reflections from Charbagh gardens", "alt": "Mehtab Bagh sunrise view"},
    {"url": "/assets/places/gallery/taj-mahal-03.jpg", "caption": "Intricate pietra dura floral inlays", "alt": "Pietra dura marble inlay details"}
  ]'::jsonb
WHERE package_code = 'taj-mahal-sunrise-tour' AND (image_url IS NULL OR gallery = '[]'::jsonb);

UPDATE tour_packages
SET
  image_url = '/assets/packages/mathura.webp',
  gallery = '[
    {"url": "/assets/places/gallery/mathura-vrindavan-01.jpg", "caption": "Banke Bihari & Prem Mandir illumination", "alt": "Prem Mandir illuminated at night"},
    {"url": "/assets/places/gallery/mathura-vrindavan-02.jpg", "caption": "Sacred Yamuna Ghats at sunset", "alt": "Yamuna river ghats Mathura"},
    {"url": "/assets/places/gallery/mathura-vrindavan-03.jpg", "caption": "Evening aarti ceremony at Vrindavan", "alt": "Evening temple ceremony Vrindavan"}
  ]'::jsonb
WHERE package_code = 'mathura-vrindavan' AND (image_url IS NULL OR gallery = '[]'::jsonb);

UPDATE tour_packages
SET
  image_url = '/assets/packages/agra-fort.webp',
  gallery = '[
    {"url": "/assets/places/gallery/agra-fort-02.jpg", "caption": "Diwan-i-Khas marble pavilion", "alt": "Diwan-i-Khas inside Agra Fort"},
    {"url": "/assets/places/gallery/taj-mahal-01.jpg", "caption": "Taj Mahal express afternoon visit", "alt": "Taj Mahal"}
  ]'::jsonb
WHERE package_code = 'gatimaan-express-agra-tour' AND (image_url IS NULL OR gallery = '[]'::jsonb);

UPDATE tour_packages
SET
  image_url = '/assets/packages/agra-fort.webp',
  gallery = '[
    {"url": "/assets/places/gallery/agra-fort-03.jpg", "caption": "Mughal courtyards & archways", "alt": "Agra Fort royal courtyard"},
    {"url": "/assets/places/gallery/fatehpur-sikri-01.jpg", "caption": "Buland Darwaza imperial gate", "alt": "Buland Darwaza at Fatehpur Sikri"},
    {"url": "/assets/places/gallery/fatehpur-sikri-02.jpg", "caption": "Panch Mahal royal pavilion", "alt": "Panch Mahal palace"}
  ]'::jsonb
WHERE package_code = 'agra-unhurried' AND (image_url IS NULL OR gallery = '[]'::jsonb);

UPDATE tour_packages
SET
  image_url = '/assets/packages/golden-triangle.webp',
  gallery = '[
    {"url": "/assets/places/gallery/jaipur-pink-city-01.jpg", "caption": "Hawa Mahal (Palace of Winds)", "alt": "Hawa Mahal facade Jaipur"},
    {"url": "/assets/places/gallery/taj-mahal-01.jpg", "caption": "Agra Taj Mahal sunrise visit", "alt": "Taj Mahal Agra"},
    {"url": "/assets/places/gallery/jaipur-pink-city-02.jpg", "caption": "Amber Fort hilltop ramparts", "alt": "Amber Fort Jaipur"}
  ]'::jsonb
WHERE package_code = 'golden-triangle' AND (image_url IS NULL OR gallery = '[]'::jsonb);
