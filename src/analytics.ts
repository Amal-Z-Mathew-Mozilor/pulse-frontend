// Google Analytics 4 loader.
//
// Loads the gtag.js snippet only when VITE_GA_MEASUREMENT_ID is set, so local
// dev (and any deploy without the env var) ships zero analytics and sets no
// cookies. When configured, GA4 sets its `_ga` / `_ga_*` cookies on first page
// load — these load on the public login page, so a cookie-consent scanner
// (CookieYes) can auto-detect them on a rescan, and the consent banner can
// auto-block them until the user accepts (Analytics category).
//
// Set the ID in Vercel env vars: VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

const MEASUREMENT_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined) || "";

export function initAnalytics(): void {
  if (!MEASUREMENT_ID) return;

  // 1. Load the gtag.js library.
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // 2. Standard GA4 bootstrap. dataLayer + gtag() must exist before config.
  const w = window as unknown as { dataLayer: unknown[]; gtag: (...args: unknown[]) => void };
  w.dataLayer = w.dataLayer || [];
  w.gtag = function gtag() {
    // GA requires the literal `arguments` object pushed onto dataLayer.
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer.push(arguments);
  };
  w.gtag("js", new Date());
  w.gtag("config", MEASUREMENT_ID);
}
