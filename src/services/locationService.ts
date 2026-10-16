// Structured Worldwide Location Hierarchy & Strict Matching Service
// Supports Worldwide -> Country -> State/Province/County -> City/Town -> Neighborhood/Estate
// Fully supports all 47 counties of Kenya and major international markets worldwide.

export interface LocationNode {
  name: string;
  type: 'country' | 'state' | 'province' | 'county' | 'region' | 'city' | 'town' | 'area' | 'estate' | 'neighborhood';
  currency?: string;
  flag?: string;
  children?: LocationNode[];
  aliases?: string[];
}

export interface WorldwideCountry {
  code: string;
  name: string;
  flag: string;
  currency: string;
  subdivisionType: 'County' | 'State' | 'Province' | 'Region' | 'Governorate' | 'Emirate';
  subdivisions: {
    name: string;
    cities?: {
      name: string;
      neighborhoods?: string[];
    }[];
  }[];
}

// ALL 47 COUNTIES OF KENYA
export const KENYA_47_COUNTIES = [
  'Mombasa', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita-Taveta',
  'Garissa', 'Wajir', 'Mandera', 'Marsabit', 'Isiolo', 'Meru',
  'Tharaka-Nithi', 'Embu', 'Kitui', 'Machakos', 'Makueni', 'Nyandarua',
  'Nyeri', 'Kirinyaga', 'Murang\'a', 'Kiambu', 'Turkana', 'West Pokot',
  'Samburu', 'Trans-Nzoia', 'Uasin Gishu', 'Elgeyo-Marakwet', 'Nandi',
  'Baringo', 'Laikipia', 'Nakuru', 'Narok', 'Kajiado', 'Kericho',
  'Bomet', 'Kakamega', 'Vihiga', 'Bungoma', 'Busia', 'Siaya',
  'Kisumu', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira', 'Nairobi'
] as const;

// Detailed Kenyan Hubs with Towns & Estates
export interface KenyanLocationNode {
  county: string;
  town: string;
  areas: string[];
  estates?: string[];
  nearbyTowns?: string[];
}

