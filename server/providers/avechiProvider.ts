// Avechi Kenya Direct WooCommerce Store API Provider
// Fetches genuine product listings from https://avechi.co.ke/wp-json/wc/store/v1/products

import { SearchProvider, ProviderSearchResult, NormalizedPriceResult, SearchOptions, extractRawImageUrl } from './types';

export interface AvechiRawProduct {
  id: number;
  name: string;
  slug?: string;
  permalink: string;
  description?: string;
  short_description?: string;
  prices?: {
    price?: string | number | null;
    regular_price?: string | number | null;
    sale_price?: string | number | null;
    price_range?: {
      min_amount?: string | number | null;
      max_amount?: string | number | null;
      currency_minor_unit?: number | null;
    } | null;
    currency_code?: string;
    currency_symbol?: string;
    currency_minor_unit?: number | null;
    currency_decimal_separator?: string;
    currency_thousand_separator?: string;
    currency_prefix?: string;
    currency_suffix?: string;
  };
  images?: Array<{
    id?: number;
    src: string;
    thumbnail?: string;
    name?: string;
    alt?: string;
  }>;
  is_in_stock?: boolean;
  categories?: Array<{
    id?: number;
    name?: string;
    slug?: string;
    link?: string;
  }>;
}

/**
 * Decodes common HTML entities returned in WooCommerce product titles
 */
