import React from 'react';
import { X, CheckCircle2, ExternalLink, ShieldCheck, Database, Layers, ArrowUpRight, Cpu } from 'lucide-react';
import { connectorRegistry } from '../services/connectors/connectorRegistry';

interface ConnectedSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectedSourcesModal: React.FC<ConnectedSourcesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const sources = connectorRegistry.getConnectorsStatus();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 text-neutral-100 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-neutral-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="sticky top-0 bg-neutral-900/95 backdrop-blur-md px-6 py-5 border-b border-neutral-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 flex items-center justify-center shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-['Space_Grotesk']">Connected Kenyan Data Sources</h2>
              <p className="text-xs text-neutral-400">Multi-source connector architecture & price transparency</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Architecture Summary */}
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-2xl p-4 text-sm text-neutral-200">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-1 text-emerald-300">Independent Aggregation & Verification</strong>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Bei Gani? searches across legitimate Kenyan e-commerce, supermarkets, classifieds, and official regulators using a standardized <code className="text-emerald-400 bg-neutral-950 px-1 py-0.5 rounded">SourceConnector</code> architecture. We never modify original retailer prices, never scrape restricted sites, and always attribute source and collection date.
                </p>
              </div>
            </div>
          </div>

          {/* Connected Sources List */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" /> Source Connectors Audit ({sources.length})
            </h3>
            
            <div className="space-y-3">
              {sources.map(source => {
                const isReal = source.status.isRealConnection;
                const connectionType = source.status.connectionType;

                return (
                  <div key={source.id} className="p-4 rounded-2xl border border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm">{source.name}</span>
                        {isReal ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Genuinely Connected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/60">
                            Requires 1P Partner API
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>Access: <strong className="text-neutral-200 font-medium">{source.status.accessMethod.replace(/_/g, ' ')}</strong></span>
                        <span>Category: <strong className="text-neutral-200 font-medium">{source.status.sourceCategory}</strong></span>
                      </div>
                      {source.status.requiredApiNotice && (
                        <p className="text-[11px] text-amber-400/90 bg-amber-950/30 border border-amber-800/40 p-2 rounded-xl mt-1">
                          <strong>Connection Requirement:</strong> {source.status.requiredApiNotice}
                        </p>
                      )}
                      {source.status.legalNotice && (
                        <p className="text-[11px] text-neutral-500 italic">{source.status.legalNotice}</p>
                      )}
                    </div>

                    <a
                      href={source.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/80 px-3 py-1.5 rounded-xl transition-colors self-start sm:self-center shrink-0"
                    >
                      <span>Official Portal</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Connector Spec for Developers */}
          <div className="border-t border-neutral-800 pt-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-neutral-400" /> Extensible Connector Interface
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed mb-3">
              New Kenyan merchants, pharmacies, hardware suppliers, and cooperatives can easily be integrated via standard connectors:
            </p>
            <div className="bg-neutral-950 text-emerald-300 p-3.5 rounded-2xl text-[11px] font-mono border border-neutral-800 overflow-x-auto">
              <div>interface SourceConnector &#123;</div>
              <div className="pl-4">searchProducts(query: SearchQueryAnalysis): Promise&lt;ExternalListing[]&gt;;</div>
              <div className="pl-4">getProductDetails(productId: string): Promise&lt;ExternalListing&gt;;</div>
              <div className="pl-4">getPrices(query: SearchQueryAnalysis): Promise&lt;ExternalListing[]&gt;;</div>
              <div className="pl-4">getAvailability(productId: string): Promise&lt;StockStatus&gt;;</div>
              <div>&#125;</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-neutral-950 px-6 py-4 border-t border-neutral-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