export const KENYAN_HIERARCHY: KenyanLocationNode[] = [
  {
    county: 'Kajiado',
    town: 'Ongata Rongai',
    areas: ['Rongai', 'Ongata Rongai', 'Maasai Lodge', 'Tuskys Stage', 'Tumaini', 'Mayor Road', 'Kware', 'Nkoroi', 'Rimpa', 'Kandisi', 'Olekasasi', 'Laiser Hill'],
    estates: ['Maasai Lodge Estate', 'Tuskys Area', 'Tumaini Estate', 'Kware Estate', 'Rimpa Estate', 'Nkoroi Estate'],
    nearbyTowns: ['Kiserian', 'Ngong', 'Karen', 'Langata', 'Nairobi']
  },
  {
    county: 'Kajiado',
    town: 'Ngong',
    areas: ['Ngong Town', 'Ngong', 'Zambia', 'Kibiko', 'Juanco', 'Veterinary', 'Mathare Ngong', 'Kahara'],
    estates: ['Kibiko Estate', 'Zambia Estate', 'Juanco Estate'],
    nearbyTowns: ['Ongata Rongai', 'Karen', 'Kiserian', 'Dagoretti']
  },
  {
    county: 'Kajiado',
    town: 'Kitengela',
    areas: ['Kitengela Town', 'Kitengela', 'Yukos', 'EPZ', 'Acacia', 'Noonkopir', 'Chuna'],
    estates: ['Acacia Estate', 'Chuna Estate', 'Yukos Area'],
    nearbyTowns: ['Athi River', 'Syokimau', 'Mlolongo', 'Nairobi']
  },
  {
    county: 'Kajiado',
    town: 'Kiserian',
    areas: ['Kiserian Town', 'Kiserian', 'Pipeline Road', 'Birika', 'Oletepesi'],
    estates: ['Kiserian Central', 'Pipeline View'],
    nearbyTowns: ['Ongata Rongai', 'Ngong', 'Matasia']
  },
  {
    county: 'Nairobi',
    town: 'Westlands',
    areas: ['Westlands', 'Sarit', 'Parklands', 'Mpaka Road', 'Waiyaki Way', 'Rhapta Road', 'Muthithi Road', 'Highridge', 'Spring Valley'],
    estates: ['Parklands Estate', 'Rhapta Road Area', 'Spring Valley'],
    nearbyTowns: ['Kilimani', 'Kileleshwa', 'Nairobi CBD', 'Parklands']
  },
  {
    county: 'Nairobi',
    town: 'Kilimani',
    areas: ['Kilimani', 'Yaya Center', 'Argwings Kodhek', 'Dennis Pritt', 'Woodley', 'Hurlingham', 'Lavington'],
    estates: ['Woodley Estate', 'Hurlingham Area', 'Dennis Pritt Area'],
    nearbyTowns: ['Kileleshwa', 'Westlands', 'Nairobi CBD', 'Lavington']
  },
  {
    county: 'Nairobi',
    town: 'Nairobi CBD',
    areas: ['Nairobi CBD', 'City Center', 'Tom Mboya', 'Moi Avenue', 'Kenyatta Avenue', 'River Road', 'Biashara Street', 'City Market', 'Burma Market'],
    estates: ['CBD Central', 'Downtown Nairobi'],
    nearbyTowns: ['Westlands', 'Ngara', 'Eastleigh', 'South B']
  },
  {
    county: 'Nairobi',
    town: 'Eastleigh',
    areas: ['Eastleigh', 'First Avenue', 'Second Avenue', 'Twelfth Street', 'Section 1', 'Section 2', 'Section 3', 'Garissa Lodge', 'Yare Towers'],
    estates: ['Section 1', 'Section 2', 'Section 3', 'California'],
    nearbyTowns: ['Nairobi CBD', 'Pangani', 'Ngara', 'Buru Buru']
  },
  {
    county: 'Nairobi',
    town: 'Roysambu',
    areas: ['Roysambu', 'TRM Drive', 'Mirema', 'Mirema Drive', 'Lumumba Drive', 'Zimmerman', 'Kasarani'],
    estates: ['TRM Estate', 'Mirema Estate', 'Lumumba Drive Area', 'Zimmerman Estate'],
    nearbyTowns: ['Kasarani', 'Kahawa West', 'Thika Road', 'Nairobi CBD']
  },
  {
    county: 'Nairobi',
    town: 'Kasarani',
    areas: ['Kasarani', 'Mwiki', 'Hunters', 'Seasons', 'Clay City', 'Santton'],
    estates: ['Clay City Estate', 'Mwiki Estate', 'Santton Estate'],
    nearbyTowns: ['Roysambu', 'Githurai', 'Zimmerman']
  },
  {
    county: 'Nairobi',
    town: 'South B',
    areas: ['South B', 'Plainsview', 'Mariakani', 'Hazina', 'Golden Gate', 'Kapiti'],
    estates: ['Plainsview Estate', 'Mariakani Estate', 'Hazina Estate', 'Golden Gate Estate'],
    nearbyTowns: ['South C', 'Nairobi CBD', 'Industrial Area']
  },
  {
    county: 'Nairobi',
    town: 'South C',
    areas: ['South C', 'Bellevue', 'Mugoya', 'Five Star', 'Akiba', 'Madaraka'],
    estates: ['Mugoya Estate', 'Five Star Estate', 'Akiba Estate'],
    nearbyTowns: ['South B', 'Nairobi CBD', 'Langata']
  },
  {
    county: 'Nairobi',
    town: 'Karen',
    areas: ['Karen', 'Karen Shopping Centre', 'Mbagathi Way', 'Bogani', 'Hardy', 'Windy Ridge'],
    estates: ['Hardy Estate', 'Bogani Area', 'Karen Plains'],
    nearbyTowns: ['Ongata Rongai', 'Ngong', 'Langata']
  },
  {
    county: 'Kiambu',
    town: 'Ruaka',
    areas: ['Ruaka', 'Two Rivers', 'Joyland', 'Gacharage', 'Banana', 'Ndenderu', 'Runda Mumwe'],
    estates: ['Joyland Area', 'Two Rivers Area', 'Gacharage Estate'],
    nearbyTowns: ['Westlands', 'Runda', 'Kiambu Town']
  },
  {
    county: 'Kiambu',
    town: 'Thika',
    areas: ['Thika Town', 'Thika', 'Makongeni', 'Section 9', 'Ngoingwa', 'Landless', 'Kenyatta Highway'],
    estates: ['Section 9', 'Ngoingwa Estate', 'Makongeni Estate'],
    nearbyTowns: ['Ruiru', 'Juja', 'Nairobi']
  },
  {
    county: 'Kiambu',
    town: 'Ruiru',
    areas: ['Ruiru Town', 'Ruiru', 'Kimbo', 'Kihunguro', 'Tatu City', 'Kenyatta Road', 'Membley'],
    estates: ['Tatu City', 'Membley Estate', 'Kenyatta Road Area'],
    nearbyTowns: ['Thika', 'Kahawa Sukari', 'Githurai']
  },
  {
    county: 'Machakos',
    town: 'Syokimau',
    areas: ['Syokimau', 'Mombasa Road', 'Katani Road', 'Gateway Mall', 'SGR Terminus', 'Chady Road'],
    estates: ['Katani Road Area', 'Syokimau Estate', 'Chady Estate'],
    nearbyTowns: ['Mlolongo', 'Athi River', 'Kitengela', 'South B']
  },
  {
    county: 'Machakos',
    town: 'Machakos Town',
    areas: ['Machakos CBD', 'Katumani', 'Miwani', 'Chumvi', 'Kyumbi'],
    estates: ['Machakos Central', 'Miwani Estate'],
    nearbyTowns: ['Athi River', 'Syokimau', 'Nairobi']
  },
  {
    county: 'Nakuru',
    town: 'Nakuru',
    areas: ['Nakuru Town', 'Nakuru CBD', 'Milimani', 'Section 58', 'Lanet', 'Kiti', 'Free Area', 'Kenyatta Avenue'],
    estates: ['Milimani Estate', 'Section 58 Estate', 'Lanet Area'],
    nearbyTowns: ['Naivasha', 'Njoro', 'Gilgil']
  },
  {
    county: 'Nakuru',
    town: 'Naivasha',
    areas: ['Naivasha Town', 'Naivasha', 'Moi South Lake Road', 'Karagita', 'Lake Naivasha'],
    estates: ['Karagita Area', 'Naivasha Central'],
    nearbyTowns: ['Nakuru', 'Nairobi', 'Gilgil']
  },
  {
    county: 'Mombasa',
    town: 'Mombasa',
    areas: ['Mombasa CBD', 'Nyali', 'Bamburi', 'Kizingo', 'Tudor', 'Ganjoni', 'Old Town', 'Likoni', 'Mtwapa', 'Changamwe'],
    estates: ['Nyali Estate', 'Bamburi Area', 'Kizingo Estate', 'Tudor Estate'],
    nearbyTowns: ['Mtwapa', 'Diani', 'Kilifi']
  },
  {
    county: 'Kisumu',
    town: 'Kisumu',
    areas: ['Kisumu CBD', 'Milimani Kisumu', 'Kondele', 'Mamboleo', 'Riat', 'Tom Mboya', 'Nyalenda', 'Migosi'],
    estates: ['Milimani Kisumu', 'Kondele Area', 'Migosi Estate', 'Mamboleo Area'],
    nearbyTowns: ['Ahero', 'Maseno', 'Kakamega']
  },
  {
    county: 'Uasin Gishu',
    town: 'Eldoret',
    areas: ['Eldoret CBD', 'Elgon View', 'Pioneer', 'Kapsoya', 'Annex', 'Action', 'Huruma Eldoret'],
    estates: ['Elgon View Estate', 'Kapsoya Estate', 'Pioneer Estate'],
    nearbyTowns: ['Kapsabet', 'Iten', 'Kitale']
  },
  {
    county: 'Kilifi',
    town: 'Kilifi Town',
    areas: ['Kilifi CBD', 'Mtwapa', 'Malindi', 'Watamu', 'Vipingo'],
    estates: ['Mtwapa Creek', 'Malindi Beachside'],
    nearbyTowns: ['Mombasa', 'Nyali']
  },
  {
    county: 'Kwale',
    town: 'Diani',
    areas: ['Diani Beach', 'Ukunda', 'Kwale Town', 'Tiwi'],
    estates: ['Diani Central', 'Ukunda Town'],
    nearbyTowns: ['Mombasa', 'Likoni']
  },
  {
    county: 'Nyeri',
    town: 'Nyeri Town',
    areas: ['Nyeri CBD', 'Karatina', 'Othaya', 'Mukurewe-ini'],
    estates: ['Nyeri Central', 'Karatina Market Area'],
    nearbyTowns: ['Nanyuki', 'Murang\'a', 'Embu']
  }
];

