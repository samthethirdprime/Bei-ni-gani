import { SearchProvider, ProviderSearchResult, NormalizedPriceResult, isTrustworthyImageUrl } from './types';

// Map known Kenyan retailer domains to clean vendor display names
function resolveVendorFromDomain(domain: string): { name: string; isOfficialRetailer: boolean } {
  const d = domain.toLowerCase();
  if (d.includes('carrefour.ke') || d.includes('carrefourkenya')) return { name: 'Carrefour Kenya', isOfficialRetailer: true };
  if (d.includes('jumia.co.ke')) return { name: 'Jumia Kenya', isOfficialRetailer: true };
  if (d.includes('naivas.online') || d.includes('naivas.co.ke')) return { name: 'Naivas Supermarket', isOfficialRetailer: true };
  if (d.includes('quickmart.co.ke')) return { name: 'Quickmart Supermarket', isOfficialRetailer: true };
  if (d.includes('jiji.co.ke')) return { name: 'Jiji Kenya Verified Seller', isOfficialRetailer: false };
  if (d.includes('kilimall.co.ke')) return { name: 'Kilimall Kenya', isOfficialRetailer: true };
  if (d.includes('phoneplacekenya.com')) return { name: 'Phoneplace Kenya', isOfficialRetailer: true };
  if (d.includes('phonestablets.co.ke')) return { name: 'Phones & Tablets Kenya', isOfficialRetailer: true };
  if (d.includes('phonesstorekenya.com')) return { name: 'Phones Store Kenya', isOfficialRetailer: true };
  if (d.includes('mobilehub.co.ke')) return { name: 'Mobile Hub Kenya', isOfficialRetailer: true };
  if (d.includes('avechi.co.ke')) return { name: 'Avechi Kenya', isOfficialRetailer: true };
  if (d.includes('gadgetworld.co.ke')) return { name: 'Gadget World Kenya', isOfficialRetailer: true };
  if (d.includes('gadgetsleo.com')) return { name: 'Gadgets Leo Kenya', isOfficialRetailer: true };
  if (d.includes('masoko.com')) return { name: 'Safaricom Masoko', isOfficialRetailer: true };
  if (d.includes('goodlife.co.ke')) return { name: 'Goodlife Pharmacy Kenya', isOfficialRetailer: true };
  if (d.includes('beautyclick.co.ke')) return { name: 'BeautyClick Kenya', isOfficialRetailer: true };
  if (d.includes('chandaranasupermarkets.co.ke')) return { name: 'Chandarana Foodplus', isOfficialRetailer: true };
  if (d.includes('cleanshelf.co.ke')) return { name: 'Cleanshelf Supermarket', isOfficialRetailer: true };
  if (d.includes('bata.co.ke')) return { name: 'Bata Kenya', isOfficialRetailer: true };
  if (d.includes('hotpoint.co.ke')) return { name: 'Hotpoint Appliances', isOfficialRetailer: true };
  if (d.includes('ramtons.com')) return { name: 'Ramtons Kenya', isOfficialRetailer: true };
  if (d.includes('bamburicement.com') || d.includes('bamburi')) return { name: 'Bamburi Cement', isOfficialRetailer: true };
  if (d.includes('totalenergies.ke')) return { name: 'TotalEnergies Kenya', isOfficialRetailer: true };
  if (d.includes('rubiskenya.com')) return { name: 'Rubis Kenya', isOfficialRetailer: true };
  if (d.includes('pigiame.co.ke')) return { name: 'PigiaMe Kenya', isOfficialRetailer: false };
  if (d.includes('buyrentkenya.com')) return { name: 'BuyRentKenya', isOfficialRetailer: false };
  if (d.includes('property24.co.ke')) return { name: 'Property24 Kenya', isOfficialRetailer: false };
  if (d.includes('priceinkenya.com')) return { name: 'Price in Kenya', isOfficialRetailer: false };
  if (d.includes('exelicgadgets.co.ke')) return { name: 'Exelic Gadgets', isOfficialRetailer: true };
  if (d.includes('starmac.co.ke')) return { name: 'Starmac Kenya', isOfficialRetailer: true };
  if (d.includes('sparezonekenya.co.ke') || d.includes('sparezone')) return { name: 'Sparezone Kenya', isOfficialRetailer: true };
  if (d.includes('e-spareparts.com')) return { name: 'E-Spareparts Kenya', isOfficialRetailer: true };

  // Clean fallback domain
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  return { name: cleanDomain, isOfficialRetailer: false };
}

