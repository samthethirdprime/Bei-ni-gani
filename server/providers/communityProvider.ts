import { SearchProvider, ProviderSearchResult, NormalizedPriceResult } from './types';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query as firestoreQuery } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Load Firebase configuration
let db: any = null;
try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const firebaseConfig = JSON.parse(raw);
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
} catch (e) {
  console.warn('[CommunityProvider] Firebase init warning:', e);
}

export class CommunityProvider implements SearchProvider {
  readonly id = 'community';
  readonly name = 'Bei Gani Community';
  readonly requiresAuth = false;

  async search(query: string, options?: { location?: string; category?: string }): Promise<ProviderSearchResult> {
    const startTime = Date.now();
    const cleanQ = query.toLowerCase().trim();
    const targetLoc = options?.location?.toLowerCase().trim();
    const items: NormalizedPriceResult[] = [];

    if (!db) {
      return {
        providerId: this.id,
        providerName: this.name,
        items: [],
        status: {
          providerId: this.id,
          providerName: this.name,
          status: 'failed',
          itemCount: 0,
          durationMs: Date.now() - startTime,
          message: 'Firestore connection not initialized'
        }
      };
    }

    try {
      // Query community submissions from Firestore
      const reportsRef = collection(db, 'reports');
      const qSnap = await getDocs(firestoreQuery(reportsRef, limit(100)));

      qSnap.forEach(docSnap => {
        const data = docSnap.data();
        if (!data || !data.productName || !data.reportedPrice) return;

        const prodName = String(data.productName).toLowerCase();
        
        // Match against user query
        const queryTokens = cleanQ.split(/\s+/).filter(t => t.length > 1);
        const matchesQuery = queryTokens.length === 0 || 
          prodName.includes(cleanQ) || 
          queryTokens.every(tok => prodName.includes(tok));

        if (!matchesQuery) return;

        // Location filtering if requested
        if (targetLoc && targetLoc !== 'all' && targetLoc !== 'kenya') {
          const locString = `${data.county || ''} ${data.town || ''} ${data.area || ''}`.toLowerCase();
          if (!locString.includes(targetLoc)) {
            return;
          }
        }

        const locationStr = [data.area, data.town, data.county].filter(Boolean).join(', ') || 'Kenya';

        items.push({
          id: `community-${docSnap.id}`,
          name: data.productName,
          price: Number(data.reportedPrice),
          currency: 'KES',
          vendor: data.storeName || 'Local Estate Store / Market Stall',
          source: 'Community Report',
          sourceName: 'Bei Gani Shopper Community',
          sourceType: 'community',
          acquisitionMethod: 'community',
          url: data.receiptUrl || undefined,
          sourceUrl: data.receiptUrl || undefined,
          image: data.receiptUrl || undefined,
          location: locationStr,
          county: data.county,
          retrievedAt: new Date().toISOString(),
          timestamp: data.createdAt || data.purchaseDate || new Date().toISOString(),
          isVerified: true,
          notes: data.notes || 'Verified by community shopper in Kenya',
          unit: data.unit || 'unit'
        });
      });

      return {
        providerId: this.id,
        providerName: this.name,
        items,
        status: {
          providerId: this.id,
          providerName: this.name,
          status: 'success',
          itemCount: items.length,
          durationMs: Date.now() - startTime
        }
      };
    } catch (err: any) {
      console.warn('[CommunityProvider] Error querying Firestore:', err?.message || err);
      return {
        providerId: this.id,
        providerName: this.name,
        items: [],
        status: {
          providerId: this.id,
          providerName: this.name,
          status: 'failed',
          itemCount: 0,
          durationMs: Date.now() - startTime,
          message: err?.message || 'Failed to fetch community reports'
        }
      };
    }
  }
}
