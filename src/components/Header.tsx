import React from 'react';
import { Database, Plus, MapPin, Sparkles, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onOpenAddItem: () => void;
  onOpenFirebaseGuide: () => void;
  selectedCounty: string;
  onSelectCounty: (county: string) => void;
  productsCount: number;
}

const KENYA_COUNTIES = [
  'All Kenya',
  'Nairobi',
  'Mombasa',
  'Kisumu',
  'Nakuru',
  'Kiambu',
  'Kajiado',
  'Machakos',
  'Uasin Gishu'
];

export const Header: React.FC<HeaderProps> = ({
  onOpenAddItem,
  onOpenFirebaseGuide,
  selectedCounty,
  onSelectCounty,
  productsCount
}) => {
  return (
    <header className="sticky top-0 z-30 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800/80 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Logo & Tagline */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-emerald-950/50 border border-emerald-400/30">
            BG
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-extrabold tracking-tight text-white font-['Space_Grotesk']">
                BEI GANI<span className="text-emerald-400">?</span>
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 hidden sm:inline-block">
                KE
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-medium tracking-tight">
              Before unask bei, check bei.
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* County Selector */}
          <div className="relative">
            <select
              value={selectedCounty}
              onChange={(e) => onSelectCounty(e.target.value)}
              className="appearance-none bg-neutral-900 text-xs font-semibold text-neutral-200 border border-neutral-800 rounded-lg pl-7 pr-3 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {KENYA_COUNTIES.map((c) => (
                <option key={c} value={c === 'All Kenya' ? '' : c}>
                  {c}
                </option>
              ))}
            </select>
            <MapPin className="w-3.5 h-3.5 text-emerald-400 absolute left-2 top-2.5 pointer-events-none" />
          </div>

          {/* Firestore status / Guide */}
          <button
            onClick={onOpenFirebaseGuide}
            title="Firebase Firestore Active"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-neutral-300 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="hidden md:inline">Firestore</span>
            <Database className="w-3.5 h-3.5 text-amber-400" />
          </button>

          {/* Add Item Button */}
          <button
            onClick={onOpenAddItem}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-neutral-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span className="hidden sm:inline">Add Item</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>
    </header>
  );
};
