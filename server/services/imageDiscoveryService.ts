// Server-side dynamic product photograph discovery service
// Searches for authentic product photographs for products without retailer images or local fallbacks

export interface DiscoveredImageResult {
  imageUrl: string;
  thumbnailUrl?: string;
  title: string;
  pageUrl?: string;
  source?: string;
  imageSource: 'discovered';
}

export interface ImageDiscoveryParams {
  name: string;
  category?: string;
  brand?: string;
  size?: string;
  type?: string;
}

// In-memory cache to prevent repeated lookups across requests
const imageDiscoveryCache = new Map<string, { result: DiscoveredImageResult | null; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

// Clean and normalize cache key
function getCacheKey(params: ImageDiscoveryParams): string {
  const n = (params.name || '').toLowerCase().trim();
  const b = (params.brand || '').toLowerCase().trim();
  const s = (params.size || '').toLowerCase().trim();
  const c = (params.category || '').toLowerCase().trim();
  return `${n}|${b}|${s}|${c}`;
}

// Extract retailer/vendor name from page URL
function extractSourceFromUrl(purl: string): string {
  if (!purl) return 'Web Discovery';
  try {
    const host = new URL(purl).hostname.toLowerCase();
    if (host.includes('carrefour.ke') || host.includes('carrefourkenya')) return 'Carrefour Kenya';
    if (host.includes('jumia.co.ke')) return 'Jumia Kenya';
    if (host.includes('naivas.online') || host.includes('naivas.co.ke')) return 'Naivas Supermarket';
    if (host.includes('quickmart.co.ke')) return 'Quickmart Supermarket';
    if (host.includes('phoneplacekenya.com')) return 'Phoneplace Kenya';
    if (host.includes('avechi.co.ke')) return 'Avechi Kenya';
    if (host.includes('ebuild.ke')) return 'Ebuild Kenya';
    if (host.includes('bamburicement.com') || host.includes('bamburi')) return 'Bamburi Cement';
    if (host.includes('kenchic.com')) return 'Kenchic Kenya';
    if (host.includes('brookside.co.ke')) return 'Brookside Dairy';
    if (host.includes('broadways.co.ke')) return 'Broadways Bakery';
    return host.replace(/^www\./, '');
  } catch {
    return 'Web Discovery';
  }
}

// Validate candidate image against strict criteria
export function validateCandidateImage(
  murl: string,
  title: string,
  purl: string,
  params: ImageDiscoveryParams
): boolean {
  if (!murl || typeof murl !== 'string') return false;

  // 1. Basic URL protocol check
  if (!murl.startsWith('http://') && !murl.startsWith('https://')) return false;

  const murlLower = murl.toLowerCase();
  const titleLower = (title || '').toLowerCase();
  const purlLower = (purl || '').toLowerCase();
  const nameLower = (params.name || '').toLowerCase();

  // 2. Reject Unsplash images per instructions
  if (murlLower.includes('unsplash.com')) return false;

  // 3. Reject non-photographic assets: cartoons, illustrations, logos, banners, clipart, vectors
  const nonPhotoRegex = /\b(logo|site-logo|favicon|banner|badge|vector|clipart|cartoon|illustration|drawing|sketch|watermark|screenshot|placeholder|avatar)\b/i;
  if (nonPhotoRegex.test(murlLower)) return false;
  if (nonPhotoRegex.test(titleLower)) return false;

  // 4. Reject if file extension indicates non-image format
  if (/\.(svg|pdf|gif|ico|bmp)(\?|$)/i.test(murlLower)) return false;

  // 5. Brand validation: If brand is specified, the brand MUST be present in title, page URL, or image URL
  if (params.brand && params.brand.trim().length > 1) {
    const brandLower = params.brand.toLowerCase().trim();
    const hasBrand = titleLower.includes(brandLower) || purlLower.includes(brandLower) || murlLower.includes(brandLower);
    if (!hasBrand) return false;
  }

  // 6. Core tokens matching: The product type/name core nouns must match
  const stopWords = new Set([
    'buy', 'price', 'online', 'kenya', 'in', 'for', 'sale', 'best', 'the', 'and', 'with', 'per',
    'kg', 'g', 'ml', 'l', 'ltr', 'genuine', 'original', 'cheap', 'latest', 'order', 'shop'
  ]);
  const tokens = nameLower
    .replace(/[^a-z0-9]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !stopWords.has(t));

  if (tokens.length > 0) {
    const hasMatch = tokens.some(t => {
      const singular = t.endsWith('s') ? t.slice(0, -1) : t;
      return titleLower.includes(t) || titleLower.includes(singular) || purlLower.includes(t) || murlLower.includes(t);
    });
    if (!hasMatch) return false;
  }

  // 7. Strict anti-collision guards:
  // Watermelon vs bottled water
  if ((nameLower.includes('watermelon') || nameLower.includes('tikiti')) &&
      (titleLower.includes('bottled water') || titleLower.includes('water tank') || titleLower.includes('mineral water'))) {
    return false;
  }

  // Meat / butchery vs pet food
  if ((nameLower.includes('beef') || nameLower.includes('chicken') || nameLower.includes('meat')) &&
      (titleLower.includes('dog food') || titleLower.includes('cat food') || titleLower.includes('pet food') || titleLower.includes('chicken feed'))) {
    return false;
  }

  // Underwear vs boxing gear
  if (nameLower.includes('boxer') && (titleLower.includes('gloves') || titleLower.includes('ring') || titleLower.includes('punching'))) {
    return false;
  }

  return true;
}

// Discover product photograph from public index
export async function discoverProductPhotograph(
  params: ImageDiscoveryParams
): Promise<DiscoveredImageResult | null> {
  const cleanName = (params.name || '').trim();
  if (!cleanName || cleanName.length < 2) return null;

  const cacheKey = getCacheKey(params);
  const cached = imageDiscoveryCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.result;
  }

  // Construct highly specific product photograph query
  const brandPrefix = params.brand && !cleanName.toLowerCase().includes(params.brand.toLowerCase())
    ? `${params.brand} `
    : '';
  const sizeSuffix = params.size && !cleanName.toLowerCase().includes(params.size.toLowerCase())
    ? ` ${params.size}`
    : '';
  const searchQuery = `${brandPrefix}${cleanName}${sizeSuffix} product photo Kenya`.trim();

  try {
    const url = `https://www.bing.com/images/search?q=${encodeURIComponent(searchQuery)}&first=1&scenario=ImageBasicHover`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) {
      imageDiscoveryCache.set(cacheKey, { result: null, timestamp: Date.now() });
      return null;
    }

    const html = await res.text();
    const matches = [...html.matchAll(/<a[^>]+class="iusc"[^>]*m="([^"]+)"/gi)];

    for (const match of matches) {
      try {
        const rawJson = match[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
        const data = JSON.parse(rawJson);
        const murl = data.murl;
        const title = data.t || data.desc || cleanName;
        const purl = data.purl || '';

        if (validateCandidateImage(murl, title, purl, params)) {
          const result: DiscoveredImageResult = {
            imageUrl: murl,
            thumbnailUrl: data.turl || murl,
            title,
            pageUrl: purl,
            source: extractSourceFromUrl(purl),
            imageSource: 'discovered'
          };
          imageDiscoveryCache.set(cacheKey, { result, timestamp: Date.now() });
          return result;
        }
      } catch {
        // Skip parsing failure
      }
    }

    // No valid image found, cache failure to prevent repeated lookups
    imageDiscoveryCache.set(cacheKey, { result: null, timestamp: Date.now() });
    return null;
  } catch (error) {
    imageDiscoveryCache.set(cacheKey, { result: null, timestamp: Date.now() });
    return null;
  }
}
