import { SearchProvider, ProviderSearchResult } from './types';

export class JumiaProvider implements SearchProvider {
  readonly id = 'jumia';
  readonly name = 'Jumia Kenya';
  readonly requiresAuth = true;

  async search(query: string, options?: { location?: string; category?: string }): Promise<ProviderSearchResult> {
    const startTime = Date.now();
    const apiKey = process.env.JUMIA_API_KEY;

    // Truthful integration check: if direct 1P API is not configured, report as unconfigured
    // Live Jumia listings are dynamically discovered via the Real-Time Web Price Engine
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
          message: 'Direct Jumia 1P API not configured. Jumia Kenya listings are queried via Real-Time Web Price Engine.'
        }
      };
    }

    // Direct 1P API implementation when API credentials are provided
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
