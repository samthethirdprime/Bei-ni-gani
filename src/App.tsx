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
  Loader2,
  Layers,
  MapPin
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
import { StrictLocationBanner } from './components/StrictLocationBanner';
import { ConnectedSourcesModal } from './components/ConnectedSourcesModal';
import { WorkspaceModal } from './components/WorkspaceModal';
import { LocationSelector } from './components/LocationSelector';

export default function App() {
  // State
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  
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
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const [workspaceModal, setWorkspaceModal] = useState<{ product: Product; mode: 'drive' | 'calendar' } | null>(null);

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

  // Dynamic category calculations
  const dynamicCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category.toLowerCase().trim());
    });
    return Array.from(set);
  }, [products]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length };
    products.forEach(p => {
      const cat = (p.category || '').toLowerCase().trim();
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Filtered & accurately matched products from internal catalog
  const searchResults = useMemo(() => {
    return searchProducts(products, searchQuery, selectedCategory, selectedLocation);
  }, [products, searchQuery, selectedCategory, selectedLocation]);

  // Selected variant filter for broad queries
  const [selectedVariantFilter, setSelectedVariantFilter] = useState<string>('all');

  useEffect(() => {
    setSelectedVariantFilter('all');
  }, [searchQuery]);

  // Calculate available variant chips for broad product search
  const availableVariants = useMemo(() => {
    if (!queryAnalysis.baseProduct || searchResults.length <= 1) return [];
    const groups: { key: string; label: string; count: number; matcher: (p: Product) => boolean }[] = [];

    if (queryAnalysis.baseProduct === 'sugar') {
      const isWhite = (p: Product) => p.name.toLowerCase().includes('white') || p.aliases.some(a => a.includes('white'));
      const isBrown = (p: Product) => (p.name.toLowerCase().includes('brown') || p.aliases.some(a => a.includes('brown'))) && !p.name.toLowerCase().includes('raw');
      const isRaw = (p: Product) => p.name.toLowerCase().includes('raw') || p.name.toLowerCase().includes('demerara') || p.aliases.some(a => a.includes('raw'));
      
      const whiteCount = searchResults.filter(isWhite).length;
      const brownCount = searchResults.filter(isBrown).length;
      const rawCount = searchResults.filter(isRaw).length;
      
      if (whiteCount > 0) groups.push({ key: 'white', label: 'White Sugar', count: whiteCount, matcher: isWhite });
      if (brownCount > 0) groups.push({ key: 'brown', label: 'Brown Sugar', count: brownCount, matcher: isBrown });
      if (rawCount > 0) groups.push({ key: 'raw', label: 'Raw / Demerara', count: rawCount, matcher: isRaw });
    } else if (queryAnalysis.baseProduct === 'rice') {
      const isPishori = (p: Product) => p.name.toLowerCase().includes('pishori');
      const isBasmati = (p: Product) => p.name.toLowerCase().includes('basmati');
      const isSindano = (p: Product) => p.name.toLowerCase().includes('sindano');
      
      const pCount = searchResults.filter(isPishori).length;
      const bCount = searchResults.filter(isBasmati).length;
      const sCount = searchResults.filter(isSindano).length;

      if (pCount > 0) groups.push({ key: 'pishori', label: 'Pishori Rice', count: pCount, matcher: isPishori });
      if (bCount > 0) groups.push({ key: 'basmati', label: 'Basmati Rice', count: bCount, matcher: isBasmati });
      if (sCount > 0) groups.push({ key: 'sindano', label: 'Sindano Rice', count: sCount, matcher: isSindano });
    } else if (queryAnalysis.baseProduct === 'milk') {
      const isFresh = (p: Product) => p.name.toLowerCase().includes('fresh') || p.unit.toLowerCase().includes('pouch');
      const isUht = (p: Product) => p.name.toLowerCase().includes('uht') || p.name.toLowerCase().includes('long life');
      const isMala = (p: Product) => p.name.toLowerCase().includes('mala') || p.name.toLowerCase().includes('lala');

      const fCount = searchResults.filter(isFresh).length;
      const uCount = searchResults.filter(isUht).length;
      const mCount = searchResults.filter(isMala).length;

      if (fCount > 0) groups.push({ key: 'fresh', label: 'Fresh Milk', count: fCount, matcher: isFresh });
      if (uCount > 0) groups.push({ key: 'uht', label: 'UHT Long Life', count: uCount, matcher: isUht });
      if (mCount > 0) groups.push({ key: 'mala', label: 'Fermented / Mala', count: mCount, matcher: isMala });
    } else if (queryAnalysis.baseProduct === 'shoes') {
      const isSchool = (p: Product) => p.name.toLowerCase().includes('toughees') || p.name.toLowerCase().includes('school');
      const isLoafer = (p: Product) => p.name.toLowerCase().includes('loafer') || p.name.toLowerCase().includes('formal');
      const isSneaker = (p: Product) => p.name.toLowerCase().includes('sneaker') || p.name.toLowerCase().includes('canvas');
      const isBoot = (p: Product) => p.name.toLowerCase().includes('boot');

      const scCount = searchResults.filter(isSchool).length;
      const lCount = searchResults.filter(isLoafer).length;
      const snCount = searchResults.filter(isSneaker).length;
      const btCount = searchResults.filter(isBoot).length;

      if (scCount > 0) groups.push({ key: 'school', label: 'School Shoes (Toughees)', count: scCount, matcher: isSchool });
      if (lCount > 0) groups.push({ key: 'loafers', label: 'Formal Loafers', count: lCount, matcher: isLoafer });
      if (snCount > 0) groups.push({ key: 'sneakers', label: 'Sneakers (Raba)', count: snCount, matcher: isSneaker });
      if (btCount > 0) groups.push({ key: 'boots', label: 'Safari Boots', count: btCount, matcher: isBoot });
    } else if (queryAnalysis.baseProduct === 'boxers') {
      const isMen = (p: Product) => p.name.toLowerCase().includes('men') || p.name.toLowerCase().includes('boxer');
      const isWomen = (p: Product) => p.name.toLowerCase().includes('women') || p.name.toLowerCase().includes('panties');

      const mCount = searchResults.filter(isMen).length;
      const wCount = searchResults.filter(isWomen).length;

      if (mCount > 0) groups.push({ key: 'men', label: "Men's Boxers", count: mCount, matcher: isMen });
      if (wCount > 0) groups.push({ key: 'women', label: "Women's Underwear", count: wCount, matcher: isWomen });
    }

    return groups;
  }, [queryAnalysis.baseProduct, searchResults]);

  // Displayed results after optional variant filter
  const displayedResults = useMemo(() => {
    if (selectedVariantFilter === 'all') return searchResults;
    const group = availableVariants.find(g => g.key === selectedVariantFilter);
    if (!group) return searchResults;
    return searchResults.filter(group.matcher);
  }, [searchResults, selectedVariantFilter, availableVariants]);

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
        selectedLocation || queryAnalysis.detectedLocation, 
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
  }, [selectedLocation, selectedCategory, queryAnalysis.detectedLocation]);

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
    setProducts(prev => prev.map(p => {
      if (p.id === reportData.productId) {
        return {
          ...p,
          reportsCount: (p.reportsCount || 0) + 1,
          minPrice: Math.min(p.minPrice, reportData.reportedPrice),
          maxPrice: Math.max(p.maxPrice, reportData.reportedPrice)
        };
      }
      return p;
    }));
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
    setProducts(prev => [newProd, ...prev.filter(p => p.id !== newProd.id)]);
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
        onOpenSources={() => setShowSourcesModal(true)}
        selectedLocation={selectedLocation}
        selectedCounty={selectedLocation}
        onOpenLocationModal={() => setShowLocationModal(true)}
        onSelectCounty={setSelectedLocation}
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
            selectedLocation={selectedLocation}
            onOpenLocationModal={() => setShowLocationModal(true)}
          />
        </section>

        {/* Category Horizontal Pills */}
        <section>
          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            categoryCounts={categoryCounts}
            dynamicCategories={dynamicCategories}
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

            {/* Clickable Location Badge */}
            {selectedLocation ? (
              <button
                type="button"
                onClick={() => setShowLocationModal(true)}
                className="bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/80 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                title="Click to change location filter"
              >
                <MapPin className="w-3 h-3 text-emerald-400" />
                <span>📍 {selectedLocation}</span>
                <span
                  role="button"
                  aria-label="Clear location filter"
                  className="text-emerald-400 hover:text-white ml-0.5 px-1 rounded hover:bg-emerald-800/60 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLocation('');
                  }}
                  title="Clear location filter"
                >
                  ✕
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowLocationModal(true)}
                className="bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 hover:border-neutral-700 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Filter by Country, County, City or Area"
              >
                <MapPin className="w-3 h-3 text-emerald-400" />
                <span>Worldwide</span>
              </button>
            )}
          </div>

          {(searchQuery || selectedCategory !== 'all' || selectedLocation) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedLocation('');
                setLiveSearchFailed(false);
              }}
              className="text-emerald-400 hover:text-emerald-300 font-semibold text-xs cursor-pointer"
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
              className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Store className="w-3.5 h-3.5 text-amber-400" />
              <span>Scan More Sources</span>
            </button>
          </div>
        )}

        {/* Strict Location Banner when 0 results in specified location */}
        {searchResults.length === 0 && (selectedLocation || queryAnalysis.detectedLocation) && !isLiveSearching && (
          <StrictLocationBanner
            requestedLocation={selectedLocation || queryAnalysis.detectedLocation || ''}
            itemQuery={queryAnalysis.itemQuery}
            onSelectNearby={(area) => {
              setSelectedLocation(area);
            }}
            onClearLocation={() => {
              setSelectedLocation('');
              setSearchQuery(queryAnalysis.itemQuery);
            }}
            onReportPrice={() => {
              setAddItemPrefill(queryAnalysis.itemQuery);
              setShowAddItemModal(true);
            }}
            onOpenLocationModal={() => setShowLocationModal(true)}
          />
        )}

        {/* Live Search Scanning / Fallback Area (when no strict location issue) */}
        {(isLiveSearching || (searchResults.length === 0 && searchQuery.trim().length >= 2 && !(selectedLocation || queryAnalysis.detectedLocation))) && (
          <LiveSearchScanner
            query={searchQuery}
            identifiedName={queryAnalysis.canonicalName || queryAnalysis.itemQuery}
            isSearching={isLiveSearching}
            searchFailed={liveSearchFailed}
            failedMessage={liveSearchFailedMessage}
            onOpenAddItem={handleOpenAddItemWithQuery}
            onSelectExample={handleSelectExample}
            onRetry={() => performLiveSearch(searchQuery)}
          />
        )}

        {/* Broad Query Variant Filter Tabs */}
        {availableVariants.length > 0 && searchResults.length > 0 && (
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider pl-1.5 pr-1 flex items-center gap-1 flex-shrink-0">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Variants:</span>
            </span>

            <button
              onClick={() => setSelectedVariantFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold flex-shrink-0 transition-all ${
                selectedVariantFilter === 'all'
                  ? 'bg-emerald-500 text-neutral-950 shadow-md'
                  : 'bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white'
              }`}
            >
              All Variants ({searchResults.length})
            </button>

            {availableVariants.map((v) => (
              <button
                key={v.key}
                onClick={() => setSelectedVariantFilter(v.key)}
                className={`px-3 py-1.5 rounded-xl font-bold flex-shrink-0 transition-all ${
                  selectedVariantFilter === v.key
                    ? 'bg-emerald-500 text-neutral-950 shadow-md'
                    : 'bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white'
                }`}
              >
                {v.label} ({v.count})
              </button>
            ))}
          </div>
        )}

        {/* Product Cards Grid */}
        {displayedResults.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {displayedResults.map((product) => (
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

        {/* When variant filter narrows to 0 items */}
        {displayedResults.length === 0 && searchResults.length > 0 && (
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 text-center text-xs text-neutral-400 space-y-2">
            <p>No products found for the selected variant.</p>
            <button
              onClick={() => setSelectedVariantFilter('all')}
              className="text-emerald-400 font-bold hover:underline"
            >
              Show all variants ({searchResults.length})
            </button>
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
          onOpenWorkspaceModal={(p, mode) => setWorkspaceModal({ product: p, mode })}
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

      {/* 6. Connected Sources Transparency Modal */}
      <ConnectedSourcesModal
        isOpen={showSourcesModal}
        onClose={() => setShowSourcesModal(false)}
      />

      {/* 7. Google Workspace Modal (Drive & Calendar) */}
      {workspaceModal && (
        <WorkspaceModal
          isOpen={!!workspaceModal}
          product={workspaceModal.product}
          mode={workspaceModal.mode}
          onClose={() => setWorkspaceModal(null)}
          onToast={showToast}
        />
      )}

      {/* 8. Worldwide & Kenyan Location Filter Selector Modal */}
      <LocationSelector
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        selectedLocation={selectedLocation}
        onSelectLocation={(locStr) => {
          setSelectedLocation(locStr);
        }}
      />
    </div>
  );
}
