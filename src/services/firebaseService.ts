import { 
  collection, 
  doc, 
  getDocs, 
  getDocFromServer,
  setDoc, 
  updateDoc, 
  addDoc, 
  onSnapshot, 
  query, 
  where,
  increment 
} from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { Product, CommunityReport, PriceFeedback } from '../types';
import { INITIAL_PRODUCTS, INITIAL_COMMUNITY_REPORTS } from './catalogData';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test initial connection as required by Firebase skill
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
    return false;
  }
}

const PRODUCTS_COLLECTION = 'products';
const REPORTS_COLLECTION = 'reports';
const FEEDBACK_COLLECTION = 'feedback';
const PRICES_COLLECTION = 'prices';
const CATEGORIES_COLLECTION = 'categories';

// Fetch all community-added and verified products from Firestore
export async function fetchProductsFromFirestore(): Promise<Product[]> {
  try {
    const querySnapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    const products: Product[] = [];
    querySnapshot.forEach(docSnap => {
      products.push(docSnap.data() as Product);
    });
    return products;
  } catch (error) {
    console.warn('Firestore fetch failed:', error);
    return [];
  }
}

// Deprecated: No fake retailer data is seeded into Firestore
export async function seedInitialCatalog(): Promise<void> {
  // Intentionally a no-op to prevent injecting fake retailer data into Firestore.
  // Real community reports and submissions from real shoppers are persisted directly.
}

// Subscribe to real-time updates of community and verified products in Firestore
export function subscribeToProducts(
  onUpdate: (products: Product[]) => void,
  onError?: (err: unknown) => void
): () => void {
  try {
    const unsubscribe = onSnapshot(
      collection(db, PRODUCTS_COLLECTION),
      (snapshot) => {
        const items: Product[] = [];
        snapshot.forEach(docSnap => {
          items.push(docSnap.data() as Product);
        });
        onUpdate(items);
      },
      (error) => {
        console.error('Products onSnapshot error:', error);
        if (onError) onError(error);
        try {
          handleFirestoreError(error, OperationType.GET, PRODUCTS_COLLECTION);
        } catch (err) {
          console.error(err);
        }
      }
    );
    return unsubscribe;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, PRODUCTS_COLLECTION);
    return () => {};
  }
}

