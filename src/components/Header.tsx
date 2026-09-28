import React, { useState, useEffect } from 'react';
import { Database, Plus, MapPin, Globe, Sparkles, ShieldCheck, Layers, LogOut, ChevronDown } from 'lucide-react';
import { auth, googleSignIn, logout } from '../firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';

interface HeaderProps {
  onOpenAddItem: () => void;
  onOpenFirebaseGuide: () => void;
  onOpenSources: () => void;
  selectedLocation?: string;
  selectedCounty?: string;
  onOpenLocationModal?: () => void;
  onSelectCounty?: (c: string) => void;
  productsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddItem,
  onOpenFirebaseGuide,
  onOpenSources,
  selectedLocation,
  selectedCounty,
  onOpenLocationModal,
  productsCount
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  const handleGoogleAuth = async () => {
    if (currentUser) {
      await logout();
      return;
    }

    try {
      setIsSigningIn(true);
      await googleSignIn();
    } catch (e) {
      console.warn('Google sign-in cancelled or failed:', e);
    } finally {
      setIsSigningIn(false);
    }
  };

  // Determine short badge display text
  const locationBadge = (selectedLocation || selectedCounty) ? (selectedLocation || selectedCounty) : 'Worldwide';

  return (
    <header className="sticky top-0 z-30 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800/80 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
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
                GLOBAL
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-medium tracking-tight">
              Before unask bei, check bei.
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Worldwide Location Selector Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onOpenLocationModal) {
                onOpenLocationModal();
              }
            }}
            className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-700 text-xs font-semibold text-neutral-200 border border-neutral-800 hover:border-neutral-700 rounded-xl px-2.5 py-1.5 transition-all max-w-[140px] sm:max-w-[200px] cursor-pointer shadow-sm select-none"
            title="Select Worldwide or Kenyan Location"
            aria-label={`Select location (currently ${locationBadge})`}
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="truncate">{locationBadge}</span>
            <ChevronDown className="w-3 h-3 text-neutral-500 flex-shrink-0" />
          </button>

          {/* Sources Connector Button */}
          <button
            onClick={onOpenSources}
            title="Connected Data Sources"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-neutral-300 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Sources</span>
          </button>

          {/* Google Workspace Account / Sign-In Button */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-xl px-2 py-1">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-emerald-700 text-[10px] font-bold text-white flex items-center justify-center">
                  {currentUser.displayName ? currentUser.displayName[0] : 'G'}
                </div>
              )}
              <span className="text-xs text-neutral-300 font-medium hidden md:inline truncate max-w-[90px]">
                {currentUser.displayName?.split(' ')[0] || 'User'}
              </span>
              <button
                onClick={handleGoogleAuth}
                title="Sign out of Google"
                className="text-neutral-400 hover:text-red-400 p-0.5 ml-0.5 transition-colors"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleAuth}
              disabled={isSigningIn}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-neutral-100 text-neutral-900 text-xs font-semibold rounded-xl shadow-sm transition-all border border-neutral-300 active:scale-95"
              title="Sign in with Google to use Drive & Calendar"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span className="hidden md:inline">Sign in</span>
            </button>
          )}

          {/* Add Item Button */}
          <button
            onClick={onOpenAddItem}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-neutral-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-sm transition-all active:scale-95"
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

