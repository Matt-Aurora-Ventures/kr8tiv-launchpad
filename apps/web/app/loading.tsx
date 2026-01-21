'use client';

import { Rocket } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center">
        {/* Animated Logo */}
        <div className="relative mb-6">
          <div className="h-20 w-20 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
            <Rocket className="h-10 w-10 text-primary animate-bounce" />
          </div>
          {/* Pulse rings */}
          <div className="absolute inset-0 h-20 w-20 rounded-full border-2 border-primary/20 animate-ping mx-auto" />
        </div>

        <h2 className="text-lg font-semibold mb-2">Loading</h2>
        <p className="text-sm text-muted-foreground">Please wait...</p>

        {/* Loading bar */}
        <div className="mt-6 mx-auto w-48 h-1 bg-secondary rounded-full overflow-hidden">
          <div className="h-full w-full bg-primary animate-loading-bar" />
        </div>
      </div>
    </div>
  );
}
