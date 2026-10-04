-- 0029_remove_pet_taxi_offering.sql
-- Remove/deactivate Pet Taxi service per client decision.
-- Update dossier_signoffs title for specialized_offerings to focus on Monument Protocols.

UPDATE pet_taxi_policy
SET
  is_offered = false,
  seat_protection_note = 'Not applicable — pet taxi service discontinued per client policy.',
  breed_restriction_note = 'Pets and animals are not permitted inside vehicles.',
  comfort_stop_note = 'Standard comfort and hydration stops provided for human passengers.',
  booking_instruction = 'Pets are strictly not permitted in vehicles to maintain passenger hygiene.',
  updated_at = now()
WHERE true;

UPDATE dossier_signoffs
SET
  section_title = 'Monument Operating Protocols & Heritage Guidelines',
  updated_at = now()
WHERE section_key = 'specialized_offerings';
