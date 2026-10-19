// Gadgets Leo Kenya Direct WooCommerce Store API Provider
// Fetches genuine smartphone & tech listings from https://gadgetsleo.com/wp-json/wc/store/v1/products

import { SearchProvider, ProviderSearchResult, NormalizedPriceResult, SearchOptions, extractRawImageUrl } from './types';
import { parseWooCommercePrice, cleanHtmlEntities, isAvechiProductRelevant as isTechProductRelevant } from './avechiProvider';

export class GadgetsLeoProvider implements SearchProvider {
  readonly id = 'gadgets_leo';
  readonly name = 'Gadgets Leo Kenya';
  readonly requiresAuth = false;

  private readonly baseUrl = 'https://gadgetsleo.com/wp-json/wc/store/v1/products';
  private readonly timeoutMs = 4500;
  private readonly defaultPerPage = 8;

  async search(query: string, options?: SearchOptions): Promise<ProviderSearchResult> {
    const startTime = Date.now();
    const cleanQ = query.trim();

    if (!cleanQ) {
      return {
        providerId: this.id,
        providerName: this.name,
        items: [],
        status: {
          providerId: this.id,
          providerName: this.name,
          status: 'success',
          itemCount: 0,
          durationMs: Date.now() - startTime
        }
      };
    }

    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      // Strip generic category words if brand is present
      let searchTerm = cleanQ;
      if (/\b(smartphone|smartphones|phone|phones|simu)\b/i.test(cleanQ) && /\b(redmi|xiaomi|samsung|itel|tecno|infinix|oppo)\b/i.test(cleanQ)) {
        searchTerm = cleanQ.replace(/\b(smartphone|smartphones|phone|phones|simu)\b/gi, '').trim();
      }

      const perPage = options?.maxResults ? Math.min(options.maxResults, 10) : this.defaultPerPage;
      const searchUrl = `${this.baseUrl}?search=${encodeURIComponent(searchTerm)}&per_page=${perPage}`;

      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 BeiGani/1.0',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutTimer);

      if (!response.ok) {
        return {
          providerId: this.id,
          providerName: this.name,
          items: [],
          status: {
            providerId: this.id,
            providerName: this.name,
            status: 'failed',
            itemCount: 0,
            durationMs: Date.now() - startTime,
            message: `Gadgets Leo API returned HTTP ${response.status}`
          }
        };
      }

      const rawItems = await response.json();
      if (!Array.isArray(rawItems)) {
        return {
          providerId: this.id,
          providerName: this.name,
          items: [],
          status: {
            providerId: this.id,
            providerName: this.name,
            status: 'failed',
            itemCount: 0,
            durationMs: Date.now() - startTime,
            message: 'Gadgets Leo API response was not an array'
          }
        };
      }

      const normalizedItems: NormalizedPriceResult[] = [];

      for (const raw of rawItems) {
        if (!raw || !raw.name || !raw.permalink) continue;

        const decodedName = cleanHtmlEntities(raw.name);
        const price = parseWooCommercePrice(raw.prices);
        if (price === null || price <= 0) continue;

        const isRelevant = isTechProductRelevant(decodedName, cleanQ, {
          category: options?.category,
          location: options?.location
        });
        if (!isRelevant) continue;

        const rawImage = raw.images && raw.images.length > 0 ? (raw.images[0].src || raw.images[0].thumbnail) : undefined;
        const imageUrl = extractRawImageUrl(rawImage) || undefined;
        const nowIso = new Date().toISOString();

        normalizedItems.push({
          id: `gadgetsleo-${raw.id}`,
          name: decodedName,
          price,
          currency: 'KES',
          vendor: 'Gadgets Leo Kenya',
          source: 'Gadgets Leo Kenya',
          sourceName: 'Gadgets Leo Kenya',
          sourceType: 'external',
          acquisitionMethod: 'direct_api',
          url: raw.permalink,
          sourceUrl: raw.permalink,
          image: imageUrl,
          location: 'Nairobi (Nationwide Delivery)',
          county: 'Nairobi',
          timestamp: nowIso,
          retrievedAt: nowIso,
          isVerified: false,
          notes: 'Direct WooCommerce Store API catalog listing (gadgetsleo.com)',
          category: 'electronics',
          unit: 'unit'
        });
      }

      return {
        providerId: this.id,
        providerName: this.name,
        items: normalizedItems,
        status: {
          providerId: this.id,
          providerName: this.name,
          status: 'success',
          itemCount: normalizedItems.length,
          durationMs: Date.now() - startTime
        }
      };
    } catch (err: any) {
      clearTimeout(timeoutTimer);
      const isTimeout = err?.name === 'AbortError' || controller.signal.aborted;
      return {
        providerId: this.id,
        providerName: this.name,
        items: [],
        status: {
          providerId: this.id,
          providerName: this.name,
          status: isTimeout ? 'timeout' : 'failed',
          itemCount: 0,
          durationMs: Date.now() - startTime,
          message: isTimeout ? `Gadgets Leo API timed out after ${this.timeoutMs}ms` : (err?.message || 'Error querying Gadgets Leo')
        }
      };
    }
  }
}
