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
    sourceType: i.sourceType
  }));

  if (result.hasLiveResults && result.items.length > 0) {
    const primaryItem = result.items[0];

    const product = {
      id: `discovered-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: primaryItem.name || query,
      aliases: [],
      category: primaryItem.category || category || 'general',
      sizeOrQuantity: '1 unit',
      unit: primaryItem.unit || 'unit',
      image: primaryItem.image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80',
      typicalPrice: result.typicalPrice,
      minPrice: result.lowestPrice,
      maxPrice: result.highestPrice,
      priceType: primaryItem.sourceType === 'official' 
        ? 'VERIFIED_OFFICIAL' 
        : (primaryItem.sourceType === 'community' ? 'COMMUNITY_REPORT' : 'MARKET_RETAIL'),
      county: primaryItem.county || targetLocation,
      town: primaryItem.location || targetLocation,
      retailerOrSource: result.items.map(i => i.vendor).slice(0, 3).join(', '),
      dateCollected: 'Live Discovery',
      reportsCount: result.items.length,
      confirmsCount: 1,
      outdatesCount: 0,
      flaggedCount: 0,
      sourceUrl: primaryItem.url,
      description: `Verified prices retrieved across ${result.sources.length} Kenyan sources (${result.sources.join(', ')}). Lowest: KSh ${result.lowestPrice.toLocaleString()} | Highest: KSh ${result.highestPrice.toLocaleString()}.`,
      isRealtimeDiscovered: true,
      verified: true,
      isDemo: false,
      vendors: result.items.map((it, idx) => ({
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

    return {
      verified: true,
      hasLiveResults: true,
      product,
      items: normalizedItems,
      results: normalizedItems,
      totalCount: result.totalCount,
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
      items: [],
      results: [],
      totalCount: 0,
      lowestPrice: 0,
      highestPrice: 0,
      typicalPrice: 0,
      sources: result.sources || [],
      providersStatus: result.providersStatus || [],
      message: 'No live results available from the connected sources.'
    };
  }
}