// Clean and decode redirection links
function cleanTargetUrl(rawUrl: string): string {
  try {
    if (rawUrl.includes('uddg=')) {
      const match = rawUrl.match(/uddg=([^&]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    }
    if (rawUrl.startsWith('//')) {
      return `https:${rawUrl}`;
    }
    return rawUrl;
  } catch (e) {
    return rawUrl;
  }
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function cleanProductTitle(rawTitle: string, fallbackQuery: string): string {
  let cleaned = decodeHtmlEntities(rawTitle.replace(/<[^>]+>/g, '').trim());
  cleaned = cleaned.replace(/\s*\|\s*Jumia Kenya.*$/i, '');
  cleaned = cleaned.replace(/\s*-\s*Jumia KE.*$/i, '');
  cleaned = cleaned.replace(/\s*\|\s*Kilimall.*$/i, '');
  cleaned = cleaned.replace(/\s*Prices on Jiji\.co\.ke.*$/i, '');
  cleaned = cleaned.replace(/\s*on Jiji\.co\.ke.*$/i, '');
  cleaned = cleaned.replace(/\s*-\s*Carrefour Kenya.*$/i, '');
  cleaned = cleaned.replace(/\s*\|\s*Homelux Kenya.*$/i, '');
  cleaned = cleaned.replace(/\s*for sale in Kenya.*$/i, '');
  cleaned = cleaned.replace(/\s*in Kenya for sale.*$/i, '');
  cleaned = cleaned.replace(/\s*Best Price in Kenya.*$/i, '');
  cleaned = cleaned.replace(/^Buy\s+/i, '');
  cleaned = cleaned.trim();
  if (cleaned.length < 3) return fallbackQuery;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

// Attempt to fetch schema.org JSON-LD or OpenGraph from a direct retailer product page with short timeout
async function fetchProductPageDetails(url: string): Promise<{ name?: string; price?: number; image?: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2600);

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const html = await res.text();

    let extractedName: string | undefined;
    let extractedPrice: number | undefined;
    let extractedImage: string | undefined;

    // 1. Schema.org JSON-LD
    const jsonLdMatch = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
    if (jsonLdMatch) {
      try {
        const data = JSON.parse(jsonLdMatch[1]);
        if (data && (data['@type'] === 'Product' || data.name)) {
          extractedName = data.name;
          const rawPrice = data.offers?.price || data.offers?.[0]?.price;
          const numPrice = typeof rawPrice === 'string' ? parseFloat(rawPrice.replace(/,/g, '')) : (typeof rawPrice === 'number' ? rawPrice : undefined);
          if (numPrice && numPrice > 0) extractedPrice = Math.round(numPrice);

          const rawImg = typeof data.image === 'string' ? data.image : (Array.isArray(data.image) ? data.image[0] : (data.image?.url || undefined));
          if (isTrustworthyImageUrl(rawImg)) extractedImage = rawImg;
        }
      } catch (e) {
        // ignore parse error
      }
    }

    // 2. OpenGraph Meta Tags
    if (!extractedImage) {
      const ogImg = html.match(/<meta[^>]+property=["\x27]og:image["\x27][^>]+content=["\x27]([^"\x27]+)["\x27]/i)
        || html.match(/<meta[^>]+content=["\x27]([^"\x27]+)["\x27][^>]+property=["\x27]og:image["\x27]/i);
      if (ogImg && isTrustworthyImageUrl(ogImg[1])) {
        extractedImage = ogImg[1];
      }
    }

    if (!extractedPrice) {
      const ogPrice = html.match(/<meta[^>]+property=["\x27]product:price:amount["\x27][^>]+content=["\x27]([0-9.,]+)["\x27]/i);
      if (ogPrice) {
        const p = parseFloat(ogPrice[1].replace(/,/g, ''));
        if (p > 0) extractedPrice = Math.round(p);
      }
    }

    // 3. Featured Image Tag
    if (!extractedImage) {
      const prodImg = html.match(/<img[^>]+class=["\x27][^"\x27]*(?:wp-post-image|attachment-shop_single|product-image|main-image)[^"\x27]*["\x27][^>]+(?:data-src|src)=["\x27]([^"\x27]+\.(?:jpg|jpeg|png|webp))["\x27]/i)
        || html.match(/<img[^>]+(?:data-src|src)=["\x27]([^"\x27]+\.(?:jpg|jpeg|png|webp))["\x27][^>]+class=["\x27][^"\x27]*(?:wp-post-image|attachment-shop_single|product-image|main-image)/i);
      if (prodImg && isTrustworthyImageUrl(prodImg[1])) {
        extractedImage = prodImg[1];
      }
    }

    if (extractedPrice || extractedImage) {
      return {
        name: extractedName,
        price: extractedPrice,
        image: extractedImage
      };
    }
    return null;
  } catch (e) {
    return null;
  }
}

// Direct search query on known Kenyan specialist retailers (Phone Place, Avechi) when relevant
async function searchKenyanSpecialistRetailers(cleanQ: string, targetLoc: string): Promise<NormalizedPriceResult[]> {
  const results: NormalizedPriceResult[] = [];
  const qLower = cleanQ.toLowerCase();
  const isTechOrElectronic = /\b(powerbank|power bank|phone|samsung|charger|anker|earbuds|headphones|laptop|cable|screen|case|adapter)\b/i.test(qLower);

  if (!isTechOrElectronic) return results;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2800);

    const res = await fetch(`https://www.phoneplacekenya.com/?s=${encodeURIComponent(cleanQ)}&post_type=product`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.ok) {
      const text = await res.text();
      const wrappers = text.match(/<div class="product-wrapper">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/gi) || [];

      for (let i = 0; i < Math.min(3, wrappers.length); i++) {
        const w = wrappers[i];
        const linkMatch = w.match(/<a[^>]+href="([^"]+)"/i);
        const titleMatch = w.match(/class="[^"]*product-title[^"]*"[^>]*><a[^>]*>([\s\S]*?)<\/a>/i) || w.match(/<h\d[^>]*>([\s\S]*?)<\/h\d>/i);
        const priceMatch = w.match(/<span class="woocommerce-Price-amount amount">[\s\S]*?<bdi>([\s\S]*?)<\/bdi>/i) || w.match(/KSh\s*([0-9,]+)/i);
        const imgMatch = w.match(/data-src="([^"]+\.(?:jpg|jpeg|png|webp))"/i) || w.match(/src="([^"]+\.(?:jpg|jpeg|png|webp))"/i);

        if (titleMatch && priceMatch && linkMatch) {
          const rawPrice = priceMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '').replace(/,/g, '').trim();
          const parsedPrice = parseFloat(rawPrice);
          const title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
          const img = imgMatch && isTrustworthyImageUrl(imgMatch[1]) ? imgMatch[1] : undefined;

          if (parsedPrice && parsedPrice > 0 && parsedPrice < 10000000) {
            results.push({
              id: `phoneplace-${Date.now()}-${i}`,
              name: title,
              price: Math.round(parsedPrice),
              currency: 'KES',
              vendor: 'Phoneplace Kenya',
              source: 'Phoneplace Kenya',
              sourceName: 'Phoneplace Kenya',
              sourceType: 'external',
              acquisitionMethod: 'search_snippet',
              url: linkMatch[1],
              sourceUrl: linkMatch[1],
              image: img,
              location: targetLoc !== 'Worldwide' ? targetLoc : 'Kenya',
              retrievedAt: new Date().toISOString(),
              timestamp: new Date().toISOString(),
              isVerified: true,
              notes: 'Verified listing from Phoneplace Kenya'
            });
          }
        }
      }
    }
  } catch (e) {
    // Ignore timeout or network errors
  }

  return results;
}

export class WebSearchProvider implements SearchProvider {
  readonly id = 'web_discovery';
  readonly name = 'Live Web Price Engine (Kenyan Retailers)';
  readonly requiresAuth = false;

  async search(query: string, options?: { location?: string; category?: string }): Promise<ProviderSearchResult> {
    const startTime = Date.now();
    const cleanQ = query.trim();
    const targetLoc = options?.location || 'Kenya';
    const items: NormalizedPriceResult[] = [];

    const searchQuery = `${cleanQ} price in kenya ksh ${targetLoc !== 'Kenya' && targetLoc !== 'Worldwide' ? targetLoc : ''}`.trim();
    const timeoutMs = 6500;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      let html = '';
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
        'Mozilla/5.0 (X11; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0'
      ];
      const ua = userAgents[Math.floor(Math.random() * userAgents.length)];

      // 1. Try DuckDuckGo Lite
      try {
        const liteUrl = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(searchQuery)}`;
        const liteRes = await fetch(liteUrl, {
          headers: {
            'User-Agent': ua,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-GB,en;q=0.9,sw;q=0.8'
          },
          signal: controller.signal
        });
        if (liteRes.ok) {
          html = await liteRes.text();
        }
      } catch (liteErr) {
        // fallback to html.duckduckgo.com
      }

      // If Lite didn't return or was empty, try html.duckduckgo.com
      if (!html || !html.includes('result-snippet')) {
        try {
          const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
          const res = await fetch(url, {
            headers: {
              'User-Agent': ua,
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-GB,en;q=0.9,sw;q=0.8'
            },
            signal: controller.signal
          });
          if (res.ok) {
            html = await res.text();
          }
        } catch (htmlErr) {
          // ignore
        }
      }

      clearTimeout(timeoutId);

      let count = 0;
      const pagesToInspect: { url: string; vendorName: string; snippetTitle: string }[] = [];

      // Parse either DDG Lite or standard DDG HTML if available
      const isLite = html.includes('result-snippet');
      const blockRegex = isLite
        ? /<a[^>]+href=["\x27]([^"\x27]+)["\x27][^>]*class=["\x27]result-link["\x27][^>]*>([\s\S]*?)<\/a>[\s\S]*?<td[^>]*class=["\x27]result-snippet["\x27][^>]*>([\s\S]*?)<\/td>/gi
        : /<a class="result__url"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;

      let match;
      while ((match = blockRegex.exec(html)) && count < 10) {
        const rawUrl = match[1];
        const rawTitleOrDomain = match[2];
        const rawSnippet = match[3];
        const cleanLink = cleanTargetUrl(rawUrl);
        const snippetText = decodeHtmlEntities(rawSnippet.replace(/<[^>]+>/g, '').trim());
        const titleText = isLite ? cleanProductTitle(rawTitleOrDomain, cleanQ) : cleanQ;

        // =========================================================================
        // STRICT RELEVANCE & ANTI-COLLISION GUARDS
        // =========================================================================
        const combinedText = `${titleText} ${snippetText} ${cleanLink}`.toLowerCase();
        const combinedClean = combinedText.replace(/[^a-z0-9]/g, '');
        const qLower = cleanQ.toLowerCase();

        // 1. Watermelon vs Bottled Water
        if ((qLower.includes('watermelon') || qLower.includes('water melon') || qLower.includes('tikiti')) && 
            (combinedText.includes('bottled water') || combinedText.includes('mineral water') || combinedText.includes('water tank') || combinedText.includes('drinking water'))) {
          continue;
        }

        // 2. Boxers/Underwear vs Boxing Gloves
        if ((qLower.includes('boxer') || qLower.includes('underwear') || qLower.includes('panties')) && 
            (combinedText.includes('boxing glove') || combinedText.includes('punching bag') || combinedText.includes('boxing ring'))) {
          continue;
        }

        // 3. Shoe rack vs Shoes
        if ((qLower.includes('shoe rack') || qLower.includes('shoerack')) && 
            !combinedText.includes('rack') && !combinedText.includes('stand') && !combinedText.includes('organizer') && !combinedText.includes('cabinet')) {
          continue;
        }

        // 4. Anal plug anti-collision (must strictly require the exact query terms)
        if (qLower === 'anal plug' && (!combinedText.includes('anal') || !combinedText.includes('plug'))) {
          continue;
        }

        // 5. Query token overlap with compound words & plural normalization
        // e.g. "powerbank" matches "power bank" or "power banks"
        const queryTokens = qLower.split(/\s+/).filter(t => t.length > 2 && !['price', 'kenya', 'ksh', 'how', 'much'].includes(t));
        const cleanQueryCompressed = cleanQ.toLowerCase().replace(/[^a-z0-9]/g, '');

        let matchesTokens = false;
        if (queryTokens.length === 0 || combinedClean.includes(cleanQueryCompressed)) {
          matchesTokens = true;
        } else {
          // Check if core noun or primary token matches
          const coreTokens = queryTokens.filter(t => !['women', 'womens', 'men', 'mens', 'genuine', 'original', 'best', 'latest', 'cheap'].includes(t));
          const tokensToCheck = coreTokens.length > 0 ? coreTokens : queryTokens;
          matchesTokens = tokensToCheck.some(t => {
            const tClean = t.replace(/[^a-z0-9]/g, '');
            const tSingular = tClean.endsWith('s') ? tClean.slice(0, -1) : tClean;
            return combinedClean.includes(tClean) || combinedClean.includes(tSingular) || combinedText.includes(t);
          });
        }

        if (!matchesTokens) {
          continue;
        }

        // Expanded Price pattern in KES / KSh (supporting space, no space, and 'from' patterns)
        const priceRegex = /(?:(?:Ksh\.?|KES)\s*([0-9,]+(?:\.\d{1,2})?)|(?:Price|Price:)\s*(?:Ksh\.?|KES)\s*([0-9,]+(?:\.\d{1,2})?)|(?:from\s*(?:Ksh\.?|KES)\s*([0-9,]+(?:\.\d{1,2})?))|([0-9,]+)\s*(?:Ksh\.?|KES|\/=))/i;
        const textForPrice = `${snippetText} ${titleText}`;
        const priceMatch = textForPrice.match(priceRegex);

        const vendorInfo = resolveVendorFromDomain(cleanLink);

        if (priceMatch) {
          const rawPriceStr = priceMatch[1] || priceMatch[2] || priceMatch[3] || priceMatch[4];
          const parsedPrice = parseFloat(rawPriceStr.replace(/,/g, ''));

          if (parsedPrice && parsedPrice > 0 && parsedPrice < 10000000) {
            // Sanity check: prevent delivery fees or ad counts for high-value goods
            const isHighValue = /\b(duvet|blanket|bed|mattress|phone|tv|television|fridge|refrigerator|laptop|cooker|sofa|furniture|table|rack|powerbank|power bank)\b/i.test(titleText + ' ' + cleanQ);
            if (isHighValue && parsedPrice < 350) {
              continue;
            }

            items.push({
              id: `web-${count}-${Date.now()}`,
              name: titleText,
              price: Math.round(parsedPrice),
              currency: 'KES',
              vendor: vendorInfo.name,
              source: vendorInfo.name,
              sourceName: vendorInfo.name,
              sourceType: 'external',
              acquisitionMethod: 'search_snippet',
              url: cleanLink,
              sourceUrl: cleanLink,
              location: targetLoc !== 'Worldwide' ? targetLoc : 'Kenya',
              retrievedAt: new Date().toISOString(),
              timestamp: new Date().toISOString(),
              isVerified: true,
              notes: `Indexed search snippet result from ${vendorInfo.name}`
            });

            count++;
          }
        } else if (
          (cleanLink.includes('carrefour.ke') && cleanLink.includes('/p/')) ||
          (cleanLink.includes('phoneplacekenya.com/product/')) ||
          (cleanLink.includes('avechi.co.ke/product/')) ||
          (cleanLink.includes('gadgetworld.co.ke/product/'))
        ) {
          pagesToInspect.push({ url: cleanLink, vendorName: vendorInfo.name, snippetTitle: titleText });
        }
      }

      // Check queued direct product pages for exact structured price & image
      if (pagesToInspect.length > 0) {
        for (const page of pagesToInspect.slice(0, 3)) {
          const details = await fetchProductPageDetails(page.url);
          if (details && details.price && details.price > 0) {
            items.push({
              id: `web-page-${Date.now()}-${count++}`,
              name: details.name || page.snippetTitle,
              price: details.price,
              currency: 'KES',
              vendor: page.vendorName,
              source: page.vendorName,
              sourceName: page.vendorName,
              sourceType: 'external',
              acquisitionMethod: 'direct_webpage',
              url: page.url,
              sourceUrl: page.url,
              image: isTrustworthyImageUrl(details.image) ? details.image : undefined,
              location: targetLoc !== 'Worldwide' ? targetLoc : 'Kenya',
              retrievedAt: new Date().toISOString(),
              timestamp: new Date().toISOString(),
              isVerified: true,
              notes: `Direct webpage structured LD-JSON extraction from ${page.vendorName}`
            });
          }
        }
      }

      // If items are few, query Kenyan specialist catalog search (e.g. Phoneplace Kenya)
      if (items.length < 2) {
        const specialistItems = await searchKenyanSpecialistRetailers(cleanQ, targetLoc);
        for (const sItem of specialistItems) {
          if (!items.some(i => i.vendor === sItem.vendor && i.price === sItem.price)) {
            items.push(sItem);
          }
        }
      }

      return {
        providerId: this.id,
        providerName: this.name,
        items,
        status: {
          providerId: this.id,
          providerName: this.name,
          status: 'success',
          itemCount: items.length,
          durationMs: Date.now() - startTime
        }
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isTimeout = err.name === 'AbortError' || err.message?.includes('timeout') || err.message?.includes('aborted');

      return {
        providerId: this.id,
        providerName: this.name,
        items,
        status: {
          providerId: this.id,
          providerName: this.name,
          status: isTimeout ? 'timeout' : 'failed',
          itemCount: items.length,
          durationMs: Date.now() - startTime,
          message: isTimeout ? 'External search timed out' : err.message
        }
      };
    }
  }
}
