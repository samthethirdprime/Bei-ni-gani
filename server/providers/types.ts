// Types and data normalization for multi-provider live search engine

export type SourceType = 'external' | 'community' | 'official' | 'demo';

export type AcquisitionMethod = 
  | 'direct_api' 
  | 'direct_webpage' 
  | 'search_index' 
  | 'search_snippet' 
  | 'community' 
  | 'official' 
  | 'cache' 
  | 'demo';

export interface NormalizedPriceResult {
  id: string;
  name: string;
  price: number;
  currency: 'KES';
  vendor: string;
  source: string;
  sourceName?: string;
  sourceType: SourceType;
  acquisitionMethod: AcquisitionMethod;
  url?: string;
  sourceUrl?: string;
  image?: string;
  location?: string;
  county?: string;
  retrievedAt?: string;
  timestamp: string;
  isVerified: boolean;
  notes?: string;
  category?: string;
  unit?: string;
}

export interface ProviderStatus {
  providerId: string;
  providerName: string;
  status: 'success' | 'failed' | 'unconfigured' | 'timeout';
  itemCount: number;
  durationMs: number;
  message?: string;
}

export interface ProviderSearchResult {
  providerId: string;
  providerName: string;
  items: NormalizedPriceResult[];
  status: ProviderStatus;
}

export interface SearchOptions {
  location?: string;
  category?: string;
  maxResults?: number;
}

export interface SearchProvider {
  readonly id: string;
  readonly name: string;
  readonly requiresAuth: boolean;
  search(query: string, options?: SearchOptions): Promise<ProviderSearchResult>;
}

