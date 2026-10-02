import React, { useState } from 'react';
import { X, Calendar, FileText, CheckCircle2, AlertCircle, Loader2, ArrowUpRight, Clock, ShieldCheck, Package } from 'lucide-react';
import { Product } from '../types';
import { savePriceComparisonToDrive, scheduleCalendarEvent } from '../services/workspaceService';
import { getAccessToken, googleSignIn } from '../firebaseConfig';
import { getProductImageUrl } from '../services/imageUtils';

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  mode: 'drive' | 'calendar';
  onToast: (msg: string) => void;
}

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({
  isOpen,
  onClose,
  product,
  mode,
  onToast
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7); // Default to 1 week from now
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [calendarNotes, setCalendarNotes] = useState(() => {
    return product ? `Check for price drops or restock for ${product.name} (Current range: KSh ${product.minPrice?.toLocaleString()} - ${product.maxPrice?.toLocaleString()}).` : '';
  });

  if (!isOpen || !product) return null;

  // Prepare Drive content preview
  const driveContentPreview = `=========================================
BEI GANI? KENYA - PRICE COMPARISON REPORT
=========================================
Product: ${product.name}
Category: ${product.category}
Subcategory: ${product.subcategory || 'General'}
Date Generated: ${new Date().toLocaleDateString('en-GB')}
Target Location: ${product.county || 'Kenya'}

BENCHMARK SUMMARY:
- Lowest Reported Price: KSh ${product.minPrice?.toLocaleString()}
- Highest Reported Price: KSh ${product.maxPrice?.toLocaleString()}
- Typical Market Average: KSh ${product.typicalPrice?.toLocaleString()}

VERIFIED KENYAN SOURCES & VENDORS:
${(product.vendors || []).map((v, i) => `${i + 1}. ${v.vendorName}
   Price: KSh ${v.price.toLocaleString()} (${v.unit || 'unit'})
   Location: ${v.location}
   Stock: ${v.inStock !== false ? 'In Stock' : 'Out of Stock'}
   Source Link: ${v.sourceUrl || 'In-store / Market'}
`).join('\n') || `Main Source: ${product.retailerOrSource}`}

NOTES & ADVICE:
${product.description || 'Always verify the seller and check price before purchase.'}

Generated via Bei Gani? - "Before unask bei, check bei"
https://beigani.co.ke
`;

  // Explicit user confirmation handler for Google Drive export
  const handleConfirmDriveExport = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      let token = await getAccessToken();
      if (!token) {
        // Trigger Google Sign-In with popup
        const authRes = await googleSignIn();
        token = authRes?.accessToken || null;
      }

      if (!token) {
        throw new Error('Google Sign-In is required to export to Google Drive.');
      }

      const title = `Bei Gani - ${product.name.replace(/[^a-zA-Z0-9]/g, ' ').trim().slice(0, 30)} Price Comparison`;
      const result = await savePriceComparisonToDrive(title, driveContentPreview);

      if (result.success) {
        onToast(`✓ Price comparison saved to your Google Drive!`);
        if (result.webViewLink) {
          window.open(result.webViewLink, '_blank', 'noopener,noreferrer');
        }
        onClose();
      } else {
        setError(result.error || 'Failed to save to Google Drive');
      }
    } catch (err: any) {
      console.error('Drive export action failed:', err);
      setError(err?.message || 'Failed to export to Google Drive');
    } finally {
      setIsProcessing(false);
    }
  };

  // Explicit user confirmation handler for Google Calendar reminder
  const handleConfirmCalendarEvent = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      let token = await getAccessToken();
      if (!token) {
        // Trigger Google Sign-In with popup
        const authRes = await googleSignIn();
        token = authRes?.accessToken || null;
      }

      if (!token) {
        throw new Error('Google Sign-In is required to schedule events on Google Calendar.');
      }

      const title = `Bei Gani Alert: ${product.name}`;
      const startDate = new Date(calendarDate).toISOString();
      const result = await scheduleCalendarEvent(title, calendarNotes, startDate);

      if (result.success) {
        onToast(`✓ Reminder scheduled on your Google Calendar!`);
        if (result.htmlLink) {
          window.open(result.htmlLink, '_blank', 'noopener,noreferrer');
        }
        onClose();
      } else {
        setError(result.error || 'Failed to schedule calendar event');
      }
    } catch (err: any) {
      console.error('Calendar action failed:', err);
      setError(err?.message || 'Failed to schedule Google Calendar reminder');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-5 border-b border-gray-100 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs ${
              mode === 'drive' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
            }`}>
              {mode === 'drive' ? <FileText className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {mode === 'drive' ? 'Save to Google Drive' : 'Add to Google Calendar'}
              </h2>
              <p className="text-xs text-gray-500">Google Workspace Integration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* User Confirmation Banner */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block mb-0.5">Permission Confirmation</strong>
              {mode === 'drive' ? (
                <span>
                  Do you want to save a verified price report for <strong>{product.name}</strong> to your Google Drive? This will create a text report in your Google Drive with your permission.
                </span>
              ) : (
                <span>
                  Do you want to schedule a price check or shopping reminder for <strong>{product.name}</strong> on your Google Calendar? This will create a calendar event with your permission.
                </span>
              )}
            </div>
          </div>

          {/* Target Product Summary */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200/80">
            {getProductImageUrl(product) ? (
              <img
                src={getProductImageUrl(product)!}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-14 h-14 object-cover rounded-lg bg-gray-100 border border-gray-200 shrink-0"
              />
            ) : (
              <div className="w-14 h-14 flex items-center justify-center rounded-lg bg-gray-200 border border-gray-300 text-gray-500 shrink-0">
                <Package className="w-6 h-6 text-gray-500" />
              </div>
            )}
            <div className="min-w-0">
              <h4 className="font-bold text-gray-900 text-sm truncate">{product.name}</h4>
              <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                KSh {product.typicalPrice?.toLocaleString()} ({product.unit})
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Range: KSh {product.minPrice?.toLocaleString()} - {product.maxPrice?.toLocaleString()} across {product.vendors?.length || 2} sources
              </p>
            </div>
          </div>

          {mode === 'drive' ? (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                File Content Preview
              </label>
              <pre className="bg-gray-900 text-gray-200 p-3.5 rounded-xl text-[11px] font-mono max-h-48 overflow-y-auto leading-relaxed border border-gray-800">
                {driveContentPreview}
              </pre>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-500" /> Reminder Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={calendarDate}
                  onChange={(e) => setCalendarDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Event Description & Shopping Notes
                </label>
                <textarea
                  rows={3}
                  value={calendarNotes}
                  onChange={(e) => setCalendarNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-gray-900"
                  placeholder="Notes about price comparison, estate market day, or rent due date..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200/70 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          {mode === 'drive' ? (
            <button
              type="button"
              onClick={handleConfirmDriveExport}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving to Drive...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Confirm Export to Drive
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirmCalendarEvent}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scheduling Event...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  Confirm Add to Calendar
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
