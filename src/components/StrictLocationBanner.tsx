import React from 'react';
import { MapPin, Navigation, Globe, ArrowRight } from 'lucide-react';
import { getNearbyLocations } from '../services/locationService';

interface StrictLocationBannerProps {
  requestedLocation: string;
  itemQuery?: string;
  onSelectNearby: (area: string) => void;
  onClearLocation: () => void;
  onReportPrice: () => void;
  onOpenLocationModal?: () => void;
}

export const StrictLocationBanner: React.FC<StrictLocationBannerProps> = ({
  requestedLocation,
  itemQuery,
  onSelectNearby,
  onClearLocation,
  onReportPrice,
  onOpenLocationModal
}) => {
  const nearbyAreas = getNearbyLocations(requestedLocation);

  return (
    <div className="bg-neutral-900/90 border border-amber-500/30 rounded-3xl p-6 sm:p-8 text-center my-6 shadow-xl relative overflow-hidden">
      <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-400 shadow-inner">
        <MapPin className="w-6 h-6" />
      </div>

      <h3 className="text-lg sm:text-xl font-bold text-white mb-2 font-['Space_Grotesk']">
        No verified results found in {requestedLocation}.
      </h3>
      
      <p className="text-neutral-400 text-xs sm:text-sm max-w-md mx-auto mb-6 leading-relaxed">
        Bei Gani? strictly verifies locations so you don't travel to the wrong neighborhood. There are currently no verified prices or listings registered in <strong className="text-white font-semibold">{requestedLocation}</strong> {itemQuery ? `for "${itemQuery}"` : ''}.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
        <button
          type="button"
          onClick={onClearLocation}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <Globe className="w-4 h-4" />
          Search Worldwide (All Locations)
        </button>

        {onOpenLocationModal && (
          <button
            type="button"
            onClick={onOpenLocationModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-neutral-200 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-emerald-400" />
            Change Location
          </button>
        )}

        <button
          type="button"
          onClick={onReportPrice}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-800/80 border border-neutral-700 hover:bg-neutral-700 text-neutral-300 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer"
        >
          + Report Price in {requestedLocation}
        </button>
      </div>

      {/* Nearby areas recommendations */}
      {nearbyAreas.length > 0 && (
        <div className="pt-4 border-t border-neutral-800/80 max-w-xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center justify-center gap-1.5">
            <Navigation className="w-3.5 h-3.5" /> Search nearby markets & hubs:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {nearbyAreas.slice(0, 5).map(area => (
              <button
                key={area}
                onClick={() => onSelectNearby(area)}
                className="px-3 py-1.5 bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <span>{area}</span>
                <ArrowRight className="w-3 h-3 text-emerald-400" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
