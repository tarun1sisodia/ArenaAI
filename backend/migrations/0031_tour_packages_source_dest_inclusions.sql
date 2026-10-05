-- Migration 0031: Add source, destination, inclusions, exclusions, and itinerary to tour_packages

ALTER TABLE tour_packages
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'Agra',
  ADD COLUMN IF NOT EXISTS destination TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS inclusions JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS exclusions JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS itinerary JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Populate canonical sources, destinations, inclusions, exclusions, and itineraries for baseline packages
UPDATE tour_packages
SET
  source = 'Agra',
  destination = 'Mathura & Vrindavan',
  inclusions = jsonb_build_array(
    'Private Sanitized AC Cab for Entire Day',
    'Experienced Commercial Chauffeur Allowance & Fuel',
    'All Highway Tolls, State Taxes & Parking Charges',
    'Complimentary Doorstep Hotel / Railway Station Pickup & Drop',
    'Prem Mandir, Banke Bihari & Krishna Janmabhoomi Darshan Assistance',
    'Chilled Packaged Drinking Water Bottles'
  ),
  exclusions = jsonb_build_array(
    'Monument / Temple Entry Tickets & Special VIP Darshan Passes',
    'Meals, Snacks & Personal Dining Expenses',
    'Personal Gratuities & Chauffeur Tips',
    'Camera / Video Recording Fee at Designated Sites'
  ),
  itinerary = jsonb_build_array(
    jsonb_build_object('time', '07:00 AM', 'title', 'Doorstep Pickup in Agra', 'desc', 'Chauffeur receives you at your hotel or Agra Cantt station in a sanitized AC cab.'),
    jsonb_build_object('time', '08:30 AM', 'title', 'Shri Krishna Janmabhoomi, Mathura', 'desc', 'Visit the sacred birthplace of Lord Krishna, the ancient prison cell sanctum, and Keshavdev temple.'),
    jsonb_build_object('time', '11:00 AM', 'title', 'Dwarkadhish Temple & Vishram Ghat', 'desc', 'Experience historic temple darshan followed by sacred Yamuna Aarti steps at Vishram Ghat.'),
    jsonb_build_object('time', '01:00 PM', 'title', 'Traditional Satvik Braj Bhojan', 'desc', 'Enjoy authentic satvik vegetarian lunch with famous Mathura khoya pedas.'),
    jsonb_build_object('time', '02:30 PM', 'title', 'Banke Bihari Ji Mandir, Vrindavan', 'desc', 'Navigate smoothly through sacred Vrindavan to witness Thakur Jis mesmerizing darshan.'),
    jsonb_build_object('time', '05:00 PM', 'title', 'ISKCON Krishna Balaram Temple', 'desc', 'Immerse in joyful evening kirtan and peaceful white marble temple corridors.'),
    jsonb_build_object('time', '06:30 PM', 'title', 'Prem Mandir Musical Light Show', 'desc', 'Behold the magnificent Italian marble temple illuminated in majestic evening color displays.'),
    jsonb_build_object('time', '08:00 PM', 'title', 'Expressway Return Journey to Agra', 'desc', 'Relax in your private AC cab on the highway back to your Agra hotel or station.')
  )
WHERE package_code = 'same-day-prem-mandir-tour';
