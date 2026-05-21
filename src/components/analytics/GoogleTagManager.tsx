export const GTM_ID = "GTM-P3W8GS97";

const GTM_HEAD_SNIPPET = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`;

/**
 * Official GTM snippet as a native <script> in <head>.
 * Avoids next/script __next_s deferral so gtm.js runs on first HTML parse.
 */
export function GoogleTagManagerScript() {
  return (
    <script
      id="gtm-base"
      dangerouslySetInnerHTML={{ __html: GTM_HEAD_SNIPPET }}
    />
  );
}

/** Official GTM noscript fallback — place immediately after opening <body>. */
export function GoogleTagManagerNoscript() {
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
