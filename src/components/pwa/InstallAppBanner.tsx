'use client';

import { useEffect, useState } from 'react';

const DISMISS_KEY = 'br-install-banner-dismissed';

function isStandaloneDisplayMode() {
  if (typeof window === 'undefined') return false;

  // iOS Safari older way
  // @ts-expect-error - navigator.standalone is not in standard typings
  if (typeof navigator !== 'undefined' && navigator.standalone) {
    return true;
  }

  // Standard PWA check
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  return false;
}

export function InstallAppBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Already installed → do not show
    if (isStandaloneDisplayMode()) return;

    // Only show on relatively small screens (mobile / small tablets)
    const isSmallScreen = window.innerWidth <= 768;
    if (!isSmallScreen) return;

    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    const android = /android/.test(ua);

    if (!ios && !android) return;

    setIsIOS(ios);
    setIsAndroid(android);

    try {
      const dismissed = window.localStorage.getItem(DISMISS_KEY);
      if (dismissed === 'true') {
        return;
      }
    } catch {
      // ignore localStorage errors
    }

    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, 'true');
    } catch {
      // ignore
    }
  };

  const handleToggleDetails = () => {
    setShowDetails((prev) => !prev);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-3 bottom-4 z-40">
      <div className="rounded-2xl bg-gradient-to-br from-pink-500 to-pink-400 text-white shadow-lg px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="mt-1 h-9 w-9 flex items-center justify-center rounded-full bg-gradient-to-tr from-pink-500 to-orange-400 text-xs font-bold text-white ring-1 ring-white/30">
            BR
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">
                  Install BeautyReviewty
                </p>
                <p className="text-xs text-pink-50">
                  Add it to your home screen for faster access.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close"
                className="text-white/70 hover:text-white text-xl leading-none"
              >
                ×
              </button>
            </div>

            <button
              type="button"
              onClick={handleToggleDetails}
              className="mt-1 inline-flex items-center justify-center rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/30 transition"
            >
              {showDetails ? 'Hide instructions' : 'How to install'}
            </button>

            {showDetails && (
              <div className="mt-2 rounded-xl bg-white/15 px-3 py-2 text-[11px] leading-snug text-white">
                {isIOS && (
                  <div>
                    <p className="font-semibold mb-1">On iPhone (Safari):</p>
                    <ol className="list-decimal ml-4 space-y-0.5">
                      <li>Tap the Share button at the bottom.</li>
                      <li>Select <span className="font-semibold">"Add to Home Screen"</span>.</li>
                      <li>Tap <span className="font-semibold">Add</span> to confirm.</li>
                    </ol>
                  </div>
                )}
                {isAndroid && (
                  <div>
                    <p className="font-semibold mb-1">On Android (Chrome):</p>
                    <ol className="list-decimal ml-4 space-y-0.5">
                      <li>Tap the menu button (⋮) in the top right.</li>
                      <li>Choose <span className="font-semibold">"Add to Home screen"</span> or <span className="font-semibold">"Install app"</span>.</li>
                      <li>Confirm to add BeautyReviewty.</li>
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

