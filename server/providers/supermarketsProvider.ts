import { SearchProvider, ProviderSearchResult } from './types';

export class SupermarketsProvider implements SearchProvider {
  readonly id = 'supermarkets';
  readonly name = 'Kenyan Supermarkets Network';
  readonly requiresAuth = true;

  async search(query: string, options?: { location?: string; category?: string }): Promise<ProviderSearchResult> {
    const startTime = Date.now();
    const apiKey = process.env.SUPERMARKET_API_KEY;

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
          message: 'Direct warehouse stock sync requires Carrefour MAF / Naivas / Quickmart POS & ERP partner credentials.'
        }
      };
    }

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
        message: 'Supermarket POS credentials awaiting verification'
      }
    };
  }
}
