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

export function isTrustworthyImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('https://') && !trimmed.startsWith('http://')) return false;
  if (trimmed.includes('unsplash.com')) return false;
  if (trimmed.includes('[') || trimmed.includes(']') || trimmed.includes('<') || trimmed.includes('>')) return false;
  if (trimmed.includes('(') && trimmed.includes(')') && trimmed.includes('http')) return false;
  if (trimmed.length > 500) return false;
  return true;
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
    image: isTrustworthyImageUrl(i.image) ? i.image : undefined
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
      const rep = items[0];
      const prices = items.map(i => i.price).filter(p => p > 0);
      const minPrice = prices.length > 0 ? Math.min(...prices) : rep.price;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : rep.price;
      const typicalPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : rep.price;
      const validImageItem = items.find(i => isTrustworthyImageUrl(i.image));

      return {
        id: `discovered-${clusterKey}-${pIdx}-${Date.now()}`,
        name: rep.name || query,
        aliases: [],
        category: rep.category || category || 'general',
        sizeOrQuantity: rep.unit || '1 unit',
        unit: rep.unit || 'unit',
        image: validImageItem?.image || undefined,
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
        vendors: items.map((it, idx) => ({
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
          dateCollected: it.retrievedAt || it.timestamp,
          inStock: true,
          notes: it.notes,
          isDemo: false
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
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
