import { SearchProvider, ProviderSearchResult } from './types';

export class JumiaProvider implements SearchProvider {
  readonly id = 'jumia';
  readonly name = 'Jumia Kenya';
  readonly requiresAuth = true;

  async search(query: string, options?: { location?: string; category?: string }): Promise<ProviderSearchResult> {
    const startTime = Date.now();
    const apiKey = process.env.JUMIA_API_KEY;

    if (!apiKey) {
      return {
        providerId: this.id,
        providerName: this.name,
        items: [],
        status: {
          providerId: this.id,
          providerName: this.name,
          status: 'unconfigured',
          itemCount: 0,
          durationMs: Date.now() - startTime,
          message: 'Requires Jumia Affiliate or Vendor API credentials (JUMIA_API_KEY). Direct unauthenticated scraping is blocked by Jumia bot-protection (HTTP 403).'
        }
      };
    }

    try {
      // If API key is provided, query official Jumia Affiliate/Vendor API
      const res = await fetch(`https://affiliate.jumia.com/api/v1/products?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error(`Jumia API returned HTTP ${res.status}`);
      }

      const data = await res.json();
      const items = (data.products || []).map((p: any) => ({
        id: `jumia-${p.id}`,
        name: p.name,
        price: Number(p.price),
        currency: 'KES' as const,
        vendor: 'Jumia Kenya',
        source: 'Jumia Kenya',
        sourceType: 'external' as const,
        url: p.url,
        image: p.image,
        location: 'Nationwide Delivery',
        timestamp: new Date().toISOString(),
        isVerified: true
      }));

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
          message: err.message
        }
      };
    }
  }
}
