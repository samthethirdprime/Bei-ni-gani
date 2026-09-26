import React, { useRef } from 'react';
import { Search, X, MapPin, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { SearchQueryAnalysis } from '../types';

interface SearchBarProps {
  query: string;
  onChangeQuery: (val: string) => void;
  onClear: () => void;
  queryAnalysis: SearchQueryAnalysis;
  onSelectExample: (term: string) => void;
  onSearchSubmit?: () => void;
  isSearching?: boolean;
}

const EXAMPLE_SEARCHES = [
  { label: 'boxers', term: 'boxers' },
  { label: 'gas', term: 'gas' },
  { label: 'humidifier', term: 'humidifier' },
  { label: 'cement', term: 'cement' },
  { label: 'beef / nyama', term: 'nyama' },
  { label: 'sugar / sukari', term: 'sukari' },
  { label: 'shoe rack', term: 'shoe rack' },
  { label: 'socks', term: 'socks' },
  { label: 'workout equipment', term: 'workout equipment' },
  { label: 'plumber', term: 'plumber' },
  { label: 'barber / kinyozi', term: 'kinyozi' }
];

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onChangeQuery,
  onClear,
  queryAnalysis,
  onSelectExample,
  onSearchSubmit,
  isSearching = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearchSubmit) {
      e.preventDefault();
      onSearchSubmit();
    }
  };

  return (
    <div className="w-full">
      {/* Search Input Box */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {isSearching ? (
            <Loader2 className="h-5 w-5 text-emerald-400 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-neutral-400 group-focus-within:text-emerald-400 transition-colors" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onChangeQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search any product or service... (e.g. boxers, gas refill, humidifier, nyama, cement...)"
          className="w-full pl-12 pr-28 sm:pr-32 py-3.5 sm:py-4 bg-neutral-900/90 text-white placeholder-neutral-500 rounded-2xl border border-neutral-800 focus:border-emerald-500/80 focus:ring-4 focus:ring-emerald-500/10 text-base md:text-lg font-medium shadow-xl transition-all outline-none"
        />

        <div className="absolute inset-y-0 right-1.5 flex items-center gap-1">
          {query && (
            <button
              onClick={() => {
                onClear();
                inputRef.current?.focus();
              }}
              className="p-1.5 text-neutral-400 hover:text-white transition-colors rounded-full hover:bg-neutral-800"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {query && (
            <button
              onClick={onSearchSubmit}
              disabled={isSearching}
              className="px-3 sm:px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center gap-1 shadow-md transition-all active:scale-95"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden sm:inline">Checking</span>
                </>
              ) : (
                <>
                  <span>Check Bei</span>
                  <ArrowRight className="w-3 h-3 stroke-[2.5]" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Query Location Indicator if separated */}
      {queryAnalysis.detectedLocation && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-lg w-fit">
          <MapPin className="w-3.5 h-3.5" />
          <span>Searching item: <strong className="text-white">"{queryAnalysis.itemQuery}"</strong> in <strong className="text-white">{queryAnalysis.detectedLocation}</strong></span>
        </div>
      )}

      {/* Example Chips */}
      <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs">
        <span className="text-neutral-500 font-medium whitespace-nowrap pl-0.5 text-[11px] uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Try:
        </span>
        {EXAMPLE_SEARCHES.map((item) => (
          <button
            key={item.term}
            onClick={() => onSelectExample(item.term)}
            className={`whitespace-nowrap px-2.5 py-1 rounded-full border transition-all text-xs font-medium ${
              query.toLowerCase() === item.term.toLowerCase()
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
