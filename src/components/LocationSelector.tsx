import React, { useState, useMemo } from 'react';
import { 
  X, 
  MapPin, 
  Globe, 
  Search, 
  ChevronRight, 
  Check, 
  ArrowLeft,
  Navigation,
  Building,
  Map
} from 'lucide-react';
import { 
  WORLDWIDE_COUNTRIES, 
  KENYA_47_COUNTIES, 
  WorldwideCountry, 
  KENYAN_HIERARCHY 
} from '../services/locationService';

export interface LocationSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLocation: string; // current active location
  onSelectLocation: (locationStr: string, meta?: { country?: string; county?: string; town?: string; area?: string }) => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  isOpen,
  onClose,
  selectedLocation,
  onSelectLocation
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<WorldwideCountry | null>(null);
  const [selectedSubdivision, setSelectedSubdivision] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  // Reset drill-down on modal open/close
  const handleClose = () => {
    setSelectedCountry(null);
    setSelectedSubdivision(null);
    setSelectedCity(null);
    setSearchQuery('');
    onClose();
  };

  const handleSelectWorldwide = () => {
    onSelectLocation('');
    handleClose();
  };

  const handleSelectSpecific = (
    displayStr: string, 
    meta?: { country?: string; county?: string; town?: string; area?: string }
  ) => {
    onSelectLocation(displayStr, meta);
    handleClose();
  };

  // Search filter across all countries, subdivisions, cities, and neighborhoods
  const filteredSearchMatches = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q || q.length < 2) return [];

    const matches: {
      type: string;
      title: string;
      subtitle: string;
      displayStr: string;
      meta: { country?: string; county?: string; town?: string; area?: string };
    }[] = [];

    // Worldwide matches
    if ('worldwide'.includes(q) || 'global'.includes(q) || 'all'.includes(q)) {
      matches.push({
        type: 'World',
        title: 'Worldwide',
        subtitle: 'All countries & locations globally',
        displayStr: '',
        meta: {}
      });
    }

    // Check Kenyan 47 counties
    for (const c of KENYA_47_COUNTIES) {
      if (c.toLowerCase().includes(q)) {
        matches.push({
          type: 'County (Kenya)',
          title: `${c} County`,
          subtitle: 'Kenya',
          displayStr: c,
          meta: { country: 'Kenya', county: c }
        });
      }
    }

    // Check Kenyan towns and estates
    for (const node of KENYAN_HIERARCHY) {
      if (node.town.toLowerCase().includes(q)) {
        matches.push({
          type: 'Town (Kenya)',
          title: node.town,
          subtitle: `${node.county} County, Kenya`,
          displayStr: node.town,
          meta: { country: 'Kenya', county: node.county, town: node.town }
        });
      }
      for (const area of node.areas) {
        if (area.toLowerCase().includes(q) && area.toLowerCase() !== node.town.toLowerCase()) {
          matches.push({
            type: 'Estate / Area (Kenya)',
            title: area,
            subtitle: `${node.town}, ${node.county} County, Kenya`,
            displayStr: area,
            meta: { country: 'Kenya', county: node.county, town: node.town, area }
          });
        }
      }
    }

    // Check Worldwide Countries & Cities
    for (const country of WORLDWIDE_COUNTRIES) {
      if (country.name.toLowerCase().includes(q)) {
        matches.push({
          type: 'Country',
          title: `${country.flag} ${country.name}`,
          subtitle: `Currency: ${country.currency}`,
          displayStr: country.name,
          meta: { country: country.name }
        });
      }

      for (const sub of country.subdivisions) {
        if (sub.name.toLowerCase().includes(q)) {
          matches.push({
            type: `${country.subdivisionType} (${country.name})`,
            title: sub.name,
            subtitle: `${country.name}`,
            displayStr: `${sub.name}, ${country.name}`,
            meta: { country: country.name, county: sub.name }
          });
        }

        if (sub.cities) {
          for (const city of sub.cities) {
            if (city.name.toLowerCase().includes(q)) {
              matches.push({
                type: `City (${country.name})`,
                title: city.name,
                subtitle: `${sub.name}, ${country.name}`,
                displayStr: `${city.name}, ${country.name}`,
                meta: { country: country.name, county: sub.name, town: city.name }
              });
            }

            if (city.neighborhoods) {
              for (const n of city.neighborhoods) {
                if (n.toLowerCase().includes(q)) {
                  matches.push({
                    type: `Neighborhood (${country.name})`,
                    title: n,
                    subtitle: `${city.name}, ${sub.name}, ${country.name}`,
                    displayStr: `${n}, ${city.name}`,
                    meta: { country: country.name, county: sub.name, town: city.name, area: n }
                  });
                }
              }
            }
          }
        }
      }
    }

    // Deduplicate and limit to top 20 matches
    const seen = new Set<string>();
    return matches.filter(m => {
      const key = `${m.title}|${m.subtitle}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 20);
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
    >
      <div 
        className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between gap-3 bg-neutral-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 id="location-modal-title" className="text-base sm:text-lg font-extrabold text-white font-['Space_Grotesk']">
                Select Location Filter
              </h3>
              <p className="text-xs text-neutral-400">
                Worldwide → Country → County/State → Town/City → Neighborhood
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close location selector"
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar Input */}
        <div className="p-4 border-b border-neutral-800/80 bg-neutral-950/40">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search country, 47 counties, city, or neighborhood..."
              className="w-full bg-neutral-900 text-neutral-100 placeholder-neutral-500 text-xs sm:text-sm rounded-xl pl-9 pr-8 py-2.5 border border-neutral-800 focus:outline-none focus:border-emerald-500 transition-colors"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-neutral-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 1. If user typed a search query */}
          {searchQuery.trim().length >= 2 ? (
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-1">
                Search Results ({filteredSearchMatches.length})
              </p>

              {filteredSearchMatches.length === 0 ? (
                <div className="text-center py-8 text-neutral-400 space-y-3">
                  <MapPin className="w-8 h-8 mx-auto text-neutral-600" />
                  <p className="text-sm">No structured location match for "{searchQuery}".</p>
                  <button
                    type="button"
                    onClick={() => handleSelectSpecific(searchQuery.trim())}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400 transition-colors cursor-pointer"
                  >
                    Use "{searchQuery.trim()}" as custom location
                  </button>
                </div>
              ) : (
                filteredSearchMatches.map((m, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSpecific(m.displayStr, m.meta)}
                    className="w-full text-left p-3 rounded-xl bg-neutral-800/40 hover:bg-neutral-800 border border-neutral-800/80 hover:border-neutral-700 flex items-center justify-between group transition-all cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                          {m.title}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700/60">
                          {m.type}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">{m.subtitle}</p>
                    </div>

                    <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))
              )}
            </div>
          ) : (
            /* 2. Hierarchical Drilldown Navigation */
            <div className="space-y-4">
              {/* Quick Actions: Worldwide & Current Active */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSelectWorldwide}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                    !selectedLocation
                      ? 'bg-emerald-500 text-neutral-950 border-emerald-400 shadow-md'
                      : 'bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 border-neutral-700/80'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>🌍 Worldwide (All Locations)</span>
                </button>

                {selectedLocation && (
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-xs font-bold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>Current: {selectedLocation}</span>
                  </div>
                )}
              </div>

              {/* Breadcrumbs if drilled in */}
              {(selectedCountry || selectedSubdivision || selectedCity) && (
                <div className="flex items-center gap-1.5 text-xs text-neutral-400 bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-800 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCountry(null);
                      setSelectedSubdivision(null);
                      setSelectedCity(null);
                    }}
                    className="text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" /> All Countries
                  </button>

                  {selectedCountry && (
                    <>
                      <span>/</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSubdivision(null);
                          setSelectedCity(null);
                        }}
                        className={`font-semibold cursor-pointer ${!selectedSubdivision ? 'text-white' : 'text-neutral-300 hover:text-white'}`}
                      >
                        {selectedCountry.flag} {selectedCountry.name}
                      </button>
                    </>
                  )}

                  {selectedSubdivision && (
                    <>
                      <span>/</span>
                      <button
                        type="button"
                        onClick={() => setSelectedCity(null)}
                        className={`font-semibold cursor-pointer ${!selectedCity ? 'text-white' : 'text-neutral-300 hover:text-white'}`}
                      >
                        {selectedSubdivision}
                      </button>
                    </>
                  )}

                  {selectedCity && (
                    <>
                      <span>/</span>
                      <span className="text-emerald-400 font-bold">{selectedCity}</span>
                    </>
                  )}
                </div>
              )}

              {/* Level 1: Country Selection */}
              {!selectedCountry && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-1">
                    Select Country
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {WORLDWIDE_COUNTRIES.map((country) => (
                      <div
                        key={country.code}
                        className="p-3 rounded-xl bg-neutral-800/40 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 flex items-center justify-between transition-all group cursor-pointer"
                        onClick={() => setSelectedCountry(country)}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{country.flag}</span>
                          <div>
                            <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                              {country.name}
                            </span>
                            <p className="text-[11px] text-neutral-400">
                              {country.name === 'Kenya' ? 'All 47 Counties' : `${country.subdivisions.length} ${country.subdivisionType}s`} • {country.currency}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectSpecific(country.name, { country: country.name });
                            }}
                            className="text-[10px] px-2 py-1 rounded bg-neutral-800 hover:bg-emerald-500 hover:text-neutral-950 font-bold text-neutral-300 transition-colors cursor-pointer"
                            title={`Select entire ${country.name}`}
                          >
                            All {country.name}
                          </button>
                          <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-emerald-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Level 2: Subdivisions (e.g. Kenya 47 Counties or US States) */}
              {selectedCountry && !selectedSubdivision && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-1">
                      {selectedCountry.name} • Select {selectedCountry.subdivisionType} ({selectedCountry.name === 'Kenya' ? '47 Counties' : selectedCountry.subdivisions.length})
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSelectSpecific(selectedCountry.name, { country: selectedCountry.name })}
                      className="text-xs text-emerald-400 hover:underline font-bold cursor-pointer"
                    >
                      Use All {selectedCountry.name}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[380px] overflow-y-auto pr-1">
                    {selectedCountry.subdivisions.map((sub) => (
                      <button
                        key={sub.name}
                        type="button"
                        onClick={() => {
                          if (sub.cities && sub.cities.length > 0) {
                            setSelectedSubdivision(sub.name);
                          } else {
                            handleSelectSpecific(`${sub.name}, ${selectedCountry.name}`, {
                              country: selectedCountry.name,
                              county: sub.name
                            });
                          }
                        }}
                        className="p-2.5 rounded-xl bg-neutral-800/40 hover:bg-neutral-800 border border-neutral-800 text-left group transition-all flex flex-col justify-between cursor-pointer"
                      >
                        <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                          {sub.name}
                        </span>
                        <span className="text-[10px] text-neutral-500 mt-1">
                          {sub.cities && sub.cities.length > 0 ? `${sub.cities.length} towns` : 'Select county'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Level 3: Cities / Towns */}
              {selectedCountry && selectedSubdivision && !selectedCity && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-1">
                      {selectedSubdivision} • Select City or Town
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSelectSpecific(`${selectedSubdivision}, ${selectedCountry.name}`, {
                        country: selectedCountry.name,
                        county: selectedSubdivision
                      })}
                      className="text-xs text-emerald-400 hover:underline font-bold cursor-pointer"
                    >
                      Use Entire {selectedSubdivision}
                    </button>
                  </div>

                  {(() => {
                    const sub = selectedCountry.subdivisions.find(s => s.name === selectedSubdivision);
                    const cities = sub?.cities || [];

                    if (cities.length === 0) {
                      return (
                        <div className="p-4 text-center text-neutral-400 text-xs">
                          No sub-cities listed for {selectedSubdivision}. You can use this {selectedCountry.subdivisionType.toLowerCase()} directly:
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={() => handleSelectSpecific(`${selectedSubdivision}, ${selectedCountry.name}`, {
                                country: selectedCountry.name,
                                county: selectedSubdivision
                              })}
                              className="px-4 py-2 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs cursor-pointer"
                            >
                              Select {selectedSubdivision}
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {cities.map((city) => (
                          <div
                            key={city.name}
                            onClick={() => {
                              if (city.neighborhoods && city.neighborhoods.length > 0) {
                                setSelectedCity(city.name);
                              } else {
                                handleSelectSpecific(`${city.name}, ${selectedSubdivision}`, {
                                  country: selectedCountry.name,
                                  county: selectedSubdivision,
                                  town: city.name
                                });
                              }
                            }}
                            className="p-3 rounded-xl bg-neutral-800/40 hover:bg-neutral-800 border border-neutral-800 flex items-center justify-between group cursor-pointer"
                          >
                            <div>
                              <span className="text-sm font-bold text-white group-hover:text-emerald-400">
                                {city.name}
                              </span>
                              <p className="text-[11px] text-neutral-400">
                                {city.neighborhoods?.length ? `${city.neighborhoods.length} areas/estates` : selectedSubdivision}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectSpecific(city.name, {
                                  country: selectedCountry.name,
                                  county: selectedSubdivision,
                                  town: city.name
                                });
                              }}
                              className="text-[10px] px-2 py-1 rounded bg-neutral-800 hover:bg-emerald-500 hover:text-neutral-950 font-bold text-neutral-300 transition-colors cursor-pointer"
                            >
                              Select
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Level 4: Neighborhoods / Estates */}
              {selectedCountry && selectedSubdivision && selectedCity && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-1">
                      {selectedCity} • Select Neighborhood or Estate
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSelectSpecific(selectedCity, {
                        country: selectedCountry.name,
                        county: selectedSubdivision,
                        town: selectedCity
                      })}
                      className="text-xs text-emerald-400 hover:underline font-bold cursor-pointer"
                    >
                      Use All {selectedCity}
                    </button>
                  </div>

                  {(() => {
                    const sub = selectedCountry.subdivisions.find(s => s.name === selectedSubdivision);
                    const city = sub?.cities?.find(c => c.name === selectedCity);
                    const neighborhoods = city?.neighborhoods || [];

                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {neighborhoods.map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => handleSelectSpecific(n, {
                              country: selectedCountry.name,
                              county: selectedSubdivision,
                              town: selectedCity,
                              area: n
                            })}
                            className="p-2.5 rounded-xl bg-neutral-800/40 hover:bg-neutral-800 border border-neutral-800 text-left text-xs font-bold text-white hover:text-emerald-400 transition-colors cursor-pointer"
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-xs text-neutral-400">
          <span>Active: <strong className="text-white">{selectedLocation || 'Worldwide (All Locations)'}</strong></span>
          <button
            type="button"
            onClick={handleSelectWorldwide}
            className="text-emerald-400 hover:underline font-semibold cursor-pointer"
          >
            Reset to Worldwide
          </button>
        </div>
      </div>
    </div>
  );
};
