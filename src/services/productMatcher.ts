// High-Precision Kenyan Product & Service Identity Matcher
// Prevents collisions (e.g. A56 256GB vs 128GB, watermelon vs water, boxers vs boxing gloves)

import { ExternalListing, GroupedProductComparison } from './connectors/types';
import { SearchQueryAnalysis } from '../types';
import { matchesStrictLocation } from './locationService';
import { isTrustworthyImageUrl } from './imageUtils';

// Extract storage variant (e.g. "256GB", "128GB", "64GB", "512GB")
export function extractStorageVariant(text: string): string | undefined {
  const match = text.match(/\b(32|64|128|256|512)\s*(?:gb|gig)\b/i);
  return match ? `${match[1].toUpperCase()}GB` : undefined;
}

// Extract packaging/volume variant (e.g. "6kg", "13kg", "50kg", "1kg", "2kg", "3-pack")
export function extractSizeVariant(text: string): string | undefined {
  const match = text.match(/\b(\d+(?:\.\d+)?)\s*(kg|g|litre|litres|l|ml|pack|pair|pieces|seater|kg refill)\b/i);
  return match ? `${match[1]}${match[2].toLowerCase()}` : undefined;
}

// Check if query is looking for an accessory rather than the actual device
export function isAccessoryQuery(text: string): boolean {
  return /\b(case|cover|screen protector|tempered glass|pouch|charger|cable|skin|housing)\b/i.test(text);
}

// Check if product is an accessory
export function isAccessoryProduct(text: string): boolean {
  return /\b(case|cover|protector|silicone|leather case|tempered glass|back cover|flip cover)\b/i.test(text);
}

/**
 * Check if an external listing strictly matches the user's intended product identity
 */
