import { Product, SearchQueryAnalysis, VendorPrice } from '../types';

// Comprehensive Kenyan locations dictionary
export const KENYAN_LOCATIONS: { [key: string]: { county: string; town?: string } } = {
  'rongai': { county: 'Kajiado', town: 'Ongata Rongai' },
  'ongata rongai': { county: 'Kajiado', town: 'Ongata Rongai' },
  'nairobi': { county: 'Nairobi', town: 'Nairobi' },
  'mombasa': { county: 'Mombasa', town: 'Mombasa' },
  'kisumu': { county: 'Kisumu', town: 'Kisumu' },
  'nakuru': { county: 'Nakuru', town: 'Nakuru' },
  'eldoret': { county: 'Uasin Gishu', town: 'Eldoret' },
  'thika': { county: 'Kiambu', town: 'Thika' },
  'kiambu': { county: 'Kiambu', town: 'Kiambu' },
  'ruaka': { county: 'Kiambu', town: 'Ruaka' },
  'ruiru': { county: 'Kiambu', town: 'Ruiru' },
  'machakos': { county: 'Machakos', town: 'Machakos' },
  'naivasha': { county: 'Nakuru', town: 'Naivasha' },
  'ngong': { county: 'Kajiado', town: 'Ngong' },
  'kitengela': { county: 'Kajiado', town: 'Kitengela' },
  'syokimau': { county: 'Machakos', town: 'Syokimau' },
  'eastleigh': { county: 'Nairobi', town: 'Eastleigh' },
  'westlands': { county: 'Nairobi', town: 'Westlands' },
  'karen': { county: 'Nairobi', town: 'Karen' },
  'kasarani': { county: 'Nairobi', town: 'Kasarani' },
  'roysambu': { county: 'Nairobi', town: 'Roysambu' },
  'kilimani': { county: 'Nairobi', town: 'Kilimani' },
  'south b': { county: 'Nairobi', town: 'South B' },
  'south c': { county: 'Nairobi', town: 'South C' },
  'pipeline': { county: 'Nairobi', town: 'Pipeline' },
  'donholm': { county: 'Nairobi', town: 'Donholm' },
  'kayole': { county: 'Nairobi', town: 'Kayole' },
  'githurai': { county: 'Nairobi', town: 'Githurai' },
  'kahawa': { county: 'Nairobi', town: 'Kahawa' },
  'kahawa west': { county: 'Nairobi', town: 'Kahawa West' },
  'umoja': { county: 'Nairobi', town: 'Umoja' },
  'buruburu': { county: 'Nairobi', town: 'Buruburu' },
  'nyali': { county: 'Mombasa', town: 'Nyali' },
  'bamburi': { county: 'Mombasa', town: 'Bamburi' },
  'mtwapa': { county: 'Kilifi', town: 'Mtwapa' },
  'diani': { county: 'Kwale', town: 'Diani' },
  'kondele': { county: 'Kisumu', town: 'Kondele' }
};

// Kenyan and English Natural Language query inquiry prefixes
const QUERY_PREFIXES = [
  /^how\s+much\s+is\s+(the\s+|a\s+|an\s+)?/i,
  /^how\s+much\s+does\s+(a\s+|an\s+)?/i,
  /^what\s+is\s+the\s+price\s+of\s+(a\s+|an\s+)?/i,
  /^what\s+is\s+the\s+cost\s+of\s+(a\s+|an\s+)?/i,
  /^what\s+does\s+(a\s+|an\s+)?/i,
  /^price\s+of\s+(a\s+|an\s+)?/i,
  /^cost\s+of\s+(a\s+|an\s+)?/i,
  /^bei\s+ya\s+/i,
  /^bei\s+gani\s+(ya\s+)?/i,
  /^ni\s+bei\s+gani\s+(ya\s+)?/i,
  /^ni\s+how\s+much\s+(is\s+)?/i,
  /^pesa\s+ngapi\s+(ya\s+)?/i,
  /^tell\s+me\s+price\s+of\s+/i,
  /^check\s+bei\s+ya\s+/i,
  /^rate\s+of\s+/i
];

const QUERY_SUFFIXES = [
  /\s+price$/i,
  /\s+cost$/i,
  /\s+bei$/i,
  /\s+bei\s+gani\??$/i,
  /\s+ni\s+how\s+much\??$/i,
  /\s+ni\s+pesa\s+ngapi\??$/i,
  /\s+refill$/i,
  /\s+refill\s+price$/i
];

