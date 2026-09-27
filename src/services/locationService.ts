// Structured Kenyan Location Hierarchy & Strict Matching Service

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
    county: 'Nairobi',
    town: 'Westlands',
    areas: ['Westlands', 'Sarit', 'Parklands', 'Mpaka Road', 'Waiyaki Way', 'Rhapta Road', 'Muthithi Road', 'Highridge'],
    estates: ['Parklands Estate', 'Rhapta Road Area', 'Spring Valley'],
    nearbyTowns: ['Kilimani', 'Kileleshwa', 'Nairobi CBD', 'Parklands']
  },
  {
    county: 'Nairobi',
    town: 'Kilimani',
    areas: ['Kilimani', 'Yaya Center', 'Argwings Kodhek', 'Dennis Pritt', 'Woodley', 'Hurlingham'],
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
  }
];

// Helper to normalize location strings
function cleanLoc(str?: string): string {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Strict Location Verification
 * If user specifies 'Rongai', returns true ONLY if the item's location is actually in Rongai.
 * Does NOT accept Westlands, Kilimani, Nairobi CBD etc.
 */
export function matchesStrictLocation(
  item: { county?: string; town?: string; area?: string; location?: string },
  requestedLocation: string
): boolean {
  if (!requestedLocation || !requestedLocation.trim()) return true;

  const target = cleanLoc(requestedLocation);
  if (!target) return true;

  // Check if target is a generic country-level query
  if (target === 'kenya' || target === 'all kenya' || target === 'national') return true;

  // Find corresponding node in hierarchy if any
  const matchedNode = KENYAN_HIERARCHY.find(node => {
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

  // If we matched a specific town/node (e.g. Ongata Rongai)
  if (matchedNode) {
    // Check if the item belongs to any area/estate of this node
    const isExplicitlyInNode = 
      matchedNode.areas.some(a => combinedItemText.includes(cleanLoc(a))) ||
      (matchedNode.estates && matchedNode.estates.some(e => combinedItemText.includes(cleanLoc(e)))) ||
      itemTown === cleanLoc(matchedNode.town) ||
      combinedItemText.includes(cleanLoc(matchedNode.town));

    if (isExplicitlyInNode) return true;

    // Strict negative check: If target is Rongai, reject Nairobi CBD, Westlands, Kilimani etc.
    return false;
  }

  // Fallback to strict token matching if it's a specific county or town not in main hierarchy
  if (combinedItemText.includes(target)) {
    return true;
  }

  return false;
}

/**
 * Get nearby areas when a requested location has 0 verified results
 */
export function getNearbyLocations(locationName: string): string[] {
  const target = cleanLoc(locationName);
  const matchedNode = KENYAN_HIERARCHY.find(node => {
    if (cleanLoc(node.town) === target || cleanLoc(node.town).includes(target) || target.includes(cleanLoc(node.town))) return true;
    if (node.areas.some(a => cleanLoc(a) === target || target.includes(cleanLoc(a)))) return true;
    return false;
  });

  if (matchedNode && matchedNode.nearbyTowns && matchedNode.nearbyTowns.length > 0) {
    return matchedNode.nearbyTowns;
  }

  // Default Kenyan hubs
  return ['Nairobi', 'Kiambu', 'Kajiado', 'Machakos', 'Mombasa', 'Nakuru', 'Kisumu'];
}

/**
 * Format location string for display
 */
export function formatStructuredLocation(county?: string, town?: string, area?: string): string {
  const parts = [area, town, county].filter(Boolean);
  const uniqueParts = Array.from(new Set(parts.map(p => p?.trim()))).filter(Boolean);
  return uniqueParts.join(', ') || 'Kenya';
}
