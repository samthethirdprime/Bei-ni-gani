// Avechi Kenya Source Connector
// Direct integration with Avechi's public WooCommerce Store API
// Endpoint: https://avechi.co.ke/wp-json/wc/store/v1/products

import { SourceConnector, ExternalListing, SourceConnectorStatus } from './types';
import { SearchQueryAnalysis } from '../../types';

export function isAccessoryQuery(text: string): boolean {
  return /\b(case|cover|screen protector|tempered glass|pouch|charger|cable|skin|housing)\b/i.test(text);
}

export function isAccessoryProduct(text: string): boolean {
  return /\b(case|cover|protector|silicone|leather case|tempered glass|back cover|flip cover)\b/i.test(text);
}

export interface AvechiWcProduct {
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
  }>;
}

/**
 * Decodes common HTML entities returned in WooCommerce product titles
 */
export function decodeHtmlEntities(text: string): string {
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
 * Parse WooCommerce Store API prices using the API's currency metadata.
 * Converts minor currency units to KSh without blindly dividing every value by 100.
 */
export function parseWooCommercePrice(prices?: AvechiWcProduct['prices'] | null): number | null {
  if (!prices || typeof prices !== 'object') {
    return null;
  }

  const rawCandidate = prices.sale_price ?? prices.price ?? prices.regular_price ?? prices.price_range?.min_amount;
  if (rawCandidate === null || rawCandidate === undefined || rawCandidate === '') {
    return null;
  }

  const rawStr = String(rawCandidate).trim();
  const rawNum = parseFloat(rawStr);
  if (isNaN(rawNum) || rawNum <= 0) {
    return null;
  }

  // If raw string already has a decimal point (e.g. "32299.00"), it is already in whole KSh
  if (rawStr.includes('.') && (!prices.currency_decimal_separator || prices.currency_decimal_separator === '.')) {
    return Math.round(rawNum);
  }

  const minorUnits = typeof prices.currency_minor_unit === 'number'
    ? prices.currency_minor_unit
    : (typeof prices.price_range?.currency_minor_unit === 'number' ? prices.price_range.currency_minor_unit : null);

  if (minorUnits !== null && minorUnits > 0) {
    const divisor = Math.pow(10, minorUnits);
    return Math.round(rawNum / divisor);
  }

  if (minorUnits === 0) {
    return Math.round(rawNum);
  }

  return Math.round(rawNum);
}

const KNOWN_BRANDS = [
  'redmi', 'xiaomi', 'itel', 'tecno', 'infinix', 'samsung',
  'apple', 'iphone', 'oppo', 'vivo', 'realme', 'huawei',
  'nokia', 'oneplus', 'google', 'pixel', 'sony', 'tcl',
  'hisense', 'ramtons', 'von', 'mika', 'bruhm', 'lg',
  'whirlpool', 'armco', 'hotpoint', 'syinix', 'vitron'
];

/**
 * Strict product identity & relevance checks for Avechi catalog listings
 */
export function isAvechiProductMatch(
  productName: string,
  query: SearchQueryAnalysis,
  locationFilter?: string
): boolean {
  const qItem = (query.itemQuery || query.rawQuery || '').toLowerCase().trim();
  const lName = productName.toLowerCase().trim();

  // 1. Anti-accessory check
  const wantsAccessory = isAccessoryQuery(qItem);
  const isAccessory = isAccessoryProduct(lName) || /\b(screen replacement|lcd display|charging cable|charger|power adapter|inlet pipe|hose)\b/i.test(lName);
  if (!wantsAccessory && isAccessory) {
    return false;
  }
  if (wantsAccessory && !isAccessory) {
    return false;
  }

  // 2. Lighting vs TV discrimination:
  // "LED lights" must never return a QLED / LED TV
  const isLightingQuery = /\b(led light|led lights|light|lights|bulb|bulbs|strip light|lamp|torch|floodlight)\b/i.test(qItem);
  const isTv = /\b(tv|television|qled tv|smart tv|uhd tv|monitor)\b/i.test(lName);
  if (isLightingQuery && isTv) {
    return false;
  }
  if (qItem.includes('led light') && !/\b(light|lights|bulb|bulbs|strip|lamp|torch)\b/i.test(lName)) {
    return false;
  }

  // 3. Washing machine discrimination
  if (qItem.includes('washing machine') && !lName.includes('washing machine') && !lName.includes('washer')) {
    return false;
  }

  // 4. Kettle discrimination
  if (qItem.includes('kettle') && !lName.includes('kettle')) {
    return false;
  }

  // 5. Strict brand enforcement
  const detectedBrand = (query.detectedBrand || '').toLowerCase();
  if (detectedBrand) {
    if (detectedBrand === 'redmi' && (lName.includes('redmi') || lName.includes('xiaomi'))) {
      // Xiaomi Redmi is acceptable
    } else if (detectedBrand === 'xiaomi' && (lName.includes('xiaomi') || lName.includes('redmi') || lName.includes('mi '))) {
      // Xiaomi Mi / Redmi is acceptable
    } else if (!lName.includes(detectedBrand)) {
      return false;
    }
  } else {
    for (const b of KNOWN_BRANDS) {
      if (new RegExp(`\\b${b}\\b`, 'i').test(qItem)) {
        if (b === 'redmi' && (lName.includes('redmi') || lName.includes('xiaomi'))) continue;
        if (b === 'xiaomi' && (lName.includes('xiaomi') || lName.includes('redmi') || lName.includes('mi '))) continue;
        if (!lName.includes(b)) {
          return false;
        }
      }
    }
  }

  // 6. Strict model discrimination:
  // e.g. "itel A50" must NOT return "itel A60", "Tecno Spark" must match Spark
  const modelMatch = qItem.match(/\b(a\d{2}|s\d{2}|note\s*\d+|spark\s*\d+|spark|camon\s*\d+|pova\s*\d+|hot\s*\d+)\b/i);
  if (modelMatch) {
    const targetModel = modelMatch[1].replace(/\s+/g, '').toLowerCase();
    const lNameNorm = lName.replace(/[\s\-_]+/g, '');
    if (!lNameNorm.includes(targetModel)) {
      return false;
    }
  }

  // 7. Strict location filter:
  // Avechi delivers nationwide in Kenya. If foreign location requested, reject.
  if (locationFilter) {
    const loc = locationFilter.toLowerCase();
    if (loc.includes('uganda') || loc.includes('tanzania') || loc.includes('london') || loc.includes('usa')) {
      return false;
    }
  }

  return true;
}

export class AvechiKenyaConnector implements SourceConnector {
  readonly id = 'avechi-ke';
  readonly name = 'Avechi Kenya';
  readonly displayName = 'Avechi Kenya';
  readonly sourceCategory = 'ELECTRONICS';
  readonly accessMethod = 'PUBLIC_CATALOG';
  readonly officialUrl = 'https://avechi.co.ke';
  readonly supportedCategories = ['electronics', 'smartphones', 'appliances', 'kitchen', 'audio', 'all'];

  private readonly baseUrl = 'https://avechi.co.ke/wp-json/wc/store/v1/products';
  private readonly timeoutMs = 5000;
  private readonly perPage = 8;

  isConfigured(): boolean {
    return true;
  }

  getStatus(): SourceConnectorStatus {
    return {
      online: true,
      isConfigured: true,
      isRealConnection: true,
      connectionType: 'REALTIME_SEARCH_GROUNDING',
      accessMethod: this.accessMethod,
      sourceCategory: this.sourceCategory,
      lastSync: new Date().toISOString(),
      legalNotice: 'Live catalog queries to Avechi Kenya via public WooCommerce Store API (avechi.co.ke).'
    };
  }

  async searchProducts(
    query: SearchQueryAnalysis,
    locationFilter?: string,
    demoMode: boolean = false
  ): Promise<ExternalListing[]> {
    const searchTerm = (query.itemQuery || query.rawQuery || '').trim();
    if (!searchTerm) {
      return [];
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const url = `${this.baseUrl}?search=${encodeURIComponent(searchTerm)}&per_page=${this.perPage}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 BeiGani/1.0',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!res.ok) {
        console.warn(`[AvechiConnector] Store API returned status ${res.status}`);
        return [];
      }

      const products = await res.json();
      if (!Array.isArray(products)) {
        return [];
      }

      const listings: ExternalListing[] = [];

      for (const p of products as AvechiWcProduct[]) {
        if (!p || !p.name || !p.permalink) continue;

        const decodedName = decodeHtmlEntities(p.name);

        // 1. Strict Price Parsing using currency metadata
        const price = parseWooCommercePrice(p.prices);
        if (price === null || price <= 0) {
          // Preserve accuracy: do NOT fabricate missing prices
          continue;
        }

        // 2. Strict Relevance & Anti-Accessory check
        if (!isAvechiProductMatch(decodedName, query, locationFilter)) {
          continue;
        }

        // 3. Exact image extraction without fabrication
        const imgUrl = (p.images && p.images.length > 0) ? (p.images[0].src || p.images[0].thumbnail) : undefined;

        // 4. Variant extraction
        const storageMatch = decodedName.match(/\b(32|64|128|256|512)\s*(?:gb|gig)\b/i);
        const sizeMatch = decodedName.match(/\b(\d+(?:\.\d+)?)\s*(kg|litre|litres|l|inch|inches)\b/i);
        const variant = storageMatch ? `${storageMatch[1].toUpperCase()}GB` : (sizeMatch ? `${sizeMatch[1]}${sizeMatch[2].toLowerCase()}` : undefined);

        // 5. Brand extraction
        const brandMatch = KNOWN_BRANDS.find(b => new RegExp(`\\b${b}\\b`, 'i').test(decodedName));
        const brand = brandMatch ? (brandMatch.charAt(0).toUpperCase() + brandMatch.slice(1)) : undefined;

        listings.push({
          id: `avechi-listing-${p.id}`,
          productId: `avechi-${p.id}`,
          productName: decodedName,
          brand,
          variant,
          category: query.detectedCategory || 'electronics',
          price,
          currency: 'KES',
          vendor: 'Avechi Kenya',
          location: 'Nairobi (Nationwide Delivery)',
          county: 'Nairobi',
          town: 'Nairobi CBD',
          area: 'Pioneer House, Moi Avenue',
          source: 'Avechi Kenya',
          sourceCategory: this.sourceCategory,
          sourceUrl: p.permalink,
          sourceMethod: this.accessMethod,
          availability: p.is_in_stock === false ? 'OUT_OF_STOCK' : 'IN_STOCK',
          dateCollected: 'Today',
          imageUrl: imgUrl,
          imageSource: imgUrl ? 'retailer' : 'fallback',
          isVerified: false, // Honest verification: retailer-sourced listing, unconfirmed by 1P checkout
          isDemo: false
        });
      }

      return listings;
    } catch (err: any) {
      clearTimeout(timeout);
      console.warn('[AvechiConnector] Error querying Avechi Store API:', err?.message || err);
      return [];
    }
  }

  async getProductDetails(productId: string): Promise<ExternalListing | null> {
    return null;
  }

  async getPrices(query: SearchQueryAnalysis): Promise<ExternalListing[]> {
    return this.searchProducts(query);
  }

  async getAvailability(productId: string): Promise<'IN_STOCK' | 'OUT_OF_STOCK' | 'ON_ORDER' | 'UNKNOWN'> {
    return 'UNKNOWN';
  }
}
