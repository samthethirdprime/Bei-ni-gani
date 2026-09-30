// Bei Gani? Multi-Source Connector Architecture Interfaces

import { SearchQueryAnalysis } from '../../types';

export type SourceAccessMethod = 
  | 'OFFICIAL_API' 
  | 'OFFICIAL_FEED' 
  | 'PARTNER_API' 
  | 'PUBLIC_CATALOG' 
  | 'COMMUNITY_DATABASE';

export type SourceCategory =
  | 'E_COMMERCE'
  | 'MARKETPLACE'
  | 'SUPERMARKET'
  | 'ELECTRONICS'
  | 'FASHION'
  | 'HARDWARE'
  | 'PHARMACY'
  | 'OFFICIAL_REGULATOR'
  | 'COMMUNITY';

export interface ExternalListing {
  id: string;
  productId: string;
  productName: string;
  brand?: string;
  model?: string;
  variant?: string; // e.g. "256GB", "128GB", "6kg refill", "50kg bag", "Pair", "3-pack"
  category: string;
  subcategory?: string;
  price: number;
  currency: 'KES';
  vendor: string;
  location: string;
  county?: string;
  town?: string;
  area?: string;
  source: string; // e.g. "Jumia Kenya", "Kilimall", "Jiji Kenya", "Carrefour Kenya", "Naivas", "EPRA Kenya"
  sourceCategory: SourceCategory;
  sourceUrl?: string;
  sourceMethod: SourceAccessMethod;
  availability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'ON_ORDER' | 'UNKNOWN';
  dateCollected: string;
  imageUrl?: string;
  specifications?: Record<string, string>;
  isVerified: boolean;
  notes?: string;
  isDemo?: boolean;
}

export interface SourceConnectorStatus {
  online: boolean;
  isConfigured: boolean;
  isRealConnection: boolean;
  connectionType: 'DIRECT_DATABASE' | 'REGULATORY_GAZETTE' | 'REALTIME_SEARCH_GROUNDING' | 'ENTERPRISE_API_REQUIRED';
  accessMethod: SourceAccessMethod;
  sourceCategory: SourceCategory;
  lastSync?: string;
  listingCount?: number;
  legalNotice?: string;
  requiredApiNotice?: string;
}

export interface SourceConnector {
  readonly id: string;
  readonly name: string;
  readonly displayName: string;
  readonly sourceCategory: SourceCategory;
  readonly accessMethod: SourceAccessMethod;
  readonly supportedCategories: string[];
  readonly officialUrl: string;

  isConfigured(): boolean;
  getStatus(): SourceConnectorStatus;
  
  // Consistent interface across all Kenyan sources
  searchProducts(query: SearchQueryAnalysis, locationFilter?: string, demoMode?: boolean): Promise<ExternalListing[]>;
  getProductDetails(productId: string): Promise<ExternalListing | null>;
  getPrices(query: SearchQueryAnalysis): Promise<ExternalListing[]>;
  getAvailability(productId: string): Promise<'IN_STOCK' | 'OUT_OF_STOCK' | 'ON_ORDER' | 'UNKNOWN'>;
}

export interface GroupedProductComparison {
  canonicalId: string;
  productName: string;
  brand?: string;
  model?: string;
  variant?: string;
  category: string;
  subcategory?: string;
  image: string;
  lowestPrice: number;
  highestPrice: number;
  typicalPrice: number;
  priceSpreadPercent: number;
  sourcesCount: number;
  listings: ExternalListing[];
  distinctVendors: string[];
  sourcesSummary: Array<{
    sourceName: string;
    sourceCategory: SourceCategory;
    price: number;
    location: string;
    sourceUrl?: string;
    dateCollected: string;
    availability: string;
    isVerified: boolean;
  }>;
  relatedAlternatives?: GroupedProductComparison[];
}
