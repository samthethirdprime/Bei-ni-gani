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
export function isGenericBrandDescriptor(brand?: string): boolean {
  if (!brand) return false;
  const b = brand.trim().toLowerCase();
  if (/^generic\b/i.test(b)) return true;
  if (/^(unknown|various|unbranded|n\/a|none|generic|no brand|speedfit|powerfit)$/i.test(b)) return true;
  return false;
}

// Clean product name for discovery search query without losing core nouns
export function cleanProductQueryName(name: string): string {
  let n = name;

  // Strip price intelligence and retailer snippet boilerplate
  n = n.replace(/\s*(?:reported\s+)?price\s+in\s+kenya.*$/i, '');
  n = n.replace(/\s*\|\s*(?:agrisoko|buy\s+online|selina\s+wamucii|mahitaji|naivas|gobeba|taste\s+kenya|jumia|kilimall|jiji).*$/i, '');
  n = n.replace(/\s*-\s*(?:selina\s+wamucii|mahitaji|naivas|gobeba|taste\s+kenya|jumia|kilimall|jiji).*$/i, '');
  n = n.replace(/\s*KES\s*\d+.*$/i, '');

  if (n.includes('(') && n.includes('/')) {
    // Keep alternative product/brand names without parens/slashes
    n = n.replace(/[\/\\()]/g, ' ');
  } else {
    // Strip technical spec or size parentheticals like (Pair of 10kg), (3.0 HP Motor), (10mm NBR)
    n = n.replace(/\([^)]*\)/g, ' ');
  }

  let cleaned = n
    .replace(/\b(non-slip|high density)\b/gi, '')
    .replace(/[\/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const lower = cleaned.toLowerCase();

  // Enhance product relevance for specific ambiguous terms
  if (/\bfortified\s+maize\s+flour\b/i.test(lower)) {
    cleaned = 'fortified sifted maize flour 2kg kenya';
  } else if (/\b(maize flour|unga wa ugali)\b/i.test(lower)) {
    cleaned = 'sifted maize meal unga wa ugali 2kg kenya';
  } else if (/\bfortified\s+wheat\s+flour\b/i.test(lower)) {
    cleaned = 'fortified home baking wheat flour 2kg';
  } else if (/\b(wheat flour|unga wa ngano)\b/i.test(lower)) {
    cleaned = 'home baking wheat flour 2kg';
  } else if (lower === 'laptop' || lower === 'laptops') {
    cleaned = 'laptop computer notebook';
  } else if (/\b(multimedia speaker|speaker system|speakers?)\b/i.test(lower) && !/\b(subwoofer)\b/i.test(lower)) {
    cleaned = `${cleaned} with subwoofer`;
  } else if (/\b(water dispenser)\b/i.test(lower)) {
    cleaned = 'water dispenser hot and cold appliance';
  } else if (/\b(adult wellness|sexual wellness)\b/i.test(lower)) {
    cleaned = 'personal wellness intimate care retail packaging';
  } else if (/\b(dildo|dildos)\b/i.test(lower)) {
    cleaned = 'silicone personal body massager retail product';
  } else if (/\b(tv\s+stand|tv\s+console)\b/i.test(lower)) {
    cleaned = 'tv stand console entertainment unit furniture';
  } else if ((lower === "men's classic leather" || lower === "mens classic leather" || lower === "classic leather") && !/\b(loafer|shoe|shoes)\b/i.test(lower)) {
    cleaned = `${cleaned} formal loafers shoes`;
  }

  return cleaned;
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

  // 3. Reject non-photographic assets: cartoons, illustrations, logos, banners, clipart, vectors, presentation slides
  const nonPhotoRegex = /\b(logo|site-logo|favicon|banner|badge|vector|clipart|cartoon|illustration|drawing|sketch|watermark|screenshot|placeholder|avatar|coloring\s*page|stock\s*vector|slide|slides|presentation|powerpoint|презентация|mockup|packaging\s*design|design\s*on\s*kraft|kraft\s*paper\s*design)\b/i;
  if (nonPhotoRegex.test(murlLower)) return false;
  if (nonPhotoRegex.test(titleLower)) return false;

  // Reject known watermark stock image domains, AI image portals, design portfolios, and slow/challenge B2B wholesale portals
  const stockWatermarkDomains = /\b(dreamstime\.com|vecteezy\.com|shutterstock\.com|istockphoto\.com|alamy\.com|freepik\.com|123rf\.com|depositphotos\.com|vectorstock\.com|canstockphoto\.com|imimg\.com|tradeindia\.com|exportersindia\.com|ppt-online\.org|slideshare\.net|stablediffusionweb\.com|craiyon\.com|behance\.net|dribbble\.com)\b/i;
  if (stockWatermarkDomains.test(murlLower) || stockWatermarkDomains.test(purlLower)) return false;

  // Reject CDNs returning 53-byte HTML challenge pages or protocol errors
  if (murlLower.includes('cdn.mafrservices.com')) return false;

  // Reject spare parts, replacement components, and manuals
  const nonProductRegex = /\b(spare parts|replacement motor|drive motor|circuit board|repair manual|belt replacement|disassembly|teardown)\b/i;
  if (nonProductRegex.test(titleLower)) return false;

  // 4. Reject if file extension indicates non-image format
  if (/\.(svg|pdf|gif|ico|bmp)(\?|$)/i.test(murlLower)) return false;

  // 5. Brand validation: distinguish between:
  // - Real, explicitly identified manufacturer
  // - Generic descriptor such as "Generic Leather", "SpeedFit", "PowerFit"
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
            const bSpaced = b.replace(/([a-z])([0-9a-z])/g, '$1 $2');
            return titleLower.includes(b) ||
              purlLower.includes(b) ||
              murlLower.includes(b) ||
              titleLower.includes(bSpaced) ||
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
  }

  // 6. Strict anti-collision guards and specific product category requirements:
  // Watermelon vs bottled water
  if ((nameLower.includes('watermelon') || nameLower.includes('tikiti')) &&
      (titleLower.includes('bottled water') || titleLower.includes('water tank') || titleLower.includes('mineral water') || titleLower.includes('drinking water'))) {
    return false;
  }
  if ((nameLower.includes('bottled water') || nameLower.includes('drinking water') || nameLower.includes('mineral water')) &&
      (titleLower.includes('watermelon') || titleLower.includes('tikiti') || titleLower.includes('water tank') || titleLower.includes('water pump') || titleLower.includes('water heater'))) {
    return false;
  }

  // Wheat flour vs maize flour & raw grains
  if (nameLower.includes('wheat flour') || nameLower.includes('ngano')) {
    if (titleLower.includes('maize flour') || titleLower.includes('corn flour') || titleLower.includes('cornmeal') || titleLower.includes('ugali') || titleLower.includes('maize meal')) {
      return false;
    }
    // Reject loose unground raw grains or fields when seeking flour
    if (/\b(wheat berries|wheat grass|wheat crop|wheat field|raw grain|wheat stalk)\b/i.test(titleLower)) {
      return false;
    }
    if (!titleLower.includes('flour') && !titleLower.includes('atta') && !titleLower.includes('unga') && !titleLower.includes('baking') && !purlLower.includes('flour')) {
      return false;
    }
  }
  if (nameLower.includes('maize flour') || nameLower.includes('corn flour') || nameLower.includes('maize meal') || nameLower.includes('ugali')) {
    if (titleLower.includes('wheat flour') || titleLower.includes('baking flour') || titleLower.includes('all purpose flour') || titleLower.includes('ngano')) {
      return false;
    }
  }

  // Laptop vs desktop monitors, TVs, and accessories
  if (nameLower.includes('laptop') || nameLower.includes('notebook')) {
    if (/\b(desktop monitor|computer monitor|curved monitor|gaming monitor|monitor only|pc monitor|lcd monitor|tv monitor|desktop pc|all-in-one pc|laptop bag|laptop sleeve|laptop case|laptop backpack|laptop stand|laptop skin|sticker|docking station|keyboard cover|laptop charger|power adapter)\b/i.test(titleLower) &&
        !/\b(touch-screen laptop|gaming laptop|notebook laptop|core i\d|ryzen|chromebook|macbook)\b/i.test(titleLower)) {
      return false;
    }
    if (!titleLower.includes('laptop') && !titleLower.includes('notebook') && !titleLower.includes('macbook') && !titleLower.includes('chromebook') && !purlLower.includes('laptop')) {
      return false;
    }
  }

  // Multimedia speaker system vs headphones / earphones / earbuds / televisions
  if (nameLower.includes('speaker system') || nameLower.includes('multimedia speaker') || nameLower.includes('speaker') || nameLower.includes('subwoofer')) {
    if (/\b(headphone|headphones|headset|headsets|earphone|earphones|earbud|earbuds|airpod|airpods|in-ear|over-ear|tv|television)\b/i.test(titleLower)) {
      return false;
    }
    if (!titleLower.includes('speaker') && !titleLower.includes('subwoofer') && !titleLower.includes('soundbar') && !purlLower.includes('speaker')) {
      return false;
    }
  }

  // Water dispenser vs bottled water / water bottles
  if (nameLower.includes('dispenser') && (nameLower.includes('water') || nameLower.includes('maji'))) {
    if (/\b(bottled water|water bottle|mineral water|drinking water bottle|watermelon|tikiti)\b/i.test(titleLower) && !titleLower.includes('dispenser')) {
      return false;
    }
    if (!titleLower.includes('dispenser') && !purlLower.includes('dispenser')) {
      return false;
    }
  }

  // TV stand / console vs television screen
  if (nameLower.includes('tv stand') || nameLower.includes('television stand') || nameLower.includes('tv unit') || nameLower.includes('tv console') || nameLower.includes('entertainment unit')) {
    if (/\b(smart tv|led tv|oled tv|qled tv|android tv|frameless tv|television set|inch tv|tv screen)\b/i.test(titleLower) && !/\b(stand|console|unit|cabinet|rack|shelf|table|mount)\b/i.test(titleLower)) {
      return false;
    }
    if (!titleLower.includes('stand') && !titleLower.includes('console') && !titleLower.includes('unit') && !titleLower.includes('cabinet') && !titleLower.includes('shelf') && !titleLower.includes('table') && !purlLower.includes('stand')) {
      return false;
    }
  }

  // Adult wellness vs explicit dildos
  if (nameLower.includes('dildo')) {
    if (!titleLower.includes('dildo') && !titleLower.includes('massager') && !purlLower.includes('dildo') && !purlLower.includes('massager')) {
      return false;
    }
  } else if (nameLower.includes('adult wellness') || nameLower.includes('sexual wellness')) {
    if (titleLower.includes('dildo') && !titleLower.includes('wellness') && !titleLower.includes('care')) {
      return false;
    }
  }

  // Formal leather loafers vs athletic running shoes / sneakers
  if (nameLower.includes('loafer') || (nameLower.includes('classic leather') && !nameLower.includes('reebok'))) {
    if (/\b(running shoe|running shoes|sneaker|sneakers|athletic shoe|athletic shoes|trainers|cleats|trail running)\b/i.test(titleLower)) {
      return false;
    }
  }

  // Dumbbells
  if (nameLower.includes('dumbbell')) {
    if (!titleLower.includes('dumbbell') && !titleLower.includes('dumbbells') && !titleLower.includes('hex') && !purlLower.includes('dumbbell')) {
      return false;
    }
  }

  // Pull-up bar
  if (nameLower.includes('pull-up') || nameLower.includes('pull up') || nameLower.includes('chin-up')) {
    if (!titleLower.includes('pull') && !titleLower.includes('chin') && !titleLower.includes('bar') && !purlLower.includes('pull-up')) {
      return false;
    }
  }

  // Treadmill
  if (nameLower.includes('treadmill')) {
    if (!titleLower.includes('treadmill') && !purlLower.includes('treadmill')) {
      return false;
    }
  }

  // Yoga mat
  if (nameLower.includes('yoga mat') || nameLower.includes('exercise mat')) {
    if (!titleLower.includes('mat') && !titleLower.includes('mkeka') && !purlLower.includes('mat')) {
      return false;
    }
  }

  // Meat / butchery vs pet food
  if ((nameLower.includes('beef') || nameLower.includes('chicken') || nameLower.includes('meat') || nameLower.includes('nyama')) &&
      (titleLower.includes('dog food') || titleLower.includes('cat food') || titleLower.includes('pet food') || titleLower.includes('chicken feed') || titleLower.includes('poultry feed'))) {
    return false;
  }

  // Underwear vs boxing gear
  if (nameLower.includes('boxer') && (titleLower.includes('gloves') || titleLower.includes('ring') || titleLower.includes('punching') || titleLower.includes('sparring'))) {
    return false;
  }

  // 7. General core tokens matching: The product type/name core nouns must match
  const stopWords = new Set([
    'buy', 'price', 'online', 'kenya', 'in', 'for', 'sale', 'best', 'the', 'and', 'with', 'per',
    'kg', 'g', 'ml', 'l', 'ltr', 'genuine', 'original', 'cheap', 'latest', 'order', 'shop', 'set', 'pack'
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
    let bestCandidateWithThumbnail: DiscoveredImageResult | null = null;

    for (const match of matches) {
      try {
        const rawJson = match[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
        const data = JSON.parse(rawJson);
        const rawMurl = typeof data.murl === 'string' ? data.murl.trim() : '';
        const murl = rawMurl ? encodeURI(rawMurl) : '';
        const title = data.t || data.desc || cleanName;
        const purl = data.purl || '';

        if (murl && validateCandidateImage(murl, title, purl, params)) {
          // Probe candidate reachability to prevent returning 404 or anti-bot challenge pages
          let directReachable = false;
          try {
            const probeController = new AbortController();
            const probeTimeout = setTimeout(() => probeController.abort(), 3000);
            let probeRes = await fetch(murl, {
              method: 'HEAD',
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'image/*,*/*;q=0.8'
              },
              signal: probeController.signal
            });
            if (probeRes.status === 405 || probeRes.status === 403) {
              probeRes = await fetch(murl, {
                method: 'GET',
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                  'Accept': 'image/*,*/*;q=0.8',
                  'Range': 'bytes=0-1023'
                },
                signal: probeController.signal
              });
            }
            clearTimeout(probeTimeout);
            const ct = (probeRes.headers.get('content-type') || '').toLowerCase();
            if ((probeRes.ok || probeRes.status === 206) && ct.startsWith('image/')) {
              directReachable = true;
            }
          } catch {
            directReachable = false;
          }

          if (directReachable) {
            const result: DiscoveredImageResult = {
              imageUrl: murl,
              thumbnailUrl: (data.turl && !data.turl.includes('bing.net')) ? data.turl : murl,
              title,
              pageUrl: purl,
              source: extractSourceFromUrl(purl),
              imageSource: 'discovered'
            };
            imageDiscoveryCache.set(cacheKey, { result, timestamp: Date.now() });
            return result;
          } else if (!bestCandidateWithThumbnail) {
            bestCandidateWithThumbnail = {
              imageUrl: murl,
              thumbnailUrl: (data.turl && !data.turl.includes('bing.net')) ? data.turl : murl,
              title,
              pageUrl: purl,
              source: extractSourceFromUrl(purl),
              imageSource: 'discovered'
            };
          }
        }
      } catch {
        // Skip parsing failure
      }
    }

    if (bestCandidateWithThumbnail) {
      imageDiscoveryCache.set(cacheKey, { result: bestCandidateWithThumbnail, timestamp: Date.now() });
      return bestCandidateWithThumbnail;
    }

    // No valid image found, cache failure briefly (30s) to prevent hammering while allowing timely retries
    imageDiscoveryCache.set(cacheKey, { result: null, timestamp: Date.now() - CACHE_TTL_MS + (30 * 1000) });
    return null;
  } catch (error) {
    imageDiscoveryCache.set(cacheKey, { result: null, timestamp: Date.now() - CACHE_TTL_MS + (30 * 1000) });
    return null;
  }
}
