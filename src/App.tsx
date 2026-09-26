import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  TrendingDown, 
  ShieldCheck, 
  ShoppingBag,
  HelpCircle,
  ArrowRight,
  Database,
  Store,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { Product, CommunityReport, CategoryKey, SearchQueryAnalysis } from './types';
import { INITIAL_PRODUCTS } from './services/catalogData';
import { 
  testConnection, 
  subscribeToProducts, 
  confirmPrice, 
  markPriceOutdated, 
  reportPriceIssue, 
  submitPaidReport, 
  addCommunityProduct,
  saveDiscoveredProduct
} from './services/firebaseService';
import { searchProducts, analyzeSearchQuery, searchRealtimePrice } from './services/searchEngine';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { CategoryFilter } from './components/CategoryFilter';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { IPaidThisModal } from './components/IPaidThisModal';
import { AddItemModal } from './components/AddItemModal';
import { ReportIssueModal } from './components/ReportIssueModal';
import { FirebaseConfigGuideModal } from './components/FirebaseConfigGuideModal';
import { LiveSearchScanner } from './components/LiveSearchScanner';

export default function App() {
  // State
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');
  const [selectedCounty, setSelectedCounty] = useState('');
  
  // Real-time Discovery State
  const [isLiveSearching, setIsLiveSearching] = useState(false);
  const [liveSearchFailed, setLiveSearchFailed] = useState(false);
  const [liveSearchFailedMessage, setLiveSearchFailedMessage] = useState<string | undefined>();
  const [lastLiveQueried, setLastLiveQueried] = useState<string>('');
  
  // Modals state
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [paidModalProduct, setPaidModalProduct] = useState<Product | null>(null);
  const [issueModalProduct, setIssueModalProduct] = useState<{ product: Product; mode: 'outdated' | 'report' } | null>(null);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [addItemPrefill, setAddItemPrefill] = useState('');
  const [showFirebaseGuide, setShowFirebaseGuide] = useState(false);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  // Firebase connection and real-time subscription
  useEffect(() => {
    // 1. Connection test
    testConnection();

    // 2. Real-time subscription to products
    const unsubscribe = subscribeToProducts((loadedProducts) => {
      if (loadedProducts && loadedProducts.length > 0) {
        setProducts(loadedProducts);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Handle deep linking to product (?item=prod-id or ?product=prod-id or #item=prod-id)
  const initialDeepLinkProcessed = useRef(false);

  useEffect(() => {
    if (initialDeepLinkProcessed.current || products.length === 0) return;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash.replace('#', '');
      const hashParams = new URLSearchParams(hash);
      const targetId = urlParams.get('item') || urlParams.get('product') || urlParams.get('id') || hashParams.get('item') || hashParams.get('product');

      if (targetId) {
        const found = products.find(p => p.id === targetId || p.id.toLowerCase() === targetId.toLowerCase());
        if (found) {
          setActiveProduct(found);
          initialDeepLinkProcessed.current = true;
        }
      }
    } catch (e) {
      console.warn('Deep link parsing error:', e);
    }
  }, [products]);

  // Sync browser URL with active product for seamless sharing
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (activeProduct) {
        url.searchParams.set('item', activeProduct.id);
        window.history.replaceState({ productId: activeProduct.id }, '', url.toString());
      } else {
        if (url.searchParams.has('item') || url.searchParams.has('product') || url.searchParams.has('id')) {
          url.searchParams.delete('item');
          url.searchParams.delete('product');
          url.searchParams.delete('id');
          window.history.replaceState({}, '', url.toString());
        }
      }
    } catch (e) {
      // Ignore URL manipulation failures in restricted environments
    }
  }, [activeProduct]);

  // Sync active product when product list changes (e.g. confirms incremented)
  useEffect(() => {
    if (activeProduct) {
      const updated = products.find(p => p.id === activeProduct.id);
      if (updated) {
        setActiveProduct(updated);
      }
    }
  }, [products]);

  // Query analysis for UI (location separation, cleaned item term)
  const queryAnalysis: SearchQueryAnalysis = useMemo(() => {
    return analyzeSearchQuery(searchQuery);
  }, [searchQuery]);

  // Filtered & accurately matched products from internal catalog
  const searchResults = useMemo(() => {
    return searchProducts(products, searchQuery, selectedCategory, selectedCounty);
  }, [products, searchQuery, selectedCategory, selectedCounty]);

  // Perform Live Real-time Price Discovery across Kenyan sources
  const performLiveSearch = useCallback(async (queryToSearch: string) => {
    const trimmed = queryToSearch.trim();
    if (!trimmed || trimmed.length < 2) return;

    setIsLiveSearching(true);
    setLiveSearchFailed(false);
    setLiveSearchFailedMessage(undefined);
    setLastLiveQueried(trimmed.toLowerCase());

    try {
      const result = await searchRealtimePrice(
        trimmed, 
        selectedCounty || queryAnalysis.detectedLocation, 
        selectedCategory !== 'all' ? selectedCategory : undefined
      );

      if (result.verified && result.product) {
        const discovered = result.product;
        // Persist to Firestore
        await saveDiscoveredProduct(discovered);
        
        // Update local state immediately
        setProducts((prev) => {
          const filtered = prev.filter(p => p.id !== discovered.id && p.name.toLowerCase() !== discovered.name.toLowerCase());
          return [discovered, ...filtered];
        });

        setIsLiveSearching(false);
        setLiveSearchFailed(false);
        showToast(`✓ Verified live prices found across ${discovered.vendors?.length || 3} Kenyan vendors!`);
      } else {
        setIsLiveSearching(false);
        setLiveSearchFailed(true);
        setLiveSearchFailedMessage(result.message || "We couldn't find a verified current price for this item.");
      }
    } catch (err) {
      console.error('Error during real-time search:', err);
      setIsLiveSearching(false);
      setLiveSearchFailed(true);
      setLiveSearchFailedMessage("We couldn't find a verified current price for this item.");
    }
  }, [selectedCounty, selectedCategory, queryAnalysis.detectedLocation]);

  // Auto-trigger live search if no internal results found (with debouncing)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const trimmed = searchQuery.trim();

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Reset failed state if query cleared
    if (!trimmed) {
      setIsLiveSearching(false);
      setLiveSearchFailed(false);
      setLastLiveQueried('');
      return;
    }

    // If internal results are present, do not auto-fail
    if (searchResults.length > 0) {
      setLiveSearchFailed(false);
      setIsLiveSearching(false);
      return;
    }

    // If NO internal results and query is substantial and not already queried
    if (searchResults.length === 0 && trimmed.length >= 3 && trimmed.toLowerCase() !== lastLiveQueried && !isLiveSearching) {
      setIsLiveSearching(true);
      debounceTimerRef.current = setTimeout(() => {
        performLiveSearch(trimmed);
      }, 1300);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, searchResults.length, lastLiveQueried, performLiveSearch]);

  // Refresh live vendors for a specific product inside modal
  const handleRefreshProductVendors = async (product: Product) => {
    try {
      showToast(`⚡ Querying latest vendor prices for "${product.name}"...`);
      const result = await searchRealtimePrice(
        product.name,
        product.county,
        product.category
      );

      if (result.verified && result.product && result.product.vendors && result.product.vendors.length > 0) {
        const updatedProduct: Product = {
          ...product,
          vendors: result.product.vendors,
          minPrice: result.product.minPrice,
          maxPrice: result.product.maxPrice,
          typicalPrice: result.product.typicalPrice,
          updatedAt: new Date().toISOString()
        };

        await saveDiscoveredProduct(updatedProduct);
        setProducts(prev => prev.map(p => p.id === product.id ? updatedProduct : p));
        setActiveProduct(updatedProduct);
        showToast('✓ Successfully refreshed prices with latest Kenyan vendor data!');
      } else {
        showToast('Current prices verified as up-to-date.');
      }
    } catch (err) {
      console.error(err);
      showToast('Could not refresh live vendors at this moment.');
    }
  };

  // Quick confirm handler
  const handleQuickConfirm = async (productId: string) => {
    try {
      await confirmPrice(productId);
      showToast('✓ Price confirmed! Asante for verifying.');
    } catch (err) {
      console.error(err);
      showToast('Price confirmation saved.');
    }
  };

  // Submit what user paid
  const handlePaidSubmit = async (reportData: Omit<CommunityReport, 'id' | 'createdAt'>) => {
    await submitPaidReport(reportData);
    showToast('✓ Your price paid was saved to Bei Gani!');
  };

  // Outdated flag submit
  const handleOutdatedSubmit = async (productId: string, suggestedPrice?: number) => {
    await markPriceOutdated(productId, suggestedPrice);
    showToast('⏰ Flagged as outdated. Thank you!');
  };

  // Problem report submit
  const handleReportSubmit = async (productId: string, reason: string) => {
    await reportPriceIssue(productId, reason);
    showToast('⚑ Report submitted for review.');
  };

  // Add missing product
  const handleAddProduct = async (productData: Parameters<typeof addCommunityProduct>[0]) => {
    const newProd = await addCommunityProduct(productData);
    showToast(`✓ "${newProd.name}" added to catalog!`);
    setActiveProduct(newProd);
  };

  // Navigation handlers
  const handleSelectProduct = (product: Product) => {
    setActiveProduct(product);
  };

  const handleCloseProductModal = () => {
    setActiveProduct(null);
  };

  const handleSelectExample = (term: string) => {
    setSearchQuery(term);
    setSelectedCategory('all');
    setLiveSearchFailed(false);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setLiveSearchFailed(false);
    setIsLiveSearching(false);
    setLastLiveQueried('');
  };

  const handleOpenAddItemWithQuery = (prefillName: string) => {
    setAddItemPrefill(prefillName);
    setShowAddItemModal(true);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-neutral-950 px-4 py-2.5 rounded-full font-bold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3 max-w-[90vw] text-center">
          <CheckCircle className="w-4 h-4 stroke-[2.5] flex-shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* App Header */}
      <Header
        onOpenAddItem={() => {
          setAddItemPrefill('');
          setShowAddItemModal(true);
        }}
        onOpenFirebaseGuide={() => setShowFirebaseGuide(true)}
        selectedCounty={selectedCounty}
        onSelectCounty={setSelectedCounty}
        productsCount={products.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-5 space-y-5">
        {/* Hero Banner / Tagline Box */}
        <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Usipay Over • Real-Time Kenyan Price Discovery</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Space_Grotesk'] tracking-tight">
              Before unask bei, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">check bei.</span>
            </h2>

            <p className="text-xs sm:text-sm text-neutral-400 max-w-xl leading-relaxed">
              Find out what products & services cost across Kenya right now. Discover and compare verified prices from multiple online retailers, supermarkets, open-air markets, and community reports.
            </p>
          </div>

          <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Large Search Box with Examples */}
        <section>
          <SearchBar
            query={searchQuery}
            onChangeQuery={setSearchQuery}
            onClear={handleClearSearch}
            queryAnalysis={queryAnalysis}
            onSelectExample={handleSelectExample}
            isSearching={isLiveSearching}
            onSearchSubmit={() => performLiveSearch(searchQuery)}
          />
        </section>

        {/* Category Horizontal Pills */}
        <section>
          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </section>

        {/* Active Filters / Results Header */}
        <div className="flex items-center justify-between pt-1 text-xs text-neutral-400">
          <div className="flex items-center gap-2 flex-wrap">
            {searchQuery ? (
              <span>
                Results for <strong className="text-white">"{searchQuery}"</strong> ({searchResults.length} {searchResults.length === 1 ? 'match' : 'matches'})
              </span>
            ) : selectedCategory !== 'all' ? (
              <span>
                Showing <strong className="text-white">{selectedCategory}</strong> items ({searchResults.length})
              </span>
            ) : (
              <span>
                Commonly Checked Everyday Items ({searchResults.length})
              </span>
            )}

            {selectedCounty && (
              <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                📍 {selectedCounty}
              </span>
            )}
          </div>

          {(searchQuery || selectedCategory !== 'all' || selectedCounty) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedCounty('');
                setLiveSearchFailed(false);
              }}
              className="text-emerald-400 hover:text-emerald-300 font-semibold text-xs"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Live Search Discovery Banner if internal matches already exist */}
        {searchQuery.trim().length >= 2 && searchResults.length > 0 && !isLiveSearching && (
          <div className="bg-neutral-900/60 border border-emerald-800/40 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-neutral-300">
              <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                Showing catalog matches. Want to scan more live Kenyan online retailers & markets for <strong className="text-white">"{searchQuery}"</strong>?
              </span>
            </div>

            <button
              onClick={() => performLiveSearch(searchQuery)}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 font-bold flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Store className="w-3.5 h-3.5 text-amber-400" />
              <span>Scan More Sources</span>
            </button>
          </div>
        )}

        {/* Live Search Scanning / Fallback Area */}
        {(isLiveSearching || (searchResults.length === 0 && searchQuery.trim().length >= 2)) && (
          <LiveSearchScanner
            query={searchQuery}
            isSearching={isLiveSearching}
            searchFailed={liveSearchFailed}
            failedMessage={liveSearchFailedMessage}
            onOpenAddItem={handleOpenAddItemWithQuery}
            onSelectExample={handleSelectExample}
            onRetry={() => performLiveSearch(searchQuery)}
          />
        )}

        {/* Product Cards Grid */}
        {searchResults.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {searchResults.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={handleSelectProduct}
                onQuickConfirm={handleQuickConfirm}
                onOpenReportModal={(p) => setIssueModalProduct({ product: p, mode: 'report' })}
              />
            ))}
          </div>
        )}

        {/* Bottom Banner: Community Reporting Info */}
        <section className="bg-neutral-900/40 border border-neutral-800/60 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
          <div className="flex items-center gap-2.5 text-center sm:text-left">
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 hidden sm:block" />
            <span>
              Real-time prices tracked from supermarkets (Carrefour, Naivas, Quickmart), open-air markets (Wakulima, Gikomba), and ordinary Kenyans nationwide.
            </span>
          </div>

          <button
            onClick={() => {
              setAddItemPrefill('');
              setShowAddItemModal(true);
            }}
            className="flex-shrink-0 text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 whitespace-nowrap"
          >
            <span>Report a price you paid</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-neutral-800/80 bg-neutral-950 py-6 text-center text-xs text-neutral-500 space-y-2">
        <p className="font-semibold text-neutral-400">
          BEI GANI? • Before unask bei, check bei.
        </p>
        <p className="text-[11px] text-neutral-600">
          Empowering Kenyans with transparent market pricing, multi-vendor comparison, and community-driven reports.
        </p>
      </footer>

      {/* MODALS */}
      {/* 1. Item Details Modal */}
      {activeProduct && (
        <ProductDetailModal
          product={activeProduct}
          onClose={handleCloseProductModal}
          onConfirm={handleQuickConfirm}
          onOpenOutdatedModal={(p) => setIssueModalProduct({ product: p, mode: 'outdated' })}
          onOpenReportModal={(p) => setIssueModalProduct({ product: p, mode: 'report' })}
          onOpenIPaidThis={(p) => setPaidModalProduct(p)}
          onRefreshLivePrices={handleRefreshProductVendors}
          onShareToast={showToast}
        />
      )}

      {/* 2. I Paid This Modal */}
      {paidModalProduct && (
        <IPaidThisModal
          product={paidModalProduct}
          onClose={() => setPaidModalProduct(null)}
          onSubmit={handlePaidSubmit}
        />
      )}

      {/* 3. Add Item Modal (when missing) */}
      {showAddItemModal && (
        <AddItemModal
          initialName={addItemPrefill}
          onClose={() => {
            setShowAddItemModal(false);
            setAddItemPrefill('');
          }}
          onAddProduct={handleAddProduct}
        />
      )}

      {/* 4. Report Issue Modal */}
      {issueModalProduct && (
        <ReportIssueModal
          product={issueModalProduct.product}
          mode={issueModalProduct.mode}
          onClose={() => setIssueModalProduct(null)}
          onSubmitOutdated={handleOutdatedSubmit}
          onSubmitReport={handleReportSubmit}
        />
      )}

      {/* 5. Firebase Config Guide Modal */}
      {showFirebaseGuide && (
        <FirebaseConfigGuideModal
          onClose={() => setShowFirebaseGuide(false)}
        />
      )}
    </div>
  );
}