export function extractRawImageUrl(raw: unknown): string | null {
  if (!raw) return null;

  // Handle arrays: [url1, url2] or [{ url: ... }]
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const extracted = extractRawImageUrl(item);
      if (extracted) return extracted;
    }
    return null;
  }

  // Handle objects: { url: ... } or { src: ... } or { contentUrl: ... } or { image: ... } or { imageUrl: ... }
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    const candidate =
      obj.url ||
      obj.src ||
      obj.contentUrl ||
      obj.imageUrl ||
      obj.image ||
      obj.photo ||
      obj.secure_url ||
      obj.thumbnail ||
      obj.previewUrl ||
      obj.original ||
      obj.source;

    if (candidate && candidate !== raw) {
      return extractRawImageUrl(candidate);
    }
    return null;
  }

  if (typeof raw !== 'string') return null;

  let str = raw.trim();
  if (!str) return null;

  // Unescape HTML entities like &amp; -> &
  str = str.replace(/&amp;/g, '&');

  // Strip wrapping quotes
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1).trim();
  }

  // Handle Markdown syntax: ![alt](url) or [alt](url) or [![alt](url)](link)
  const mdMatch = str.match(/(?:!\[.*?\]|\[.*?\])\((https?:\/\/[^\s\)]+|\/\/[^\s\)]+)\)/i);
  if (mdMatch) {
    str = mdMatch[1];
  } else {
    // Handle raw wrapped parentheses: (https://...)
    const parenMatch = str.match(/^\((https?:\/\/[^\s\)]+|\/\/[^\s\)]+)\)$/i);
    if (parenMatch) {
      str = parenMatch[1];
    }
  }

  // Handle HTML img tag: <img src="url" ... />
  const htmlImgMatch = str.match(/<img[^>]+(?:src|data-src)=["']([^"']+)["']/i);
  if (htmlImgMatch) {
    str = htmlImgMatch[1];
  }

  // Handle protocol-relative URL (e.g. //cdn.jumia.co.ke/...)
  if (str.startsWith('//')) {
    str = `https:${str}`;
  }

  // Reject generic Unsplash images or generic placeholders per instructions
  if (str.includes('unsplash.com') || /\b(logo|site-logo|favicon|woocommerce-placeholder)\b/i.test(str)) {
    return null;
  }

  // Handle local proxy URLs or generic local assets e.g. /api/image-proxy?url=..., /generic-images/...
  if (str.startsWith('/api/image-proxy') || str.startsWith('/generic-images/')) {
    return str;
  }

  // Validate standard http/https
  if (!str.startsWith('http://') && !str.startsWith('https://')) {
    return null;
  }

  if (str.length > 1000) return null;

  // Check URL validity
  try {
    const parsed = new URL(str);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function isTrustworthyImageUrl(url?: unknown): boolean {
  return extractRawImageUrl(url) !== null;
}

export function formatSearchResponse(
  result: {
    query: string;
    items: NormalizedPriceResult[];
    totalCount: number;
    lowestPrice: number;
    highestPrice: number;
    typicalPrice: number;
    sources: string[];
    providersStatus: ProviderStatus[];
    hasLiveResults: boolean;
  },
  query: string,
  targetLocation: string = 'Kenya',
  category?: string
) {
  const normalizedItems = (result.items || []).map(i => ({
    ...i,
    sourceName: i.sourceName || i.vendor || i.source,
    sourceUrl: i.sourceUrl || i.url,
    retrievedAt: i.retrievedAt || i.timestamp,
    acquisitionMethod: i.acquisitionMethod || (i.sourceType === 'official' ? 'official' : (i.sourceType === 'community' ? 'community' : 'search_snippet')),
    sourceType: i.sourceType,
    image: extractRawImageUrl(i.image || (i as any).imageUrl || (i as any).photoUrl || (i as any).src) || undefined
  }));

  if (result.hasLiveResults && normalizedItems.length > 0) {
    // Cluster items into distinct products by normalized product name / variant
    const clusters = new Map<string, NormalizedPriceResult[]>();

    for (const item of normalizedItems) {
      // Normalize product name to cluster key
      const cleanName = item.name.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
      const tokens = cleanName.split(/\s+/).filter(t => t.length > 2).slice(0, 4);
      const clusterKey = tokens.length > 0 ? tokens.join('-') : 'discovered-item';

      if (!clusters.has(clusterKey)) {
        clusters.set(clusterKey, []);
      }
      clusters.get(clusterKey)!.push(item);
    }

    const products = Array.from(clusters.entries()).map(([clusterKey, items], pIdx) => {
      items.sort((a, b) => a.price - b.price);
      const validImage = items.map(it => extractRawImageUrl(it.image || (it as any).imageUrl)).find(Boolean);
      // Prefer representative item that has a valid image and title
      const rep = items.find(it => extractRawImageUrl(it.image || (it as any).imageUrl)) || items[0];
      const prices = items.map(i => i.price).filter(p => p > 0);
      const minPrice = prices.length > 0 ? Math.min(...prices) : rep.price;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : rep.price;
      const typicalPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : rep.price;

      const hasGenuineImage = Boolean(validImage && !validImage.startsWith('/product-photos/') && !validImage.startsWith('/generic-images/'));
      const resolvedProductImage = hasGenuineImage ? validImage : undefined;
      const productImageSource: 'retailer' | 'fallback' = hasGenuineImage ? 'retailer' : 'fallback';

      return {
        id: `discovered-${clusterKey}-${pIdx}-${Date.now()}`,
        name: rep.name || query,
        aliases: [],
        category: rep.category || category || 'general',
        sizeOrQuantity: rep.unit || '1 unit',
        unit: rep.unit || 'unit',
        image: resolvedProductImage,
        imageSource: productImageSource,
        typicalPrice,
        minPrice,
        maxPrice,
        priceType: rep.sourceType === 'official'
          ? 'VERIFIED_OFFICIAL'
          : (rep.sourceType === 'community' ? 'COMMUNITY_REPORT' : 'MARKET_RETAIL'),
        county: rep.county || targetLocation,
        town: rep.location || targetLocation,
        retailerOrSource: Array.from(new Set(items.map(i => i.vendor))).slice(0, 3).join(', '),
        dateCollected: 'Live Discovery',
        reportsCount: items.length,
        confirmsCount: 1,
        outdatesCount: 0,
        flaggedCount: 0,
        sourceUrl: rep.url || rep.sourceUrl,
        description: `Verified prices retrieved across ${Array.from(new Set(items.map(i => i.vendor))).length} Kenyan sources. Lowest: KSh ${minPrice.toLocaleString()} | Highest: KSh ${maxPrice.toLocaleString()}.`,
        isRealtimeDiscovered: true,
        verified: true,
        isDemo: false,
        vendors: items.map((it, idx) => {
          const itemImg = extractRawImageUrl(it.image || (it as any).imageUrl);
          const hasItemGenuine = Boolean(itemImg && !itemImg.startsWith('/generic-images/'));
          return {
            id: `v-${idx}-${Date.now()}`,
            vendorName: it.vendor,
            price: it.price,
            unit: it.unit || 'unit',
            location: it.location || targetLocation,
            sourceType: it.sourceType === 'community'
              ? 'COMMUNITY'
              : (it.sourceType === 'official' ? 'OFFICIAL' : 'ONLINE_RETAILER'),
            acquisitionMethod: it.acquisitionMethod || (it.sourceType === 'official' ? 'official' : (it.sourceType === 'community' ? 'community' : 'search_snippet')),
            sourceUrl: it.sourceUrl || it.url,
            image: hasItemGenuine ? itemImg : undefined,
            imageSource: hasItemGenuine ? 'retailer' : 'fallback',
            dateCollected: it.retrievedAt || it.timestamp,
            inStock: true,
            notes: it.notes,
            isDemo: false
          };
        }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });

    // Prioritize products with verified images over text-only blog snippets
    products.sort((a, b) => {
      const aImg = a.image ? 1 : 0;
      const bImg = b.image ? 1 : 0;
      if (aImg !== bImg) return bImg - aImg;
      return a.typicalPrice - b.typicalPrice;
    });

    return {
      verified: true,
      hasLiveResults: true,
      product: products[0] || null,
      products: products,
      items: normalizedItems,
      results: normalizedItems,
      totalCount: normalizedItems.length,
      lowestPrice: result.lowestPrice,
      highestPrice: result.highestPrice,
      typicalPrice: result.typicalPrice,
      sources: result.sources,
      providersStatus: result.providersStatus
    };
  } else {
    return {
      verified: false,
      hasLiveResults: false,
      product: null,
      products: [],
      items: [],
      results: [],
      totalCount: 0,
      lowestPrice: 0,
      highestPrice: 0,
      typicalPrice: 0,
      sources: result.sources || [],
      providersStatus: result.providersStatus || [],
      message: 'No verified current price found.'
    };
  }
}
