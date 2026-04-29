const { execSync } = require("child_process");
const fs = require("fs");

function extract(url) {
  execSync(`curl.exe -sL -A "Mozilla/5.0" "${url}" -o tmp-page.html`, {
    stdio: "pipe",
  });
  const h = fs.readFileSync("tmp-page.html", "utf8");
  let m =
    h.match(/property=["']twitter:image["'][^>]*content=["']([^"'>\s]+)/i) ||
    h.match(/content=["']([^"']+)["'][^>]*property=["']twitter:image["']/i);
  if (!m)
    m =
      h.match(/property=["']og:image["'][^>]*content=["']([^"'>\s]+)/i) ||
      h.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  return m ? m[1].replace(/&amp;/g, "&") : "NONE";
}

/** id + official PDP URL → prints tab-separated image or NONE */
const urls = [
  ["vanicream-moisturizing-cream", "https://www.vanicream.com/product/vanicream-moisturizing-cream"],
  ["vanicream-gentle-facial-cleanser", "https://www.vanicream.com/product/gentle-facial-cleanser"],
  ["neutrogena-hydro-boost-water-gel", "https://www.neutrogena.com/products/skincare/neutrogena-hydro-boost-water-gel-with-hyaluronic-acid/6811047.html"],
  ["aveeno-calm-restore-oat-gel", "https://www.aveeno.com/products/calm-and-restore-oat-gel-moisturizer-for-sensitive-skin/0520014.html"],
  ["eltamd-uv-clear-spf46", "https://eltamd.com/products/uv-clear-broad-spectrum-spf-46"],
];

for (const [k, u] of urls) {
  const img = extract(u);
  console.log(k + "\t" + img);
}
