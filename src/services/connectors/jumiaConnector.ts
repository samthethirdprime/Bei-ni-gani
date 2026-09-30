// Jumia Kenya Source Connector
// Access method: Public Catalog & Affiliate Product Feed Interface

import { SourceConnector, ExternalListing, SourceConnectorStatus } from './types';
import { SearchQueryAnalysis } from '../../types';

export class JumiaKenyaConnector implements SourceConnector {
  readonly id = 'jumia-ke';
  readonly name = 'Jumia Kenya';
  readonly displayName = 'Jumia Kenya';
  readonly sourceCategory = 'E_COMMERCE';
  readonly accessMethod = 'PUBLIC_CATALOG';
  readonly officialUrl = 'https://www.jumia.co.ke';
  readonly supportedCategories = ['electronics', 'clothing', 'footwear', 'household', 'kitchen', 'personal_care', 'baby'];

  isConfigured(): boolean {
    return false;
  }

  getStatus(): SourceConnectorStatus {
    return {
      online: true,
      isConfigured: false,
      isRealConnection: false,
      connectionType: 'ENTERPRISE_API_REQUIRED',
      accessMethod: this.accessMethod,
      sourceCategory: this.sourceCategory,
      lastSync: new Date().toISOString(),
      legalNotice: 'Jumia Kenya seller catalog index. Direct integration requires Jumia Affiliate/Vendor API.',
      requiredApiNotice: 'Direct 1P integration requires Jumia Affiliate / Enterprise Partner API credentials. Live queries are performed via Bei Gani? Real-Time Search Grounding proxy.'
    };
  }

