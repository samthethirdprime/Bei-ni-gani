// Central Source Connector Registry & Multi-Source Search Aggregator

import { SourceConnector, ExternalListing, GroupedProductComparison, SourceConnectorStatus } from './types';
import { SearchQueryAnalysis } from '../../types';
import { JumiaKenyaConnector } from './jumiaConnector';
import { KilimallConnector } from './kilimallConnector';
import { JijiKenyaConnector } from './jijiConnector';
import { KenyanSupermarketsConnector } from './supermarketsConnector';
import { OfficialKenyaConnector } from './officialKenyaConnector';
import { SpecialtyRetailersConnector } from './specialtyRetailersConnector';
import { MasokoConnector } from './masokoConnector';
import { SocialCommerceConnector } from './socialCommerceConnector';
import { CommunityReportsConnector } from './communityConnector';
import { groupListingsIntoProducts } from '../productMatcher';

class ConnectorRegistry {
  private connectors: Map<string, SourceConnector> = new Map();

  constructor() {
    this.register(new JumiaKenyaConnector());
    this.register(new KilimallConnector());
    this.register(new JijiKenyaConnector());
    this.register(new MasokoConnector());
    this.register(new KenyanSupermarketsConnector());
    this.register(new OfficialKenyaConnector());
    this.register(new SpecialtyRetailersConnector());
    this.register(new SocialCommerceConnector());
    this.register(new CommunityReportsConnector());
  }

  public register(connector: SourceConnector): void {
    this.connectors.set(connector.id, connector);
  }

  public getConnector(id: string): SourceConnector | undefined {
    return this.connectors.get(id);
  }

  public getAllConnectors(): SourceConnector[] {
    return Array.from(this.connectors.values());
  }

  public getConnectorsStatus(): Array<{ id: string; name: string; status: SourceConnectorStatus; officialUrl: string }> {
    return this.getAllConnectors().map(c => ({
      id: c.id,
      name: c.displayName,
      status: c.getStatus(),
      officialUrl: c.officialUrl
    }));
  }

  /**
   * Search across all connected Kenyan sources in parallel with per-connector timeout protection
   */
  public async searchAll(
    query: SearchQueryAnalysis,
    locationFilter?: string,
    categoryFilter?: string,
    demoMode: boolean = false
  ): Promise<{
    listings: ExternalListing[];
    groupedResults: {
      primaryGroup: GroupedProductComparison | null;
      allGroups: GroupedProductComparison[];
    };
    queriedSources: string[];
  }> {
    const connectors = this.getAllConnectors();
    const queriedSources: string[] = [];
    const allListings: ExternalListing[] = [];
    const CONNECTOR_TIMEOUT_MS = 3000;

    // Filter connectors by category if specific category is set
    const activeConnectors = connectors.filter(conn => {
      if (!categoryFilter || categoryFilter === 'all') return true;
      if (conn.supportedCategories.includes('all')) return true;
      return conn.supportedCategories.some(c => c.toLowerCase() === categoryFilter.toLowerCase());
    });

    const promises = activeConnectors.map(async conn => {
      try {
        queriedSources.push(conn.displayName);
        // Timeout guard: if a connector hangs or external resource is blocked, abort after CONNECTOR_TIMEOUT_MS
        const timeoutPromise = new Promise<ExternalListing[]>((_, reject) =>
          setTimeout(() => reject(new Error(`Connector ${conn.name} timed out after ${CONNECTOR_TIMEOUT_MS}ms`)), CONNECTOR_TIMEOUT_MS)
        );

        const results = await Promise.race([
          conn.searchProducts(query, locationFilter, demoMode),
          timeoutPromise
        ]);
        return results;
      } catch (err: any) {
        console.warn(`[ConnectorRegistry] Issue querying connector ${conn.name}:`, err?.message || err);
        return [];
      }
    });

    const settled = await Promise.allSettled(promises);
    for (const res of settled) {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        allListings.push(...res.value);
      }
    }

    // Group listings with strict product identity matching & location filter
    const grouped = groupListingsIntoProducts(allListings, query, locationFilter);

    return {
      listings: allListings,
      groupedResults: grouped,
      queriedSources
    };
  }
}

export const connectorRegistry = new ConnectorRegistry();
