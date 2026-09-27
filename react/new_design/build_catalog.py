import glob
import os
import re
import sys
import json
import csv
from collections import Counter, defaultdict

sys.stdout.reconfigure(encoding='utf-8')

def classify_corridor(slug, origin, destination):
    o = origin or ''
    d = destination or ''
    slug_l = slug.lower()
    
    if 'delhi-to-mathura' in slug_l or (d == 'Mathura' and 'Delhi' in o):
        return 'Delhi -> Mathura'
    elif ('delhi-to-agra' in slug_l) or ('gurgaon-to-agra' in slug_l) or (d == 'Agra' and ('Delhi' in o or 'Gurgaon' in o or 'delhi' in slug_l or 'gurgaon' in slug_l)):
        return 'Delhi / Gurgaon (NCR) -> Agra'
    elif 'to-haridwar' in slug_l or d == 'Haridwar':
        return 'Agra (Localities) -> Haridwar'
    elif 'to-chandigarh' in slug_l or d == 'Chandigarh':
        return 'Agra (Localities) -> Chandigarh'
    elif 'to-lucknow' in slug_l or d == 'Lucknow':
        return 'Agra (Localities) -> Lucknow'
    elif 'to-gurgaon' in slug_l or d == 'Gurgaon':
        return 'Agra (Localities) -> Gurgaon'
    elif 'tempo-traveller' in slug_l:
        if 'in-' in slug_l or 'services-in-' in slug_l:
            return 'Local Tempo Traveller (Haridwar / Agra)'
        else:
            return 'Agra -> Pan-India Long Distance (Tempo Traveller)'
    elif 'taxi-services-in-' in slug_l:
        return 'Local City Taxi (Gurgaon / NCR Localities)'
    elif any(k in slug_l for k in ['tour', 'package', 'same-day', 'visit']):
        return 'Curated Tour Packages (Agra, Jaipur, Delhi, Bharatpur)'
    else:
        return 'Other Regional Routes & Informational Hubs'

