export const GTM_ID = "GTM-P3W8GS97";

const GTM_HEAD_SNIPPET = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`;

let gtmInjected = false;

/** Inject the official GTM bootstrap snippet once (safe to call repeatedly). */
export function injectGoogleTagManager(): void {
  if (typeof document === "undefined" || gtmInjected) {
    return;
  }

  if (document.getElementById("gtm-base")) {
    gtmInjected = true;
    return;
  }

  const script = document.createElement("script");
  script.id = "gtm-base";
  script.text = GTM_HEAD_SNIPPET;
  document.head.appendChild(script);
  gtmInjected = true;
}
