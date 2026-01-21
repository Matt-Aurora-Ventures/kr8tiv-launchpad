'use client';

import { useState, useEffect } from 'react';
import { usePWA } from '@/hooks/usePWA';

interface InstallPromptProps {
  /** Delay before showing prompt (ms) */
  showDelay?: number;
  /** Position of the prompt */
  position?: 'top' | 'bottom';
}

export function InstallPrompt({
  showDelay = 3000,
  position = 'bottom',
}: InstallPromptProps) {
  const { isInstallable, isIOSSafari, install, dismissInstall } = usePWA();
  const [visible, setVisible] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // Show prompt after delay
  useEffect(() => {
    if (!isInstallable && !isIOSSafari) return;

    const timer = setTimeout(() => {
      setVisible(true);
    }, showDelay);

    return () => clearTimeout(timer);
  }, [isInstallable, isIOSSafari, showDelay]);

  const handleInstall = async () => {
    if (isIOSSafari) {
      setShowIOSInstructions(true);
      return;
    }

    const result = await install();
    if (result === 'accepted') {
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    dismissInstall();
  };

  if (!visible) return null;

  const positionClasses = position === 'top'
    ? 'top-4 left-4 right-4 md:top-6 md:left-auto md:right-6'
    : 'bottom-4 left-4 right-4 md:bottom-6 md:left-auto md:right-6';

  return (
    <>
      {/* Main Install Banner */}
      <div
        className={`fixed ${positionClasses} z-50 md:max-w-sm animate-fade-in`}
        role="dialog"
        aria-labelledby="install-prompt-title"
      >
        <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-4 pb-3">
            <div className="flex items-start gap-3">
              {/* App Icon */}
              <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-primary"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <h3
                  id="install-prompt-title"
                  className="font-semibold text-foreground"
                >
                  Install KR8TIV
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {isIOSSafari
                    ? 'Add to home screen for the best experience'
                    : 'Install for quick access and offline support'}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-1 -m-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Dismiss"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 pb-4 flex gap-2">
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
            >
              Not Now
            </button>
            <button
              onClick={handleInstall}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isIOSSafari ? (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  How to Install
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Install
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowIOSInstructions(false)}
        >
          <div
            className="bg-card border border-border rounded-t-2xl md:rounded-2xl w-full max-w-md overflow-hidden animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 pb-4 text-center border-b border-border">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
                <svg
                  className="w-8 h-8 text-primary"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Install KR8TIV Launchpad
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Follow these steps to install on iOS
              </p>
            </div>

            {/* Steps */}
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold text-primary">
                  1
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Tap the Share button
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Look for{' '}
                    <span className="inline-flex items-center">
                      <svg
                        className="w-4 h-4 mx-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                      </svg>
                    </span>{' '}
                    at the bottom of Safari
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold text-primary">
                  2
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Select "Add to Home Screen"
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Scroll down in the share menu to find this option
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold text-primary">
                  3
                </div>
                <div>
                  <p className="font-medium text-foreground">Tap "Add"</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Confirm to add KR8TIV to your home screen
                  </p>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="p-4 pt-0">
              <button
                onClick={() => setShowIOSInstructions(false)}
                className="w-full px-4 py-3 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
