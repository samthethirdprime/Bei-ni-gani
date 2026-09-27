import React from 'react';
import { MapPin, Navigation, Globe, ArrowRight } from 'lucide-react';
import { getNearbyLocations } from '../services/locationService';

interface StrictLocationBannerProps {
  requestedLocation: string;
  itemQuery?: string;
  onSelectNearby: (area: string) => void;
  onClearLocation: () => void;
  onReportPrice: () => void;
}

export const StrictLocationBanner: React.FC<StrictLocationBannerProps> = ({
  requestedLocation,
  itemQuery,
  onSelectNearby,
  onClearLocation,
  onReportPrice
}) => {
  const nearbyAreas = getNearbyLocations(requestedLocation);

  return (
    <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-6 sm:p-8 text-center my-6 shadow-sm">
      <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-800 shadow-inner">
        <MapPin className="w-6 h-6" />
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-2">
        No verified results found in {requestedLocation}.
      </h3>
      
      <p className="text-gray-600 text-sm max-w-md mx-auto mb-6">
        Bei Gani? strictly verifies locations so you don't travel to the wrong neighborhood. There are currently no verified prices or listings registered in <strong className="text-gray-900 font-semibold">{requestedLocation}</strong> {itemQuery ? `for "${itemQuery}"` : ''}.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
        <button
          onClick={onClearLocation}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-all shadow-sm active:scale-95"
        >
          <Globe className="w-4 h-4" />
          Search all Kenya
        </button>

        <button
          onClick={onReportPrice}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 rounded-xl font-semibold text-sm transition-all shadow-sm active:scale-95"
        >
          + Report a Price in {requestedLocation}
        </button>
      </div>

      {/* Nearby areas recommendations */}
      {nearbyAreas.length > 0 && (
        <div className="pt-4 border-t border-amber-200/60 max-w-xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-900 mb-3 flex items-center justify-center gap-1.5">
            <Navigation className="w-3.5 h-3.5" /> Search nearby areas:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {nearbyAreas.slice(0, 5).map(area => (
              <button
                key={area}
                onClick={() => onSelectNearby(area)}
                className="px-3 py-1.5 bg-white hover:bg-amber-100/70 border border-amber-200 text-amber-950 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
              >
                <span>{area}</span>
                <ArrowRight className="w-3 h-3 text-amber-700" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
