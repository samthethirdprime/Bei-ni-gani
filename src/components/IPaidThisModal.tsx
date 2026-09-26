import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownRight, Minus, Store, MapPin } from 'lucide-react';
import { Product, CommunityReport } from '../types';

interface IPaidThisModalProps {
  product: Product | null;
  onClose: () => void;
  onSubmit: (report: Omit<CommunityReport, 'id' | 'createdAt'>) => Promise<void>;
}

export const IPaidThisModal: React.FC<IPaidThisModalProps> = ({
  product,
  onClose,
  onSubmit
}) => {
  if (!product) return null;

  const [pricePaid, setPricePaid] = useState<number | ''>('');
  const [quantity, setQuantity] = useState(product.sizeOrQuantity || '1');
  const [unit, setUnit] = useState(product.unit || 'piece');
  const [county, setCounty] = useState(product.county || 'Nairobi');
  const [area, setArea] = useState('');
  const [storeName, setStoreName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('Today');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Price Assessment Calculation (without modifying user's price)
  const numericPrice = typeof pricePaid === 'number' ? pricePaid : 0;
  let priceAssessment = {
    status: 'in_range',
    message: 'Within current reported market range.',
    color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60',
    icon: <Minus className="w-4 h-4 text-emerald-400" />
  };

  if (numericPrice > 0) {
    if (numericPrice > product.maxPrice) {
      priceAssessment = {
        status: 'above',
        message: 'Above current market range (Higher than average — e.g. estate delivery, premium brand, or remote area).',
        color: 'text-amber-400 bg-amber-950/40 border-amber-800/60',
        icon: <ArrowUpRight className="w-4 h-4 text-amber-400" />
      };
    } else if (numericPrice < product.minPrice) {
      priceAssessment = {
        status: 'below',
        message: 'Below current market range (Bargain deal, wholesale purchase, or promo discount).',
        color: 'text-teal-400 bg-teal-950/40 border-teal-800/60',
        icon: <ArrowDownRight className="w-4 h-4 text-teal-400" />
      };
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pricePaid || numericPrice <= 0) return;

    setSubmitting(true);
    try {
      await onSubmit({
        productId: product.id,
        productName: product.name,
        reportedPrice: numericPrice,
        unit,
        quantity,
        county,
        town: area,
        area,
        storeName: storeName.trim() || 'Local Seller',
        purchaseDate,
        notes: notes.trim()
      });
      setSubmittedSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div 
        className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div>
            <h3 className="text-lg font-black text-white font-['Space_Grotesk']">
              I Paid This • Report Price
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Item: <strong className="text-emerald-400">{product.name}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedSuccess ? (
          <div className="py-12 text-center space-y-3">
            <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-lg font-bold text-white">Asante Sana! Report Saved.</h4>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              Your price has been added to the Bei Gani community database. This helps fellow Kenyans compare fairly!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Market Reference Box */}
            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800/80 text-xs flex justify-between items-center">
              <span className="text-neutral-400">Current Market Range:</span>
              <span className="font-bold text-white">
                KSh {product.minPrice.toLocaleString()} – {product.maxPrice.toLocaleString()} / {product.unit}
              </span>
            </div>

            {/* Price Input */}
            <div>
              <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                How much did you actually pay? (KSh)*
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-neutral-400 font-bold text-sm">
                  KSh
                </span>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={pricePaid}
                  onChange={(e) => setPricePaid(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 650"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl pl-14 pr-4 py-2.5 text-white font-bold text-lg focus:outline-none"
                />
              </div>
            </div>

            {/* Live Price Assessment (Requirement: Do not change user's price, compare politely) */}
            {numericPrice > 0 && (
              <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${priceAssessment.color}`}>
                <div className="mt-0.5">{priceAssessment.icon}</div>
                <div>
                  <div className="font-bold">
                    Your reported price: KSh {numericPrice.toLocaleString()} / {unit}
                  </div>
                  <div className="text-[11px] opacity-90 mt-0.5">
                    {priceAssessment.message}
                  </div>
                </div>
              </div>
            )}

            {/* Quantity and Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">
                  Quantity / Size
                </label>
                <input
                  type="text"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 1 kg, 500ml, 1 pair"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">
                  Unit
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="kg, piece, liter, month"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Location (County & Area) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">
                  County*
                </label>
                <select
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Nairobi">Nairobi</option>
                  <option value="Mombasa">Mombasa</option>
                  <option value="Kisumu">Kisumu</option>
                  <option value="Nakuru">Nakuru</option>
                  <option value="Kiambu">Kiambu</option>
                  <option value="Kajiado">Kajiado</option>
                  <option value="Machakos">Machakos</option>
                  <option value="Uasin Gishu">Uasin Gishu</option>
                  <option value="Kilifi">Kilifi</option>
                  <option value="Other">Other County</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">
                  Town / Estate / Area
                </label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Rongai, South B, Gikomba"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Store & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">
                  Store / Vendor
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g. Naivas, Local Butchery"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">
                  When did you pay?
                </label>
                <select
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Today">Today</option>
                  <option value="Yesterday">Yesterday</option>
                  <option value="This Week">This Week</option>
                  <option value="Last Month">Last Month</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">
                Optional Notes (e.g. includes delivery, special offer)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special context..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || !pricePaid}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 font-bold rounded-xl transition-all shadow-md active:scale-95"
              >
                {submitting ? 'Saving to Database...' : 'Submit Price Paid'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
