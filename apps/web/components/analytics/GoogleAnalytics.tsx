import Script from 'next/script';

/**
 * Google Analytics 4 Script Component
 *
 * Loads the GA4 gtag.js script. Should be placed in the root layout.
 *
 * Requires NEXT_PUBLIC_GA_ID environment variable.
 *
 * @example
 * // In app/layout.tsx
 * <head>
 *   <GoogleAnalytics />
 * </head>
 */
export function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  // Don't render if no GA ID configured
  if (!gaId) {
    return null;
  }

  return (
    <>
      {/* Load gtag.js script */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />

      {/* Initialize gtag */}
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_path: window.location.pathname,
              anonymize_ip: true,
              send_page_view: false
            });
          `,
        }}
      />
    </>
  );
}

export default GoogleAnalytics;
