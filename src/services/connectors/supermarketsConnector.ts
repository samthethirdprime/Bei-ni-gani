// Kenyan Supermarket Aggregator Connector
// Covers: Carrefour Kenya, Naivas, Quickmart, Chandarana Foodplus, Cleanshelf
// Access method: Public Catalog & Retail Feeds

import { SourceConnector, ExternalListing, SourceConnectorStatus } from './types';
import { SearchQueryAnalysis } from '../../types';

export class KenyanSupermarketsConnector implements SourceConnector {
  readonly id = 'supermarkets-ke';
  readonly name = 'Kenyan Supermarket Network';
  readonly displayName = 'Carrefour, Naivas, Quickmart, Chandarana & Cleanshelf';
  readonly sourceCategory = 'SUPERMARKET';
  readonly accessMethod = 'PUBLIC_CATALOG';
  readonly officialUrl = 'https://www.carrefour.ke';
  readonly supportedCategories = ['groceries', 'household', 'personal_care', 'clothing', 'baby', 'kitchen'];

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
      legalNotice: 'Kenyan supermarket shelf price circulars index (Carrefour, Naivas, Quickmart, Chandarana).',
      requiredApiNotice: 'Direct 1P integration requires supermarket partner enterprise API feeds. Live queries are performed via Bei Gani? Real-Time Search Grounding proxy.'
    };
  }

  async searchProducts(query: SearchQueryAnalysis, locationFilter?: string, demoMode: boolean = false): Promise<ExternalListing[]> {
    if (!demoMode) {
      return [];
    }

    const q = query.itemQuery.toLowerCase();
    const isBroad = query.isBroadQuery || (!query.detectedVariant && !query.detectedSize && !query.detectedBrand);
    const targetVariant = query.detectedVariant?.toLowerCase();
    const targetSize = query.detectedSize?.toLowerCase().replace(/\s+/g, '');
    const listings: ExternalListing[] = [];

    // ==========================================
    // 1. SUGAR (Sukari) - Broad Variant Coverage
    // ==========================================
    if (q.includes('sugar') || q.includes('sukari')) {
      const matchWhite = isBroad || !targetVariant || targetVariant === 'white';
      const matchBrown = isBroad || targetVariant === 'brown' || targetVariant === 'raw';

      // 1.1 White Sugar 1kg
      if (matchWhite && (!targetSize || targetSize === '1kg')) {
        listings.push({
          id: 'naivas-sugar-white-1kg',
          productId: 'sugar-white-1kg',
          productName: 'Kabras Pure White Cane Sugar (1 kg Packet)',
          brand: 'Kabras',
          model: 'White Sugar',
          variant: 'White Cane 1 kg',
          category: 'groceries',
          subcategory: 'Pantry Staples',
          price: 185,
          currency: 'KES',
          vendor: 'Naivas Supermarket',
          location: 'All Branches (Nairobi, Mombasa, Kisumu, Nakuru, Eldoret)',
          county: 'Nairobi',
          town: 'Nairobi',
          source: 'Naivas',
          sourceCategory: 'SUPERMARKET',
          sourceUrl: 'https://naivas.online',
          sourceMethod: this.accessMethod,
          availability: 'IN_STOCK',
          dateCollected: 'Today',
          imageUrl: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=600&q=80',
          isVerified: true
        });

        listings.push({
          id: 'carrefour-sugar-white-1kg',
          productId: 'sugar-white-1kg',
          productName: 'Mumias Pure White Sugar (1 kg Packet)',
          brand: 'Mumias',
          model: 'White Sugar',
          variant: 'White Cane 1 kg',
          category: 'groceries',
          subcategory: 'Pantry Staples',
          price: 180,
          currency: 'KES',
          vendor: 'Carrefour Kenya',
          location: 'Two Rivers, Sarit, Galleria, Junction, Mega',
          county: 'Nairobi',
          town: 'Nairobi',
          source: 'Carrefour Kenya',
          sourceCategory: 'SUPERMARKET',
          sourceUrl: 'https://www.carrefour.ke',
          sourceMethod: this.accessMethod,
          availability: 'IN_STOCK',
          dateCollected: 'Today',
          imageUrl: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=600&q=80',
          isVerified: true
        });
      }

      // 1.2 White Sugar 2kg
      if (matchWhite && (!targetSize || targetSize === '2kg')) {
        listings.push({
          id: 'quickmart-sugar-white-2kg',
          productId: 'sugar-white-2kg',
          productName: 'Kabras Premium White Sugar (2 kg Family Pack)',
          brand: 'Kabras',
          model: 'White Sugar',
          variant: 'White Cane 2 kg',
          category: 'groceries',
          subcategory: 'Pantry Staples',
          price: 360,
          currency: 'KES',
          vendor: 'Quickmart Supermarket',
          location: 'Branches Nationwide (Rongai, Roysambu, Westlands, etc.)',
          county: 'Nairobi',
          town: 'Nairobi',
          source: 'Quickmart',
          sourceCategory: 'SUPERMARKET',
          sourceUrl: 'https://quickmart.co.ke',
          sourceMethod: this.accessMethod,
          availability: 'IN_STOCK',
          dateCollected: 'Today',
          imageUrl: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=600&q=80',
          isVerified: true
        });

        listings.push({
          id: 'cleanshelf-sugar-white-2kg',
          productId: 'sugar-white-2kg',
          productName: 'Ndhiwa Pure White Sugar (2 kg Pack)',
          brand: 'Ndhiwa',
          model: 'White Sugar',
          variant: 'White Cane 2 kg',
          category: 'groceries',
          subcategory: 'Pantry Staples',
          price: 355,
          currency: 'KES',
          vendor: 'Cleanshelf Supermarket',
          location: 'Rongai, Kiambu, Ruaka, Kayole, Ngong',
          county: 'Kajiado',
          town: 'Ongata Rongai',
          source: 'Cleanshelf',
          sourceCategory: 'SUPERMARKET',
          sourceUrl: 'https://cleanshelf.co.ke',
          sourceMethod: this.accessMethod,
          availability: 'IN_STOCK',
          dateCollected: 'Today',
          imageUrl: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=600&q=80',
          isVerified: true
        });
      }

      // 1.3 Brown Sugar 1kg
      if (matchBrown && (!targetSize || targetSize === '1kg')) {
        listings.push({
          id: 'naivas-sugar-brown-1kg',
          productId: 'sugar-brown-1kg',
          productName: 'Kabras Light Brown Golden Cane Sugar (1 kg Packet)',
          brand: 'Kabras',
          model: 'Brown Sugar',
          variant: 'Brown Sugar 1 kg',
          category: 'groceries',
          subcategory: 'Pantry Staples',
          price: 215,
          currency: 'KES',
          vendor: 'Naivas Supermarket',
          location: 'Branches Nationwide',
          county: 'Nairobi',
          town: 'Nairobi',
          source: 'Naivas',
          sourceCategory: 'SUPERMARKET',
          sourceUrl: 'https://naivas.online',
          sourceMethod: this.accessMethod,
          availability: 'IN_STOCK',
          dateCollected: 'Today',
          imageUrl: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=600&q=80',
          isVerified: true
        });

        listings.push({
          id: 'chandarana-sugar-brown-1kg',
          productId: 'sugar-brown-1kg',
          productName: 'Nutrameal Unrefined Raw Brown Sugar (1 kg)',
          brand: 'Nutrameal',
          model: 'Raw Brown Sugar',
          variant: 'Raw Brown 1 kg',
          category: 'groceries',
          subcategory: 'Pantry Staples',
          price: 240,
          currency: 'KES',
          vendor: 'Chandarana Foodplus',
          location: 'Westlands, Kilimani, Karen, Nyali',
          county: 'Nairobi',
          town: 'Westlands',
          source: 'Chandarana Foodplus',
          sourceCategory: 'SUPERMARKET',
          sourceUrl: 'https://foodplus.co.ke',
          sourceMethod: this.accessMethod,
          availability: 'IN_STOCK',
          dateCollected: 'Yesterday',
          imageUrl: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=600&q=80',
          isVerified: true
        });
      }

      // 1.4 Brown Sugar 2kg
      if (matchBrown && (!targetSize || targetSize === '2kg')) {
        listings.push({
          id: 'carrefour-sugar-brown-2kg',
          productId: 'sugar-brown-2kg',
          productName: 'Kabras Golden Brown Cane Sugar (2 kg Pack)',
          brand: 'Kabras',
          model: 'Brown Sugar',
          variant: 'Brown Sugar 2 kg',
          category: 'groceries',
          subcategory: 'Pantry Staples',
          price: 420,
          currency: 'KES',
          vendor: 'Carrefour Kenya',
          location: 'Nationwide Stores',
          county: 'Nairobi',
          town: 'Nairobi',
          source: 'Carrefour Kenya',
          sourceCategory: 'SUPERMARKET',
          sourceUrl: 'https://www.carrefour.ke',
          sourceMethod: this.accessMethod,
          availability: 'IN_STOCK',
          dateCollected: 'Today',
          imageUrl: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=600&q=80',
          isVerified: true
        });
      }
    }

    // ==========================================
    // 2. RICE (Mchele) - Broad Variant Coverage
    // ==========================================
    if (q.includes('rice') || q.includes('mchele') || q.includes('pishori') || q.includes('basmati')) {
      const matchPishori = isBroad || !targetVariant || targetVariant === 'pishori';
      const matchBasmati = isBroad || !targetVariant || targetVariant === 'basmati';
      const matchSindano = isBroad || targetVariant === 'sindano' || targetVariant === 'white';

      // 2.1 Pure Mwea Pishori 2kg
      if (matchPishori && (!targetSize || targetSize === '2kg')) {
        listings.push({
          id: 'naivas-rice-pishori-2kg',
          productId: 'rice-pishori-2kg',
          productName: 'Sunrice Pure Mwea Pishori Aromatic Rice (2 kg)',
          brand: 'Sunrice',
          model: 'Pishori Rice',
          variant: 'Pure Pishori 2 kg',
          category: 'groceries',
          subcategory: 'Rice & Grains',
          price: 520,
          currency: 'KES',
          vendor: 'Naivas Supermarket',
          location: 'Nationwide Stores',
          county: 'Nairobi',
          town: 'Nairobi',
          source: 'Naivas',
          sourceCategory: 'SUPERMARKET',
          sourceUrl: 'https://naivas.online',
          sourceMethod: this.accessMethod,
          availability: 'IN_STOCK',
          dateCollected: 'Today',
          imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
          isVerified: true
        });

        listings.push({
          id: 'cleanshelf-rice-pishori-2kg',
          productId: 'rice-pishori-2kg',
          productName: 'Pearl Grade 1 Pure Mwea Pishori Rice (2 kg)',
          brand: 'Pearl',
          model: 'Pishori Rice',
          variant: 'Pure Pishori 2 kg',
          category: 'groceries',
          subcategory: 'Rice & Grains',
          price: 495,
          currency: 'KES',
          vendor: 'Cleanshelf Supermarket',
          location: 'Rongai, Kiambu, Ngong, Ruaka',
          county: 'Kiambu',
          town: 'Ruaka',
          source: 'Cleanshelf',
          sourceCategory: 'SUPERMARKET',
          sourceUrl: 'https://cleanshelf.co.ke',
          sourceMethod: this.accessMethod,
          availability: 'IN_STOCK',
          dateCollected: 'Today',
          imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
          isVerified: true
        });
      }

      // 2.2 Daawat Traditional Basmati Rice 2kg
      if (matchBasmati && (!targetSize || targetSize === '2kg')) {
        listings.push({
          id: 'carrefour-rice-basmati-2kg',
          productId: 'rice-basmati-2kg',
          productName: 'Daawat Traditional Long Grain Basmati Rice (2 kg)',
          brand: 'Daawat',
          model: 'Basmati Rice',
          variant: 'Basmati 2 kg',
          category: 'groceries',
          subcategory: 'Rice & Grains',
          price: 580,
          currency: 'KES',
          vendor: 'Carrefour Kenya',
          location: 'All Branches',
          county: 'Nairobi',
          town: 'Nairobi',
          source: 'Carrefour Kenya',
          sourceCategory: 'SUPERMARKET',
          sourceUrl: 'https://www.carrefour.ke',
          sourceMethod: this.accessMethod,
          availability: 'IN_STOCK',
          dateCollected: 'Today',
          imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
          isVerified: true
        });
      }

      // 2.3 Sindano Long Grain 2kg
      if (matchSindano && (!targetSize || targetSize === '2kg')) {
        listings.push({
          id: 'quickmart-rice-sindano-2kg',
          productId: 'rice-sindano-2kg',
          productName: 'Amana Sindano Long Grain White Rice (2 kg)',
          brand: 'Amana',
          model: 'Sindano Rice',
          variant: 'Sindano 2 kg',
          category: 'groceries',
          subcategory: 'Rice & Grains',
          price: 360,
          currency: 'KES',
          vendor: 'Quickmart Supermarket',
          location: 'Nationwide Stores',
          county: 'Nairobi',
          town: 'Nairobi',
          source: 'Quickmart',
          sourceCategory: 'SUPERMARKET',
          sourceUrl: 'https://quickmart.co.ke',
          sourceMethod: this.accessMethod,
          availability: 'IN_STOCK',
          dateCollected: 'Today',
          imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
          isVerified: true
        });
      }
    }

    // ==========================================
    // 3. MILK (Maziwa) - Broad Variant Coverage
    // ==========================================
    if (q.includes('milk') || q.includes('maziwa') || q.includes('lala') || q.includes('mala')) {
      const matchFresh = isBroad || !targetVariant || targetVariant === 'fresh';
      const matchUHT = isBroad || targetVariant === 'uht' || targetVariant === 'long life';
      const matchMala = isBroad || targetVariant === 'mala' || targetVariant === 'lala' || targetVariant === 'fermented';

      // 3.1 Fresh Pasteurized Milk 500ml Pouch
      if (matchFresh && (!targetSize || targetSize === '500ml')) {
        listings.push({
          id: 'naivas-milk-fresh-500ml',
          productId: 'milk-fresh-500ml',
          productName: 'Brookside Homogenized Fresh Whole Milk (500 ml Pouch)',
          brand: 'Brookside',
          model: 'Fresh Whole Milk',
          variant: 'Fresh Pouch 500ml',
          category: 'groceries',
          subcategory: 'Dairy & Milk',
          price: 65,
          currency: 'KES',
          vendor: 'Naivas Supermarket',
          location: 'Nationwide Stores',
          county: 'Nairobi',
          town: 'Nairobi',
          source: 'Naivas',
          sourceCategory: 'SUPERMARKET',
          sourceUrl: 'https://naivas.online',
          sourceMethod: this.accessMethod,
          availability: 'IN_STOCK',
          dateCollected: 'Today',
          imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
          isVerified: true
        });

        listings.push({
          id: 'quickmart-milk-kcc-500ml',
          productId: 'milk-fresh-500ml',
          productName: 'KCC Gold Crown Fresh Whole Milk (500 ml Pouch)',
          brand: 'KCC',
          model: 'Fresh Whole Milk',
          variant: 'Fresh Pouch 500ml',
          category: 'groceries',
          subcategory: 'Dairy & Milk',
          price: 60,
          currency: 'KES',
          vendor: 'Quickmart Supermarket',
          location: 'Nationwide Stores',
          county: 'Nairobi',
          town: 'Nairobi',
          source: 'Quickmart',
          sourceCategory: 'SUPERMARKET',
          sourceUrl: 'https://quickmart.co.ke',
          sourceMethod: this.accessMethod,
          availability: 'IN_STOCK',
          dateCollected: 'Today',
          imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
          isVerified: true
        });
      }

      // 3.2 Long Life UHT Milk 1 Litre
      if (matchUHT && (!targetSize || targetSize === '1l' || targetSize === '1litre')) {
        listings.push({
          id: 'carrefour-milk-uht-1l',
          productId: 'milk-uht-1l',
          productName: 'Brookside Long Life UHT Full Cream Milk (1 Litre Tetra Pak)',
          brand: 'Brookside',
          model: 'UHT Whole Milk',
          variant: 'UHT Carton 1L',
          category: 'groceries',
          subcategory: 'Dairy & Milk',
          price: 155,
          currency: 'KES',
          vendor: 'Carrefour Kenya',
          location: 'All Branches',
          county: 'Nairobi',
          town: 'Nairobi',
          source: 'Carrefour Kenya',
          sourceCategory: 'SUPERMARKET',
          sourceUrl: 'https://www.carrefour.ke',
          sourceMethod: this.accessMethod,
          availability: 'IN_STOCK',
          dateCollected: 'Today',
          imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
          isVerified: true
        });
      }

      // 3.3 Fermented Milk / Mala 500ml
      if (matchMala && (!targetSize || targetSize === '500ml')) {
        listings.push({
          id: 'cleanshelf-milk-mala-500ml',
          productId: 'milk-mala-500ml',
          productName: 'KCC Natural Mala Fermented Cultured Milk (500 ml Pouch)',
          brand: 'KCC',
          model: 'Fermented Mala',
          variant: 'Mala 500ml',
          category: 'groceries',
          subcategory: 'Dairy & Milk',
          price: 70,
          currency: 'KES',
          vendor: 'Cleanshelf Supermarket',
          location: 'Rongai, Kiambu, Ngong, Ruaka',
          county: 'Kajiado',
          town: 'Ongata Rongai',
          source: 'Cleanshelf',
          sourceCategory: 'SUPERMARKET',
          sourceUrl: 'https://cleanshelf.co.ke',
          sourceMethod: this.accessMethod,
          availability: 'IN_STOCK',
          dateCollected: 'Today',
          imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
          isVerified: true
        });
      }
    }

    // ==========================================
    // 4. WATERMELON & PRODUCE
    // ==========================================
    if (q.includes('watermelon') || q.includes('water melon') || q.includes('tikiti')) {
      listings.push({
        id: 'carrefour-watermelon',
        productId: 'fresh-watermelon-kg',
        productName: 'Fresh Sweet Watermelon (Per Kilogram)',
        variant: '1 kg',
        category: 'groceries',
        subcategory: 'Fresh Produce',
        price: 68,
        currency: 'KES',
        vendor: 'Carrefour Fresh Produce Section',
        location: 'Nairobi / Kiambu Branches',
        county: 'Nairobi',
        town: 'Nairobi',
        source: 'Carrefour Kenya',
        sourceCategory: 'SUPERMARKET',
        sourceUrl: 'https://www.carrefour.ke',
        sourceMethod: this.accessMethod,
        availability: 'IN_STOCK',
        dateCollected: 'Today',
        imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80',
        isVerified: true
      });

      listings.push({
        id: 'quickmart-watermelon',
        productId: 'fresh-watermelon-kg',
        productName: 'Fresh Whole Watermelon (Per Kilogram)',
        variant: '1 kg',
        category: 'groceries',
        subcategory: 'Fresh Produce',
        price: 65,
        currency: 'KES',
        vendor: 'Quickmart Fresh Market',
        location: 'Nationwide Stores',
        county: 'Nairobi',
        town: 'Nairobi',
        source: 'Quickmart',
        sourceCategory: 'SUPERMARKET',
        sourceUrl: 'https://quickmart.co.ke',
        sourceMethod: this.accessMethod,
        availability: 'IN_STOCK',
        dateCollected: 'Today',
        imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80',
        isVerified: true
      });
    }

    // ==========================================
    // 5. COOKING GAS / LPG REFILLS
    // ==========================================
    if (q.includes('gas') || q.includes('lpg') || q.includes('mtungi') || q.includes('k-gas') || q.includes('total gas')) {
      listings.push({
        id: 'carrefour-gas-6kg',
        productId: 'lpg-gas-6kg-refill',
        productName: '6kg Cooking Gas LPG Refill (TotalEnergies / K-Gas / Rubis)',
        variant: '6kg refill',
        category: 'household',
        subcategory: 'Cooking Gas & LPG',
        price: 1350,
        currency: 'KES',
        vendor: 'Carrefour Hypermarket Energy Point',
        location: 'Sarit, Two Rivers, Galleria, Junction',
        county: 'Nairobi',
        town: 'Westlands',
        source: 'Carrefour Kenya',
        sourceCategory: 'SUPERMARKET',
        sourceUrl: 'https://www.carrefour.ke',
        sourceMethod: this.accessMethod,
        availability: 'IN_STOCK',
        dateCollected: 'Today',
        imageUrl: 'https://images.unsplash.com/photo-1584281722573-b3c79c8846c4?auto=format&fit=crop&w=600&q=80',
        isVerified: true
      });

      listings.push({
        id: 'naivas-gas-6kg',
        productId: 'lpg-gas-6kg-refill',
        productName: '6kg Cooking Gas Refill (Standard Valve Interchangeable)',
        variant: '6kg refill',
        category: 'household',
        subcategory: 'Cooking Gas & LPG',
        price: 1300,
        currency: 'KES',
        vendor: 'Naivas Supermarket Gas Hub',
        location: 'Selected Naivas branches nationwide',
        county: 'Nairobi',
        town: 'Nairobi',
        source: 'Naivas',
        sourceCategory: 'SUPERMARKET',
        sourceUrl: 'https://naivas.online',
        sourceMethod: this.accessMethod,
        availability: 'IN_STOCK',
        dateCollected: 'Today',
        imageUrl: 'https://images.unsplash.com/photo-1584281722573-b3c79c8846c4?auto=format&fit=crop&w=600&q=80',
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
    return all[0] || null;
  }

  async getPrices(query: SearchQueryAnalysis): Promise<ExternalListing[]> {
    return this.searchProducts(query);
  }

  async getAvailability(productId: string): Promise<'IN_STOCK' | 'OUT_OF_STOCK' | 'ON_ORDER' | 'UNKNOWN'> {
    return 'IN_STOCK';
  }
}
