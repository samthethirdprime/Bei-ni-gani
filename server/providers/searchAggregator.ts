import { SearchProvider, ProviderSearchResult, NormalizedPriceResult, ProviderStatus, SearchOptions } from './types';
import { CommunityProvider } from './communityProvider';
import { OfficialProvider } from './officialProvider';
import { WebSearchProvider } from './webSearchProvider';
import { JumiaProvider } from './jumiaProvider';
import { KilimallProvider } from './kilimallProvider';
import { JijiProvider } from './jijiProvider';
import { MasokoProvider } from './masokoProvider';
import { SupermarketsProvider } from './supermarketsProvider';

export class SearchAggregator {
  private providers: SearchProvider[] = [];

  constructor() {
    this.providers = [
      new CommunityProvider(),
      new OfficialProvider(),
      new WebSearchProvider(),
      new JumiaProvider(),
      new KilimallProvider(),
      new JijiProvider(),
      new MasokoProvider(),
      new SupermarketsProvider()
    ];
  }

  public getProvidersInfo(): Array<{ id: string; name: string; requiresAuth: boolean }> {
    return this.providers.map(p => ({
      id: p.id,
      name: p.name,
      requiresAuth: p.requiresAuth
    }));
  }

  public async searchAll(
    query: string,
    options?: SearchOptions
  ): Promise<{
    query: string;
    items: NormalizedPriceResult[];
    totalCount: number;
    lowestPrice: number;
    highestPrice: number;
    typicalPrice: number;
    sources: string[];
    providersStatus: ProviderStatus[];
    hasLiveResults: boolean;
  }> {
    const cleanQ = query.trim();
    if (!cleanQ) {
      return {
        query,
        items: [],
        totalCount: 0,
        lowestPrice: 0,
        highestPrice: 0,
        typicalPrice: 0,
        sources: [],
        providersStatus: [],
        hasLiveResults: false
      };
    }

    // Execute all providers with individual timeout protection
    const promises = this.providers.map(async (provider) => {
      const perProviderTimeoutMs = 6500;
      let timer: any;
      const timeoutPromise = new Promise<ProviderSearchResult>((resolve) => {
        timer = setTimeout(() => {
          resolve({
            providerId: provider.id,
            providerName: provider.name,
            items: [],
            status: {
              providerId: provider.id,
              providerName: provider.name,
              status: 'timeout',
              itemCount: 0,
              durationMs: perProviderTimeoutMs,
              message: `Provider ${provider.name} timed out after ${perProviderTimeoutMs}ms`
            }
          });
        }, perProviderTimeoutMs);
        if (timer && timer.unref) {
          timer.unref();
        }
      });

      try {
        const res = await Promise.race([provider.search(cleanQ, options), timeoutPromise]);
        if (timer) clearTimeout(timer);
        return res;
      } catch (err: any) {
        if (timer) clearTimeout(timer);
        const failedResult: ProviderSearchResult = {
          providerId: provider.id,
          providerName: provider.name,
          items: [],
          status: {
            providerId: provider.id,
            providerName: provider.name,
            status: 'failed',
            itemCount: 0,
            durationMs: 0,
            message: err?.message || 'Unknown provider error'
          }
        };
        return failedResult;
      }
    });

    const results = await Promise.allSettled(promises);
    const allItems: NormalizedPriceResult[] = [];
    const providersStatus: ProviderStatus[] = [];
    const activeSources = new Set<string>();

    for (const res of results) {
      if (res.status === 'fulfilled') {
        providersStatus.push(res.value.status);
        if (res.value.items && res.value.items.length > 0) {
          allItems.push(...res.value.items);
          activeSources.add(res.value.providerName);
        }
      }
    }

    // Deduplicate items with same vendor and price
    const seen = new Set<string>();
    const deduplicated: NormalizedPriceResult[] = [];

    for (const item of allItems) {
      const key = `${item.vendor.toLowerCase()}-${item.price}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(item);
      }
    }

    // Sort items with lowest price first
    deduplicated.sort((a, b) => a.price - b.price);

    const prices = deduplicated.map(i => i.price).filter(p => typeof p === 'number' && p > 0);
    const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const highestPrice = prices.length > 0 ? Math.max(...prices) : 0;
    const typicalPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;

    return {
      query: cleanQ,
      items: deduplicated,
      totalCount: deduplicated.length,
      lowestPrice,
      highestPrice,
      typicalPrice,
      sources: Array.from(activeSources),
      providersStatus,
      hasLiveResults: deduplicated.length > 0
    };
  }
}

export const searchAggregator = new SearchAggregator();
