'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertOctagon, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-red-500/10 mb-6">
          <AlertOctagon className="h-10 w-10 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold mb-2">Something went wrong!</h1>
        <p className="text-muted-foreground mb-6">
          We encountered an unexpected error. Our team has been notified and is working on a fix.
        </p>

        {/* Error Details (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left mb-6">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 justify-center">
              <Bug className="h-4 w-4" />
              View Error Details
            </summary>
            <div className="mt-4 p-4 bg-secondary rounded-lg">
              <p className="text-sm font-mono text-red-500 break-all">{error.message}</p>
              {error.digest && (
                <p className="text-xs text-muted-foreground mt-2">
                  Error ID: {error.digest}
                </p>
              )}
              {error.stack && (
                <pre className="mt-2 text-xs text-muted-foreground overflow-auto max-h-48">
                  {error.stack}
                </pre>
              )}
            </div>
          </details>
        )}

        {/* Production Error ID */}
        {process.env.NODE_ENV === 'production' && error.digest && (
          <p className="text-xs text-muted-foreground mb-6">
            Error reference: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={reset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Link href="/">
            <Button>
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </Link>
        </div>

        {/* Support Link */}
        <p className="mt-8 text-sm text-muted-foreground">
          Need help?{' '}
          <a
            href="mailto:support@kr8tiv.io"
            className="text-primary hover:underline"
          >
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}
