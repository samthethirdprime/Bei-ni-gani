import { SearchProvider, ProviderSearchResult, NormalizedPriceResult } from './types';

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

          return {
            name: data.name,
            price: numPrice && numPrice > 0 ? Math.round(numPrice) : undefined,
            image: typeof data.image === 'string' ? data.image : (Array.isArray(data.image) ? data.image[0] : undefined)
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
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-GB,en;q=0.9,sw;q=0.8'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok || res.status === 202) {
        throw new Error(`External search returned HTTP ${res.status}${res.status === 202 ? ' (Search engine bot challenge / rate-limit)' : ''}`);
      }

      const html = await res.text();

      // Parse DuckDuckGo result blocks
      const blockRegex = /<a class="result__url"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
      let match;
      let count = 0;
      const pagesToInspect: { url: string; vendorName: string; snippetTitle: string }[] = [];

      while ((match = blockRegex.exec(html)) && count < 8) {
        const rawUrl = match[1];
        const displayDomain = match[2].replace(/<[^>]+>/g, '').trim();
        const snippet = match[3].replace(/<[^>]+>/g, '').trim();
        const cleanLink = cleanTargetUrl(rawUrl);

        // Strict query relevance filter:
        const snippetLower = snippet.toLowerCase();
        const urlLower = cleanLink.toLowerCase();
        const queryTokens = cleanQ.toLowerCase().split(/\s+/).filter(t => t.length > 2);
        
        const hasRelevantToken = queryTokens.length === 0 || 
          snippetLower.includes(cleanQ.toLowerCase()) || 
          queryTokens.every(tok => snippetLower.includes(tok) || urlLower.includes(tok));

        if (!hasRelevantToken) {
          continue; // Skip unrelated search results
        }

        // Price pattern in KES / KSh
        const priceRegex = /(?:(?:Ksh\.?|KES)\s*([0-9,]+(?:\.\d{1,2})?)|(?:Price|Price:)\s*(?:Ksh\.?|KES)?\s*([0-9,]+(?:\.\d{1,2})?))/i;
        const priceMatch = snippet.match(priceRegex);

        const vendorInfo = resolveVendorFromDomain(cleanLink || displayDomain);

        if (priceMatch) {
          const rawPriceStr = priceMatch[1] || priceMatch[2];
          const parsedPrice = parseFloat(rawPriceStr.replace(/,/g, ''));

          if (parsedPrice && parsedPrice > 0 && parsedPrice < 10000000) {
            // Clean product title from snippet or query
            let detectedName = cleanQ;
            const titleMatch = snippet.match(new RegExp(`(${cleanQ}[^.?!,;–—\\n]{0,60})`, 'i'));
            if (titleMatch) {
              detectedName = decodeHtmlEntities(titleMatch[1]);
            } else {
              detectedName = decodeHtmlEntities(detectedName);
            }

            const formattedName = detectedName.charAt(0).toUpperCase() + detectedName.slice(1);

            items.push({
              id: `web-${count}-${Date.now()}`,
              name: formattedName,
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
          // If it's a direct Carrefour product page link with missing snippet price, enqueue for JSON-LD check
          pagesToInspect.push({ url: cleanLink, vendorName: vendorInfo.name, snippetTitle: cleanQ });
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
              image: details.image,
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
