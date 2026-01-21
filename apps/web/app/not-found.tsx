'use client';

import Link from 'next/link';
import { Home, Search, ArrowLeft, Rocket } from 'lucide-react';
import { Button } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Animation */}
        <div className="relative mb-8">
          <div className="text-[120px] font-bold text-secondary/50 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center animate-bounce">
              <Rocket className="h-10 w-10 text-primary" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
        <p className="text-muted-foreground mb-8">
          Oops! The page you're looking for seems to have launched into orbit.
          Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          <Link href="/">
            <Button>
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </Link>
        </div>

        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-4">Popular destinations</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link
              href="/explore"
              className="px-3 py-1.5 text-sm bg-secondary rounded-full hover:bg-secondary/80 transition-colors"
            >
              Explore Tokens
            </Link>
            <Link
              href="/launch"
              className="px-3 py-1.5 text-sm bg-secondary rounded-full hover:bg-secondary/80 transition-colors"
            >
              Launch Token
            </Link>
            <Link
              href="/staking"
              className="px-3 py-1.5 text-sm bg-secondary rounded-full hover:bg-secondary/80 transition-colors"
            >
              Staking
            </Link>
            <Link
              href="/profile"
              className="px-3 py-1.5 text-sm bg-secondary rounded-full hover:bg-secondary/80 transition-colors"
            >
              Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
