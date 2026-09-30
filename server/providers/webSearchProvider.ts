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
  if (d.includes('mobilehub.co.ke')) return { name: 'Mobile Hub Kenya', isOfficialRetailer: true };
  if (d.includes('masoko.com')) return { name: 'Safaricom Masoko', isOfficialRetailer: true };
  if (d.includes('chandaranasupermarkets.co.ke')) return { name: 'Chandarana Foodplus', isOfficialRetailer: true };
  if (d.includes('cleanshelf.co.ke')) return { name: 'Cleanshelf Supermarket', isOfficialRetailer: true };
  if (d.includes('bata.co.ke')) return { name: 'Bata Kenya', isOfficialRetailer: true };
  if (d.includes('hotpoint.co.ke')) return { name: 'Hotpoint Appliances', isOfficialRetailer: true };
  if (d.includes('ramtons.com')) return { name: 'Ramtons Kenya', isOfficialRetailer: true };
  if (d.includes('bamburicement.com') || d.includes('bamburi')) return { name: 'Bamburi Cement', isOfficialRetailer: true };
  if (d.includes('totalenergies.ke')) return { name: 'TotalEnergies Kenya', isOfficialRetailer: true };
  if (d.includes('rubiskenya.com')) return { name: 'Rubis Kenya', isOfficialRetailer: true };
  if (d.includes('buyrentkenya.com')) return { name: 'BuyRentKenya', isOfficialRetailer: false };
  if (d.includes('property24.co.ke')) return { name: 'Property24 Kenya', isOfficialRetailer: false };

  // Fallback domain name
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

// Attempt to fetch schema.org JSON-LD from a direct retailer product page with short timeout
async function fetchProductPageDetails(url: string): Promise<{ name?: string; price?: number; image?: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const html = await res.text();

    const jsonLdMatch = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
    if (jsonLdMatch) {
      try {
        const data = JSON.parse(jsonLdMatch[1]);
        if (data && (data['@type'] === 'Product' || data.name)) {
          const rawPrice = data.offers?.price || data.offers?.[0]?.price;
          const numPrice = typeof rawPrice === 'string' ? parseFloat(rawPrice.replace(/,/g, '')) : (typeof rawPrice === 'number' ? rawPrice : undefined);

          const rawImg = typeof data.image === 'string' ? data.image : (Array.isArray(data.image) ? data.image[0] : undefined);
          return {
            name: data.name,
            price: numPrice && numPrice > 0 ? Math.round(numPrice) : undefined,
            image: isTrustworthyImageUrl(rawImg) ? rawImg : undefined
          };
        }
      } catch (e) {
        // ignore parse error
      }
    }
    return null;
  } catch (e) {
    return null;
  }
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
      // 1. Try DuckDuckGo Lite first (does not hit 202 bot challenge)
      let html = '';
      try {
        const liteUrl = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(searchQuery)}`;
        const liteRes = await fetch(liteUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-GB,en;q=0.9,sw;q=0.8'
          },
          signal: controller.signal
        });
        if (liteRes.ok && liteRes.status === 200) {
          html = await liteRes.text();
        }
      } catch (liteErr) {
        // fallback to html.duckduckgo.com
      }

      // If Lite didn't return or was empty, try html.duckduckgo.com
      if (!html || !html.includes('result-snippet')) {
        const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-GB,en;q=0.9,sw;q=0.8'
          },
          signal: controller.signal
        });
        if (res.ok && res.status !== 202) {
          html = await res.text();
        }
      }

      clearTimeout(timeoutId);

      if (!html) {
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

      let count = 0;
      const pagesToInspect: { url: string; vendorName: string; snippetTitle: string }[] = [];

      // Parse either DDG Lite or standard DDG HTML
      const isLite = html.includes('result-snippet');
      const blockRegex = isLite
        ? /<a[^>]+href=["']([^"']+)["'][^>]*class=["']result-link["'][^>]*>([\s\S]*?)<\/a>[\s\S]*?<td[^>]*class=["']result-snippet["'][^>]*>([\s\S]*?)<\/td>/gi
        : /<a class="result__url"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;

      let match;
      while ((match = blockRegex.exec(html)) && count < 8) {
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

        // 5. Query token overlap
        const queryTokens = qLower.split(/\s+/).filter(t => t.length > 2 && !['price', 'kenya', 'ksh', 'how', 'much'].includes(t));
        const hasAllTokens = queryTokens.length === 0 || queryTokens.every(t => combinedText.includes(t));
        if (!hasAllTokens) {
          continue;
        }

        // Price pattern in KES / KSh
        const priceRegex = /(?:(?:Ksh\.?|KES)\s*([0-9,]+(?:\.\d{1,2})?)|(?:Price|Price:)\s*(?:Ksh\.?|KES)\s*([0-9,]+(?:\.\d{1,2})?))/i;
        const priceMatch = snippetText.match(priceRegex);

        const vendorInfo = resolveVendorFromDomain(cleanLink);

        if (priceMatch) {
          const rawPriceStr = priceMatch[1] || priceMatch[2];
          const parsedPrice = parseFloat(rawPriceStr.replace(/,/g, ''));

          if (parsedPrice && parsedPrice > 0 && parsedPrice < 10000000) {
            // Sanity check: prevent delivery fees or ad counts for high-value goods
            const isHighValue = /\b(duvet|blanket|bed|mattress|phone|tv|television|fridge|refrigerator|laptop|cooker|sofa|furniture|table|rack)\b/i.test(titleText + ' ' + cleanQ);
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
        } else if (cleanLink.includes('carrefour.ke/mafken/en/') && cleanLink.includes('/p/')) {
          pagesToInspect.push({ url: cleanLink, vendorName: vendorInfo.name, snippetTitle: titleText });
        }
      }

      // Check queued direct product pages for exact JSON-LD price
      if (pagesToInspect.length > 0) {
        for (const page of pagesToInspect.slice(0, 2)) {
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
        items: [],
        status: {
          providerId: this.id,
          providerName: this.name,
          status: isTimeout ? 'timeout' : 'failed',
          itemCount: 0,
          durationMs: Date.now() - startTime,
          message: isTimeout ? 'External search timed out' : err.message
        }
      };
    }
  }
}