export function cleanHtmlEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/&#8221;/g, '"')
    .replace(/&#8220;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#215;/g, 'x')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

/**
 * WooCommerce Store API price parser with strict currency metadata inspection.
 * Converts minor currency units (e.g. cents) to whole KSh without blindly dividing every value by 100.
 */
export function parseWooCommercePrice(prices?: AvechiRawProduct['prices'] | null): number | null {
  if (!prices || typeof prices !== 'object') {
    return null;
  }

  // Determine the raw price field to inspect: sale_price -> price -> regular_price -> price_range.min_amount
  const candidateRaw = prices.sale_price ?? prices.price ?? prices.regular_price ?? prices.price_range?.min_amount;
  if (candidateRaw === null || candidateRaw === undefined || candidateRaw === '') {
    return null;
  }

  const rawStr = String(candidateRaw).trim();
  const rawNum = parseFloat(rawStr);
  if (isNaN(rawNum) || rawNum <= 0) {
    return null;
  }

  // If the raw string explicitly contains a decimal point and no decimal separator metadata,
  // it is already expressed in major currency units (e.g. "32299.00" -> 32299)
  if (rawStr.includes('.') && (!prices.currency_decimal_separator || prices.currency_decimal_separator === '.')) {
    return Math.round(rawNum);
  }

  // Inspect the API's currency metadata for minor units
  const minorUnits = typeof prices.currency_minor_unit === 'number'
    ? prices.currency_minor_unit
    : (typeof prices.price_range?.currency_minor_unit === 'number' ? prices.price_range.currency_minor_unit : null);

  if (minorUnits !== null && minorUnits > 0) {
    const divisor = Math.pow(10, minorUnits);
    return Math.round(rawNum / divisor);
  }

  // If minor units is explicitly 0, the value is already in whole KSh (do NOT divide)
  if (minorUnits === 0) {
    return Math.round(rawNum);
  }

  // If no minor unit metadata is provided, do NOT blindly divide
  return Math.round(rawNum);
}

/**
 * Check if a text is an accessory rather than the main product
 */
export function isAccessoryTerm(text: string): boolean {
  return /\b(case|cover|protector|tempered glass|screen replacement|lcd display|charging cable|charger|power adapter|silicone case|flip cover|pouch|holster|strap|lens protector|inlet pipe|hose|spare part|repair kit)\b/i.test(text);
}

/**
 * Known tech & electronics brands for strict brand verification
 */
const KNOWN_BRANDS = [
  'redmi', 'xiaomi', 'itel', 'tecno', 'infinix', 'samsung',
  'apple', 'iphone', 'oppo', 'vivo', 'realme', 'huawei',
  'nokia', 'oneplus', 'google', 'pixel', 'sony', 'tcl',
  'hisense', 'ramtons', 'von', 'mika', 'bruhm', 'lg',
  'whirlpool', 'armco', 'hotpoint', 'syinix', 'vitron'
];

/**
 * Strict relevance check for Avechi products:
 * Enforces brand, model, product type, anti-accessory, and location constraints.
 */
export function isAvechiProductRelevant(
  productName: string,
  rawQuery: string,
  options?: { category?: string; location?: string }
): boolean {
  const cleanQ = rawQuery.toLowerCase().trim();
  const cleanName = productName.toLowerCase().trim();

  // 1. Anti-accessory check:
  // If user searched for a device (e.g. "Redmi Note 14"), do NOT return an accessory (case, cover, protector)
  const queryWantsAccessory = isAccessoryTerm(cleanQ);
  const productIsAccessory = isAccessoryTerm(cleanName);
  if (!queryWantsAccessory && productIsAccessory) {
    return false;
  }
  if (queryWantsAccessory && !productIsAccessory) {
    return false;
  }

  // 2. Strict Lighting vs TV check:
  // "LED lights" or "LED bulbs" must NOT return LED TVs (e.g. TCL QLED TV)
  const isLightingQuery = /\b(led light|led lights|light|lights|bulb|bulbs|strip light|strip lights|floodlight|downlight|lamp|torch)\b/i.test(cleanQ);
  const isTvProduct = /\b(tv|television|qled tv|smart tv|uhd tv|curved tv|monitor)\b/i.test(cleanName);
  if (isLightingQuery && isTvProduct) {
    return false;
  }
  if (cleanQ.includes('led light') && !/\b(light|lights|bulb|bulbs|strip|lamp|torch|downlight)\b/i.test(cleanName)) {
    return false;
  }

  // 3. Washing machine check:
  if (cleanQ.includes('washing machine')) {
    if (!cleanName.includes('washing machine') && !cleanName.includes('washer')) {
      return false;
    }
  }

  // 4. Kettle check:
  if (cleanQ.includes('kettle')) {
    if (!cleanName.includes('kettle')) {
      return false;
    }
  }

  // 5. Strict Brand check:
  // If user explicitly named a known brand, the product MUST match that brand
  for (const brand of KNOWN_BRANDS) {
    const brandRegex = new RegExp(`\\b${brand}\\b`, 'i');
    if (brandRegex.test(cleanQ)) {
      // Note: "Redmi" products are manufactured by "Xiaomi" and often named "Xiaomi Redmi ..."
      if (brand === 'redmi' && (cleanName.includes('redmi') || cleanName.includes('xiaomi'))) {
        continue;
      }
      if (brand === 'xiaomi' && (cleanName.includes('xiaomi') || cleanName.includes('redmi') || cleanName.includes('mi '))) {
        continue;
      }
      if (!cleanName.includes(brand)) {
        return false;
      }
    }
  }

  // 6. Strict Model check:
  // e.g. "A50" vs "A60", "Spark", "Note 14" vs "Note 13"
  const modelPattern = cleanQ.match(/\b(a\d{2}|s\d{2}|note\s*\d+|spark\s*\d+|spark|camon\s*\d+|pova\s*\d+|hot\s*\d+|smart\s*\d+)\b/i);
  if (modelPattern) {
    const targetModel = modelPattern[1].replace(/\s+/g, '').toLowerCase();
    const nameNoSpaces = cleanName.replace(/[\s\-_]+/g, '');
    if (!nameNoSpaces.includes(targetModel)) {
      return false;
    }
  }

  // 7. Token Coverage: Ensure significant tokens from query appear in product name
  const stopWords = new Set(['price', 'in', 'kenya', 'ksh', 'kes', 'bei', 'ya', 'gani', 'buy', 'cost', 'how', 'much', 'for', 'and', 'the', 'with', 'cheap']);
  const queryTokens = cleanQ
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !stopWords.has(t));

  if (queryTokens.length > 0) {
    // If brand was already matched, at least one remaining specific token must match
    const matchesAny = queryTokens.some(token => cleanName.includes(token));
    if (!matchesAny) {
      return false;
    }
  }

  // 8. Location constraint:
  // Avechi is a Kenyan national retailer (Nairobi store + nationwide delivery).
  // If location requested is outside Kenya (e.g. Uganda, London, USA), reject.
  if (options?.location) {
    const locLower = options.location.toLowerCase();
    if (locLower.includes('uganda') || locLower.includes('tanzania') || locLower.includes('london') || locLower.includes('usa')) {
      return false;
    }
  }

  return true;
}

/**
 * Infer category from Avechi product details
 */