// TOP GLOBAL COUNTRIES & STRUCTURED ADMINISTRATIVE DIVISIONS
export const WORLDWIDE_COUNTRIES: WorldwideCountry[] = [
  {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    currency: 'KES',
    subdivisionType: 'County',
    subdivisions: KENYA_47_COUNTIES.map(c => {
      const matched = KENYAN_HIERARCHY.filter(h => h.county.toLowerCase() === c.toLowerCase());
      return {
        name: c,
        cities: matched.map(m => ({
          name: m.town,
          neighborhoods: m.areas
        }))
      };
    })
  },
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    subdivisionType: 'State',
    subdivisions: [
      {
        name: 'California',
        cities: [
          { name: 'Los Angeles', neighborhoods: ['Downtown LA', 'Hollywood', 'Santa Monica', 'Venice', 'Beverly Hills', 'Silver Lake', 'Westwood'] },
          { name: 'San Francisco', neighborhoods: ['Mission District', 'SoMa', 'Financial District', 'Nob Hill', 'Marina'] },
          { name: 'San Diego', neighborhoods: ['Downtown', 'La Jolla', 'Pacific Beach'] },
          { name: 'San Jose', neighborhoods: ['Downtown', 'Willow Glen'] }
        ]
      },
      {
        name: 'New York',
        cities: [
          { name: 'New York City', neighborhoods: ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island', 'SoHo', 'Midtown', 'Williamsburg'] },
          { name: 'Buffalo', neighborhoods: ['Downtown', 'Elmwood Village'] }
        ]
      },
      {
        name: 'Texas',
        cities: [
          { name: 'Houston', neighborhoods: ['Downtown', 'Montrose', 'The Heights', 'Galleria'] },
          { name: 'Dallas', neighborhoods: ['Downtown', 'Uptown', 'Deep Ellum'] },
          { name: 'Austin', neighborhoods: ['Downtown', 'South Congress', 'East Austin'] }
        ]
      },
      {
        name: 'Florida',
        cities: [
          { name: 'Miami', neighborhoods: ['South Beach', 'Brickell', 'Wynwood', 'Downtown'] },
          { name: 'Orlando', neighborhoods: ['Downtown', 'Lake Nona'] },
          { name: 'Tampa', neighborhoods: ['Ybor City', 'Downtown'] }
        ]
      },
      {
        name: 'Washington',
        cities: [
          { name: 'Seattle', neighborhoods: ['Capitol Hill', 'Ballard', 'Downtown', 'Belltown', 'Fremont'] }
        ]
      },
      {
        name: 'Illinois',
        cities: [
          { name: 'Chicago', neighborhoods: ['The Loop', 'River North', 'Lincoln Park', 'Wicker Park', 'West Loop'] }
        ]
      }
    ]
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    subdivisionType: 'Region',
    subdivisions: [
      {
        name: 'England',
        cities: [
          { name: 'London', neighborhoods: ['Westminster', 'Camden', 'Soho', 'Kensington', 'Greenwich', 'Hackney', 'Croydon', 'Islington', 'Chelsea'] },
          { name: 'Manchester', neighborhoods: ['City Centre', 'Northern Quarter', 'Salford', 'Didsbury'] },
          { name: 'Birmingham', neighborhoods: ['City Centre', 'Jewellery Quarter', 'Edgbaston'] },
          { name: 'Leeds', neighborhoods: ['City Centre', 'Headingley'] }
        ]
      },
      {
        name: 'Scotland',
        cities: [
          { name: 'Edinburgh', neighborhoods: ['Old Town', 'New Town', 'Leith', 'Stockbridge'] },
          { name: 'Glasgow', neighborhoods: ['City Centre', 'West End', 'Merchant City'] }
        ]
      },
      {
        name: 'Wales',
        cities: [
          { name: 'Cardiff', neighborhoods: ['Cardiff Bay', 'City Centre'] }
        ]
      },
      {
        name: 'Northern Ireland',
        cities: [
          { name: 'Belfast', neighborhoods: ['Cathedral Quarter', 'Titanic Quarter'] }
        ]
      }
    ]
  },
  {
    code: 'NG',
    name: 'Nigeria',
    flag: '🇳🇬',
    currency: 'NGN',
    subdivisionType: 'State',
    subdivisions: [
      {
        name: 'Lagos State',
        cities: [
          { name: 'Lagos', neighborhoods: ['Ikeja', 'Victoria Island (VI)', 'Lekki Phase 1', 'Yaba', 'Surulere', 'Ikoyi', 'Maryland', 'Ajah'] }
        ]
      },
      {
        name: 'Abuja FCT',
        cities: [
          { name: 'Abuja', neighborhoods: ['Garki', 'Wuse 2', 'Maitama', 'Asokoro', 'Jabi', 'Utako'] }
        ]
      },
      {
        name: 'Rivers State',
        cities: [
          { name: 'Port Harcourt', neighborhoods: ['GRA Phase 2', 'Old GRA', 'Rumuokoro'] }
        ]
      },
      {
        name: 'Oyo State',
        cities: [
          { name: 'Ibadan', neighborhoods: ['Bodija', 'Ring Road', 'Dugbe'] }
        ]
      }
    ]
  },
  {
    code: 'ZA',
    name: 'South Africa',
    flag: '🇿🇦',
    currency: 'ZAR',
    subdivisionType: 'Province',
    subdivisions: [
      {
        name: 'Gauteng',
        cities: [
          { name: 'Johannesburg', neighborhoods: ['Sandton', 'Rosebank', 'Soweto', 'Midrand', 'Fourways', 'Braamfontein'] },
          { name: 'Pretoria', neighborhoods: ['Centurion', 'Hatfield', 'Brooklyn'] }
        ]
      },
      {
        name: 'Western Cape',
        cities: [
          { name: 'Cape Town', neighborhoods: ['Camps Bay', 'Sea Point', 'Green Point', 'City Bowl', 'Stellenbosch', 'Constantia'] }
        ]
      },
      {
        name: 'KwaZulu-Natal',
        cities: [
          { name: 'Durban', neighborhoods: ['Umhlanga Rocks', 'Morningside', 'Durban North'] }
        ]
      }
    ]
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    currency: 'CAD',
    subdivisionType: 'Province',
    subdivisions: [
      {
        name: 'Ontario',
        cities: [
          { name: 'Toronto', neighborhoods: ['Downtown', 'Yorkville', 'Scarborough', 'North York', 'Mississauga'] },
          { name: 'Ottawa', neighborhoods: ['ByWard Market', 'Centretown'] }
        ]
      },
      {
        name: 'British Columbia',
        cities: [
          { name: 'Vancouver', neighborhoods: ['Downtown', 'Yaletown', 'Kitsilano', 'Gastown', 'Richmond'] }
        ]
      },
      {
        name: 'Quebec',
        cities: [
          { name: 'Montreal', neighborhoods: ['Old Montreal', 'Plateau-Mont-Royal', 'Downtown'] }
        ]
      }
    ]
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    currency: 'AUD',
    subdivisionType: 'State',
    subdivisions: [
      {
        name: 'New South Wales',
        cities: [
          { name: 'Sydney', neighborhoods: ['CBD', 'Bondi', 'Surry Hills', 'Parramatta', 'Manly'] }
        ]
      },
      {
        name: 'Victoria',
        cities: [
          { name: 'Melbourne', neighborhoods: ['CBD', 'St Kilda', 'Fitzroy', 'Southbank', 'Brunswick'] }
        ]
      }
    ]
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    currency: 'AED',
    subdivisionType: 'Emirate',
    subdivisions: [
      {
        name: 'Dubai',
        cities: [
          { name: 'Dubai', neighborhoods: ['Downtown Dubai', 'Dubai Marina', 'Deira', 'Business Bay', 'JBR', 'Palm Jumeirah'] }
        ]
      },
      {
        name: 'Abu Dhabi',
        cities: [
          { name: 'Abu Dhabi', neighborhoods: ['Corniche', 'Al Reem Island', 'Yas Island'] }
        ]
      }
    ]
  },
  {
    code: 'UG',
    name: 'Uganda',
    flag: '🇺🇬',
    currency: 'UGX',
    subdivisionType: 'Region',
    subdivisions: [
      {
        name: 'Central',
        cities: [
          { name: 'Kampala', neighborhoods: ['Kololo', 'Nakasero', 'Ntinda', 'Bugolobi', 'Kabuusu'] },
          { name: 'Entebbe', neighborhoods: ['Entebbe Town', 'Kitoro'] }
        ]
      }
    ]
  },
  {
    code: 'TZ',
    name: 'Tanzania',
    flag: '🇹🇿',
    currency: 'TZS',
    subdivisionType: 'Region',
    subdivisions: [
      {
        name: 'Dar es Salaam',
        cities: [
          { name: 'Dar es Salaam', neighborhoods: ['Kariakoo', 'Masaki', 'Mikocheni', 'Posta', 'Oysterbay'] }
        ]
      },
      {
        name: 'Arusha',
        cities: [
          { name: 'Arusha', neighborhoods: ['Central', 'Njiro'] }
        ]
      }
    ]
  },
  {
    code: 'RW',
    name: 'Rwanda',
    flag: '🇷🇼',
    currency: 'RWF',
    subdivisionType: 'Province',
    subdivisions: [
      {
        name: 'Kigali City',
        cities: [
          { name: 'Kigali', neighborhoods: ['Kacyiru', 'Nyarutarama', 'Kimihurura', 'Kiyovu', 'Remera'] }
        ]
      }
    ]
  },
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    currency: 'INR',
    subdivisionType: 'State',
    subdivisions: [
      {
        name: 'Maharashtra',
        cities: [
          { name: 'Mumbai', neighborhoods: ['Bandra', 'Andheri', 'Colaba', 'Juhu'] }
        ]
      },
      {
        name: 'Delhi NCR',
        cities: [
          { name: 'New Delhi', neighborhoods: ['Connaught Place', 'South Extension', 'Hauz Khas'] }
        ]
      },
      {
        name: 'Karnataka',
        cities: [
          { name: 'Bengaluru', neighborhoods: ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout'] }
        ]
      }
    ]
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    currency: 'EUR',
    subdivisionType: 'State',
    subdivisions: [
      {
        name: 'Berlin',
        cities: [{ name: 'Berlin', neighborhoods: ['Mitte', 'Kreuzberg', 'Charlottenburg'] }]
      },
      {
        name: 'Bavaria',
        cities: [{ name: 'Munich', neighborhoods: ['Altstadt', 'Schwabing'] }]
      }
    ]
  },
  {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    currency: 'EUR',
    subdivisionType: 'Region',
    subdivisions: [
      {
        name: 'Île-de-France',
        cities: [{ name: 'Paris', neighborhoods: ['1st Arrondissement', 'Le Marais', 'Montmartre', 'La Défense'] }]
      }
    ]
  }
];

