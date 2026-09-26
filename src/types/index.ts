export type PriceType = 'MARKET_RETAIL' | 'COMMUNITY_REPORT' | 'VERIFIED_OFFICIAL';

export interface LocationInfo {
  county: string;
  town?: string;
  area?: string;
}

export interface VendorPrice {
  id: string;
  vendorName: string;
  price: number;
  unit: string;
  location: string;
  sourceType: 'ONLINE_RETAILER' | 'PHYSICAL_STORE' | 'MARKET_STALL' | 'OFFICIAL' | 'COMMUNITY';
  sourceUrl?: string;
  dateCollected: string;
  inStock?: boolean;
  notes?: string;
}

export interface PriceRecord {
  id: string;
  productId: string;
  vendorId?: string;
  vendorName: string;
  price: number;
  currency: 'KES';
  unit: string;
  location: string;
  county?: string;
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
  sizeOrQuantity: string;
  unit: string;
  image: string;
  typicalPrice: number;
  minPrice: number;
  maxPrice: number;
  priceType: PriceType;
  county: string;
  town?: string;
  area?: string;
  retailerOrSource: string;
  dateCollected: string;
  reportsCount: number;
  confirmsCount: number;
  outdatesCount: number;
  flaggedCount: number;
  sourceUrl?: string;
  description: string;
  isCommunityAdded?: boolean;
  isRealtimeDiscovered?: boolean;
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
  unit: string;
  quantity: string;
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
  canonicalName?: string;
  detectedCategory?: string;
  detectedSubcategory?: string;
  detectedBrand?: string;
  detectedSize?: string;
  detectedLocation?: string;
  categoryFilter?: string;
}

export type CategoryKey = 
  | 'all'
  | 'groceries'
  | 'clothing'
  | 'footwear'
  | 'household'
  | 'kitchen'
  | 'personal_care'
  | 'electronics'
  | 'hardware'
  | 'fitness'
  | 'furniture'
  | 'automotive'
  | 'baby'
  | 'services'
  | 'housing'
  | 'transport'
  | string;