def build_complete_dataset():
    source_dir = '01a0d897-6996-76f1-8656-c70611d44eb8'
    files = glob.glob(f'{source_dir}/*.md')
    print(f"Reading {len(files)} files...")

    # Rate Cards
    rate_cards = {
        "one_way_and_round_trip": {
            "description": "Standard Outstation One-Way and Round-Trip Fares (Includes Tolls & State Taxes)",
            "terms_note": "Tolls and state border taxes are included in the quoted fare. Parking charges are payable directly by passenger.",
            "vehicles": [
                {
                    "vehicle_type": "Hatchback",
                    "models": ["Wagon-R", "Indica", "or similar"],
                    "seating_capacity": "4 seater",
                    "luggage_capacity": "2 Bags",
                    "price_per_km": 9,
                    "price_per_km_formatted": "Rs. 9 / KM",
                    "one_way_price": 2500,
                    "one_way_price_formatted": "Rs. 2500",
                    "round_trip_price": 5000,
                    "round_trip_price_formatted": "Rs. 5000"
                },
                {
                    "vehicle_type": "Sedan",
                    "models": ["Dzire", "Etios", "or similar"],
                    "seating_capacity": "4 seater",
                    "luggage_capacity": "2 Bags",
                    "price_per_km": 10,
                    "price_per_km_formatted": "Rs. 10 / KM",
                    "one_way_price": 2900,
                    "one_way_price_formatted": "Rs. 2900",
                    "round_trip_price": 6000,
                    "round_trip_price_formatted": "Rs. 6000"
                },
                {
                    "vehicle_type": "SUV",
                    "models": ["Xylo", "Ertiga", "or similar"],
                    "seating_capacity": "6 seater",
                    "luggage_capacity": "4 Bags",
                    "price_per_km": 14,
                    "price_per_km_formatted": "Rs. 14 / KM",
                    "one_way_price": 4200,
                    "one_way_price_formatted": "Rs. 4200",
                    "round_trip_price": 8000,
                    "round_trip_price_formatted": "Rs. 8000"
                },
                {
                    "vehicle_type": "Assured Innova",
                    "models": ["Innova", "Innova Crysta"],
                    "seating_capacity": "6 seater",
                    "luggage_capacity": "4 Bags",
                    "price_per_km": 16,
                    "price_per_km_formatted": "Rs. 16 / KM",
                    "one_way_price": 4800,
                    "one_way_price_formatted": "Rs. 4800",
                    "round_trip_price": 9400,
                    "round_trip_price_formatted": "Rs. 9400"
                }
            ]
        },
        "day_package_120km": {
            "description": "1 Day / 120 K.M. Outstation & Day Tour Package",
            "included_distance_km": 120,
            "duration": "1 Day (Calendar Day)",
            "calculation_rule": "Base Package Price covers up to 120 KM. Any excess distance is billed per KM at the designated extra KM rate.",
            "vehicles": [
                {
                    "vehicle_type": "Hatchback",
                    "models": ["Wagon-R", "Indica", "or similar"],
                    "seating_capacity": "4 seater",
                    "start_price_per_km": 10,
                    "start_price_per_km_formatted": "Rs. 10 / KM",
                    "package_price_1_day_120km": 2200,
                    "package_price_1_day_120km_formatted": "Rs. 2200",
                    "extra_km_rate": 10,
                    "extra_km_rate_formatted": "Rs. 10 / KM"
                },
                {
                    "vehicle_type": "Sedan",
                    "models": ["Dzire", "Etios", "or similar"],
                    "seating_capacity": "4 seater",
                    "start_price_per_km": 10,
                    "start_price_per_km_formatted": "Rs. 10 / KM",
                    "package_price_1_day_120km": 2800,
                    "package_price_1_day_120km_formatted": "Rs. 2800",
                    "extra_km_rate": 10,
                    "extra_km_rate_formatted": "Rs. 10 / KM"
                },
                {
                    "vehicle_type": "SUV",
                    "models": ["Xylo", "Ertiga", "or similar"],
                    "seating_capacity": "6 seater",
                    "start_price_per_km": 14,
                    "start_price_per_km_formatted": "Rs. 14 / KM",
                    "package_price_1_day_120km": 3000,
                    "package_price_1_day_120km_formatted": "Rs. 3000",
                    "extra_km_rate": 14,
                    "extra_km_rate_formatted": "Rs. 14 / KM"
                },
                {
                    "vehicle_type": "Assured Innova",
                    "models": ["Innova", "Innova Crysta"],
                    "seating_capacity": "6 seater",
                    "start_price_per_km": 16,
                    "start_price_per_km_formatted": "Rs. 16 / KM",
                    "package_price_1_day_120km": 3600,
                    "package_price_1_day_120km_formatted": "Rs. 3600",
                    "extra_km_rate": 16,
                    "extra_km_rate_formatted": "Rs. 16 / KM"
                }
            ]
        },
        "tempo_traveller": {
            "description": "Tempo Traveller Fleet Pricing (7 Seater to 26 Seater)",
            "minimum_km_limit_per_day": 300,
            "minimum_km_limit_note": "Minimum Kilometer Limit 300 KM per day for outstation bookings.",
            "driver_allowance_per_day": 500,
            "driver_allowance_formatted": "Rs. 500/- Per Day",
            "additional_charges_note": "Parking, State Tax, and Toll Tax extra.",
            "fleet": [
                {"seating_type": "7 Seater", "price_per_km": 17, "price_per_km_formatted": "17/- Rs.", "configuration": "6+1-D", "driver_charge": 500},
                {"seating_type": "8 Seater", "price_per_km": 18, "price_per_km_formatted": "18/- Rs.", "configuration": "7+1-D", "driver_charge": 500},
                {"seating_type": "9 Seater", "price_per_km": 22, "price_per_km_formatted": "22/- Rs.", "configuration": "8+1-D", "driver_charge": 500},
                {"seating_type": "10 Seater", "price_per_km": 23, "price_per_km_formatted": "23/- Rs.", "configuration": "9+1-D", "driver_charge": 500},
                {"seating_type": "11 Seater", "price_per_km": 23, "price_per_km_formatted": "23/- Rs.", "configuration": "10+1-D", "driver_charge": 500},
                {"seating_type": "12 Seater", "price_per_km": 25, "price_per_km_formatted": "25/- Rs.", "configuration": "11+1-D", "driver_charge": 500},
                {"seating_type": "13 Seater", "price_per_km": 25, "price_per_km_formatted": "25/- Rs.", "configuration": "12+1-D", "driver_charge": 500},
                {"seating_type": "14 Seater", "price_per_km": 25, "price_per_km_formatted": "25/- Rs.", "configuration": "13+1-D", "driver_charge": 500},
                {"seating_type": "15 Seater", "price_per_km": 25, "price_per_km_formatted": "25/- Rs.", "configuration": "14+1-D", "driver_charge": 500},
                {"seating_type": "16 Seater", "price_per_km": 26, "price_per_km_formatted": "26/- Rs.", "configuration": "15+1-D", "driver_charge": 500},
                {"seating_type": "17 Seater", "price_per_km": 26, "price_per_km_formatted": "26/- Rs.", "configuration": "16+1-D", "driver_charge": 500},
                {"seating_type": "18 Seater", "price_per_km": 26, "price_per_km_formatted": "26/- Rs.", "configuration": "17+1-D", "driver_charge": 500},
                {"seating_type": "19 Seater", "price_per_km": 27, "price_per_km_formatted": "27/- Rs.", "configuration": "18+1-D", "driver_charge": 500},
                {"seating_type": "20 Seater", "price_per_km": 29, "price_per_km_formatted": "29/- Rs.", "configuration": "19+1-D", "driver_charge": 500},
                {"seating_type": "21 Seater", "price_per_km": 29, "price_per_km_formatted": "29/- Rs.", "configuration": "20+1-D", "driver_charge": 500},
                {"seating_type": "22 Seater", "price_per_km": 29, "price_per_km_formatted": "29/- Rs.", "configuration": "21+1-D", "driver_charge": 500},
                {"seating_type": "23 Seater", "price_per_km": 31, "price_per_km_formatted": "31/- Rs.", "configuration": "22+1-D", "driver_charge": 500},
                {"seating_type": "24 Seater", "price_per_km": 32, "price_per_km_formatted": "32/- Rs.", "configuration": "23+1-D", "driver_charge": 500},
                {"seating_type": "25 Seater", "price_per_km": 34, "price_per_km_formatted": "34/- Rs.", "configuration": "24+1-D", "driver_charge": 500},
                {"seating_type": "26 Seater", "price_per_km": 34, "price_per_km_formatted": "34/- Rs.", "configuration": "25+1-D", "driver_charge": 500}
            ]
        },
        "luxury_and_hourly_rentals": {
            "description": "Hourly, Daily & Airport Transfer Luxury Rentals (e.g. Audi Grand Sedan)",
            "vehicle": "Audi Grand Sedan",
            "hourly_rate": 190,
            "hourly_rate_formatted": "Rs190 / Hour (+ fuel & toll surcharges)",
            "daily_rate": 360,
            "daily_rate_formatted": "Rs360 / Day (+ fuel & toll surcharges)",
            "airport_transfer": 210,
            "airport_transfer_formatted": "Rs210 (+ fuel & toll surcharges)"
        },
        "local_rental_packages": {
            "description": "City Local Car Rental Packages",
            "package_8hr_80km": {
                "name": "8 Hours / 80 KM",
                "duration_hours": 8,
                "included_km": 80,
                "ideal_for": "Local business, sightseeing, shopping, city transfers"
            },
            "package_full_day": {
                "name": "Full Day Local Taxi",
                "duration_hours": 12,
                "ideal_for": "Full day sightseeing of Agra monuments and local transit"
            }
        },
        "fleet_base_rates": [
            {"model": "Tata Indigo", "category": "Hatchback/Sedan", "capacity": "4 Passengers, 2 Bags", "starting_price_per_km": 10},
            {"model": "Dzire", "category": "Sedan", "capacity": "4 Passengers, 2 Bags", "starting_price_per_km": 11},
            {"model": "Etios", "category": "Sedan", "capacity": "4 Passengers, 2 Bags", "starting_price_per_km": 11},
            {"model": "Ertiga", "category": "SUV", "capacity": "7 Passengers, 4 Bags", "starting_price_per_km": 13},
            {"model": "Toyota Innova", "category": "Premium SUV", "capacity": "7 Passengers, 4 Bags", "starting_price_per_km": 15},
            {"model": "Toyota Innova Crysta", "category": "Luxury SUV", "capacity": "7 Passengers, 4 Bags", "starting_price_per_km": 18}
        ]
    }

    # Tour Packages Catalog
    tour_packages = [
        {
            "package_id": "same-day-agra-tour",
            "package_name": "Same Day Agra Tour",
            "duration": "1 Day / Same Day",
            "origin": "Agra / Local Hotel",
            "destination": "Agra Major Monuments",
            "pricing": {
                "sedan_price": 2000,
                "sedan_price_formatted": "Rs. 2000",
                "prime_suv_price": 2700,
                "prime_suv_price_formatted": "Rs. 2700"
            },
            "attractions_covered": [
                "Taj Mahal (UNESCO World Heritage Site, Symbol of Love)",
                "Agra Fort (UNESCO World Heritage Site, Mughal Architecture)",
                "Itmad-ud-Daulah's Tomb (Baby Taj)",
                "Akbar's Tomb (Sikandra)"
            ],
            "inclusions": [
                "Pick-up and drop-off from hotel/railway station/location",
                "Dedicated air-conditioned car with chauffeur",
                "All fuel, parking, and toll tax surcharges",
                "Sightseeing tour as per itinerary"
            ],
            "exclusions": ["Monument entry tickets", "Meals and personal expenses", "Guide charges"]
        },
        {
            "package_id": "golden-triangle-tour-3-nights-4-days",
            "package_name": "Golden Triangle Tour 3 Nights 4 Days",
            "duration": "4 Days / 3 Nights",
            "origin": "Delhi (Airport / Rly Station)",
            "destination": "Agra & Jaipur",
            "destinations": ["Delhi", "Agra", "Jaipur"],
            "itinerary": [
                {"day": 1, "title": "Arrival in Delhi & Departure for Agra", "details": "Pickup at Delhi airport/station, transfer to Agra by road, check-in, evening visit to Agra Fort."},
                {"day": 2, "title": "Visit of Agra & Transfer to Jaipur", "details": "Early morning visit to Taj Mahal, breakfast, check-out, visit Fatehpur Sikri en route to Jaipur."},
                {"day": 3, "title": "Jaipur Sightseeing Tour", "details": "Full day sightseeing: Amber Fort, Hawa Mahal, City Palace, Jantar Mantar, local bazaars."},
                {"day": 4, "title": "Jaipur to Delhi Return", "details": "Morning checkout, drive back to Delhi with drop-off at airport or railway station."}
            ],
            "vehicle_options": ["Sedan (Dzire/Etios)", "SUV (Ertiga/Innova)", "Tempo Traveller (for groups)"],
            "pricing_type": "Custom Quote / Based on Vehicle & Hotel Selection"
        },
        {
            "package_id": "same-day-tour-of-jaipur",
            "package_name": "Same Day Tour of Jaipur",
            "duration": "1 Day / Same Day",
            "origin": "Agra / Delhi",
            "destination": "Jaipur",
            "destinations": ["Jaipur, Rajasthan"],
            "attractions_covered": [
                "Hawa Mahal (Palace of Winds)",
                "City Palace",
                "Amber Fort",
                "Jantar Mantar (Astronomical Observatory)",
                "Johari Bazaar and Bapu Bazaar"
            ],
            "pricing_type": "Round Trip Taxi / Package Fare Available"
        },
        {
            "package_id": "same-day-tour-of-fatehpur-sikri",
            "package_name": "Same Day Tour of Fatehpur Sikri",
            "duration": "Same Day (Approx. 40 km from Agra)",
            "origin": "Agra",
            "destination": "Fatehpur Sikri",
            "destinations": ["Fatehpur Sikri, Uttar Pradesh"],
            "attractions_covered": [
                "Buland Darwaza (Gate of Magnificence)",
                "Jama Masjid",
                "Tomb of Salim Chishti",
                "Panch Mahal",
                "Jodha Bai Palace"
            ],
            "distance_km": 40,
            "pricing_type": "Local / Outstation Short Day Fare"
        },
        {
            "package_id": "same-day-tour-of-mathura-vrindavan",
            "package_name": "Same Day Tour of Mathura & Vrindavan",
            "duration": "1 Day / Same Day Pilgrimage Tour",
            "origin": "Agra / Delhi",
            "destination": "Mathura & Vrindavan",
            "destinations": ["Mathura & Vrindavan, Uttar Pradesh"],
            "attractions_covered": [
                "Krishna Janma Bhoomi (Birthplace of Lord Krishna)",
                "Dwarkadhish Temple",
                "Vishram Ghat",
                "Banke Bihari Temple (Vrindavan)",
                "Prem Mandir",
                "ISKCON Temple Vrindavan"
            ],
            "pricing_type": "Same Day Outstation Rate Card"
        },
        {
            "package_id": "same-day-visit-of-bharatpur",
            "package_name": "Same Day Visit of Bharatpur",
            "duration": "1 Day / Same Day Wildlife & Heritage Tour",
            "origin": "Agra / Delhi",
            "destination": "Bharatpur",
            "destinations": ["Bharatpur, Rajasthan"],
            "attractions_covered": [
                "Keoladeo National Park (UNESCO World Heritage Bird Sanctuary)",
                "Lohagarh Fort (The Iron Fort)",
                "Bharatpur Palace and Museum"
            ],
            "pricing_type": "Same Day Outstation Rate Card"
        },
        {
            "package_id": "local-city-taxi-packages",
            "package_name": "Local City Rental Packages",
            "origin": "Agra / NCR Local",
            "destination": "Local City / Sightseeing",
            "options": [
                {
                    "name": "8 Hours / 80 KM Package",
                    "duration": "8 Hours",
                    "included_km": 80,
                    "description": "Ideal for local city business, shopping, or full Agra sightseeing.",
                    "extra_charges": "Extra KM and Extra Hour billed as per vehicle class"
                },
                {
                    "name": "Full Day Local Package",
                    "duration": "12 Hours / Full Day",
                    "included_km": "Standard City Limit",
                    "description": "Comprehensive full day hire for local travel, events, or visiting all Agra monuments."
                }
            ]
        }
    ]

    # Process all routes from markdown files
    routes_database = []
    category_counter = Counter()
    pricing_model_counter = Counter()
    corridors_grouped = defaultdict(list)

    for f in files:
        bname = os.path.basename(f)
        slug = bname.replace('www.agrashivtourandtravels.com_', '').replace('_.md', '').replace('.md', '')
        if not slug:
            slug = "home"
        
        if 'sitemap' in slug:
            continue
            
        with open(f, 'r', encoding='utf-8', errors='ignore') as fp:
            content = fp.read()
            
        title_m = re.search(r'title:\s*\"([^\"]+)\"', content)
        title = title_m.group(1).strip() if title_m else (slug.replace('-', ' ').title() if slug != "home" else "ASTT Home - Taxi Services in Agra")
        
        url_m = re.search(r'url:\s*\"([^\"]+)\"', content)
        url = url_m.group(1).strip() if url_m else f"https://www.agrashivtourandtravels.com/{slug if slug != 'home' else ''}"

        # Determine origin and destination
        origin = None
        destination = None
        service_category = None
        
        m_route = re.search(r'^(?:get-)?(.*?)-to-(.*?)-(taxi-services|taxi|tempo-traveller|cab-services|cab|car-hire)(?:-\d+)?$', slug)
        if m_route:
            origin = m_route.group(1).replace('-', ' ').title()
            destination = m_route.group(2).replace('-', ' ').title()
            raw_type = m_route.group(3)
            if 'tempo' in raw_type:
                service_category = 'Tempo Traveller Rental'
            else:
                service_category = 'Outstation Taxi'
        elif slug.startswith('taxi-services-in-'):
            destination = slug.replace('taxi-services-in-', '').replace('-', ' ').title()
            origin = 'Local Hub / Base'
            service_category = 'Local City Taxi'
        elif slug.startswith('tempo-traveller-in-'):
            destination = slug.replace('tempo-traveller-in-', '').replace('-', ' ').title()
            origin = 'Local Hub / Base'
            service_category = 'Local Tempo Traveller'
        elif slug.startswith('tempo-traveller-services-in-'):
            destination = slug.replace('tempo-traveller-services-in-', '').replace('-', ' ').title()
            origin = 'Local Hub / Base'
            service_category = 'Local Tempo Traveller'
        elif any(k in slug for k in ['tour', 'package', 'same-day', 'visit']):
            service_category = 'Tour Package'
            origin = 'Agra / Delhi'
            destination = slug.replace('same-day-', '').replace('-tour', '').replace('-', ' ').title()
        else:
            service_category = 'Special Service / Information Page'
            origin = 'General'
            destination = 'General'

        category_counter[service_category] += 1

        # Pricing model determination & explicit fares
        pricing_model = None
        applicable_fares = None
        hatchback_price_str = "N/A"
        sedan_price_str = "N/A"
        suv_price_str = "N/A"
        innova_price_str = "N/A"
        per_km_rates_str = "N/A"
        round_trip_str = "N/A"
        driver_charge_str = "N/A"
        tolls_taxes_str = "N/A"

        if 'Price (One Way)' in content:
            pricing_model = 'one_way_and_round_trip'
            hatchback_price_str = "Rs. 2,500"
            sedan_price_str = "Rs. 2,900"
            suv_price_str = "Rs. 4,200"
            innova_price_str = "Rs. 4,800"
            per_km_rates_str = "Hatchback: Rs. 9/km | Sedan: Rs. 10/km | SUV: Rs. 14/km | Innova: Rs. 16/km"
            round_trip_str = "Hatchback: Rs. 5,000 | Sedan: Rs. 6,000 | SUV: Rs. 8,000 | Innova: Rs. 9,400"
            driver_charge_str = "Included in fixed fare"
            tolls_taxes_str = "Included in quoted fare"
            applicable_fares = {
                "hatchback": {"per_km": "Rs. 9 / KM", "one_way": 2500, "round_trip": 5000},
                "sedan": {"per_km": "Rs. 10 / KM", "one_way": 2900, "round_trip": 6000},
                "suv": {"per_km": "Rs. 14 / KM", "one_way": 4200, "round_trip": 8000},
                "assured_innova": {"per_km": "Rs. 16 / KM", "one_way": 4800, "round_trip": 9400}
            }
        elif '1 Day / 120 K.M.' in content:
            pricing_model = 'day_package_120km'
            hatchback_price_str = "Rs. 2,200 (120 KM)"
            sedan_price_str = "Rs. 2,800 (120 KM)"
            suv_price_str = "Rs. 3,000 (120 KM)"
            innova_price_str = "Rs. 3,600 (120 KM)"
            per_km_rates_str = "Extra KM: Hatch/Sedan: Rs. 10/km | SUV: Rs. 14/km | Innova: Rs. 16/km"
            round_trip_str = "Standard Day Package (120 KM limit)"
            driver_charge_str = "Included for 1-day trip"
            tolls_taxes_str = "Included in package"
            applicable_fares = {
                "hatchback": {"per_km": "Rs. 10 / KM", "package_120km": 2200, "extra_km": 10},
                "sedan": {"per_km": "Rs. 10 / KM", "package_120km": 2800, "extra_km": 10},
                "suv": {"per_km": "Rs. 14 / KM", "package_120km": 3000, "extra_km": 14},
                "assured_innova": {"per_km": "Rs. 16 / KM", "package_120km": 3600, "extra_km": 16}
            }
        elif 'Tempo Traveller' in content and 'Price / K.M.' in content:
            pricing_model = 'tempo_traveller'
            hatchback_price_str = "N/A (Group Mini-Bus)"
            sedan_price_str = "N/A (Group Mini-Bus)"
            suv_price_str = "From Rs. 17 / KM (7-Seater)"
            innova_price_str = "From Rs. 25 / KM (12-Seater)"
            per_km_rates_str = "7 Seater: Rs. 17/km up to 26 Seater: Rs. 34/km"
            round_trip_str = "Min 300 KM / Day billing rule"
            driver_charge_str = "Rs. 500 / Day"
            tolls_taxes_str = "Tolls, Parking & State Tax Extra"
            applicable_fares = {
                "rate_range": "Rs. 17 / KM to Rs. 34 / KM (7 to 26 Seater)",
                "driver_charge_per_day": 500,
                "minimum_km_per_day": 300
            }
        elif service_category == 'Tour Package':
            pricing_model = 'tour_package'
            hatchback_price_str = "Contact for quote"
            sedan_price_str = "Rs. 2,000 (Agra Tour) / Custom"
            suv_price_str = "Rs. 2,700 (Agra Tour) / Custom"
            innova_price_str = "Custom Package Quote"
            per_km_rates_str = "Package Fixed Price"
            round_trip_str = "Sightseeing Return Included"
            driver_charge_str = "Included"
            tolls_taxes_str = "Fuel, Parking, Tolls Included"
            applicable_fares = {
                "sedan_price": 2000,
                "suv_price": 2700,
                "pricing_type": "Package Sightseeing Rate"
            }
        else:
            pricing_model = 'custom_or_hourly'

        pricing_model_counter[pricing_model] += 1

        # Distance & Travel Time extraction
        dist = None
        travel_time = None
        
        m_dist = re.search(r'distance\s*(?:between|from)\s*([^\n?.]+?)\s*is\s*(?:about|around|approximately)?\s*([\d\s\-\–to]+?\s*km)', content, re.IGNORECASE)
        if m_dist:
            dist = m_dist.group(2).strip()
        else:
            m_dist2 = re.search(r'distance of\s*([\d\s\-\–to]+?\s*km)', content, re.IGNORECASE)
            if m_dist2:
                dist = m_dist2.group(1).strip()
            else:
                m_kms = re.findall(r'(\b\d+\s*km\b)', content, re.IGNORECASE)
                valid_kms = [k for k in m_kms if '120' not in k and '80' not in k and '300' not in k]
                if valid_kms:
                    dist = valid_kms[0]

        m_time = re.search(r'travel time is (?:about|around|approximately)?\s*([^\n,.]+?(?:hours?|hrs?))', content, re.IGNORECASE)
        if m_time:
            travel_time = m_time.group(1).strip()

        # FAQs extraction
        faqs = []
        faq_matches = re.findall(r'-\s*\*\*([^\*]+?\?)\*\*\s*\n+([^\n\-#]+)', content)
        if not faq_matches:
            faq_matches = re.findall(r'\*\*(\d+\.\s*[^\*]+?\?)\*\*\s*\n+([^\n\-#]+)', content)
        for q, a in faq_matches[:4]:
            faqs.append({'question': q.strip(), 'answer': a.strip()})

        corridor_name = classify_corridor(slug, origin, destination)

        route_obj = {
            "route_id": slug,
            "title": title,
            "url": url,
            "travel_corridor": corridor_name,
            "origin": origin,
            "destination": destination,
            "service_category": service_category,
            "pricing_model": pricing_model,
            "distance": dist if dist else "Per actual route",
            "estimated_travel_time": travel_time if travel_time else "Varies by traffic",
            "hatchback_price": hatchback_price_str,
            "sedan_price": sedan_price_str,
            "suv_price": suv_price_str,
            "innova_price": innova_price_str,
            "per_km_rates": per_km_rates_str,
            "round_trip_rates": round_trip_str,
            "driver_allowance": driver_charge_str,
            "tolls_and_taxes": tolls_taxes_str,
            "applicable_fares": applicable_fares,
            "faqs": faqs
        }

        routes_database.append(route_obj)
        corridors_grouped[corridor_name].append(route_obj)

    print(f"Total structured routes in catalog: {len(routes_database)}")

    # 1. Master JSON File
    master_catalog = {
        "metadata": {
            "catalog_title": "Agra Shiv Tour And Travels (ASTT) Complete Pricing, Fares & Tour Package Catalog",
            "source": "Scraped via Firecrawl from www.agrashivtourandtravels.com",
            "version": "2.0.0",
            "extracted_at": "2026-09-25",
            "company_info": {
                "name": "Agra Shiv Tour And Travels (ASTT)",
                "experience": "15+ Years Trusted Taxi & Tour Operator in Agra",
                "phone_numbers": ["+91 9759000249", "+91 9068888587", "+91 9058016350"],
                "landline": "+91 0562 430 6350",
                "email": "contact@agrashivtourandtravels.com",
                "headquarters": "Agra, Uttar Pradesh, India"
            },
            "summary_statistics": {
                "total_routes_and_pages": len(routes_database),
                "total_travel_corridors": len(corridors_grouped),
                "corridors_breakdown": {k: len(v) for k, v in corridors_grouped.items()},
                "pricing_models_breakdown": dict(pricing_model_counter)
            }
        },
        "service_types": [
            {
                "id": "outstation_one_way_round_trip",
                "name": "Outstation One-Way & Round-Trip Taxi",
                "description": "Direct point-to-point transfers and round-trip journeys between major cities and regional towns with inclusive toll/tax rates."
            },
            {
                "id": "outstation_1day_120km",
                "name": "1-Day / 120 KM Outstation Package",
                "description": "Fixed day packages covering up to 120 KM for day trips, business visits, or short outstation travels with nominal per-km excess billing."
            },
            {
                "id": "local_city_taxi",
                "name": "Local City Taxi & Sightseeing",
                "description": "City car hire for local Agra/Gurgaon/Delhi travel (8 Hours / 80 KM or Full Day) for local shopping, meetings, and monument visits."
            },
            {
                "id": "tempo_traveller_hire",
                "name": "Tempo Traveller Fleet Rentals",
                "description": "Group travel solutions from 7-seater to 26-seater luxury and standard mini-buses with dedicated chauffeurs."
            },
            {
                "id": "luxury_hourly_rental",
                "name": "Luxury & Executive Car Rentals",
                "description": "Chauffeur-driven luxury sedans (e.g. Audi Grand Sedan) on hourly, daily, or fixed airport transfer basis."
            },
            {
                "id": "curated_tour_packages",
                "name": "Curated Sightseeing & Heritage Tour Packages",
                "description": "Turnkey day and multi-day tour packages including Golden Triangle, Same Day Agra, Jaipur, Fatehpur Sikri, Mathura-Vrindavan, and Bharatpur."
            }
        ],
        "rate_cards": rate_cards,
        "tour_packages": tour_packages,
        "travel_corridors_summary": {k: len(v) for k, v in corridors_grouped.items()},
        "routes_catalog": routes_database
    }

    json_path = 'travel_tour_pricing_catalog.json'
    with open(json_path, 'w', encoding='utf-8') as jf:
        json.dump(master_catalog, jf, indent=2, ensure_ascii=False)
    print(f"Master JSON written successfully to {json_path} (Size: {os.path.getsize(json_path)} bytes)")

    # 2. Master CSV File
    csv_path = 'all_routes_and_prices.csv'
    with open(csv_path, 'w', encoding='utf-8-sig', newline='') as cf:
        fieldnames = [
            'route_id', 'origin', 'destination', 'travel_corridor', 'service_category', 
            'pricing_model', 'distance', 'estimated_travel_time', 
            'hatchback_price', 'sedan_price', 'suv_price', 'innova_price', 
            'per_km_rates', 'round_trip_rates', 'driver_allowance', 'tolls_and_taxes', 'url'
        ]
        writer = csv.DictWriter(cf, fieldnames=fieldnames)
        writer.writeheader()
        
        for r in routes_database:
            writer.writerow({
                'route_id': r['route_id'],
                'origin': r['origin'],
                'destination': r['destination'],
                'travel_corridor': r['travel_corridor'],
                'service_category': r['service_category'],
                'pricing_model': r['pricing_model'],
                'distance': r['distance'],
                'estimated_travel_time': r['estimated_travel_time'],
                'hatchback_price': r['hatchback_price'],
                'sedan_price': r['sedan_price'],
                'suv_price': r['suv_price'],
                'innova_price': r['innova_price'],
                'per_km_rates': r['per_km_rates'],
                'round_trip_rates': r['round_trip_rates'],
                'driver_allowance': r['driver_allowance'],
                'tolls_and_taxes': r['tolls_and_taxes'],
                'url': r['url']
            })
    print(f"Master CSV written successfully to {csv_path} (Size: {os.path.getsize(csv_path)} bytes)")

    # 3. Master Markdown File (UNTRUNCATED: EVERY SINGLE ROUTE LISTED!)
    md_path = 'travel_tour_pricing_catalog.md'
    with open(md_path, 'w', encoding='utf-8') as mf:
        mf.write("# Agra Shiv Tour And Travels (ASTT) - Complete Pricing, Fares & Package Catalog\n\n")
        mf.write("> Comprehensive extracted data catalog from Firecrawl crawl of `www.agrashivtourandtravels.com`.\n")
        mf.write(f"> **Contains ALL {len(routes_database)} routes, pairs, prices, vehicle fares, calculation formulas, and tour packages in a single non-truncated file.**\n\n")
        
        mf.write("## 1. Company & Contact Details\n\n")
        mf.write("- **Company Name**: Agra Shiv Tour And Travels (ASTT)\n")
        mf.write("- **Experience**: 15+ Years Trusted Local & Outstation Taxi Provider in Agra & North India\n")
        mf.write("- **Mobile Bookings**: +91 9759000249 / +91 9068888587 / +91 9058016350\n")
        mf.write("- **Customer Care / Landline**: +91 0562 430 6350\n")
        mf.write("- **Email**: contact@agrashivtourandtravels.com\n")
        mf.write(f"- **Total Routes & Pages Extracted**: {len(routes_database)} complete route entries\n\n")

        mf.write("## 2. Types of Services & Packages (Types of Tour / Tool)\n\n")
        mf.write("| Service Type ID | Service Name | Key Description |\n")
        mf.write("| --- | --- | --- |\n")
        for st in master_catalog["service_types"]:
            mf.write(f"| `{st['id']}` | **{st['name']}** | {st['description']} |\n")
        mf.write("\n")

        mf.write("## 3. Master Fare & Pricing Rate Cards\n\n")

        mf.write("### A. One-Way & Round-Trip Outstation Fares\n\n")
        mf.write("| Vehicle Type | Model Examples | Seating Capacity | Luggage | Price / KM | One-Way Fixed Price | Round-Trip Fixed Price |\n")
        mf.write("| --- | --- | --- | --- | --- | --- | --- |\n")
        for v in rate_cards["one_way_and_round_trip"]["vehicles"]:
            mf.write(f"| **{v['vehicle_type']}** | {', '.join(v['models'])} | {v['seating_capacity']} | {v['luggage_capacity']} | {v['price_per_km_formatted']} | {v['one_way_price_formatted']} | {v['round_trip_price_formatted']} |\n")
        mf.write("\n*Note: Quoted one-way and round-trip fares typically include highway toll taxes and state border permits. Parking fees are paid separately by passenger.*\n\n")

        mf.write("### B. 1 Day / 120 K.M. Outstation & Day Tour Packages\n\n")
        mf.write("| Vehicle Type | Model Examples | Seating | Base Price / KM | 1 Day / 120 K.M. Package Rate | Extra KM Rate |\n")
        mf.write("| --- | --- | --- | --- | --- | --- |\n")
        for v in rate_cards["day_package_120km"]["vehicles"]:
            mf.write(f"| **{v['vehicle_type']}** | {', '.join(v['models'])} | {v['seating_capacity']} | {v['start_price_per_km_formatted']} | {v['package_price_1_day_120km_formatted']} | Rs. {v['extra_km_rate']} / KM |\n")
        mf.write("\n*Calculation Rule: Fare = Base Package Rate (covers first 120 KM) + (Extra KM * Extra KM Rate).*\n\n")

        mf.write("### C. Tempo Traveller Fleet Pricing (7 to 26 Seater)\n\n")
        mf.write(f"- **Driver Daily Allowance**: {rate_cards['tempo_traveller']['driver_allowance_formatted']}\n")
        mf.write(f"- **Minimum Distance Limit**: {rate_cards['tempo_traveller']['minimum_km_limit_note']}\n")
        mf.write(f"- **Tolls & Taxes**: {rate_cards['tempo_traveller']['additional_charges_note']}\n\n")
        mf.write("| Tempo Traveller Type | Configuration | Seating Capacity | Price / K.M. | Driver Allowance |\n")
        mf.write("| --- | --- | --- | --- | --- |\n")
        for tt in rate_cards["tempo_traveller"]["fleet"]:
            mf.write(f"| **{tt['seating_type']}** | {tt['configuration']} | {tt['configuration'].split('+')[0]} Pax + 1 Chauffeur | Rs. {tt['price_per_km']} / KM | Rs. {tt['driver_charge']}/day |\n")
        mf.write("\n")

        mf.write("### D. Luxury, Hourly & Daily Rentals (Audi Grand Sedan)\n\n")
        lux = rate_cards["luxury_and_hourly_rentals"]
        mf.write(f"- **Vehicle**: {lux['vehicle']}\n")
        mf.write(f"- **Hourly Rate**: {lux['hourly_rate_formatted']}\n")
        mf.write(f"- **Daily Rate**: {lux['daily_rate_formatted']}\n")
        mf.write(f"- **Airport Transfer Flat**: {lux['airport_transfer_formatted']}\n\n")

        mf.write("### E. Fleet Base Rates Per KM\n\n")
        mf.write("| Vehicle Model | Vehicle Class | Capacity | Starting Price / KM |\n")
        mf.write("| --- | --- | --- | --- |\n")
        for fb in rate_cards["fleet_base_rates"]:
            mf.write(f"| **{fb['model']}** | {fb['category']} | {fb['capacity']} | Rs. {fb['starting_price_per_km']} / KM |\n")
        mf.write("\n")

        mf.write("### F. Local City Rental Packages\n\n")
        lpk = rate_cards["local_rental_packages"]
        mf.write(f"- **{lpk['package_8hr_80km']['name']}**: {lpk['package_8hr_80km']['duration_hours']} Hours duration, {lpk['package_8hr_80km']['included_km']} KM included. {lpk['package_8hr_80km']['ideal_for']}.\n")
        mf.write(f"- **{lpk['package_full_day']['name']}**: {lpk['package_full_day']['duration_hours']} Hours duration. {lpk['package_full_day']['ideal_for']}.\n\n")

        mf.write("## 4. Curated Tour Packages Catalog\n\n")
        for pkg in tour_packages:
            mf.write(f"### {pkg['package_name']}\n\n")
            if "duration" in pkg:
                mf.write(f"- **Duration**: {pkg['duration']}\n")
            if "destinations" in pkg:
                mf.write(f"- **Destinations Covered**: {', '.join(pkg['destinations'])}\n")
            elif "destination" in pkg:
                mf.write(f"- **Destination**: {pkg['destination']}\n")
            if "pricing" in pkg:
                mf.write(f"- **Pricing**: Sedan: **{pkg['pricing']['sedan_price_formatted']}** | Prime SUV: **{pkg['pricing']['prime_suv_price_formatted']}**\n")
            elif "pricing_type" in pkg:
                mf.write(f"- **Pricing Model**: {pkg['pricing_type']}\n")
            if "distance_km" in pkg:
                mf.write(f"- **Approximate Distance**: {pkg['distance_km']} KM\n")
            if "attractions_covered" in pkg:
                mf.write("- **Attractions Covered**:\n")
                for att in pkg["attractions_covered"]:
                    mf.write(f"  - {att}\n")
            if "itinerary" in pkg:
                mf.write("- **Daily Itinerary**:\n")
                for it in pkg["itinerary"]:
                    mf.write(f"  - **Day {it['day']}: {it['title']}**: {it['details']}\n")
            if "inclusions" in pkg:
                mf.write("- **Inclusions**:\n")
                for inc in pkg["inclusions"]:
                    mf.write(f"  - {inc}\n")
            if "options" in pkg:
                mf.write("- **Package Options**:\n")
                for opt in pkg["options"]:
                    mf.write(f"  - **{opt['name']}**: {opt['description']} (Included: {opt['included_km']} KM, Duration: {opt['duration']})\n")
            mf.write("\n")

        mf.write("## 5. Fare Calculations & Pricing Logic\n\n")
        mf.write("### Fare Calculation Formulas\n\n")
        mf.write("- **One-Way Outstation**: `Fare = Flat Route Rate OR (Distance KM * Per KM Rate)` (Tolls & State Taxes Included)\n")
        mf.write("- **Round-Trip Outstation**: `Fare = Max(Round-Trip KM, Min Daily KM * Days) * Per KM Rate + (Driver Allowance * Days)`\n")
        mf.write("- **1-Day / 120 KM Package**: `Fare = Base Package Price + Max(0, Actual KM - 120) * Extra KM Rate`\n")
        mf.write("- **Tempo Traveller Group Hire**: `Fare = Max(Total KM, 300 KM * Days) * Per KM Rate + (Rs. 500 * Days Driver Charge) + Tolls + State Taxes + Parking`\n")
        mf.write("- **Hourly Luxury (Audi)**: `Fare = (Hours * Rs. 190/hr) OR (Days * Rs. 360/day) + Fuel & Toll Surcharges`\n\n")

        mf.write("## 6. What They Are Providing (Inclusions, Features & Safety)\n\n")
        mf.write("- **Amenities**: Full AC, Roof luggage carrier with heavy-duty ropes, Reclining/pushback seats, GPS tracking, Seat belts.\n")
        mf.write("- **Chauffeur Standards**: Uniformed, background-verified, experienced highway drivers.\n")
        mf.write("- **Inclusions**: Fuel and driver charges included. Toll taxes and state permits included in outstation car fares. Parking fees extra.\n")
        mf.write("- **Service Guarantees**: Door-to-door doorstep pickup, instant booking confirmation, 24/7 customer care support.\n")
        mf.write("- **5-Layer Safety Measures**: Regular car deep sanitization, driver thermal checks, face masks, digital payment, safe seating distancing.\n\n")

        # 7. Complete, Non-Truncated Master Routes Table
        mf.write("## 7. Master Routes, Pairs & Pricing Table (COMPLETE LISTING - All 983 Routes)\n\n")
        mf.write("> **This table contains EVERY SINGLE ROUTE scraped from the site with its origin, destination, corridor, distance, and prices for Hatchback, Sedan, SUV, and Assured Innova.**\n\n")

        # We will write the full table corridor by corridor so it is organized cleanly
        for cname, rlist in sorted(corridors_grouped.items(), key=lambda x: -len(x[1])):
            mf.write(f"### {cname} ({len(rlist)} Routes)\n\n")
            
            mf.write("| # | Origin | Destination | Distance | Travel Time | Hatchback | Sedan | SUV | Innova | Driver Charge | Tolls & Taxes |\n")
            mf.write("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n")
            
            for idx, r in enumerate(rlist, 1):
                o_str = r['origin'] if r['origin'] else "Local Base"
                d_str = r['destination'] if r['destination'] else "Local Area"
                dist_str = r['distance']
                time_str = r['estimated_travel_time']
                h_price = r['hatchback_price']
                s_price = r['sedan_price']
                suv_price = r['suv_price']
                inno_price = r['innova_price']
                d_charge = r['driver_allowance']
                tolls = r['tolls_and_taxes']

                mf.write(f"| {idx} | **{o_str}** | **{d_str}** | {dist_str} | {time_str} | {h_price} | {s_price} | {suv_price} | {inno_price} | {d_charge} | {tolls} |\n")
            mf.write("\n")

    print(f"Master Markdown written successfully to {md_path} (Size: {os.path.getsize(md_path)} bytes)")

build_complete_dataset()
