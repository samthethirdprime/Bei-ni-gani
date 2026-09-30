import { SearchProvider, ProviderSearchResult } from './types';

export class KilimallProvider implements SearchProvider {
  readonly id = 'kilimall';
  readonly name = 'Kilimall Kenya';
  readonly requiresAuth = true;

  async search(query: string, options?: { location?: string; category?: string }): Promise<ProviderSearchResult> {
    const startTime = Date.now();
    const apiKey = process.env.KILIMALL_API_KEY;

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
          message: 'Requires Kilimall Open Platform merchant credentials (KILIMALL_API_KEY). Direct unauthenticated requests are rejected.'
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
        message: 'Kilimall partner endpoint integration requires verified merchant scope'
      }
    };
  }
}
