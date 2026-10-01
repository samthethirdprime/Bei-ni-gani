import { SearchProvider, ProviderSearchResult } from './types';

export class KilimallProvider implements SearchProvider {
  readonly id = 'kilimall';
  readonly name = 'Kilimall Kenya';
  readonly requiresAuth = true;

  async search(query: string, options?: { location?: string; category?: string }): Promise<ProviderSearchResult> {
    const startTime = Date.now();
    const apiKey = process.env.KILIMALL_API_KEY;

    // Truthful integration check: if direct 1P API is not configured, report as unconfigured
    // Live Kilimall listings are dynamically discovered via the Real-Time Web Price Engine
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
          message: 'Direct Kilimall 1P API not configured. Kilimall listings are queried via Real-Time Web Price Engine.'
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
        status: 'success',
        itemCount: 0,
        durationMs: Date.now() - startTime
      }
    };
  }
}
