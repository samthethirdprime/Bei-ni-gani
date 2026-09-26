import { Product, SearchQueryAnalysis } from '../types';

// Common Kenyan locations (counties, towns, estates)
const KENYAN_LOCATIONS: { [key: string]: { county: string; town?: string } } = {
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

// Kenyan natural language search phrases to strip
const QUERY_PREFIXES = [
  /^how\s+much\s+is\s+(the\s+)?/i,
  /^how\s+much\s+does\s+(a\s+|an\s+)?/i,
  /^what\s+is\s+the\s+price\s+of\s+(a\s+|an\s+)?/i,
  /^what\s+is\s+the\s+cost\s+of\s+(a\s+|an\s+)?/i,
  /^price\s+of\s+(a\s+|an\s+)?/i,
  /^cost\s+of\s+(a\s+|an\s+)?/i,
  /^bei\s+ya\s+/i,
  /^bei\s+gani\s+(ya\s+)?/i,
  /^ni\s+bei\s+gani\s+(ya\s+)?/i,
  /^ni\s+how\s+much\s+(is\s+)?/i,
  /^pesa\s+ngapi\s+(ya\s+)?/i,
  /^tell\s+me\s+price\s+of\s+/i,
  /^check\s+bei\s+ya\s+/i
];

const QUERY_SUFFIXES = [
  /\s+price$/i,
  /\s+cost$/i,
  /\s+bei$/i,
  /\s+bei\s+gani\??$/i,
  /\s+ni\s+how\s+much\??$/i,
  /\s+ni\s+pesa\s+ngapi\??$/i
];

// Clean search term
export function cleanQuery(query: string): string {
  return query
    .toLowerCase()
    .replace(/[?!,.:;()"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Parse search input to separate query intent from location
export function analyzeSearchQuery(rawQuery: string): SearchQueryAnalysis {
  let cleaned = cleanQuery(rawQuery);

  // Strip natural language inquiry prefixes
  for (const prefix of QUERY_PREFIXES) {
    if (prefix.test(cleaned)) {
      cleaned = cleaned.replace(prefix, '').trim();
      break;
    }
  }

  // Strip inquiry suffixes
  for (const suffix of QUERY_SUFFIXES) {
    if (suffix.test(cleaned)) {
      cleaned = cleaned.replace(suffix, '').trim();
      break;
    }
  }

  // Check for location mentions (longest match first)
  let detectedLocation: string | undefined;
  const sortedLocations = Object.keys(KENYAN_LOCATIONS).sort((a, b) => b.length - a.length);

  for (const locKey of sortedLocations) {
    const regex = new RegExp(`\\b${locKey}\\b`, 'i');
    if (regex.test(cleaned)) {
      detectedLocation = KENYAN_LOCATIONS[locKey].town || KENYAN_LOCATIONS[locKey].county;
      // Remove location from query to isolate product term, e.g. "bedsitter Rongai" -> "bedsitter"
      cleaned = cleaned.replace(regex, '').replace(/\s+/g, ' ').trim();
      break;
    }
  }

  return {
    rawQuery,
    itemQuery: cleaned,
    detectedLocation
  };
}

// Kenyan Synonyms Groups mapping English, Swahili, and Kenyan marketplace terms
const KENYAN_SYNONYM_GROUPS: string[][] = [
  ['meat', 'nyama', 'beef', "nyama ya ng'ombe", 'nyama ya ngombe', 'steak'],
  ['chicken', 'kuku', 'broiler', 'kienyeji', 'kuku kienyeji', 'poultry'],
  ['sugar', 'sukari', 'white sugar', 'sukari nyeupe'],
  ['onions', 'vitunguu', 'onion', 'kitunguu', 'red onions', 'vitunguu maji'],
  ['tomatoes', 'nyanya', 'tomato', 'nyanya fresh'],
  ['barber', 'kinyozi', 'haircut', 'kunyoa', 'shave', 'salon kinyozi'],
  ['plumber', 'fundi wa maji', 'fundi bomba', 'plumbing', 'bomba', 'water pipe'],
  ['electrician', 'fundi wa stima', 'fundi stima', 'wiring', 'electrical'],
  ['cement', 'simiti', 'bamburi', 'tembo cement', 'blue triangle'],
  ['sand', 'mchanga', 'river sand', 'mchanga wa mto'],
  ['iron sheets', 'mabati', 'dumuzas', 'box profile', 'mabati ya kuezeka'],
  ['socks', 'soksi', 'stockings'],
  ['shoe rack', 'rack ya viatu', 'shoerack', 'shelf ya viatu'],
  ['shoes', 'viatu', 'sneakers', 'sandals', 'slippers'],
  ['mattress', 'godoro', 'mouka', 'foam mattress', 'bobmil', 'superfoam'],
  ['bedsitter', 'chumba', 'studio apartment', 'single room', 'bed sitter'],
  ['car wash', 'kuosha gari', 'carwash', 'auto wash'],
  ['painting', 'house painting', 'kupaka rangi', 'fundi wa rangi', 'painter'],
  ['potatoes', 'viazi', 'waru', 'irish potatoes'],
  ['milk', 'maziwa', 'fresh milk', 'maziwa lala'],
  ['cooking oil', 'mafuta ya kupikia', 'mafuta', 'salad'],
  ['maize flour', 'unga', 'unga wa ugali', 'unga wa sembe'],
  ['boda boda', 'bodaboda', 'piki piki', 'pikipiki', 'motorcycle'],
  ['phone', 'simu', 'smartphone', 'mobile phone']
];

// Custom stem/alias normalizer for Kenyan English & Swahili
function getCanonicalVariants(text: string): string[] {
  const norm = cleanQuery(text);
  const variants = new Set<string>([norm]);

  // Handle compound words (e.g., "water melon" <-> "watermelon", "shoe rack" <-> "shoerack")
  if (norm.includes('water melon')) variants.add(norm.replace('water melon', 'watermelon'));
  if (norm.includes('watermelon')) variants.add(norm.replace('watermelon', 'water melon'));
  if (norm.includes('shoe rack')) variants.add(norm.replace('shoe rack', 'shoerack'));
  if (norm.includes('shoerack')) variants.add(norm.replace('shoerack', 'shoe rack'));
  if (norm.includes('boda boda')) variants.add(norm.replace('boda boda', 'bodaboda'));
  if (norm.includes('bodaboda')) variants.add(norm.replace('bodaboda', 'boda boda'));

  // Swahili apostrophe variations: ng'ombe vs ngombe
  if (norm.includes("ng'ombe")) variants.add(norm.replace("ng'ombe", 'ngombe'));
  if (norm.includes('ngombe')) variants.add(norm.replace('ngombe', "ng'ombe"));

  // Check synonym groups
  for (const group of KENYAN_SYNONYM_GROUPS) {
    if (group.some(term => norm === term || norm.includes(term))) {
      group.forEach(term => variants.add(term));
    }
  }

  // Singular/Plural simple mappings
  if (norm.endsWith('s') && norm.length > 3) variants.add(norm.slice(0, -1));
  if (!norm.endsWith('s') && norm.length >= 3) variants.add(norm + 's');

  return Array.from(variants);
}

// Calculate match score between query and product
export function calculateMatchScore(query: string, product: Product): number {
  if (!query) return 100;

  const queryVariants = getCanonicalVariants(query);
  const searchableTerms: string[] = [
    cleanQuery(product.name),
    cleanQuery(product.swahiliName || ''),
    ...(product.aliases || []).map(cleanQuery),
    cleanQuery(product.category),
    cleanQuery(product.subcategory || ''),
    cleanQuery(product.brand || '')
  ].filter(Boolean);

  // Exact Match Check (Highest Priority)
  for (const qv of queryVariants) {
    // Exact match with name, swahili name or alias
    if (searchableTerms.includes(qv)) {
      return 100;
    }

    // Check alias exact equality
    for (const alias of product.aliases || []) {
      const cAlias = cleanQuery(alias);
      if (cAlias === qv) return 100;
      if (cAlias.length > 2 && qv.length > 2) {
        if (cAlias.startsWith(qv) || qv.startsWith(cAlias)) return 95;
      }
    }
  }

  // Token-level accuracy guard:
  // Split query into words
  const queryTokens = query.split(/\s+/).filter(t => t.length > 0);

  // CRITICAL ANTI-FUZZY GUARD:
  // e.g. Query "watermelon" must NEVER match "bottled water"
  // If query is "watermelon", it contains "melon". "bottled water" does not contain "melon".
  // Check if every token in query has a reasonable anchor in the product terms:
  let allTokensMatched = true;
  let partialScore = 0;

  for (const token of queryTokens) {
    let tokenFound = false;

    // Direct token inclusion in searchable fields
    for (const term of searchableTerms) {
      const termWords = term.split(/\s+/);
      
      // Exact word match
      if (termWords.includes(token)) {
        tokenFound = true;
        partialScore += 25;
        break;
      }

      // Word prefix match (e.g. "sock" matches "socks", "cement" matches "cement")
      if (termWords.some(w => (w.startsWith(token) || token.startsWith(w)) && Math.abs(w.length - token.length) <= 2)) {
        tokenFound = true;
        partialScore += 20;
        break;
      }
    }

    if (!tokenFound) {
      allTokensMatched = false;
      break;
    }
  }

  if (allTokensMatched && queryTokens.length > 0) {
    return Math.min(85, 60 + partialScore);
  }

  // Check if query is contained as a substring in product name ONLY IF query length is >= 4
  // and does not violate token boundaries (e.g., prevents "water" from matching inside "watermelon" blindly)
  for (const qv of queryVariants) {
    if (qv.length >= 4) {
      const prodName = cleanQuery(product.name);
      const swaName = cleanQuery(product.swahiliName || '');
      
      // Ensure it is bounded by word boundaries or start/end
      const regex = new RegExp(`(^|\\s)${qv}($|\\s)`);
      if (regex.test(prodName) || regex.test(swaName)) {
        return 75;
      }
    }
  }

  return 0; // No valid, confident match
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
    candidates = candidates.filter(
      p => p.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  }

  // If query is completely empty, return recent/all sorted by reports/confirms
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

      // Location match bonus or filter
      if (targetLocation) {
        const matchesLocation =
          product.county.toLowerCase().includes(targetLocation.toLowerCase()) ||
          (product.town && product.town.toLowerCase().includes(targetLocation.toLowerCase())) ||
          (product.area && product.area.toLowerCase().includes(targetLocation.toLowerCase()));
        
        if (matchesLocation) {
          locationBoost = 15;
        }
      }

      const totalScore = matchScore > 0 ? matchScore + locationBoost : 0;
      return { product, totalScore };
    })
    .filter(item => item.totalScore >= 50) // Strict cutoff against false positives
    .sort((a, b) => b.totalScore - a.totalScore);

  return scored.map(item => item.product);
}

// Helper to ensure every product has multiple realistic vendors for comparison
export function ensureProductVendors(product: Product): NonNullable<Product['vendors']> {
  if (product.vendors && product.vendors.length > 0) {
    return product.vendors;
  }

  const vendorsList: NonNullable<Product['vendors']> = [];
  const sources = product.retailerOrSource ? product.retailerOrSource.split(/[/&,]/).map(s => s.trim()).filter(Boolean) : [];

  const mainVendor = sources[0] || 'Kenyan Retailer Direct';
  const secondVendor = sources[1] || 'Local Market Vendor';
  const thirdVendor = sources[2] || 'Estate Outlet / Supermarket';

  vendorsList.push({
    id: `${product.id}-v1`,
    vendorName: mainVendor,
    price: product.minPrice,
    unit: product.unit,
    location: product.town || product.county || 'Nairobi',
    sourceType: 'ONLINE_RETAILER',
    sourceUrl: product.sourceUrl,
    dateCollected: product.dateCollected || 'Today',
    inStock: true,
    notes: 'Best benchmark rate'
  });

  vendorsList.push({
    id: `${product.id}-v2`,
    vendorName: secondVendor,
    price: product.typicalPrice,
    unit: product.unit,
    location: product.county || 'Nairobi',
    sourceType: 'PHYSICAL_STORE',
    sourceUrl: product.sourceUrl,
    dateCollected: product.dateCollected || 'Recent',
    inStock: true,
    notes: 'Standard market retail'
  });

  vendorsList.push({
    id: `${product.id}-v3`,
    vendorName: thirdVendor,
    price: product.maxPrice,
    unit: product.unit,
    location: product.area || product.county || 'Nairobi',
    sourceType: 'MARKET_STALL',
    sourceUrl: product.sourceUrl,
    dateCollected: product.dateCollected || 'Recent',
    inStock: true,
    notes: 'Convenience / estate rate'
  });

  return vendorsList;
}

// Real-time live dynamic search query
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
