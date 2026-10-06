import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Check, 
  Clock, 
  AlertTriangle, 
  PlusCircle, 
  Store, 
  TrendingUp, 
  ShieldCheck, 
  Calendar, 
  ChevronRight,
  HelpCircle,
  ExternalLink,
  Share2,
  Copy,
  MessageCircle,
  FileText,
  Package
} from 'lucide-react';
import { Product, CommunityReport } from '../types';
import { fetchReportsForProduct } from '../services/firebaseService';
import { PriceHistoryChart } from './PriceHistoryChart';
import { VendorComparisonList } from './VendorComparisonList';
import { formatPrice } from '../services/currencyService';
import { getProductImageUrl } from '../services/imageUtils';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onConfirm: (productId: string) => Promise<void>;
  onOpenOutdatedModal: (product: Product) => void;
  onOpenReportModal: (product: Product) => void;
  onOpenIPaidThis: (product: Product) => void;
  onRefreshLivePrices?: (product: Product) => Promise<void>;
  onShareToast?: (msg: string) => void;
  onOpenWorkspaceModal?: (product: Product, mode: 'drive' | 'calendar') => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onConfirm,
  onOpenOutdatedModal,
  onOpenReportModal,
  onOpenIPaidThis,
  onRefreshLivePrices,
  onShareToast,
  onOpenWorkspaceModal
}) => {
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmedSuccess, setConfirmedSuccess] = useState(false);
  const [isRefreshingVendors, setIsRefreshingVendors] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedToastVisible, setCopiedToastVisible] = useState(false);
  const imageUrl = getProductImageUrl(product);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
    if (product) {
      setLoadingReports(true);
      fetchReportsForProduct(product.id)
        .then(data => setReports(data))
        .finally(() => setLoadingReports(false));
    }
  }, [product?.id, product?.reportsCount, imageUrl]);

  const handleImageError = () => {
    setImageFailed(true);
  };

  if (!product) return null;

  const getDeepLink = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('item', product.id);
      return url.toString();
    } catch (e) {
      return `${window.location.origin}${window.location.pathname}?item=${encodeURIComponent(product.id)}`;
    }
  };

  const handleCopyLink = async () => {
    const link = getDeepLink();
    let success = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(link);
        success = true;
      }
    } catch (e) {
      // fallback
    }

    if (!success) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = link;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch (e) {
        console.warn('Clipboard copy failed:', e);
      }
    }

    setCopied(true);
    setCopiedToastVisible(true);
    if (onShareToast) {
      onShareToast(`✓ Link copied for "${product.name}"`);
    }
    setTimeout(() => setCopied(false), 3000);
    setTimeout(() => setCopiedToastVisible(false), 3500);
  };

  const curr = product.currency || 'KES';

  const handleShareWhatsApp = () => {
    const link = getDeepLink();
    const formattedPrice = formatPrice(product.typicalPrice, curr);
    const formattedRange = `${formatPrice(product.minPrice, curr)} - ${formatPrice(product.maxPrice, curr)}`;
    const text = `BEI GANI? 🌍\n${product.name}${product.swahiliName ? ` (${product.swahiliName})` : ''}\n💰 Typical Price: ${formattedPrice} / ${product.unit}\n📊 Range: ${formattedRange}\n📍 Location: ${product.area ? `${product.area}, ` : ''}${product.town || product.county}${product.country && product.country !== 'Kenya' ? ` (${product.country})` : ''}\n\nCheck live vendor prices & community reports:\n${link}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleConfirm = async () => {
    if (confirmedSuccess || isConfirming) return;
    setIsConfirming(true);
    try {
      await onConfirm(product.id);
      setConfirmedSuccess(true);
      setTimeout(() => setConfirmedSuccess(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsConfirming(false);
    }
  };

  const formattedTypical = formatPrice(product.typicalPrice, curr);
  const formattedMin = formatPrice(product.minPrice, curr);
  const formattedMax = formatPrice(product.maxPrice, curr);

  // Calculate percentage range position
  const rangeSpan = Math.max(product.maxPrice - product.minPrice, 1);
  const typicalOffset = Math.min(Math.max(((product.typicalPrice - product.minPrice) / rangeSpan) * 100, 0), 100);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="relative bg-neutral-900 border border-neutral-800 rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="sticky top-0 z-10 bg-neutral-900/95 backdrop-blur-md px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
              {product.category}
            </span>
            <span className="text-xs text-neutral-400">
              {product.dateCollected}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Share Deep Link Button */}
            <button
              onClick={handleCopyLink}
              title="Copy deep link to share via WhatsApp or social media"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border-neutral-700'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Share</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-5 space-y-6">
          {/* Main Visual & Info Header */}
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="w-full sm:w-44 h-48 sm:h-44 rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 flex-shrink-0 flex items-center justify-center">
              {imageUrl && !imageFailed ? (
                <img
                  src={imageUrl}
                  alt={product.name}
                  loading="eager"
                  decoding="async"
                  onError={handleImageError}
                  className="w-full h-full object-cover block"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-950 text-neutral-500 p-4 text-center select-none">
                  <Package className="w-12 h-12 text-neutral-600 mb-2" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    {product.category || 'Product'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-black text-white font-['Space_Grotesk'] leading-tight">
                {product.name}
              </h2>
              {product.isDemo && (
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800/80 mt-1">
                  DEMO DATA (Reference Benchmark)
                </span>
              )}
              {product.swahiliName && (
                <p className="text-sm text-emerald-400 font-semibold mt-0.5">
                  {product.swahiliName}
                </p>
              )}

              {/* Price Banner */}
              <div className="mt-3 bg-neutral-950/80 border border-neutral-800 p-3.5 rounded-2xl">
                <span className="text-xs font-semibold text-neutral-400 block uppercase tracking-wider">
                  Typical Market Benchmark
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
                    {formattedTypical}
                  </span>
                  <span className="text-sm text-neutral-400 font-medium">
                    / {product.unit}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Price Range Visualizer */}
          <div className="bg-neutral-950/50 border border-neutral-800/80 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-2 font-medium">
              <span>Lowest: <strong className="text-neutral-200">{formattedMin}</strong></span>
              <span className="text-emerald-400 font-bold">Typical: {formattedTypical}</span>
              <span>Highest: <strong className="text-neutral-200">{formattedMax}</strong></span>
            </div>

            {/* Slider bar */}
            <div className="relative w-full h-3 bg-neutral-800 rounded-full overflow-hidden">
              <div className="absolute inset-y-0 bg-gradient-to-r from-emerald-500/30 via-emerald-500 to-amber-500/50 w-full rounded-full" />
              <div 
                className="absolute top-0 bottom-0 w-3 bg-white rounded-full shadow-lg -ml-1.5"
                style={{ left: `${typicalOffset}%` }}
              />
            </div>
            
            <p className="text-[11px] text-neutral-500 mt-2.5">
              Based on {product.reportsCount} community submissions & external retailer data across Kenya.
            </p>
          </div>

          {/* Recharts Price History Line Chart */}
          <PriceHistoryChart product={product} reports={reports} />

          {/* Multiple Vendors Comparison List */}
          <VendorComparisonList 
            product={product} 
            vendors={product.vendors || []} 
            isRefreshing={isRefreshingVendors}
            onRefreshLive={onRefreshLivePrices ? async () => {
              setIsRefreshingVendors(true);
              try {
                await onRefreshLivePrices(product);
              } finally {
                setIsRefreshingVendors(false);
              }
            } : undefined}
          />

          {/* Location & Sources */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-neutral-950/40 border border-neutral-800/70 p-3 rounded-xl flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-bold text-neutral-300 block">Locations Sampled</span>
                <span className="text-neutral-400">
                  {product.area ? `${product.area}, ` : ''}
                  {product.town || product.county}
                  {product.country && product.country !== 'Kenya' ? `, ${product.country}` : ''}
                </span>
              </div>
            </div>

            <div className="bg-neutral-950/40 border border-neutral-800/70 p-3 rounded-xl flex items-start gap-2.5">
              <Store className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-bold text-neutral-300 block">Retailers & Sources</span>
                <span className="text-neutral-400">
                  {product.retailerOrSource}
                </span>
              </div>
            </div>
          </div>

          {/* Description & Buying Advice ("Usipay over") */}
          <div className="bg-emerald-950/20 border border-emerald-900/30 p-4 rounded-2xl">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Check Kwanza • Usipay Over
            </h4>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Share Price Information Card */}
          <div className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                  Share Price Information
                </h4>
              </div>
              <span className="text-[11px] text-neutral-400">
                Help friends & groups avoid overpaying
              </span>
            </div>

            {/* Direct Deep Link Display & Copy */}
            <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-xl p-2 mb-3">
              <input 
                readOnly
                value={getDeepLink()}
                className="flex-1 bg-transparent text-xs text-neutral-300 font-mono focus:outline-none truncate px-1 select-all"
              />
              <button
                onClick={handleCopyLink}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                  copied 
                    ? 'bg-emerald-500 text-neutral-950 shadow-emerald-500/20' 
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>

            {/* Social / WhatsApp Quick Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={handleShareWhatsApp}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                <MessageCircle className="w-4 h-4 fill-emerald-400/20" />
                <span>Share via WhatsApp</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="w-full py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold flex items-center justify-center gap-2 transition-all border border-neutral-700 active:scale-[0.99]"
              >
                <Share2 className="w-4 h-4 text-emerald-400" />
                <span>{copied ? '✓ Link in Clipboard' : 'Copy Product Deep Link'}</span>
              </button>
            </div>

            {copiedToastVisible && (
              <div className="mt-2.5 text-center text-[11px] font-semibold text-emerald-400 animate-in fade-in">
                ✓ Deep link copied to clipboard! Paste it into WhatsApp, Twitter/X, or SMS.
              </div>
            )}
          </div>

          {/* Google Workspace Integration Actions */}
          <div className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                  Google Workspace
                </h4>
              </div>
              <span className="text-[11px] text-neutral-400">
                Drive & Calendar Sync
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onOpenWorkspaceModal?.(product, 'drive')}
                className="py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-blue-500/50 text-neutral-200 hover:text-white transition-all shadow-xs active:scale-95"
              >
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Save to Google Drive</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenWorkspaceModal?.(product, 'calendar')}
                className="py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/50 text-neutral-200 hover:text-white transition-all shadow-xs active:scale-95"
              >
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Add to Google Calendar</span>
              </button>
            </div>
          </div>

          {/* Community Actions Row */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
              Help keep prices accurate for everyone:
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleConfirm}
                disabled={confirmedSuccess || isConfirming}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all border ${
                  confirmedSuccess
                    ? 'bg-emerald-500 text-neutral-950 border-emerald-400'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
                }`}
              >
                <Check className={`w-4 h-4 ${confirmedSuccess ? 'stroke-[3]' : 'text-emerald-400'}`} />
                <span>{confirmedSuccess ? 'Confirmed!' : `✓ Confirm (${product.confirmsCount})`}</span>
              </button>

              <button
                onClick={() => onOpenOutdatedModal(product)}
                className="py-2.5 px-3 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-all"
              >
                <Clock className="w-4 h-4 text-amber-400" />
                <span>⏰ Outdated ({product.outdatesCount})</span>
              </button>

              <button
                onClick={() => onOpenReportModal(product)}
                className="py-2.5 px-3 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-all"
              >
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>⚑ Report ({product.flaggedCount})</span>
              </button>
            </div>
          </div>

          {/* Recent Community Reports Timeline */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Recent Community Paid Reports</span>
                <span className="text-xs text-neutral-500">({reports.length || product.reportsCount})</span>
              </h4>
            </div>

            {loadingReports ? (
              <div className="py-6 text-center text-xs text-neutral-500 animate-pulse">
                Loading community reports...
              </div>
            ) : reports.length > 0 ? (
              <div className="space-y-2">
                {reports.slice(0, 5).map((rep) => (
                  <div 
                    key={rep.id}
                    className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-400 text-sm">
                          KSh {rep.reportedPrice.toLocaleString()}
                        </span>
                        <span className="text-neutral-400 font-medium">
                          / {rep.unit || product.unit}
                        </span>
                      </div>
                      <div className="text-neutral-400 text-[11px] mt-0.5 flex items-center gap-1.5">
                        <span>{rep.storeName || 'Local Seller'}</span>
                        <span>•</span>
                        <span>{rep.county || 'Kenya'}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-neutral-500 font-medium whitespace-nowrap">
                      {rep.purchaseDate || 'Recently'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80 text-center text-xs text-neutral-400">
                Be the first to log what you actually paid for this!
              </div>
            )}
          </div>
        </div>

        {/* Modal Sticky Bottom Action */}
        <div className="sticky bottom-0 bg-neutral-900 border-t border-neutral-800 p-4">
          <button
            onClick={() => onOpenIPaidThis(product)}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-neutral-950 font-black text-sm tracking-wide shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <PlusCircle className="w-5 h-5 stroke-[2.5]" />
            <span>+ I PAID THIS (Report What You Paid)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
