import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Loader2, 
  Sparkles, 
  AlertCircle, 
  Plus, 
  Store, 
  Building2, 
  ShieldCheck, 
  Wheat, 
  Radio, 
  CheckCircle2,
  DollarSign
} from 'lucide-react';

interface LiveSearchScannerProps {
  query: string;
  identifiedName?: string;
  isSearching: boolean;
  searchFailed: boolean;
  failedMessage?: string;
  onOpenAddItem: (prefillName: string) => void;
  onSelectExample: (term: string) => void;
  onRetry: () => void;
}

const SOURCES = [
  { name: 'Kenyan Marketplaces (Jumia, Kilimall, Masoko)', icon: Store, delay: 0 },
  { name: 'Supermarkets (Carrefour, Naivas, Quickmart)', icon: Building2, delay: 500 },
  { name: 'Agricultural Markets & Wakulima Marikiti', icon: Wheat, delay: 1000 },
  { name: 'Public Price Datasets & Official Tariffs (EPRA, SGR)', icon: ShieldCheck, delay: 1500 },
  { name: 'Kenyan Classifieds & Trade Listings (BuyRentKenya, PigiaMe)', icon: Radio, delay: 2000 }
];

export const LiveSearchScanner: React.FC<LiveSearchScannerProps> = ({
  query,
  identifiedName,
  isSearching,
  searchFailed,
  failedMessage,
  onOpenAddItem,
  onSelectExample,
  onRetry
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const displayName = identifiedName || query;

  useEffect(() => {
    if (!isSearching) {
      setActiveStep(0);
      return;
    }

    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % SOURCES.length);
    }, 800);

    return () => clearInterval(interval);
  }, [isSearching]);

  // When live search is currently in progress
  if (isSearching) {
    return (
      <div className="bg-gradient-to-b from-neutral-900/90 to-neutral-950 border border-emerald-900/40 rounded-3xl p-6 sm:p-8 text-center space-y-5 my-4 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center space-y-3">
          <div className="relative w-16 h-16 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
            <Radio className="w-8 h-8 animate-pulse text-emerald-400" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-ping opacity-75" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white font-['Space_Grotesk'] flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
              <span>Searching more sources...</span>
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto">
              Scanning live retailer catalogs, public market databases & verified vendor listings across Kenya for <strong className="text-white">"{query}"</strong>.
            </p>
          </div>
        </div>

        {/* Live scanning sources pills */}
        <div className="relative z-10 max-w-md mx-auto space-y-2 pt-2">
          {SOURCES.map((source, index) => {
            const Icon = source.icon;
            const isCurrent = index === activeStep;
            const isDone = index < activeStep;

            return (
              <div
                key={source.name}
                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all duration-300 ${
                  isCurrent
                    ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300 shadow-md scale-[1.02]'
                    : isDone
                    ? 'bg-neutral-900/60 border-neutral-800 text-neutral-400 opacity-80'
                    : 'bg-neutral-900/30 border-neutral-800/40 text-neutral-500 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isCurrent ? 'text-emerald-400' : isDone ? 'text-emerald-500/80' : 'text-neutral-500'}`} />
                  <span className="font-medium text-left">{source.name}</span>
                </div>

                <div>
                  {isCurrent ? (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                      Checking...
                    </span>
                  ) : isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <span className="text-[10px] text-neutral-600 font-medium">Queued</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-neutral-500 italic">
          Bei Gani verifies real prices in Kenyan Shillings (KSh) from multiple sources without fabricating numbers.
        </p>
      </div>
    );
  }

  // When live search has finished and nothing could be verified
  if (searchFailed) {
    return (
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 sm:p-8 text-center space-y-4 my-4 shadow-xl">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-950/50 border border-amber-800/60 flex items-center justify-center text-amber-400">
          <AlertCircle className="w-7 h-7" />
        </div>

        <div className="space-y-1.5 max-w-md mx-auto">
          <div className="text-xs uppercase font-extrabold tracking-wider text-amber-400">
            {displayName}
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white font-['Space_Grotesk']">
            {failedMessage || "No verified current price found."}
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            We searched connected external retailers, supermarket catalogs, and community reports for <strong className="text-neutral-200">"{displayName}"</strong>, but no verified price was found. Bei Gani never manufactures or guesses prices.
          </p>
        </div>

        {/* Action Buttons: Report a price or Add Item */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onOpenAddItem(displayName)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs tracking-wide shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Report a price ({displayName})</span>
          </button>

          <button
            onClick={onRetry}
            className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs transition-all border border-neutral-700"
          >
            Try Live Search Again
          </button>
        </div>

        {/* Popular verified suggestions */}
        <div className="pt-4 border-t border-neutral-800 text-xs text-neutral-500">
          <span className="block mb-2 font-medium">Or try one of these verified everyday Kenyan items:</span>
          <div className="flex flex-wrap justify-center gap-1.5">
            {['nyama', 'sugar', 'cement', 'socks', 'shoe rack', 'PS5', 'plumber', 'bedsitter', 'kuku', 'watermelon'].map((s) => (
              <button
                key={s}
                onClick={() => onSelectExample(s)}
                className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};
