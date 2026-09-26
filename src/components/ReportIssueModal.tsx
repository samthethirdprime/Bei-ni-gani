import React, { useState } from 'react';
import { X, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { Product } from '../types';

interface ReportIssueModalProps {
  product: Product | null;
  mode: 'outdated' | 'report';
  onClose: () => void;
  onSubmitOutdated: (productId: string, suggestedPrice?: number) => Promise<void>;
  onSubmitReport: (productId: string, reason: string) => Promise<void>;
}

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  product,
  mode,
  onClose,
  onSubmitOutdated,
  onSubmitReport
}) => {
  if (!product) return null;

  const [suggestedPrice, setSuggestedPrice] = useState<number | ''>('');
  const [reason, setReason] = useState('Price increased significantly');
  const [otherReason, setOtherReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const REPORT_REASONS = [
    'Price is significantly wrong or fake',
    'Item/Listing is misleading or scam',
    'Incorrect unit of measure or size',
    'Store/Location closed or no longer sells this',
    'Other reason'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === 'outdated') {
        const numPrice = typeof suggestedPrice === 'number' && suggestedPrice > 0 ? suggestedPrice : undefined;
        await onSubmitOutdated(product.id, numPrice);
      } else {
        const finalReason = reason === 'Other reason' ? (otherReason.trim() || 'Other reason') : reason;
        await onSubmitReport(product.id, finalReason);
      }
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const isOutdatedMode = mode === 'outdated';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div 
        className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            {isOutdatedMode ? (
              <Clock className="w-5 h-5 text-amber-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400" />
            )}
            <h3 className="text-base font-bold text-white font-['Space_Grotesk']">
              {isOutdatedMode ? 'Flag Price as Outdated' : 'Report Price Problem'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="py-10 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-base font-bold text-white">Feedback Logged</h4>
            <p className="text-xs text-neutral-400">
              Thank you for keeping Bei Gani accurate for the community.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="text-xs text-neutral-400">
              Target item: <strong className="text-white">{product.name}</strong>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                Current typical price: KSh {product.typicalPrice.toLocaleString()} / {product.unit}
              </div>
            </div>

            {isOutdatedMode ? (
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  What is the current price today if you know it? (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-neutral-400 font-bold text-xs">
                    KSh
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={suggestedPrice}
                    onChange={(e) => setSuggestedPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 700"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl pl-12 pr-4 py-2 text-sm text-white font-bold focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  We'll update the outdated flag count and queue this item for fresh price verification.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-neutral-300">
                  Select reason for report:*
                </label>
                <div className="space-y-1.5">
                  {REPORT_REASONS.map((r) => (
                    <label 
                      key={r}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                        reason === r
                          ? 'bg-red-950/30 border-red-800/80 text-white'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        checked={reason === r}
                        onChange={() => setReason(r)}
                        className="text-red-500 focus:ring-red-500"
                      />
                      <span>{r}</span>
                    </label>
                  ))}
                </div>

                {reason === 'Other reason' && (
                  <textarea
                    rows={2}
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    placeholder="Describe the issue with this price..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                )}
              </div>
            )}

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`flex-1 py-2.5 font-bold rounded-xl text-xs text-neutral-950 transition-all ${
                  isOutdatedMode
                    ? 'bg-amber-400 hover:bg-amber-300'
                    : 'bg-red-400 hover:bg-red-300'
                }`}
              >
                {submitting ? 'Submitting...' : isOutdatedMode ? 'Flag Outdated' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
