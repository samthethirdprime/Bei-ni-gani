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

// Check if a brand string is a synthetic or generic descriptor
function isGenericBrandDescriptor(brand?: string): boolean {
  if (!brand) return false;
  const b = brand.trim().toLowerCase();
  if (/^generic\b/i.test(b)) return true;
  if (/^(unknown|various|unbranded|n\/a|none|generic|no brand)$/i.test(b)) return true;
  return false;
}

// Clean product name for discovery search query without losing core nouns
function cleanProductQueryName(name: string): string {
  let n = name;
  if (n.includes('(') && n.includes('/')) {
    // Keep alternative product/brand names without parens/slashes
    n = n.replace(/[\/\\()]/g, ' ');
  } else {
    // Strip technical spec or size parentheticals like (Pair of 10kg), (3.0 HP Motor), (10mm NBR)
    n = n.replace(/\([^)]*\)/g, ' ');
  }
  return n
    .replace(/\b(non-slip|high density)\b/gi, '')
    .replace(/[\/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract concise size / unit token to prevent query bloating
function cleanProductSize(size?: string): string {
  if (!size) return '';
  const unitMatch = size.match(/\b\d+(?:\.\d+)?\s*(?:kg|g|ml|l|ltr|mm|cm|m)\b/i);
  if (unitMatch && !size.includes('/')) return unitMatch[0];
  if (size.length <= 12 && !size.includes('/') && !size.includes('doorway')) {
    return size.replace(/\([^)]*\)/g, '').trim();
  }
  return '';
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

  // Reject spare parts, replacement components, and manuals
  const nonProductRegex = /\b(spare parts|replacement motor|drive motor|circuit board|repair manual|belt replacement)\b/i;
  if (nonProductRegex.test(titleLower)) return false;

  // 4. Reject if file extension indicates non-image format
  if (/\.(svg|pdf|gif|ico|bmp)(\?|$)/i.test(murlLower)) return false;

  // 5. Brand validation: distinguish between:
  // - Real, explicitly identified manufacturer
  // - Generic descriptor such as "Generic Leather"
  // - Composite brand field containing alternatives separated by "/" (e.g. "NordicTrack / ProForm")
  if (params.brand && params.brand.trim().length > 1) {
    const rawBrand = params.brand.trim();
    const brandLower = rawBrand.toLowerCase();

    const isGeneric = isGenericBrandDescriptor(rawBrand);
    if (!isGeneric) {
      if (rawBrand.includes('/')) {
        // Composite brand field: accept genuine match to an individual explicitly listed brand
        const subBrands = rawBrand
          .split('/')
          .map(b => b.trim().toLowerCase())
          .filter(b => b.length > 1 && !isGenericBrandDescriptor(b));

        if (subBrands.length > 0) {
          const hasAnySubBrand = subBrands.some(b => {
            const bNoSpace = b.replace(/[^a-z0-9]/g, '');
            return titleLower.includes(b) ||
              purlLower.includes(b) ||
              murlLower.includes(b) ||
              (bNoSpace.length > 2 && (titleLower.replace(/[^a-z0-9]/g, '').includes(bNoSpace) || purlLower.includes(bNoSpace)));
          });

          if (!hasAnySubBrand) return false;
        }
      } else {
        // Real, explicitly identified single manufacturer: match with spacing and case normalization
        const bNoSpace = brandLower.replace(/[^a-z0-9]/g, '');
        const bSpaced = brandLower.replace(/([a-z])([0-9a-z])/g, '$1 $2');
        const titleNoSpace = titleLower.replace(/[^a-z0-9]/g, '');

        const hasBrand = titleLower.includes(brandLower) ||
          purlLower.includes(brandLower) ||
          murlLower.includes(brandLower) ||
          titleLower.includes(bSpaced) ||
          (bNoSpace.length > 2 && (titleNoSpace.includes(bNoSpace) || purlLower.includes(bNoSpace)));

        if (!hasBrand) return false;
      }
    }
    // For generic descriptors (e.g. "Generic Leather"), do not require literal string in title or URL.
    // Continue checking core tokens, category relevance, and anti-collision guards below.
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
  if ((nameLower.includes('bottled water') || nameLower.includes('drinking water')) &&
      (titleLower.includes('watermelon') || titleLower.includes('tikiti'))) {
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
  const queryName = cleanProductQueryName(cleanName);
  const isGeneric = isGenericBrandDescriptor(params.brand);

  let brandPrefix = '';
  if (params.brand && !isGeneric) {
    const primary = params.brand.includes('/') ? params.brand.split('/')[0].trim() : params.brand.trim();
    if (primary && !queryName.toLowerCase().includes(primary.toLowerCase())) {
      brandPrefix = `${primary} `;
    }
  }

  const s = cleanProductSize(params.size);
  let sizeSuffix = '';
  if (s && !queryName.toLowerCase().includes(s.toLowerCase())) {
    sizeSuffix = ` ${s}`;
  }

  const searchQuery = `${brandPrefix}${queryName}${sizeSuffix}`.trim();

  try {
    const url = `https://www.bing.com/images/search?q=${encodeURIComponent(searchQuery)}&form=HDRSC2`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
        'Cookie': 'SRCHHPGUSR=ADLT=OFF;'
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
          let finalImageUrl = murl;

          // Probe candidate reachability to prevent returning 404 or anti-bot challenge pages
          try {
            const probeController = new AbortController();
            const probeTimeout = setTimeout(() => probeController.abort(), 2000);
            const probeRes = await fetch(murl, {
              method: 'HEAD',
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'image/*,*/*;q=0.8'
              },
              signal: probeController.signal
            });
            clearTimeout(probeTimeout);
            const ct = (probeRes.headers.get('content-type') || '').toLowerCase();
            if (!probeRes.ok || ct.includes('text/html')) {
              if (data.turl && typeof data.turl === 'string' && data.turl.startsWith('http')) {
                finalImageUrl = data.turl;
              } else {
                continue;
              }
            }
          } catch {
            if (data.turl && typeof data.turl === 'string' && data.turl.startsWith('http')) {
              finalImageUrl = data.turl;
            }
          }

          const result: DiscoveredImageResult = {
            imageUrl: finalImageUrl,
            thumbnailUrl: data.turl || finalImageUrl,
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
