// Kilimall Kenya Direct Catalog Provider
// Genuinely retrieves real-time product listings from https://www.kilimall.co.ke/search?q=...

import { SearchProvider, ProviderSearchResult, NormalizedPriceResult, SearchOptions, extractRawImageUrl } from './types';

export interface KilimallParsedItem {
  listingId: number | string;
  title: string;
  price: number;
  image?: string;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * Decodes HTML entities commonly found in product titles
 */
export function decodeKilimallEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#8221;/g, '"')
    .replace(/&#8220;/g, '"')
    .replace(/&#215;/g, 'x')
    .trim();
}

/**
 * Parses raw Kilimall SSR Nuxt data into structured items
 */
export function extractKilimallNuxtItems(html: string): KilimallParsedItem[] {
  const match = html.match(/<script type=\"application\/json\" id=\"__NUXT_DATA__\"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) return [];

  try {
    const raw: any[] = JSON.parse(match[1]);
    if (!Array.isArray(raw)) return [];

    const items: KilimallParsedItem[] = [];
    const seenIds = new Set<string>();

    for (let i = 0; i < raw.length; i++) {
      const entry = raw[i];
      if (entry && typeof entry === 'object' && 'listingId' in entry) {
        // Resolve values that may be indexed pointers in raw
        const rawTitle = typeof entry.title === 'number' ? raw[entry.title] : entry.title;
        const rawPrice = typeof entry.price === 'number' ? (typeof raw[entry.price] === 'number' ? raw[entry.price] : entry.price) : entry.price;
        const rawImage = typeof entry.image === 'number' ? raw[entry.image] : entry.image;
        const rawLid = typeof entry.listingId === 'number' ? (typeof raw[entry.listingId] === 'number' ? raw[entry.listingId] : entry.listingId) : entry.listingId;

        if (!rawTitle || typeof rawTitle !== 'string') continue;
        const cleanTitle = decodeKilimallEntities(rawTitle);

        const priceNum = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice || '0').replace(/[^0-9.]/g, ''));
        if (isNaN(priceNum) || priceNum <= 0) continue;

        const idStr = String(rawLid || '');
        if (idStr && seenIds.has(idStr)) continue;
        if (idStr) seenIds.add(idStr);

        let imgUrl: string | undefined = undefined;
        if (typeof rawImage === 'string' && rawImage.startsWith('http')) {
          // Strip image processing hash suffix if present
          imgUrl = rawImage.replace(/\?x-image-process=.*$/, '');
        }

        items.push({
          listingId: rawLid || i,
          title: cleanTitle,
          price: Math.round(priceNum),
          image: imgUrl
        });
      }
    }

    return items;
  } catch (err) {
    console.warn('[KilimallProvider] Error parsing Nuxt data:', err);
    return [];
  }
}

/**
 * Anti-accessory check
 */
export function isAccessoryProduct(title: string): boolean {
  return /\b(case|cover|protector|tempered glass|screen replacement|lcd display|charging cable|charger|power adapter|silicone case|flip cover|pouch|holster|strap|lens protector|inlet pipe|hose|anti vibration|rubber feet)\b/i.test(title);
}

/**
 * Checks if query is looking for an accessory
 */
export function isAccessoryQuery(query: string): boolean {
  return /\b(case|cover|screen protector|tempered glass|pouch|charger|cable|skin|housing|inlet pipe|hose)\b/i.test(query);
}

const KNOWN_BRANDS = [
  'redmi', 'xiaomi', 'itel', 'tecno', 'infinix', 'samsung',
  'apple', 'iphone', 'oppo', 'vivo', 'realme', 'huawei',
  'nokia', 'hp', 'dell', 'lenovo', 'asus', 'acer', 'ramtons',
  'tcl', 'hisense', 'von', 'mika', 'bruhm', 'lg', 'whirlpool',
  'armco', 'hotpoint', 'syinix', 'vitron'
];

/**
 * Strict product identity & relevance checks for Kilimall listings
 */
export function isKilimallProductRelevant(
  title: string,
  rawQuery: string,
  options?: { category?: string; location?: string }
): boolean {
  const cleanQ = rawQuery.toLowerCase().trim();
  const cleanTitle = title.toLowerCase().trim();

  // 1. Anti-Accessory Guard
  const wantsAcc = isAccessoryQuery(cleanQ);
  const isAcc = isAccessoryProduct(cleanTitle);
  if (!wantsAcc && isAcc) return false;
  if (wantsAcc && !isAcc) return false;

  // 2. Lighting vs TV Discrimination
  const isLightingQuery = /\b(led light|led lights|light|lights|bulb|bulbs|strip light|strip lights|floodlight|downlight|lamp|torch)\b/i.test(cleanQ);
  const isTvProduct = /\b(tv|television|qled tv|smart tv|uhd tv|monitor)\b/i.test(cleanTitle);
  if (isLightingQuery && isTvProduct) return false;
  if (cleanQ.includes('led light') && !/\b(light|lights|bulb|bulbs|strip|lamp|torch|downlight)\b/i.test(cleanTitle)) {
    return false;
  }

  // 3. Washing Machine vs Spare Parts / Detergent
  if (cleanQ.includes('washing machine')) {
    if (!cleanTitle.includes('washing machine') && !cleanTitle.includes('washer')) {
      return false;
    }
  }

  // 4. Kettle vs Gym Weights
  if (cleanQ.includes('kettle')) {
    if (cleanTitle.includes('dumbbell') || cleanTitle.includes('kettlebell') || cleanTitle.includes('weights')) {
      return false;
    }
    if (!cleanTitle.includes('kettle') && !cleanTitle.includes('birika')) {
      return false;
    }
  }

  // 5. Laptop vs Phone or Tablet
  if (cleanQ.includes('laptop')) {
    if (!cleanTitle.includes('laptop') && !cleanTitle.includes('notebook') && !cleanTitle.includes('elitebook') && !cleanTitle.includes('probook') && !cleanTitle.includes('thinkpad')) {
      return false;
    }
  }

  // 6. Strict Brand Check
  for (const brand of KNOWN_BRANDS) {
    const brandRegex = new RegExp(`(^|\\s)${brand}($|\\s|[0-9])`, 'i');
    if (brandRegex.test(cleanQ)) {
      if (brand === 'redmi' && (cleanTitle.includes('redmi') || cleanTitle.includes('xiaomi'))) {
        continue;
      }
      if (brand === 'xiaomi' && (cleanTitle.includes('xiaomi') || cleanTitle.includes('redmi'))) {
        continue;
      }
      if (!cleanTitle.includes(brand)) {
        return false;
      }
    }
  }

  // 7. Strict Model Discrimination (e.g. 14C vs 15C, A50 vs A60, Spark, 840)
  const modelMatch = cleanQ.match(/\b(14c|15c|a\d{2}|s\d{2}|note\s*\d+|spark\s*\d+|spark|camon\s*\d+|pova\s*\d+|840|g\d)\b/i);
  if (modelMatch) {
    const targetModel = modelMatch[1].replace(/\s+/g, '').toLowerCase();
    const titleNorm = cleanTitle.replace(/[\s\-_]+/g, '');
    if (!titleNorm.includes(targetModel)) {
      return false;
    }
  }

  // 8. RAM / Storage specification check if user specified (e.g. "8GB RAM")
  const ramMatch = cleanQ.match(/\b(\d+)\s*(?:gb)?\s*ram\b/i);
  if (ramMatch) {
    const targetRam = `${ramMatch[1]}gb`;
    const titleNoSpaces = cleanTitle.replace(/\s+/g, '');
    if (!titleNoSpaces.includes(targetRam) && !titleNoSpaces.includes(`${ramMatch[1]}g`)) {
      return false;
    }
  }

  return true;
}

/**
 * Infer category from title
 */
function inferCategory(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('phone') || t.includes('smartphone') || t.includes('redmi') || t.includes('samsung') || t.includes('itel') || t.includes('tecno')) {
    return 'electronics';
  }
  if (t.includes('laptop') || t.includes('computer') || t.includes('notebook')) {
    return 'electronics';
  }
  if (t.includes('fridge') || t.includes('refrigerator') || t.includes('washing machine') || t.includes('appliance')) {
    return 'appliances';
  }
  if (t.includes('kettle') || t.includes('cooker') || t.includes('blender')) {
    return 'kitchen';
  }
  if (t.includes('light') || t.includes('lamp') || t.includes('bulb')) {
    return 'hardware';
  }
  return 'general';
}

