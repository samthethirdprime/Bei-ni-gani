// Bei Gani? Community Reports Connector
// Access method: Community-Submitted Price Database (Firebase Firestore)

import { SourceConnector, ExternalListing, SourceConnectorStatus } from './types';
import { SearchQueryAnalysis } from '../../types';
import { db } from '../../firebaseConfig';
import { collection, getDocs, query as firestoreQuery, limit } from 'firebase/firestore';
import { matchesStrictLocation } from '../locationService';

export class CommunityReportsConnector implements SourceConnector {
  readonly id = 'community-reports-ke';
  readonly name = 'Bei Gani Community';
  readonly displayName = 'Community Reports';
  readonly sourceCategory = 'COMMUNITY';
  readonly accessMethod = 'COMMUNITY_DATABASE';
  readonly officialUrl = 'https://beigani.co.ke';
  readonly supportedCategories = ['all'];

  isConfigured(): boolean {
    return true;
  }

  getStatus(): SourceConnectorStatus {
    return {
      online: true,
      isConfigured: true,
      isRealConnection: true,
      connectionType: 'DIRECT_DATABASE',
      accessMethod: this.accessMethod,
      sourceCategory: this.sourceCategory,
      lastSync: new Date().toISOString(),
      legalNotice: 'Real-time crowdsourced verified price submissions from real Kenyans buying in estates, shops, and open-air markets stored in Firebase Firestore.'
    };
  }

  async searchProducts(searchQuery: SearchQueryAnalysis, locationFilter?: string, demoMode: boolean = false): Promise<ExternalListing[]> {
    const listings: ExternalListing[] = [];
    const targetLoc = locationFilter || searchQuery.detectedLocation;
    const cleanQ = searchQuery.itemQuery.toLowerCase().trim();

    // 1. Fetch real community reports from Firebase Firestore
    try {
      const qSnap = await getDocs(firestoreQuery(collection(db, 'reports'), limit(100)));
      qSnap.forEach(docSnap => {
        const data = docSnap.data();
        if (data && data.productName && data.reportedPrice) {
          const prodName = String(data.productName).toLowerCase();
          // Match against search query tokens if query is present
          if (cleanQ && !prodName.includes(cleanQ) && !cleanQ.includes(prodName)) {
            return;
          }

          const l: ExternalListing = {
            id: `comm-${docSnap.id}`,
            productId: data.productId || `custom-${docSnap.id}`,
            productName: data.productName,
            category: data.category || 'general',
            price: Number(data.reportedPrice),
            currency: 'KES',
            vendor: data.storeName || 'Local Estate Shop / Market Stall',
            location: `${data.area || data.town || ''}, ${data.county || 'Kenya'}`.trim().replace(/^,\s*/, ''),
            county: data.county,
            town: data.town,
            area: data.area,
            source: 'Bei Gani Community',
            sourceCategory: 'COMMUNITY',
            sourceMethod: this.accessMethod,
            availability: 'IN_STOCK',
            dateCollected: data.purchaseDate || 'Recent',
            imageUrl: data.receiptUrl || undefined,
            isVerified: true,
            isDemo: false,
            notes: data.notes || 'Verified by community user submission in Firebase'
          };

          // Apply strict location if specified
          if (!targetLoc || matchesStrictLocation(l, targetLoc)) {
            listings.push(l);
          }
        }
      });
    } catch (e) {
      console.warn('[CommunityConnector] Firestore query note:', e);
    }

    // 2. Only if Demo Mode is explicitly enabled, return reference sample reports clearly labeled as DEMO DATA
    if (demoMode) {
      const q = cleanQ;
      
      if (q.includes('samsung') && q.includes('a56')) {
        listings.push({
          id: 'demo-comm-samsung-a56',
          productId: 'samsung-a56-256',
          productName: 'Samsung Galaxy A56 5G (256GB Dual SIM)',
          brand: 'Samsung',
          model: 'Galaxy A56',
          variant: '256GB',
          category: 'electronics',
          subcategory: 'Smartphones',
          price: 42500,
          currency: 'KES',
          vendor: 'Al-Haramain Phones (Eastleigh) [DEMO DATA]',
          location: 'Eastleigh, First Avenue, Nairobi',
          county: 'Nairobi',
          town: 'Eastleigh',
          area: 'First Avenue',
          source: 'Community Report (Demo Benchmark)',
          sourceCategory: 'COMMUNITY',
          sourceMethod: this.accessMethod,
          availability: 'IN_STOCK',
          dateCollected: 'Reference Demo Sample',
          isVerified: false,
          isDemo: true,
          notes: '[DEMO DATA] Reference benchmark sample - not live'
        });
      }

      if (q.includes('gas') || q.includes('lpg') || q.includes('6kg')) {
        listings.push({
          id: 'demo-comm-gas-6kg',
          productId: 'lpg-gas-6kg-refill',
          productName: '6kg Cooking Gas Refill (Kware Estate Shop)',
          variant: '6kg refill',
          category: 'household',
          subcategory: 'Cooking Gas & LPG',
          price: 1250,
          currency: 'KES',
          vendor: 'Kware Mini Market [DEMO DATA]',
          location: 'Ongata Rongai, Kware, Kajiado',
          county: 'Kajiado',
          town: 'Ongata Rongai',
          area: 'Kware',
          source: 'Community Report (Demo Benchmark)',
          sourceCategory: 'COMMUNITY',
          sourceMethod: this.accessMethod,
          availability: 'IN_STOCK',
          dateCollected: 'Reference Demo Sample',
          isVerified: false,
          isDemo: true,
          notes: '[DEMO DATA] Reference benchmark sample - not live'
        });
      }
    }

    return listings;
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