// Clean search term
export function cleanQuery(query: string): string {
  if (!query) return '';
  return query
    .toLowerCase()
    .replace(/[?!,.:;()"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Canonical everyday Kenyan concepts, synonyms, categories, and subcategories
export interface ConceptMapping {
  canonicalName: string;
  category: string;
  subcategory: string;
  swahiliName: string;
  unit: string;
  aliases: string[];
  discriminators?: string[]; // words that MUST NOT trigger collision with unrelated products
}

export const CANONICAL_CONCEPTS: ConceptMapping[] = [
  // CLOTHING & FASHION
  {
    canonicalName: 'Underwear / Innerwear (Boxers & Briefs)',
    category: 'clothing',
    subcategory: 'Underwear & Innerwear',
    swahiliName: 'Suruali ya Ndani / Boxers',
    unit: 'piece / 3-pack',
    aliases: ['underwear', 'under wear', 'innerwear', 'inner wear', 'boxers', 'boxer', 'panties', 'panty', 'briefs', 'kamisi', 'shupavu', 'suruali ya ndani', 'nguo za ndani']
  },
  {
    canonicalName: 'Handkerchiefs (Cotton Pocket Hankies)',
    category: 'clothing',
    subcategory: 'Accessories',
    swahiliName: 'Kitambaa cha Mfukoni / Leso',
    unit: '6-pack / piece',
    aliases: ['handkerchief', 'handkerchiefs', 'hanky', 'hankies', 'kitambaa cha mfukoni', 'kitambaa', 'leso ya mfuko']
  },
  {
    canonicalName: 'Cotton Socks',
    category: 'clothing',
    subcategory: 'Hosiery & Socks',
    swahiliName: 'Soksi za Pamba',
    unit: '3-pair pack',
    aliases: ['socks', 'sock', 'soksi', 'stockings', 'ankle socks', 'sports socks']
  },
  {
    canonicalName: 'Shoe Laces & Care',
    category: 'footwear',
    subcategory: 'Shoe Accessories',
    swahiliName: 'Kamba za Viatu & Kiwi',
    unit: 'pair',
    aliases: ['laces', 'shoe laces', 'shoelaces', 'kamba za viatu', 'kiwi', 'shoe polish', 'insoles']
  },
  {
    canonicalName: 'Eyewear & Glasses',
    category: 'clothing',
    subcategory: 'Eyewear & Glasses',
    swahiliName: 'Miwani ya Macho',
    unit: 'piece',
    aliases: ['glasses', 'spectacles', 'sunglasses', 'reading glasses', 'miwani', 'eyewear', 'sun glasses']
  },
  // HOUSEHOLD & CLEANING
  {
    canonicalName: 'Cooking Gas (LPG Cylinders & Refills)',
    category: 'household',
    subcategory: 'Cooking Gas & LPG',
    swahiliName: 'Mtungi wa Gas / Gas Refill',
    unit: '6kg / 13kg refill',
    aliases: ['gas', 'lpg', 'cooking gas', 'gas refill', 'gas cylinder', 'mtungi wa gas', 'k-gas', 'total gas', 'rubis gas', 'afrigas', '6kg gas', '13kg gas']
  },
  {
    canonicalName: 'Air Humidifier & Diffuser',
    category: 'household',
    subcategory: 'Appliances & Air Quality',
    swahiliName: 'Mashine ya Humidifier',
    unit: 'piece',
    aliases: ['humidifier', 'humidifiers', 'air humidifier', 'diffuser', 'aroma diffuser', 'room humidifier', 'air purifier']
  },
  {
    canonicalName: 'Bedsheets & Pillowcases',
    category: 'household',
    subcategory: 'Bedding & Linens',
    swahiliName: 'Mashuka ya Kitanda',
    unit: '4-piece set',
    aliases: ['bedsheets', 'bed sheets', 'bedsheet', 'mashuka', 'shuka', 'pillowcases', 'blanket', 'duvet', 'blankets']
  },
  {
    canonicalName: 'Bathing & Laundry Bar Soap',
    category: 'household',
    subcategory: 'Soaps & Detergents',
    swahiliName: 'Sabuni ya Kuoga & Kufua',
    unit: 'bar / 800g',
    aliases: ['soap', 'sabuni', 'bathing soap', 'bar soap', 'menengai', 'geisha', 'dettol', 'omo', 'aerial', 'detergent', 'sabuni ya kipande']
  },
  {
    canonicalName: 'Toothpaste & Oral Care',
    category: 'household',
    subcategory: 'Personal & Oral Care',
    swahiliName: 'Dawa ya Meno',
    unit: '140g tube',
    aliases: ['toothpaste', 'tooth paste', 'dawa ya meno', 'colgate', 'sensodyne', 'toothbrush', 'brush ya meno']
  },
  // FURNITURE
  {
    canonicalName: 'Shoe Rack / Stand',
    category: 'furniture',
    subcategory: 'Storage & Organizers',
    swahiliName: 'Rack ya Viatu',
    unit: 'piece',
    aliases: ['shoe rack', 'shoerack', 'rack ya viatu', 'shoe stand', 'kabati ya viatu', 'shelf ya viatu'],
    discriminators: ['rack', 'stand', 'shelf', 'storage', 'cabinet']
  },
  {
    canonicalName: 'High Density Foam Mattress',
    category: 'furniture',
    subcategory: 'Mattresses & Beds',
    swahiliName: 'Godoro la Kulala',
    unit: '6x6 / 5x6 piece',
    aliases: ['mattress', 'godoro', 'bobmil', 'superfoam', 'mouka', 'foam mattress', 'bed mattress', 'godoro 6x6', 'godoro 5x6']
  },
  // FITNESS & SPORTS
  {
    canonicalName: 'Workout Equipment & Gym Stuff',
    category: 'fitness',
    subcategory: 'Gym & Fitness Equipment',
    swahiliName: 'Vifaa vya Gym & Mazoezi',
    unit: 'set / pair',
    aliases: ['workout equipment', 'gym stuff', 'gym equipment', 'fitness equipment', 'vifaa vya gym', 'vifaa vya mazoezi']
  },
  {
    canonicalName: 'Dumbbells & Weights',
    category: 'fitness',
    subcategory: 'Gym & Fitness Equipment',
    swahiliName: 'Dumbbells za Mazoezi',
    unit: 'pair / per kg',
    aliases: ['dumbbells', 'dumbbell', 'weights', 'hex dumbbells', 'hand weights', 'kettlebell']
  },
  {
    canonicalName: 'Resistance Bands & Loop Sets',
    category: 'fitness',
    subcategory: 'Gym & Fitness Equipment',
    swahiliName: 'Resistance Bands',
    unit: '5-pack set',
    aliases: ['resistance bands', 'resistance band', 'exercise bands', 'workout bands', 'loop bands', 'pull up bands']
  },
  // ELECTRONICS
  {
    canonicalName: 'Phone Charger & USB Cables',
    category: 'electronics',
    subcategory: 'Mobile Accessories',
    swahiliName: 'Chaja ya Simu',
    unit: 'piece',
    aliases: ['phone charger', 'charger', 'usb cable', 'type c cable', 'lightning cable', 'fast charger', 'chaja', 'chaja ya simu', 'power bank']
  },
  // GROCERIES & COMMODITIES
  {
    canonicalName: 'Fresh Sweet Watermelon',
    category: 'groceries',
    subcategory: 'Fruits & Vegetables',
    swahiliName: 'Tikitimaji / Tikiti Maji',
    unit: 'kg / piece',
    aliases: ['watermelon', 'water melon', 'tikiti', 'tikitimaji', 'tikiti maji'],
    discriminators: ['melon', 'tikiti', 'watermelon'] // MUST NOT collide with bottled water
  },
  {
    canonicalName: 'White Cane Sugar',
    category: 'groceries',
    subcategory: 'Pantry & Essentials',
    swahiliName: 'Sukari Nyeupe',
    unit: '1 kg / 2 kg',
    aliases: ['sugar', 'sukari', 'white sugar', 'kabras', 'mumias', 'sukari ya chai', 'sukari 1kg', 'sukari 2kg']
  },
  {
    canonicalName: 'Fresh Beef (Steak / Bone)',
    category: 'groceries',
    subcategory: 'Meat & Butchery',
    swahiliName: 'Nyama ya Ng\'ombe',
    unit: '1 kg',
    aliases: ['meat', 'nyama', 'beef', "nyama ya ng'ombe", 'nyama ya ngombe', 'steak', 'nyama choma']
  },
  {
    canonicalName: 'Whole Dressed Chicken',
    category: 'groceries',
    subcategory: 'Poultry',
    swahiliName: 'Kuku Mzima (Broiler / Kienyeji)',
    unit: 'bird / kg',
    aliases: ['chicken', 'kuku', 'broiler', 'kienyeji', 'kuku kienyeji', 'kuku mzima', 'poultry']
  },
  // BUILDING & HARDWARE
  {
    canonicalName: 'Portland Cement (50kg Bag)',
    category: 'hardware',
    subcategory: 'Building Materials',
    swahiliName: 'Simiti (Mfuko wa 50kg)',
    unit: '50kg bag',
    aliases: ['cement', 'simiti', 'bamburi', 'tembo cement', 'blue triangle', 'simiti 50kg', 'mfuko wa simiti']
  },
  // SERVICES
  {
    canonicalName: 'Barber & Kinyozi Haircut',
    category: 'services',
    subcategory: 'Grooming & Hair',
    swahiliName: 'Kinyozi / Kunyoa Nywele',
    unit: 'cut / session',
    aliases: ['barber', 'kinyozi', 'haircut', 'kunyoa', 'shave', 'salon', 'kinyozi haircut']
  },
  {
    canonicalName: 'Plumber & Pipe Repair (Fundi wa Maji)',
    category: 'services',
    subcategory: 'Plumbing & Repairs',
    swahiliName: 'Fundi wa Maji & Mabomba',
    unit: 'call-out / job',
    aliases: ['plumber', 'fundi wa maji', 'fundi bomba', 'plumbing', 'bomba', 'water pipe repair']
  },
  {
    canonicalName: 'Electrician & Wiring (Fundi wa Stima)',
    category: 'services',
    subcategory: 'Electrical & Wiring',
    swahiliName: 'Fundi wa Stima & Umeme',
    unit: 'call-out / point',
    aliases: ['electrician', 'fundi wa stima', 'fundi stima', 'wiring', 'electrical repair', 'fundi umeme', 'stima']
  },
  {
    canonicalName: 'Car Wash & Detailing',
    category: 'services',
    subcategory: 'Automotive Services',
    swahiliName: 'Kuosha Gari',
    unit: 'vehicle / wash',
    aliases: ['car wash', 'kuosha gari', 'carwash', 'auto wash', 'cleaning car']
  }
];

// Brand dictionary for Kenya
const KNOWN_BRANDS = [
  'samsung', 'apple', 'iphone', 'tecno', 'infinix', 'xiaomi', 'oppo', 'nokia', 'sony', 'lg',
  'hp', 'dell', 'lenovo', 'asus', 'acer', 'macbook', 'jbl', 'ramtons', 'mika', 'bruhm', 'hisense',
  'bamburi', 'savannah', 'mombasa cement', 'blue triangle', 'dumuzas', 'totalenergies', 'total',
  'rubis', 'k-gas', 'afrigas', 'hashi', 'bobmil', 'superfoam', 'vitafoam', 'geisha', 'dettol',
  'colgate', 'sensodyne', 'close up', 'nike', 'adidas', 'puma', 'bata', 'kiwi', 'menengai', 'bidco'
];

// Size & Quantity patterns
const SIZE_REGEX = /\b(\d+(?:\.\d+)?\s*(?:kg|g|litre|litres|l|ml|gb|mb|tb|inch|inches|cm|mm|m|ft|piece|pieces|pair|pairs|pack|set|tier|seater|seater|x\d+))\b/i;

// Parse search input to separate query intent, location, brand, and size
export function analyzeSearchQuery(rawQuery: string): SearchQueryAnalysis {
  let cleaned = cleanQuery(rawQuery);

  // 1. Strip natural language inquiry prefixes
  for (const prefix of QUERY_PREFIXES) {
    if (prefix.test(cleaned)) {
      cleaned = cleaned.replace(prefix, '').trim();
      break;
    }
  }

  // 2. Strip inquiry suffixes
  for (const suffix of QUERY_SUFFIXES) {
    if (suffix.test(cleaned)) {
      cleaned = cleaned.replace(suffix, '').trim();
      break;
    }
  }

  // 3. Extract location mentions
  let detectedLocation: string | undefined;
  const sortedLocations = Object.keys(KENYAN_LOCATIONS).sort((a, b) => b.length - a.length);

  for (const locKey of sortedLocations) {
    const regex = new RegExp(`\\b${locKey}\\b`, 'i');
    if (regex.test(cleaned)) {
      detectedLocation = KENYAN_LOCATIONS[locKey].town || KENYAN_LOCATIONS[locKey].county;
      cleaned = cleaned.replace(regex, '').replace(/\s+/g, ' ').trim();
      break;
    }
  }

  // 4. Extract Brand if present
  let detectedBrand: string | undefined;
  for (const brand of KNOWN_BRANDS) {
    const brandRegex = new RegExp(`\\b${brand}\\b`, 'i');
    if (brandRegex.test(cleaned)) {
      detectedBrand = brand.charAt(0).toUpperCase() + brand.slice(1);
      break;
    }
  }

  // 5. Extract Size / Quantity if present
  let detectedSize: string | undefined;
  const sizeMatch = cleaned.match(SIZE_REGEX);
  if (sizeMatch) {
    detectedSize = sizeMatch[0];
  }

  // 6. Match Canonical everyday concepts
  let canonicalName: string | undefined;
  let detectedCategory: string | undefined;
  let detectedSubcategory: string | undefined;

  for (const concept of CANONICAL_CONCEPTS) {
    for (const alias of concept.aliases) {
      const aliasClean = cleanQuery(alias);
      if (cleaned === aliasClean || cleaned.startsWith(aliasClean + ' ') || cleaned.endsWith(' ' + aliasClean) || cleaned.includes(' ' + aliasClean + ' ')) {
        canonicalName = concept.canonicalName;
        detectedCategory = concept.category;
        detectedSubcategory = concept.subcategory;
        break;
      }
    }
    if (canonicalName) break;
  }

  return {
    rawQuery,
    itemQuery: cleaned,
    canonicalName,
    detectedCategory,
    detectedSubcategory,
    detectedBrand,
    detectedSize,
    detectedLocation
  };
}

// Custom stem/alias normalizer for Kenyan English & Swahili
export function getCanonicalVariants(text: string): string[] {
  const norm = cleanQuery(text);
  const variants = new Set<string>([norm]);

  // Handle compound words
  if (norm.includes('water melon')) variants.add(norm.replace('water melon', 'watermelon'));
  if (norm.includes('watermelon')) variants.add(norm.replace('watermelon', 'water melon'));
  if (norm.includes('shoe rack')) variants.add(norm.replace('shoe rack', 'shoerack'));
  if (norm.includes('shoerack')) variants.add(norm.replace('shoerack', 'shoe rack'));
  if (norm.includes('boda boda')) variants.add(norm.replace('boda boda', 'bodaboda'));
  if (norm.includes('bodaboda')) variants.add(norm.replace('bodaboda', 'boda boda'));

  // Swahili apostrophes
  if (norm.includes("ng'ombe")) variants.add(norm.replace("ng'ombe", 'ngombe'));
  if (norm.includes('ngombe')) variants.add(norm.replace('ngombe', "ng'ombe"));

  // Match concept aliases
  for (const concept of CANONICAL_CONCEPTS) {
    if (concept.aliases.some(a => norm === a || norm.includes(a) || a.includes(norm))) {
      concept.aliases.forEach(a => variants.add(a));
    }
  }

  // Plurals
  if (norm.endsWith('s') && norm.length > 3) variants.add(norm.slice(0, -1));
  if (!norm.endsWith('s') && norm.length >= 3) variants.add(norm + 's');

  return Array.from(variants);
}

// Calculate match score between query and product
export function calculateMatchScore(query: string, product: Product): number {
  if (!query) return 100;

  const cleanQ = cleanQuery(query);
  const queryVariants = getCanonicalVariants(cleanQ);

  const prodName = cleanQuery(product.name);
  const swaName = cleanQuery(product.swahiliName || '');
  const aliases = (product.aliases || []).map(cleanQuery);
  const category = cleanQuery(product.category);
  const subcategory = cleanQuery(product.subcategory || '');
  const brand = cleanQuery(product.brand || '');

  // CRITICAL ANTI-COLLISION GUARDS:
  // 1. Watermelon must NEVER match bottled water / water tank / drinking water
  const isWatermelonQuery = cleanQ.includes('watermelon') || cleanQ.includes('water melon') || cleanQ.includes('tikiti');
  const isBottledWaterProduct = prodName.includes('bottled water') || prodName.includes('mineral water') || prodName.includes('water tank');
  if (isWatermelonQuery && isBottledWaterProduct) {
    return 0; // Absolute block
  }
  const isWaterQuery = (cleanQ === 'water' || cleanQ === 'bottled water' || cleanQ === 'mineral water');
  const isWatermelonProduct = prodName.includes('watermelon') || swaName.includes('tikiti');
  if (isWaterQuery && isWatermelonProduct) {
    return 0; // Absolute block
  }

  // 2. Shoe rack vs plain shoes:
  const isShoeRackQuery = cleanQ.includes('shoe rack') || cleanQ.includes('shoerack') || cleanQ.includes('rack ya viatu');
  const isPlainShoesProduct = (prodName.includes('shoes') || prodName.includes('sneakers')) && !prodName.includes('rack');
  if (isShoeRackQuery && isPlainShoesProduct) {
    return 0;
  }

  // Exact Match Check (Highest Priority)
  for (const qv of queryVariants) {
    if (prodName === qv || swaName === qv || aliases.includes(qv)) {
      return 100;
    }
  }

  // Substring Match in Name or Swahili Name with token boundary
  for (const qv of queryVariants) {
    if (qv.length >= 3) {
      const boundaryRegex = new RegExp(`(^|\\s)${qv}($|\\s)`);
      if (boundaryRegex.test(prodName) || boundaryRegex.test(swaName)) {
        return 90;
      }
    }
  }

  // Token-level accuracy guard
  const queryTokens = cleanQ.split(/\s+/).filter(t => t.length > 1);
  const allSearchableWords = [
    ...prodName.split(/\s+/),
    ...swaName.split(/\s+/),
    ...aliases.flatMap(a => a.split(/\s+/)),
    ...category.split(/\s+/),
    ...subcategory.split(/\s+/),
    ...brand.split(/\s+/)
  ].filter(Boolean);

  let tokensMatched = 0;
  for (const token of queryTokens) {
    if (allSearchableWords.some(w => w === token || (w.startsWith(token) && Math.abs(w.length - token.length) <= 2))) {
      tokensMatched++;
    }
  }

  if (tokensMatched === queryTokens.length && queryTokens.length > 0) {
    return 80;
  }

  if (tokensMatched > 0 && queryTokens.length > 1 && tokensMatched >= Math.ceil(queryTokens.length * 0.6)) {
    return 65;
  }

  return 0;
}

// Main Search Function
export function searchProducts(
  products: Product[],
  rawQuery: string,
  selectedCategory?: string,
  selectedCounty?: string
): Product[] {
  const analysis = analyzeSearchQuery(rawQuery);
  const targetItem = analysis.itemQuery;
  const targetLocation = selectedCounty || analysis.detectedLocation;

  let candidates = products;

  // 1. Filter by category if selected
  if (selectedCategory && selectedCategory !== 'all') {
    candidates = candidates.filter(p => {
      const pCat = p.category.toLowerCase().replace(/[^a-z]/g, '');
      const sCat = selectedCategory.toLowerCase().replace(/[^a-z]/g, '');
      return pCat === sCat || pCat.includes(sCat) || sCat.includes(pCat);
    });
  }

  // If query is completely empty, return items sorted by confirms & reports
  if (!targetItem) {
    if (targetLocation) {
      return candidates.filter(p => 
        p.county.toLowerCase().includes(targetLocation.toLowerCase()) ||
        (p.town && p.town.toLowerCase().includes(targetLocation.toLowerCase())) ||
        (p.area && p.area.toLowerCase().includes(targetLocation.toLowerCase()))
      );
    }
    return candidates;
  }

  // 2. Score candidates strictly
  const scored = candidates
    .map(product => {
      const matchScore = calculateMatchScore(targetItem, product);
      let locationBoost = 0;

      if (targetLocation) {
        const matchesLocation =
          product.county.toLowerCase().includes(targetLocation.toLowerCase()) ||
          (product.town && product.town.toLowerCase().includes(targetLocation.toLowerCase())) ||
          (product.area && product.area.toLowerCase().includes(targetLocation.toLowerCase()));
        
        if (matchesLocation) {
          locationBoost = 10;
        }
      }

      const totalScore = matchScore > 0 ? matchScore + locationBoost : 0;
      return { product, totalScore };
    })
    .filter(item => item.totalScore >= 60)
    .sort((a, b) => b.totalScore - a.totalScore);

  return scored.map(item => item.product);
}

// Real-time live dynamic search query to server backend
export async function searchRealtimePrice(
  rawQuery: string,
  county?: string,
  category?: string
): Promise<{ product: Product | null; verified: boolean; message?: string; sources?: string[] }> {
  try {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: rawQuery, county, category }),
    });

    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.warn('Realtime search call failed:', err);
    return {
      verified: false,
      product: null,
      message: "We couldn't connect to live search sources right now."
    };
  }
}