export class KilimallProvider implements SearchProvider {
  readonly id = 'kilimall';
  readonly name = 'Kilimall Kenya';
  readonly requiresAuth = false;

  private readonly timeoutMs = 4500;

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
      // Normalize search term: remove generic category words like "smartphone" if brand is present
      let searchTerm = cleanQ;
      if (/\b(smartphone|smartphones|phone|phones|simu)\b/i.test(cleanQ) && /\b(redmi|xiaomi|samsung|itel|tecno|infinix|oppo)\b/i.test(cleanQ)) {
        searchTerm = cleanQ.replace(/\b(smartphone|smartphones|phone|phones|simu)\b/gi, '').trim();
      }

      const searchUrl = `https://www.kilimall.co.ke/search?q=${encodeURIComponent(searchTerm)}`;

      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 BeiGani/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
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
            message: `Kilimall returned HTTP ${response.status} ${response.statusText}`
          }
        };
      }

      const html = await response.text();
      const parsedItems = extractKilimallNuxtItems(html);

      const normalizedItems: NormalizedPriceResult[] = [];
      const maxResults = options?.maxResults ? Math.min(options.maxResults, 12) : 8;

      for (const item of parsedItems) {
        if (!item || !item.title || !item.price || item.price <= 0) continue;

        // Strict Relevance check
        const isRelevant = isKilimallProductRelevant(item.title, cleanQ, {
          category: options?.category,
          location: options?.location
        });
        if (!isRelevant) continue;

        const validImage = extractRawImageUrl(item.image) || undefined;
        const nowIso = new Date().toISOString();
        const category = inferCategory(item.title);
        const productUrl = `https://www.kilimall.co.ke/listing/${item.listingId}`;

        // Variant extraction
        const storageMatch = item.title.match(/\b(32|64|128|256|512)\s*(?:gb|gig)\b/i);
        const ramMatch = item.title.match(/\b(\d+)\s*(?:gb)?\s*ram\b/i);
        const sizeMatch = item.title.match(/\b(\d+(?:\.\d+)?)\s*(kg|litre|litres|l|inch|inches)\b/i);
        const variant = storageMatch
          ? `${storageMatch[1].toUpperCase()}GB`
          : (ramMatch ? `${ramMatch[1]}GB RAM` : (sizeMatch ? `${sizeMatch[1]}${sizeMatch[2].toLowerCase()}` : undefined));

        normalizedItems.push({
          id: `kilimall-${item.listingId}`,
          name: item.title,
          price: item.price,
          currency: 'KES',
          vendor: 'Kilimall Kenya',
          source: 'Kilimall Kenya',
          sourceName: 'Kilimall Kenya',
          sourceType: 'external',
          acquisitionMethod: 'direct_api',
          url: productUrl,
          sourceUrl: productUrl,
          image: validImage,
          location: 'Nairobi (Nationwide Delivery)',
          county: 'Nairobi',
          timestamp: nowIso,
          retrievedAt: nowIso,
          isVerified: false, // Truthful verification: retailer-sourced listing, unconfirmed by 1P checkout
          notes: 'Direct Kilimall Kenya catalog listing (kilimall.co.ke)',
          category,
          unit: variant || 'unit'
        });

        if (normalizedItems.length >= maxResults) break;
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
          message: isTimeout
            ? `Kilimall query timed out after ${this.timeoutMs}ms`
            : (err?.message || 'Unknown network error querying Kilimall')
        }
      };
    }
  }
}