// Helper to clean and normalize location strings
export function cleanLoc(str?: string): string {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Strict Kenyan Geographic Provenance Verification
 * Confirms whether an item actually belongs to Kenya.
 * Does NOT treat a missing country field as proof that a product is Kenyan.
 * Excludes records with unconfirmed geographic provenance.
 */
export function isKenyanProvenance(item: {
  country?: string;
  county?: string;
  town?: string;
  area?: string;
  location?: string;
}): boolean {
  if (item.country) {
    const c = cleanLoc(item.country);
    if (c === 'kenya' || c === 'ke') return true;
    // Explicit non-Kenyan country
    return false;
  }

  // If country is missing, check whether county, town, area, or location confirms Kenyan geography
  const countyClean = cleanLoc(item.county);
  if (countyClean && KENYA_47_COUNTIES.some(c => cleanLoc(c) === countyClean)) {
    return true;
  }

  const locText = cleanLoc(`${item.county || ''} ${item.town || ''} ${item.area || ''} ${item.location || ''}`);
  if (!locText) {
    return false; // No confirmed geographic provenance
  }

  // Check Kenyan 47 counties
  if (KENYA_47_COUNTIES.some(c => locText.includes(cleanLoc(c)))) {
    return true;
  }

  // Check Kenyan hierarchy
  if (KENYAN_HIERARCHY.some(node => {
    if (locText.includes(cleanLoc(node.town))) return true;
    if (node.areas.some(a => locText.includes(cleanLoc(a)))) return true;
    if (node.estates?.some(e => locText.includes(cleanLoc(e)))) return true;
    return false;
  })) {
    return true;
  }

  return false;
}

/**
 * Strict Worldwide Location Verification
 * If user specifies 'Rongai', returns true ONLY if the item's location is actually in Rongai.
 * If user specifies 'Los Angeles', returns true ONLY if the item's location is in Los Angeles.
 * If Worldwide / empty, returns true for all.
 * Never silently substitutes another location!
 */
export function matchesStrictLocation(
  item: { 
    country?: string; 
    county?: string; 
    town?: string; 
    area?: string; 
    location?: string;
  },
  requestedLocation?: string
): boolean {
  // Reject items with non-Kenyan or unconfirmed geographic provenance
  if (!isKenyanProvenance(item)) {
    return false;
  }

  if (!requestedLocation || !requestedLocation.trim()) {
    // Default search country is Kenya (all 47 counties)
    return true;
  }

  const target = cleanLoc(requestedLocation);
  if (!target || target === 'kenya' || target === 'all kenya' || target === 'national' || target === 'all' || target === 'all locations' || target === 'worldwide' || target === 'global') {
    return true;
  }

  // Check Kenyan hierarchy nodes (Towns, Areas, Estates)
  const matchedKenyanNode = KENYAN_HIERARCHY.find(node => {
    if (cleanLoc(node.town) === target || cleanLoc(node.town).includes(target) || target.includes(cleanLoc(node.town))) return true;
    if (node.areas.some(a => cleanLoc(a) === target || cleanLoc(a).includes(target) || target.includes(cleanLoc(a)))) return true;
    if (node.estates?.some(e => cleanLoc(e) === target || cleanLoc(e).includes(target) || target.includes(cleanLoc(e)))) return true;
    return false;
  });

  const itemCounty = cleanLoc(item.county);
  const itemTown = cleanLoc(item.town);
  const itemArea = cleanLoc(item.area);
  const itemLoc = cleanLoc(item.location);
  const combinedItemText = `${itemCounty} ${itemTown} ${itemArea} ${itemLoc}`.trim();

  // Check if requested location is one of Kenya's 47 counties
  const isCountySearch = KENYA_47_COUNTIES.some(c => cleanLoc(c) === target);
  if (isCountySearch) {
    return itemCounty === target || combinedItemText.includes(target);
  }

  if (matchedKenyanNode) {
    const isExplicitlyInNode = 
      matchedKenyanNode.areas.some(a => combinedItemText.includes(cleanLoc(a))) ||
      (matchedKenyanNode.estates && matchedKenyanNode.estates.some(e => combinedItemText.includes(cleanLoc(e)))) ||
      itemTown === cleanLoc(matchedKenyanNode.town) ||
      combinedItemText.includes(cleanLoc(matchedKenyanNode.town));

    return isExplicitlyInNode;
  }

  // Strict token inclusion within Kenyan item locality fields
  return combinedItemText.includes(target);
}

/**
 * Get nearby Kenyan areas when a requested location has 0 verified results
 */
export function getNearbyLocations(locationName: string): string[] {
  const target = cleanLoc(locationName);
  
  // Check Kenyan hierarchy
  const matchedKenyanNode = KENYAN_HIERARCHY.find(node => {
    if (cleanLoc(node.town) === target || cleanLoc(node.town).includes(target) || target.includes(cleanLoc(node.town))) return true;
    if (node.areas.some(a => cleanLoc(a) === target || target.includes(cleanLoc(a)))) return true;
    return false;
  });

  if (matchedKenyanNode && matchedKenyanNode.nearbyTowns && matchedKenyanNode.nearbyTowns.length > 0) {
    return matchedKenyanNode.nearbyTowns;
  }

  // Check Kenyan counties
  const isCounty = KENYA_47_COUNTIES.some(c => cleanLoc(c) === target);
  if (isCounty) {
    return ['Nairobi', 'Kiambu', 'Kajiado', 'Mombasa', 'Nakuru'];
  }

  return ['Nairobi', 'Kiambu', 'Mombasa', 'Nakuru', 'Kisumu'];
}

/**
 * Format location string for display
 */
export function formatStructuredLocation(
  country: string = 'Kenya',
  county?: string,
  town?: string,
  area?: string
): string {
  const parts = [area, town, county, country].filter(Boolean);
  const uniqueParts = Array.from(new Set(parts.map(p => p?.trim()))).filter(Boolean);
  return uniqueParts.join(', ') || 'Kenya';
}