export function isStrictIdentityMatch(listing: ExternalListing, query: SearchQueryAnalysis): boolean {
  const qItem = query.itemQuery.toLowerCase().trim();
  const lName = listing.productName.toLowerCase();
  const lModel = (listing.model || '').toLowerCase();
  const lBrand = (listing.brand || '').toLowerCase();

  // 1. CRITICAL ANTI-COLLISION: Watermelon vs Water / Bottled Water
  const isWatermelonQuery = qItem.includes('watermelon') || qItem.includes('water melon') || qItem.includes('tikiti');
  const isWatermelonListing = lName.includes('watermelon') || lName.includes('water melon') || lName.includes('tikiti');
  const isBottledWaterListing = lName.includes('bottled water') || lName.includes('mineral water') || lName.includes('water tank');
  if (isWatermelonQuery && isBottledWaterListing) return false;
  if (!isWatermelonQuery && qItem.includes('water') && isWatermelonListing) return false;

  // 2. CRITICAL ANTI-COLLISION: Underwear/Boxers vs Boxing Gloves/Equipment
  const isInnerwearQuery = /\b(boxer|boxers|underwear|innerwear|panties|panty|briefs|suruali ya ndani)\b/i.test(qItem);
  const isBoxingSportListing = /\b(boxing glove|boxing gloves|punching bag|boxing ring|boxing shorts)\b/i.test(lName);
  if (isInnerwearQuery && isBoxingSportListing) return false;

  // 3. CRITICAL ANTI-COLLISION: Phone vs Phone Case / Screen Protector
  const userWantsAccessory = isAccessoryQuery(qItem);
  const productIsAccessory = isAccessoryProduct(lName);
  if (!userWantsAccessory && productIsAccessory) {
    // If user searched "Samsung A56", reject "Samsung A56 Case"
    return false;
  }
  if (userWantsAccessory && !productIsAccessory) {
    // If user searched "Samsung A56 case", reject the 45,000 KSh phone
    return false;
  }

  // 4. MODEL DISCRIMINATOR: e.g. A56 vs A55 vs A36 vs A54
  const queryModelMatch = qItem.match(/\b(a\d{2}|s\d{2}|note\s*\d+|iphone\s*\d+|pixel\s*\d+)\b/i);
  if (queryModelMatch) {
    const qModel = queryModelMatch[1].replace(/\s+/g, '').toLowerCase();
    const lTextForModel = `${lName} ${lModel}`.replace(/\s+/g, '').toLowerCase();
    if (!lTextForModel.includes(qModel)) {
      return false; // e.g. user asked for A56, reject A55 or A36
    }
  }

  // 5. STORAGE VARIANT DISCRIMINATOR: e.g. 256GB vs 128GB
  const queryStorage = extractStorageVariant(qItem);
  const listingStorage = extractStorageVariant(`${lName} ${listing.variant || ''}`);
  if (queryStorage && listingStorage) {
    if (queryStorage !== listingStorage) {
      return false; // User specifically typed 256GB, do NOT mix with 128GB
    }
  }

  // 6. BRAND DISCRIMINATOR
  if (query.detectedBrand) {
    const qBrand = query.detectedBrand.toLowerCase();
    if (!lBrand.includes(qBrand) && !lName.includes(qBrand)) {
      return false;
    }
  }

  // 7. Token Overlap Check
  const qTokens = qItem.split(/\s+/).filter(t => t.length > 2 && !['the', 'and', 'for', 'with', 'price', 'bei', 'how', 'much'].includes(t));
  if (qTokens.length > 0) {
    const searchableText = `${lName} ${lBrand} ${lModel} ${listing.category} ${listing.subcategory || ''}`.toLowerCase();
    const matchesAll = qTokens.every(token => searchableText.includes(token));
    if (matchesAll) return true;

    // Check canonical name
    if (query.canonicalName) {
      const canonClean = query.canonicalName.toLowerCase();
      if (lName.includes(canonClean) || canonClean.includes(lName)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Group raw multi-source listings into consolidated Price Comparison Groups
 */
export function groupListingsIntoProducts(
  listings: ExternalListing[],
  query: SearchQueryAnalysis,
  strictLocationFilter?: string
): { primaryGroup: GroupedProductComparison | null; allGroups: GroupedProductComparison[] } {
  // 1. Apply strict location filtering first if requested
  const locationFiltered = strictLocationFilter
    ? listings.filter(l => matchesStrictLocation(l, strictLocationFilter))
    : listings;

  if (locationFiltered.length === 0) {
    return { primaryGroup: null, allGroups: [] };
  }

  // 2. Cluster listings into canonical identities
  const clusters = new Map<string, ExternalListing[]>();

  for (const listing of locationFiltered) {
    // Generate identity key: normalized product base + brand + model + variant
    const brand = (listing.brand || 'general').toLowerCase().trim();
    const model = (listing.model || '').toLowerCase().trim();
    const storage = extractStorageVariant(`${listing.productName} ${listing.variant || ''}`) || '';
    const size = extractSizeVariant(`${listing.productName} ${listing.variant || ''}`) || '';
    
    // Group key
    let clusterKey = `${brand}-${model || listing.category}-${storage || size}`.replace(/\s+/g, '-').toLowerCase();
    if (clusterKey === 'general--') {
      clusterKey = listing.productName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40);
    }

    if (!clusters.has(clusterKey)) {
      clusters.set(clusterKey, []);
    }
    clusters.get(clusterKey)!.push(listing);
  }

  // 3. Build GroupedProductComparison objects
  const groups: GroupedProductComparison[] = [];

  clusters.forEach((items, key) => {
    if (items.length === 0) return;

    // Sort listings by price ascending
    items.sort((a, b) => a.price - b.price);

    const lowestPrice = items[0].price;
    const highestPrice = items[items.length - 1].price;
    const typicalPrice = Math.round(items.reduce((sum, item) => sum + item.price, 0) / items.length);
    const priceSpreadPercent = lowestPrice > 0 ? Math.round(((highestPrice - lowestPrice) / lowestPrice) * 100) : 0;

    const rep = items[0]; // representative listing
    const distinctVendors = Array.from(new Set(items.map(i => i.vendor)));

    const sourcesSummary = items.map(i => ({
      sourceName: i.source,
      sourceCategory: i.sourceCategory,
      price: i.price,
      location: i.location,
      sourceUrl: i.sourceUrl,
      dateCollected: i.dateCollected,
      availability: i.availability,
      isVerified: i.isVerified
    }));

    groups.push({
      canonicalId: `group-${key}`,
      productName: rep.productName,
      brand: rep.brand,
      model: rep.model,
      variant: rep.variant || extractStorageVariant(rep.productName) || extractSizeVariant(rep.productName),
      category: rep.category,
      subcategory: rep.subcategory,
      image: items.find(i => isTrustworthyImageUrl(i.imageUrl))?.imageUrl || undefined,
      imageSource: items.find(i => isTrustworthyImageUrl(i.imageUrl)) ? 'retailer' : 'fallback',
      lowestPrice,
      highestPrice,
      typicalPrice,
      priceSpreadPercent,
      sourcesCount: items.length,
      listings: items,
      distinctVendors,
      sourcesSummary
    });
  });

  // 4. Sort groups by relevance to query
  groups.sort((a, b) => {
    const aStrict = isStrictIdentityMatch(a.listings[0], query) ? 1 : 0;
    const bStrict = isStrictIdentityMatch(b.listings[0], query) ? 1 : 0;
    if (aStrict !== bStrict) return bStrict - aStrict;
    return b.sourcesCount - a.sourcesCount;
  });

  const primaryGroup = groups.length > 0 ? groups[0] : null;
  if (primaryGroup && groups.length > 1) {
    primaryGroup.relatedAlternatives = groups.slice(1, 4);
  }

  return { primaryGroup, allGroups: groups };
}
