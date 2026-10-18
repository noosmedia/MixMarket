// Branchenkatalog für die Firmensuche.
// Je Branche: deutscher Suchbegriff (für Suchmaschinen und die Namenssuche),
// die OpenStreetMap-Merkmale, unter denen solche Betriebe eingetragen sind, und
// die Google-Kategorien für DataForSEO Business Listings. Die Google-Kategorien
// werden vor jeder Suche gegen die aktuelle Liste von DataForSEO geprüft;
// unbekannte fallen weg, ohne gültige Kategorie wird nach dem Namen gesucht.

export interface Branch {
  key: string
  de: string
  en: string
  term: string
  osm: string[]
  google: string[]
}

export const BRANCHES: Branch[] = [
  // --- Handwerk und Bau ---
  { key: 'roofer', de: 'Dachdecker', en: 'Roofers', term: 'Dachdecker', osm: ['craft=roofer'], google: ['roofing_contractor'] },
  { key: 'electrician', de: 'Elektriker', en: 'Electricians', term: 'Elektriker', osm: ['craft=electrician'], google: ['electrician'] },
  { key: 'plumber', de: 'Sanitär und Installateure', en: 'Plumbers', term: 'Sanitär Installateur', osm: ['craft=plumber'], google: ['plumber'] },
  { key: 'hvac', de: 'Heizung, Lüftung, Klima', en: 'Heating and HVAC', term: 'Heizungsbau', osm: ['craft=hvac', 'craft=heating_engineer'], google: ['hvac_contractor', 'heating_contractor'] },
  { key: 'carpenter', de: 'Tischler und Zimmerer', en: 'Carpenters and joiners', term: 'Tischlerei', osm: ['craft=carpenter', 'craft=joiner'], google: ['carpenter', 'cabinet_maker'] },
  { key: 'painter', de: 'Maler und Lackierer', en: 'Painters', term: 'Malerbetrieb', osm: ['craft=painter'], google: ['painter'] },
  { key: 'tiler', de: 'Fliesenleger', en: 'Tilers', term: 'Fliesenleger', osm: ['craft=tiler'], google: ['tile_contractor'] },
  { key: 'gardener', de: 'Garten- und Landschaftsbau', en: 'Landscaping', term: 'Garten- und Landschaftsbau', osm: ['craft=gardener'], google: ['landscaper', 'landscape_designer'] },
  { key: 'metal', de: 'Metallbau und Schlosser', en: 'Metal construction', term: 'Metallbau', osm: ['craft=metal_construction'], google: ['metal_construction_company', 'metal_fabricator'] },
  { key: 'window', de: 'Fenster und Türen', en: 'Windows and doors', term: 'Fensterbau', osm: ['craft=window_construction'], google: ['window_installation_service', 'window_supplier'] },
  { key: 'builder', de: 'Bauunternehmen', en: 'Builders', term: 'Bauunternehmen', osm: ['craft=builder', 'office=construction_company'], google: ['general_contractor', 'construction_company'] },
  { key: 'locksmith', de: 'Schlüsseldienste', en: 'Locksmiths', term: 'Schlüsseldienst', osm: ['shop=locksmith', 'craft=locksmith'], google: ['locksmith'] },
  { key: 'cleaning', de: 'Gebäudereinigung', en: 'Cleaning services', term: 'Gebäudereinigung', osm: ['craft=cleaning'], google: ['commercial_cleaning_service', 'house_cleaning_service'] },
  // --- Auto ---
  { key: 'car_dealer', de: 'Autohäuser', en: 'Car dealers', term: 'Autohaus', osm: ['shop=car'], google: ['car_dealer', 'used_car_dealer'] },
  { key: 'car_repair', de: 'Kfz-Werkstätten', en: 'Car repair', term: 'Kfz Werkstatt', osm: ['shop=car_repair'], google: ['auto_repair_shop', 'car_repair'] },
  // --- Gesundheit ---
  { key: 'dentist', de: 'Zahnärzte', en: 'Dentists', term: 'Zahnarzt', osm: ['amenity=dentist', 'healthcare=dentist'], google: ['dentist', 'dental_clinic'] },
  { key: 'doctor', de: 'Arztpraxen', en: 'Doctors', term: 'Arztpraxis', osm: ['amenity=doctors', 'healthcare=doctor'], google: ['doctor', 'general_practitioner', 'medical_clinic'] },
  { key: 'physio', de: 'Physiotherapie', en: 'Physiotherapy', term: 'Physiotherapie', osm: ['healthcare=physiotherapist'], google: ['physiotherapist', 'physical_therapist'] },
  { key: 'vet', de: 'Tierärzte', en: 'Veterinarians', term: 'Tierarzt', osm: ['amenity=veterinary'], google: ['veterinarian', 'animal_hospital'] },
  { key: 'pharmacy', de: 'Apotheken', en: 'Pharmacies', term: 'Apotheke', osm: ['amenity=pharmacy'], google: ['pharmacy'] },
  { key: 'optician', de: 'Optiker', en: 'Opticians', term: 'Optiker', osm: ['shop=optician'], google: ['optician'] },
  { key: 'hearing', de: 'Hörakustiker', en: 'Hearing aids', term: 'Hörakustik', osm: ['shop=hearing_aids'], google: ['hearing_aid_store'] },
  // --- Beratung und Büro ---
  { key: 'lawyer', de: 'Rechtsanwälte', en: 'Lawyers', term: 'Rechtsanwalt', osm: ['office=lawyer'], google: ['lawyer', 'law_firm'] },
  { key: 'tax', de: 'Steuerberater', en: 'Tax advisors', term: 'Steuerberater', osm: ['office=tax_advisor'], google: ['tax_consultant', 'tax_preparation_service'] },
  { key: 'accountant', de: 'Buchhaltung', en: 'Accountants', term: 'Buchhaltungsbüro', osm: ['office=accountant'], google: ['accountant', 'bookkeeping_service'] },
  { key: 'notary', de: 'Notare', en: 'Notaries', term: 'Notar', osm: ['office=notary'], google: ['notary_public'] },
  { key: 'real_estate', de: 'Immobilienmakler', en: 'Real estate agents', term: 'Immobilienmakler', osm: ['office=estate_agent'], google: ['real_estate_agency', 'real_estate_agent'] },
  { key: 'insurance', de: 'Versicherungsbüros', en: 'Insurance agencies', term: 'Versicherungsagentur', osm: ['office=insurance'], google: ['insurance_agency', 'insurance_broker'] },
  { key: 'architect', de: 'Architekten', en: 'Architects', term: 'Architekturbüro', osm: ['office=architect'], google: ['architect', 'architecture_firm'] },
  { key: 'it', de: 'IT-Dienstleister', en: 'IT services', term: 'IT-Dienstleister', osm: ['office=it'], google: ['computer_support_and_services', 'software_company'] },
  { key: 'agency', de: 'Werbe- und Webagenturen', en: 'Marketing and web agencies', term: 'Werbeagentur', osm: ['office=advertising_agency'], google: ['marketing_agency', 'advertising_agency', 'website_designer'] },
  // --- Gastronomie und Handel ---
  { key: 'restaurant', de: 'Restaurants', en: 'Restaurants', term: 'Restaurant', osm: ['amenity=restaurant'], google: ['restaurant'] },
  { key: 'cafe', de: 'Cafés', en: 'Cafés', term: 'Café', osm: ['amenity=cafe'], google: ['cafe', 'coffee_shop'] },
  { key: 'hotel', de: 'Hotels und Pensionen', en: 'Hotels', term: 'Hotel', osm: ['tourism=hotel', 'tourism=guest_house'], google: ['hotel', 'guest_house'] },
  { key: 'holiday_rental', de: 'Ferienwohnungen und Ferienhäuser', en: 'Holiday apartments and homes', term: 'Ferienwohnung', osm: ['tourism=apartment', 'tourism=chalet'], google: ['vacation_home_rental_agency', 'holiday_apartment', 'holiday_home', 'cottage', 'chalet', 'apartment_rental_agency'] },
  { key: 'camping', de: 'Campingplätze', en: 'Campsites', term: 'Campingplatz', osm: ['tourism=camp_site', 'tourism=caravan_site'], google: ['campground', 'rv_park'] },
  { key: 'bakery', de: 'Bäckereien', en: 'Bakeries', term: 'Bäckerei', osm: ['shop=bakery'], google: ['bakery'] },
  { key: 'butcher', de: 'Fleischereien', en: 'Butchers', term: 'Fleischerei', osm: ['shop=butcher'], google: ['butcher_shop'] },
  { key: 'florist', de: 'Blumenläden', en: 'Florists', term: 'Blumenladen', osm: ['shop=florist'], google: ['florist'] },
  { key: 'furniture', de: 'Möbel und Küchen', en: 'Furniture and kitchens', term: 'Möbelhaus', osm: ['shop=furniture', 'shop=kitchen'], google: ['furniture_store', 'kitchen_furniture_store'] },
  { key: 'bicycle', de: 'Fahrradläden', en: 'Bicycle shops', term: 'Fahrradladen', osm: ['shop=bicycle'], google: ['bicycle_store'] },
  // --- Dienstleistungen ---
  { key: 'hairdresser', de: 'Friseure', en: 'Hairdressers', term: 'Friseur', osm: ['shop=hairdresser'], google: ['hair_salon', 'barber_shop'] },
  { key: 'beauty', de: 'Kosmetikstudios', en: 'Beauty salons', term: 'Kosmetikstudio', osm: ['shop=beauty'], google: ['beauty_salon'] },
  { key: 'fitness', de: 'Fitnessstudios', en: 'Gyms', term: 'Fitnessstudio', osm: ['leisure=fitness_centre'], google: ['gym', 'fitness_center'] },
  { key: 'driving_school', de: 'Fahrschulen', en: 'Driving schools', term: 'Fahrschule', osm: ['amenity=driving_school'], google: ['driving_school'] },
  { key: 'photographer', de: 'Fotografen', en: 'Photographers', term: 'Fotograf', osm: ['craft=photographer', 'shop=photo'], google: ['photographer', 'photography_studio'] },
  { key: 'funeral', de: 'Bestatter', en: 'Funeral homes', term: 'Bestattungsinstitut', osm: ['shop=funeral_directors'], google: ['funeral_home'] },
]

// Branche anhand des Schlüssels finden
export function findBranch(key: string | null | undefined): Branch | undefined {
  return key ? BRANCHES.find((b) => b.key === key) : undefined
}
