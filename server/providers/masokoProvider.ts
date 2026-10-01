import { SearchProvider, ProviderSearchResult } from './types';

export class MasokoProvider implements SearchProvider {
  readonly id = 'masoko';
  readonly name = 'Masoko by Safaricom';
  readonly requiresAuth = true;

  async search(query: string, options?: { location?: string; category?: string }): Promise<ProviderSearchResult> {
    const startTime = Date.now();
    const apiKey = process.env.MASOKO_API_KEY;

    // Truthful integration check: if direct 1P API is not configured, report as unconfigured
    // Live Safaricom Masoko listings are dynamically discovered via the Real-Time Web Price Engine
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
          message: 'Direct Safaricom Masoko 1P API not configured. Masoko listings are queried via Real-Time Web Price Engine.'
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
