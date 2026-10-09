import React, { useState, useEffect } from 'react';
import { 
  Check, 
  MapPin, 
  Users, 
  Clock, 
  ExternalLink, 
  TrendingUp, 
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Store,
  Sparkles,
  Package
} from 'lucide-react';
import { Product } from '../types';
import { formatPrice } from '../services/currencyService';
import { getProductImageUrl, getGenericProductImage, isFallbackProductImage, discoverProductImageAsync } from '../services/imageUtils';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onQuickConfirm: (productId: string) => Promise<void>;
  onOpenReportModal: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onQuickConfirm,
  onOpenReportModal
}) => {
  const imageUrl = getProductImageUrl(product);
  const [currentImgSrc, setCurrentImgSrc] = useState<string | null>(imageUrl);
  const [imageFailed, setImageFailed] = useState(false);
  const [hasTriedProxy, setHasTriedProxy] = useState(false);
  const [imgSource, setImgSource] = useState<'retailer' | 'fallback' | 'discovered' | 'generic' | null>(
    imageUrl ? (isFallbackProductImage(imageUrl) ? 'fallback' : (product.imageSource || 'retailer')) : null
  );
  const [isConfirming, setIsConfirming] = useState(false);
  const [justConfirmed, setJustConfirmed] = useState(false);

  // Sync image source when imageUrl changes, and trigger async discovery only if no image exists
  useEffect(() => {
    setCurrentImgSrc(imageUrl);
    setImageFailed(false);
    setHasTriedProxy(false);
    setImgSource(imageUrl ? (isFallbackProductImage(imageUrl) ? 'fallback' : (product.imageSource || 'retailer')) : null);

    // Dynamic discovery: ONLY run if no retailer image and no local photographic fallback
    if (!imageUrl && product?.name) {
      let isCancelled = false;
      discoverProductImageAsync({
        name: product.name,
        category: product.category,
        brand: product.brand,
        sizeOrQuantity: product.sizeOrQuantity,
        subcategory: product.subcategory
      }).then(discoveredUrl => {
        if (!isCancelled && discoveredUrl) {
          setCurrentImgSrc(discoveredUrl);
          setImgSource('discovered');
          setImageFailed(false);
        }
      });
      return () => {
        isCancelled = true;
      };
    }
  }, [imageUrl, product?.id, product?.name, product?.brand, product?.sizeOrQuantity, product?.category]);

  const handleImageError = () => {
    // If direct external image failed, automatically fall back to local image proxy
    if (!hasTriedProxy && currentImgSrc && (currentImgSrc.startsWith('http://') || currentImgSrc.startsWith('https://')) && !currentImgSrc.startsWith('/api/image-proxy')) {
      setHasTriedProxy(true);
      setCurrentImgSrc(`/api/image-proxy?url=${encodeURIComponent(currentImgSrc)}`);
    } else if (currentImgSrc && !isFallbackProductImage(currentImgSrc) && imgSource !== 'discovered') {
      // If genuine retailer image couldn't load, fallback to real matching product photograph
      const fallback = getGenericProductImage(product);
      if (fallback) {
        setCurrentImgSrc(fallback);
        setImgSource('fallback');
      } else {
        setImageFailed(true);
      }
    } else {
      setImageFailed(true);
    }
  };

  const handleConfirmClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (justConfirmed || isConfirming) return;
    setIsConfirming(true);
    try {
      await onQuickConfirm(product.id);
      setJustConfirmed(true);
      setTimeout(() => setJustConfirmed(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsConfirming(false);
    }
  };

  const curr = product.currency || 'KES';
  const formattedTypical = formatPrice(product.typicalPrice, curr);
  const formattedMin = formatPrice(product.minPrice, curr);
  const formattedMax = formatPrice(product.maxPrice, curr);

  return (
    <div 
      onClick={() => onSelect(product)}
      className="group relative bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700/80 rounded-2xl p-3.5 transition-all shadow-lg hover:shadow-xl cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top Header: Image + Names + Price */}
        <div className="flex gap-3.5 items-start">
          {/* Image / Neutral Placeholder */}
          <div className="relative aspect-square w-24 h-24 sm:w-28 sm:h-28 min-h-24 sm:min-h-28 rounded-xl overflow-hidden bg-neutral-950 flex-shrink-0 border border-neutral-800 flex items-center justify-center">
            {currentImgSrc && !imageFailed ? (
              <img
                src={currentImgSrc}
                alt={product.name}
                loading="eager"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={handleImageError}
                className="w-full h-full object-cover block group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-950 text-neutral-500 p-2 text-center select-none">
                <Package className="w-8 h-8 text-neutral-600 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 line-clamp-1">
                  {product.category || 'Product'}
                </span>
              </div>
            )}
            {product.isCommunityAdded && (
              <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/90 text-neutral-950">
                Community
              </span>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
                {product.category}
              </span>
              {product.brand && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/60">
                  {product.brand}
                </span>
              )}
              {product.sizeOrQuantity && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-800 text-teal-300 border border-neutral-700/50">
                  {product.sizeOrQuantity}
                </span>
              )}
              {product.isDemo ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800/80 flex items-center gap-1">
                  DEMO DATA
                </span>
              ) : product.priceType === 'VERIFIED_OFFICIAL' ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/80 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Official
                </span>
              ) : product.verified || product.isRealtimeDiscovered ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800/80 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Verified Live
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700/60">
                  Community
                </span>
              )}
              {product.vendors && product.vendors.length > 1 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700/60 flex items-center gap-1">
                  <Store className="w-3 h-3 text-amber-400" /> {product.vendors.length} Vendors
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1 mt-1 font-['Space_Grotesk']">
              {product.name}
            </h3>

            {product.swahiliName && (
              <p className="text-xs text-neutral-400 italic line-clamp-1">
                {product.swahiliName}
              </p>
            )}

            {/* Price display */}
            <div className="mt-1.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg sm:text-xl font-extrabold text-emerald-400">
                  {formattedTypical}
                </span>
                <span className="text-xs text-neutral-400 font-medium">
                  / {product.unit}
                </span>
              </div>
              <div className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5 flex-wrap min-w-0">
                <span className="text-neutral-500">Range:</span>
                <span className="font-semibold text-neutral-300">
                  {formattedMin} – {formattedMax}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Vendor & Source Row: Shows all available marketplaces directly on the initial result */}
        {product.vendors && product.vendors.length > 0 ? (
          <div className="mt-2.5 pt-2 border-t border-neutral-800/60 text-[11px] text-neutral-400">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                <Store className="w-3 h-3 text-amber-400" />
                Available at:
              </span>
              {Array.from(new Set(product.vendors.map(v => v.vendorName))).slice(0, 4).map(vName => (
                <span 
                  key={vName}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-200 border border-neutral-700/60 truncate max-w-[140px]"
                >
                  {vName}
                </span>
              ))}
              {new Set(product.vendors.map(v => v.vendorName)).size > 4 && (
                <span className="text-[10px] text-neutral-400 font-medium">
                  +{new Set(product.vendors.map(v => v.vendorName)).size - 4} more
                </span>
              )}
            </div>
          </div>
        ) : product.retailerOrSource ? (
          <div className="mt-2 text-[11px] text-neutral-400 flex items-center justify-between gap-2">
            <span className="truncate flex items-center gap-1.5 text-neutral-300">
              <Store className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
              <span className="truncate">{product.retailerOrSource}</span>
            </span>
            {product.dateCollected && (
              <span className="flex-shrink-0 text-neutral-500 flex items-center gap-1 text-[10px]">
                <Clock className="w-3 h-3" />
                <span>{product.dateCollected}</span>
              </span>
            )}
          </div>
        ) : null}

        {/* Location & Metadata Bar */}
        <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400">
          <div className="flex items-center gap-1 truncate max-w-[200px] sm:max-w-none">
            <MapPin className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
            <span className="truncate">
              {product.area ? `${product.area}, ` : ''}
              {product.town || product.county}
              {product.country && product.country !== 'Kenya' ? ` (${product.country})` : ''}
            </span>
          </div>

          <div className="flex items-center gap-3 text-neutral-400">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3 text-neutral-500" />
              <span>{product.reportsCount} reports</span>
            </span>
            <span className="flex items-center gap-1 text-emerald-400/90 font-medium">
              <Check className="w-3 h-3" />
              <span>{product.confirmsCount}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Action footer */}
      <div className="mt-3 pt-2.5 flex items-center justify-between gap-2">
        <button
          onClick={handleConfirmClick}
          disabled={justConfirmed || isConfirming}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            justConfirmed
              ? 'bg-emerald-500 text-neutral-950 font-bold'
              : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white'
          }`}
        >
          <Check className={`w-3.5 h-3.5 ${justConfirmed ? 'stroke-[3]' : 'text-emerald-400'}`} />
          <span>{justConfirmed ? 'Confirmed!' : '✓ Confirm'}</span>
        </button>

        <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 group-hover:translate-x-0.5 transition-transform">
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
