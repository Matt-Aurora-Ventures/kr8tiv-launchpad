'use client';

import { usePWA } from '@/hooks/usePWA';

export function UpdatePrompt() {
  const { updateAvailable, applyUpdate } = usePWA();

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:bottom-6 md:left-auto md:right-6 z-50 md:max-w-sm animate-fade-in">
      <div className="bg-card border border-primary/20 rounded-xl shadow-lg overflow-hidden">
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Update Icon */}
            <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm">
                Update Available
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                A new version of KR8TIV is ready
              </p>
            </div>

            <button
              onClick={applyUpdate}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors"
            >
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
