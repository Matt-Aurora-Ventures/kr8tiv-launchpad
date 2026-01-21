import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { WalletProvider } from '@/providers/WalletProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { JsonLd, MultiJsonLd } from '@/components/seo';
import {
  generateBaseMetadata,
  generateWebsiteSchema,
  generateOrganizationSchema,
} from '@/lib/seo';
import { PWAProvider } from '@/providers/PWAProvider';
import { AnalyticsProvider, GoogleAnalytics, Mixpanel } from '@/components/analytics';
import { SkipLink } from '@/components/a11y';
import { AnnounceProvider } from '@/hooks/useAnnounce';

const inter = Inter({ subsets: ['latin'], variable: '--font-geist-sans' });

// Merge base metadata with PWA-specific fields
const baseMetadata = generateBaseMetadata();
export const metadata: Metadata = {
  ...baseMetadata,
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'KR8TIV',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    ...baseMetadata.other,
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#8b5cf6' },
  ],
  colorScheme: 'dark light',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <MultiJsonLd
          schemas={[generateWebsiteSchema(), generateOrganizationSchema()]}
        />
        <GoogleAnalytics />
        <Mixpanel />
        {/* Prevent flash of incorrect theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                  } else {
                    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                      document.documentElement.classList.add('dark');
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans min-h-screen flex flex-col`}>
        <ThemeProvider defaultTheme="system">
          <WalletProvider>
            <AnalyticsProvider>
              <PWAProvider>
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
              </PWAProvider>
            </AnalyticsProvider>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