function inferCategory(product: AvechiRawProduct): string {
  const catNames = (product.categories || []).map(c => (c.name || '').toLowerCase()).join(' ');
  const name = product.name.toLowerCase();

  if (catNames.includes('smartphone') || name.includes('phone') || name.includes('4g') || name.includes('5g')) {
    return 'electronics';
  }
  if (catNames.includes('tv') || catNames.includes('audio') || catNames.includes('speaker')) {
    return 'electronics';
  }
  if (catNames.includes('kitchen') || name.includes('kettle') || name.includes('cooker') || name.includes('microwave')) {
    return 'kitchen';
  }
  if (catNames.includes('appliance') || name.includes('washing machine') || name.includes('refrigerator') || name.includes('fridge')) {
    return 'appliances';
  }
  return 'electronics';
}

/**
 * Extract size or storage variant from product name
 */
function extractVariant(name: string): string | undefined {
  const storage = name.match(/\b(32|64|128|256|512)\s*(?:gb|gig)\b/i);
  if (storage) return `${storage[1].toUpperCase()}GB`;

  const size = name.match(/\b(\d+(?:\.\d+)?)\s*(kg|litre|litres|l|inch|inches|cm)\b/i);
  if (size) return `${size[1]}${size[2].toLowerCase()}`;

  return undefined;
}

export class AvechiProvider implements SearchProvider {
  readonly id = 'avechi';
  readonly name = 'Avechi Kenya';
  readonly requiresAuth = false;

  private readonly baseUrl = 'https://avechi.co.ke/wp-json/wc/store/v1/products';
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
      // For broad queries like "Redmi smartphone", query the core brand keyword on the retailer API
      let searchTerm = cleanQ;
      if (/\b(smartphone|smartphones|phone|phones|simu)\b/i.test(cleanQ) && /\b(redmi|xiaomi|samsung|itel|tecno|infinix|oppo|vivo)\b/i.test(cleanQ)) {
        searchTerm = cleanQ.replace(/\b(smartphone|smartphones|phone|phones|simu)\b/gi, '').trim();
      }

      const perPage = options?.maxResults ? Math.min(options.maxResults, 12) : this.defaultPerPage;
      const searchUrl = `${this.baseUrl}?search=${encodeURIComponent(searchTerm)}&per_page=${perPage}`;

      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 BeiGani/1.0',
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
            message: `Avechi Store API returned HTTP ${response.status} ${response.statusText}`
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
            message: 'Avechi Store API response was not an array of products'
          }
        };
      }

      const normalizedItems: NormalizedPriceResult[] = [];

      for (const raw of rawItems as AvechiRawProduct[]) {
        if (!raw || !raw.name || !raw.permalink) {
          continue;
        }

        const decodedName = cleanHtmlEntities(raw.name);

        // 1. Strict Price Parsing using currency metadata
        const price = parseWooCommercePrice(raw.prices);
        if (price === null || price <= 0) {
          // Do NOT fabricate missing prices
          continue;
        }

        // 2. Strict Relevance & Anti-Accessory check
        const isRelevant = isAvechiProductRelevant(decodedName, cleanQ, {
          category: options?.category,
          location: options?.location
        });
        if (!isRelevant) {
          continue;
        }

        // 3. Image URL extraction (preserves exact source, never fabricates)
        const rawImage = raw.images && raw.images.length > 0 ? (raw.images[0].src || raw.images[0].thumbnail) : undefined;
        const imageUrl = extractRawImageUrl(rawImage) || undefined;

        // 4. Variant & Category
        const variant = extractVariant(decodedName);
        const category = inferCategory(raw);

        // 5. Accurate provenance:
        // Retailer-sourced listing with honest verification status:
        // isVerified = false (requires direct 1P checkout / authorized live order verification to be "Verified Live")
        const nowIso = new Date().toISOString();
        normalizedItems.push({
          id: `avechi-${raw.id}`,
          name: decodedName,
          price,
          currency: 'KES',
          vendor: 'Avechi Kenya',
          source: 'Avechi Kenya',
          sourceName: 'Avechi Kenya',
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
          notes: 'Direct WooCommerce Store API catalog listing (avechi.co.ke)',
          category,
          unit: variant || 'unit'
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
          message: isTimeout
            ? `Avechi Store API query timed out after ${this.timeoutMs}ms`
            : (err?.message || 'Unknown network error querying Avechi Store API')
        }
      };
    }
  }
}
