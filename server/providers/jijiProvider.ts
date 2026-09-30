import { SearchProvider, ProviderSearchResult } from './types';

export class JijiProvider implements SearchProvider {
  readonly id = 'jiji';
  readonly name = 'Jiji Kenya';
  readonly requiresAuth = true;

  async search(query: string, options?: { location?: string; category?: string }): Promise<ProviderSearchResult> {
    const startTime = Date.now();
    const apiKey = process.env.JIJI_API_KEY;

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
          message: 'Requires Genesis Tech / Jiji Kenya Partner API credentials (JIJI_API_KEY). Direct unauthenticated scraping is blocked by Cloudflare (HTTP 403).'
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
        message: 'Jiji Partner API credentials awaiting verification'
      }
    };
  }
}