// Confirm a price accuracy
export async function confirmPrice(productId: string): Promise<void> {
  const path = `${PRODUCTS_COLLECTION}/${productId}`;
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    try {
      await updateDoc(productRef, {
        confirmsCount: increment(1),
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Product doc update skipped (item may be catalog-only):', e);
    }

    // Record feedback event
    await addDoc(collection(db, FEEDBACK_COLLECTION), {
      productId,
      actionType: 'confirm',
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Mark a price as outdated
export async function markPriceOutdated(productId: string, suggestedPrice?: number): Promise<void> {
  const path = `${PRODUCTS_COLLECTION}/${productId}`;
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    try {
      await updateDoc(productRef, {
        outdatesCount: increment(1),
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Product doc update skipped (item may be catalog-only):', e);
    }

    await addDoc(collection(db, FEEDBACK_COLLECTION), {
      productId,
      actionType: 'outdated',
      suggestedPrice: suggestedPrice || null,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Report a price issue
export async function reportPriceIssue(productId: string, reason: string): Promise<void> {
  const path = `${PRODUCTS_COLLECTION}/${productId}`;
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    try {
      await updateDoc(productRef, {
        flaggedCount: increment(1),
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Product doc update skipped (item may be catalog-only):', e);
    }

    await addDoc(collection(db, FEEDBACK_COLLECTION), {
      productId,
      actionType: 'report',
      reason,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Submit what user paid (Community Report)
export async function submitPaidReport(
  report: Omit<CommunityReport, 'id' | 'createdAt'>
): Promise<CommunityReport> {
  const newId = `rep-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const fullReport: CommunityReport = {
    ...report,
    id: newId,
    createdAt: new Date().toISOString()
  };

  try {
    // Save report
    await setDoc(doc(db, REPORTS_COLLECTION, newId), fullReport);

    // Update product stats
    try {
      const productRef = doc(db, PRODUCTS_COLLECTION, report.productId);
      await updateDoc(productRef, {
        reportsCount: increment(1),
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Product doc update skipped (item may be catalog-only):', e);
    }

    return fullReport;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${REPORTS_COLLECTION}/${newId}`);
    return fullReport;
  }
}

// Add a community product when item wasn't found in catalog
export async function addCommunityProduct(
  productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'confirmsCount' | 'outdatesCount' | 'flaggedCount' | 'reportsCount'>
): Promise<Product> {
  const newId = `user-prod-${Date.now()}`;
  const now = new Date().toISOString();
  
  const newProduct: Product = {
    ...productData,
    id: newId,
    confirmsCount: 1,
    outdatesCount: 0,
    flaggedCount: 0,
    reportsCount: 1,
    isCommunityAdded: true,
    createdAt: now,
    updatedAt: now
  };

  try {
    await setDoc(doc(db, PRODUCTS_COLLECTION, newId), newProduct);

    // Also record the first report for this item
    await addDoc(collection(db, REPORTS_COLLECTION), {
      productId: newId,
      productName: newProduct.name,
      reportedPrice: newProduct.typicalPrice,
      unit: newProduct.unit,
      quantity: newProduct.sizeOrQuantity,
      county: newProduct.county,
      town: newProduct.town || '',
      area: newProduct.area || '',
      storeName: newProduct.retailerOrSource,
      purchaseDate: 'Recently',
      createdAt: now
    });

    // Record in prices collection
    const priceId = `price-${newId}-p1`;
    await setDoc(doc(db, PRICES_COLLECTION, priceId), {
      id: priceId,
      productId: newId,
      vendorName: newProduct.retailerOrSource,
      price: newProduct.typicalPrice,
      currency: 'KES',
      unit: newProduct.unit,
      location: newProduct.town || newProduct.county,
      county: newProduct.county,
      source: 'Community User Submission',
      collectedAt: 'Today',
      inStock: true
    }).catch(e => console.warn('Could not write price record:', e));

    return newProduct;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${PRODUCTS_COLLECTION}/${newId}`);
    return newProduct;
  }
}

// Save a dynamically discovered product from real-time sources to Firestore
export async function saveDiscoveredProduct(product: Product): Promise<Product> {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, product.id);
    await setDoc(productRef, product, { merge: true });

    // Also persist individual vendor quotes to prices collection
    if (product.vendors && product.vendors.length > 0) {
      for (const v of product.vendors) {
        const pId = `price-${product.id}-${v.id}`;
        setDoc(doc(db, PRICES_COLLECTION, pId), {
          id: pId,
          productId: product.id,
          vendorName: v.vendorName,
          price: v.price,
          currency: 'KES',
          unit: v.unit || product.unit,
          location: v.location || product.county,
          county: product.county,
          source: v.sourceType,
          sourceUrl: v.sourceUrl || '',
          collectedAt: v.dateCollected || 'Recent',
          inStock: v.inStock !== false
        }).catch(e => console.warn('Could not write vendor price record:', e));
      }
    }

    return product;
  } catch (error) {
    console.warn('Could not save discovered product to Firestore:', error);
    return product;
  }
}

// Get community reports for a specific product
export async function fetchReportsForProduct(productId: string): Promise<CommunityReport[]> {
  try {
    const q = query(collection(db, REPORTS_COLLECTION), where('productId', '==', productId));
    const snapshot = await getDocs(q);
    const reports: CommunityReport[] = [];
    snapshot.forEach(docSnap => {
      reports.push(docSnap.data() as CommunityReport);
    });

    if (reports.length > 0) {
      return reports.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    // Fallback to initial seed reports if none in Firestore
    const matchingInitial = INITIAL_COMMUNITY_REPORTS.filter(r => r.productId === productId);
    if (matchingInitial.length > 0) {
      // Async seed to Firestore
      for (const initRep of matchingInitial) {
        setDoc(doc(db, REPORTS_COLLECTION, initRep.id), initRep).catch(() => {});
      }
      return matchingInitial.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    return [];
  } catch (error) {
    console.warn(`Could not load reports for ${productId}:`, error);
    const matchingInitial = INITIAL_COMMUNITY_REPORTS.filter(r => r.productId === productId);
    return matchingInitial.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
}
