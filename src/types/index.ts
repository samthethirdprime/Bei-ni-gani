export type PriceType = 'MARKET_RETAIL' | 'COMMUNITY_REPORT' | 'VERIFIED_OFFICIAL';

export type AcquisitionMethod = 
  | 'direct_api' 
  | 'direct_webpage' 
  | 'search_index' 
  | 'search_snippet' 
  | 'community' 
  | 'official' 
  | 'cache' 
  | 'demo';

export interface StructuredLocation {
  country?: string; // e.g. "Kenya", "United States", "United Kingdom", "Worldwide"
  countryCode?: string; // "KE", "US", "GB", "GLOBAL", etc.
  region?: string; // state/province/county/governorate
  city?: string; // city/town
  area?: string; // district/sub-county/neighborhood/estate
  rawText?: string; // formatted text e.g. "Kenya → Nairobi → Westlands"
}

export interface LocationInfo {
  country?: string;
  county: string;
  stateOrProvince?: string;
  town?: string;
  cityOrTown?: string;
  area?: string;
  neighborhoodOrArea?: string;
}

export interface VendorPrice {
  id: string;
  vendorName: string;
  price: number;
  currency?: string;
  unit: string;
  location: string;
  country?: string;
  sourceType: 'ONLINE_RETAILER' | 'PHYSICAL_STORE' | 'MARKET_STALL' | 'OFFICIAL' | 'COMMUNITY';
  acquisitionMethod?: AcquisitionMethod;
  sourceUrl?: string;
  image?: string;
  imageSource?: 'retailer' | 'fallback' | 'discovered' | 'generic';
  dateCollected: string;
  inStock?: boolean;
  notes?: string;
  isDemo?: boolean;
}

export interface PriceRecord {
  id: string;
  productId: string;
  vendorId?: string;
  vendorName: string;
  price: number;
  currency: string;
  unit: string;
  location: string;
  county?: string;
  country?: string;
  source: string;
  sourceUrl?: string;
  collectedAt: string;
  inStock?: boolean;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  subcategories?: string[];
}

export interface Product {
  id: string;
  name: string;
  swahiliName?: string;
  aliases: string[];
  category: string;
  subcategory?: string;
  brand?: string;
  model?: string;
  sizeOrQuantity: string;
  unit: string;
  image?: string;
  imageSource?: 'retailer' | 'fallback' | 'discovered' | 'generic';
  typicalPrice: number;
  minPrice: number;
  maxPrice: number;
  currency?: string; // 'KES' | 'USD' | 'GBP' | 'EUR' | 'NGN' | 'ZAR' | etc. Defaults to 'KES'
  priceType: PriceType;
  country?: string; // 'Kenya', 'United States', 'United Kingdom', etc.
  county: string; // state/county/province
  town?: string; // city/town
  area?: string; // neighborhood/estate/district
  retailerOrSource: string;
  dateCollected: string;
  reportsCount: number;
  confirmsCount: number;
  outdatesCount: number;
  flaggedCount: number;
  sourceUrl?: string;
  description: string;
  isCommunityAdded?: boolean;
  isCommunityCreated?: boolean;
  isRealtimeDiscovered?: boolean;
  isDemo?: boolean;
  verified?: boolean;
  vendors?: VendorPrice[];
  createdAt: string;
  updatedAt: string;
}

export interface CommunityReport {
  id: string;
  productId: string;
  productName: string;
  reportedPrice: number;
  currency?: string;
  unit: string;
  quantity: string;
  country?: string;
  county: string;
  town?: string;
  area?: string;
  storeName: string;
  purchaseDate: string;
  receiptUrl?: string;
  notes?: string;
  userVerification?: string;
  createdAt: string;
}

export interface PriceFeedback {
  id: string;
  productId: string;
  actionType: 'confirm' | 'outdated' | 'report';
  reason?: string;
  suggestedPrice?: number;
  createdAt: string;
}

export interface SearchQueryAnalysis {
  rawQuery: string;
  itemQuery: string;
  baseProduct?: string;
  detectedVariant?: string;
  detectedBrand?: string;
  detectedSize?: string;
  detectedLocation?: string;
  detectedCountry?: string;
  detectedRegion?: string;
  detectedCity?: string;
  detectedArea?: string;
  detectedCategory?: string;
  detectedSubcategory?: string;
  canonicalName?: string;
  isBroadQuery?: boolean;
  categoryFilter?: string;
}

export type CategoryKey = 
  | 'all'
  | 'groceries'
  | 'clothing'
  | 'footwear'
  | 'fitness'
  | 'household'
  | 'kitchen'
  | 'personal_care'
  | 'electronics'
  | 'hardware'
  | 'furniture'
  | 'automotive'
  | 'baby'
  | 'services'
  | 'housing'
  | 'transport'
  | 'office'
  | 'gardening'
  | 'pets'
  | 'travel'
  | 'music'
  | string;