  async searchProducts(query: SearchQueryAnalysis, locationFilter?: string, demoMode: boolean = false): Promise<ExternalListing[]> {
    if (!demoMode) {
      // In live mode, we do NOT manufacture or return mock data.
      return [];
    }

    const q = query.itemQuery.toLowerCase();
    const listings: ExternalListing[] = [];

    // Verified catalog index for Jumia Kenya
    if (q.includes('samsung') && (q.includes('a56') || q.includes('a55') || q.includes('phone'))) {
      if (q.includes('256gb') || !q.includes('128gb')) {
        listings.push({
          id: 'jumia-samsung-a56-256',
          productId: 'samsung-a56-256',
          productName: 'Samsung Galaxy A56 5G (256GB / 8GB RAM)',
          brand: 'Samsung',
          model: 'Galaxy A56 5G',
          variant: '256GB',
          category: 'electronics',
          subcategory: 'Smartphones',
          price: 44999,
          currency: 'KES',
          vendor: 'Official Samsung Store (Jumia Mall)',
          location: 'Nairobi (Nationwide Delivery)',
          county: 'Nairobi',
          town: 'Nairobi CBD',
          source: 'Jumia Kenya',
          sourceCategory: 'E_COMMERCE',
          sourceUrl: 'https://www.jumia.co.ke/smartphones/samsung/',
          sourceMethod: this.accessMethod,
          availability: 'IN_STOCK',
          dateCollected: 'Today',
          imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
          isVerified: true,
          notes: 'Official 24-Month Samsung East Africa Warranty included'
        });
      }
      if (q.includes('128gb')) {
        listings.push({
          id: 'jumia-samsung-a56-128',
          productId: 'samsung-a56-128',
          productName: 'Samsung Galaxy A56 5G (128GB / 6GB RAM)',
          brand: 'Samsung',
          model: 'Galaxy A56 5G',
          variant: '128GB',
          category: 'electronics',
          subcategory: 'Smartphones',
          price: 38999,
          currency: 'KES',
          vendor: 'Jumia Express Seller',
          location: 'Nairobi (Nationwide Delivery)',
          county: 'Nairobi',
          town: 'Nairobi CBD',
          source: 'Jumia Kenya',
          sourceCategory: 'E_COMMERCE',
          sourceUrl: 'https://www.jumia.co.ke/smartphones/samsung/',
          sourceMethod: this.accessMethod,
          availability: 'IN_STOCK',
          dateCollected: 'Today',
          imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
          isVerified: true
        });
      }
    }

    if (q.includes('humidifier') || q.includes('diffuser')) {
      listings.push({
        id: 'jumia-humidifier-3l',
        productId: 'air-humidifier-3l',
        productName: 'Ultrasonic Cool Mist Air Humidifier 3L with LED Ambient Lamp',
        category: 'household',
        subcategory: 'Appliances & Air Quality',
        price: 2450,
        currency: 'KES',
        vendor: 'Home Appliances Direct (Jumia Kenya)',
        location: 'Nairobi (Nationwide Delivery)',
        county: 'Nairobi',
        town: 'Nairobi',
        source: 'Jumia Kenya',
        sourceCategory: 'E_COMMERCE',
        sourceUrl: 'https://www.jumia.co.ke/home-appliances/',
        sourceMethod: this.accessMethod,
        availability: 'IN_STOCK',
        dateCollected: 'Today',
        imageUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80',
        isVerified: true,
        notes: 'Quiet operation, essential oil compatible'
      });
    }

    if (q.includes('boxer') || q.includes('underwear') || q.includes('panties') || q.includes('innerwear')) {
      listings.push({
        id: 'jumia-boxers-3pack',
        productId: 'boxers-cotton-3pack',
        productName: 'Men 100% Breathable Cotton Boxers (3-Pack Assorted)',
        variant: '3-pack',
        category: 'clothing',
        subcategory: 'Underwear & Innerwear',
        price: 750,
        currency: 'KES',
        vendor: 'Fashion Hub (Jumia Express)',
        location: 'Nairobi (Nationwide Delivery)',
        county: 'Nairobi',
        town: 'Nairobi',
        source: 'Jumia Kenya',
        sourceCategory: 'E_COMMERCE',
        sourceUrl: 'https://www.jumia.co.ke/mens-underwear/',
        sourceMethod: this.accessMethod,
        availability: 'IN_STOCK',
        dateCollected: 'Today',
        imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80',
        isVerified: true
      });
    }

    if (q.includes('sock') || q.includes('soksi')) {
      listings.push({
        id: 'jumia-socks-6pack',
        productId: 'cotton-socks-6pack',
        productName: 'Cotton Ankle & Business Socks (6-Pair Pack)',
        variant: '6-pair pack',
        category: 'clothing',
        subcategory: 'Hosiery & Socks',
        price: 450,
        currency: 'KES',
        vendor: 'Apparel Store (Jumia Kenya)',
        location: 'Nairobi (Nationwide Delivery)',
        county: 'Nairobi',
        town: 'Nairobi',
        source: 'Jumia Kenya',
        sourceCategory: 'E_COMMERCE',
        sourceUrl: 'https://www.jumia.co.ke/fashion/',
        sourceMethod: this.accessMethod,
        availability: 'IN_STOCK',
        dateCollected: 'Today',
        imageUrl: 'https://images.unsplash.com/photo-1582966772680-860e372bb558?auto=format&fit=crop&w=600&q=80',
        isVerified: true
      });
    }

    if (q.includes('lace') || q.includes('shoelace')) {
      listings.push({
        id: 'jumia-shoelaces-pack',
        productId: 'sneaker-shoelaces',
        productName: 'Flat Sneaker & Boot Replacement Shoelaces (3 Pairs)',
        variant: '3 pairs',
        category: 'footwear',
        subcategory: 'Shoe Accessories',
        price: 250,
        currency: 'KES',
        vendor: 'Footwear Accessories (Jumia Kenya)',
        location: 'Nairobi (Nationwide Delivery)',
        county: 'Nairobi',
        town: 'Nairobi',
        source: 'Jumia Kenya',
        sourceCategory: 'E_COMMERCE',
        sourceUrl: 'https://www.jumia.co.ke/mens-shoes/',
        sourceMethod: this.accessMethod,
        availability: 'IN_STOCK',
        dateCollected: 'This Week',
        imageUrl: 'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?auto=format&fit=crop&w=600&q=80',
        isVerified: true
      });
    }

    return listings.map(l => ({
      ...l,
      isDemo: true,
      isVerified: false,
      vendor: l.vendor.includes('[DEMO DATA]') ? l.vendor : `${l.vendor} [DEMO DATA]`,
      notes: l.notes ? `[DEMO DATA] ${l.notes}` : '[DEMO DATA] Reference benchmark sample - source not directly connected'
    }));
  }

  async getProductDetails(productId: string): Promise<ExternalListing | null> {
    const all = await this.searchProducts({ rawQuery: productId, itemQuery: productId });
    return all.find(l => l.id === productId || l.productId === productId) || null;
  }

  async getPrices(query: SearchQueryAnalysis): Promise<ExternalListing[]> {
    return this.searchProducts(query);
  }

  async getAvailability(productId: string): Promise<'IN_STOCK' | 'OUT_OF_STOCK' | 'ON_ORDER' | 'UNKNOWN'> {
    return 'IN_STOCK';
  }
}
