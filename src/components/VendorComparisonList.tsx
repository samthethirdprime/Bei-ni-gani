import React from 'react';
import { Store, ExternalLink, MapPin, Clock, Tag, CheckCircle2, TrendingDown, ArrowUpRight, Sparkles, Loader2 } from 'lucide-react';
import { Product, VendorPrice } from '../types';

interface VendorComparisonListProps {
  product: Product;
  vendors: VendorPrice[];
  onRefreshLive?: () => void;
  isRefreshing?: boolean;
}

export const VendorComparisonList: React.FC<VendorComparisonListProps> = ({ 
  product, 
  vendors,
  onRefreshLive,
  isRefreshing = false
}) => {
  if (!vendors || vendors.length === 0) return null;

  // Calculate stats purely from actual vendor prices
  const validPrices = vendors.map(v => v.price).filter(p => typeof p === 'number' && p > 0);
  const lowestPrice = validPrices.length > 0 ? Math.min(...validPrices) : product.minPrice;
  const highestPrice = validPrices.length > 0 ? Math.max(...validPrices) : product.maxPrice;
  const avgPrice = validPrices.length > 0 
    ? Math.round(validPrices.reduce((a, b) => a + b, 0) / validPrices.length) 
    : product.typicalPrice;

  // Sort vendors with lowest price first
  const sortedVendors = [...vendors].sort((a, b) => a.price - b.price);

  return (
    <div className="bg-neutral-950/70 border border-neutral-800/90 rounded-2xl p-4 space-y-3.5">
      {/* Header & Price Range summary calculated strictly from vendors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-neutral-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5 font-['Space_Grotesk']">
              <Store className="w-4 h-4 text-emerald-400" />
              <span>Compare Multiple Vendors ({vendors.length})</span>
            </h4>
            {onRefreshLive && (
              <button
                onClick={onRefreshLive}
                disabled={isRefreshing}
                className="px-2 py-0.5 rounded-full bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95"
                title="Fetch freshest prices from live retailers"
              >
                {isRefreshing ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Checking live...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Check Live Prices</span>
                  </>
                )}
              </button>
            )}
          </div>
          <p className="text-[11px] text-neutral-400">
            Real retrieved prices across Kenyan online retailers & local markets
          </p>
        </div>

        {/* Calculated vendor comparison range */}
        <div className="flex items-center gap-2 text-xs">
          <div className="bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-xl">
            <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold block leading-none">
              Lowest
            </span>
            <span className="font-extrabold text-emerald-300 text-xs sm:text-sm">
              KSh {lowestPrice.toLocaleString()}
            </span>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-xl">
            <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-semibold block leading-none">
              Typical Range
            </span>
            <span className="font-bold text-neutral-200 text-xs">
              KSh {lowestPrice.toLocaleString()} – {highestPrice.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Vendors list cards */}
      <div className="space-y-2">
        {sortedVendors.map((vendor, idx) => {
          const isLowest = vendor.price === lowestPrice;
          const diffFromLowest = vendor.price - lowestPrice;

          return (
            <div
              key={vendor.id || idx}
              className={`p-3 rounded-xl border transition-all text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                isLowest
                  ? 'bg-emerald-950/20 border-emerald-800/60 shadow-sm'
                  : 'bg-neutral-900/60 hover:bg-neutral-900 border-neutral-800/80'
              }`}
            >
              {/* Vendor Info */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-sm">
                    {vendor.vendorName}
                  </span>

                  {isLowest && (
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-500 text-neutral-950 flex items-center gap-1">
                      <TrendingDown className="w-3 h-3 stroke-[3]" /> Best Deal
                    </span>
                  )}

                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700/60">
                    {vendor.sourceType === 'ONLINE_RETAILER' ? 'Online' : vendor.sourceType === 'MARKET_STALL' ? 'Open Market' : 'Store'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-neutral-400 text-[11px] flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                    <span>{vendor.location || product.county}</span>
                  </span>

                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                    <span>{vendor.dateCollected || 'Recent'}</span>
                  </span>

                  {vendor.notes && (
                    <span className="text-neutral-500 italic">
                      • {vendor.notes}
                    </span>
                  )}
                </div>
              </div>

              {/* Price & External Link */}
              <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0 border-t sm:border-t-0 border-neutral-800/60">
                <div className="text-left sm:text-right">
                  <div className="text-base font-extrabold text-emerald-400">
                    KSh {vendor.price.toLocaleString()}
                    <span className="text-xs font-normal text-neutral-400"> / {vendor.unit || product.unit}</span>
                  </div>
                  {!isLowest && diffFromLowest > 0 && (
                    <div className="text-[10px] text-neutral-400">
                      +KSh {diffFromLowest.toLocaleString()} vs lowest
                    </div>
                  )}
                </div>

                {vendor.sourceUrl && (
                  <a
                    href={vendor.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 text-[11px] font-semibold"
                    title="View source"
                  >
                    <span>Source</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-[11px] text-neutral-500 flex items-center justify-between pt-1">
        <span>Prices verified from real merchant catalogs & listings.</span>
        <span>Always confirm stock with vendor before travel.</span>
      </div>
    </div>
  );
};
