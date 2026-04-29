/**
 * One-off: inject imageUrl after ...e for each product row.
 * Run from repo root: node scripts/_apply-image-urls.cjs
 */
const fs = require("fs");
const path = require("path");

const fp = path.join(__dirname, "..", "src", "lib", "skincareProducts.ts");

/** Verified retailer/brand CDN URLs (HTTP 200 / official asset hosts). Unlisted ids → "". */
const IMAGE_MAP = {
  "cerave-moisturizing-cream":
    "https://www.cerave.com/-/media/project/loreal/brand-sites/cerave/americas/us/products-v4/moisturizing-cream/cerave_moisturizing_cream_16oz_jar_front-700x700-v3.jpg?rev=7e37e9cc45754615b1532d77df5a0b52",
  "cerave-daily-moisturizing-lotion":
    "https://www.cerave.com/-/media/project/loreal/brand-sites/cerave/americas/us/products-v3/daily-moisturizing-lotion/700x700/cerave_daily_moisturizing_lotion_12oz_front_-700x700-v2.jpg?rev=5fb61e1db7fe49fb9faf308c5f583d65",
  "cerave-hydrating-mineral-spf30":
    "https://www.cerave.com/-/media/project/loreal/brand-sites/cerave/americas/us/sunscreen/face/30-spf-face/30-spf-face_front.jpg?rev=3a662171cf3d47eea33f18a9d080b1a8",
  "cerave-hydrating-cleanser":
    "https://www.cerave.com/-/media/project/loreal/brand-sites/cerave/americas/us/skincare/cleansers/hydrating-facial-cleanser/photos/2022/700x700/cerave_daily_hydrating-cleanser_12oz_front-700x700-v2.jpg?rev=8dcf681b75c042deaaa0c6ea1581d4df",
  "cerave-foaming-cleanser":
    "https://www.cerave.com/-/media/project/loreal/brand-sites/cerave/americas/us/products-v3/foaming-facial-cleanser/700x700/cerave_foaming-facial-cleanser-12oz_front-700x700-v2.jpg?rev=da10428fc5104c97a980e0d5ff5ce9bb",
  "cerave-healing-ointment":
    "https://www.cerave.com/-/media/project/loreal/brand-sites/cerave/americas/us/skincare/moisturizers/healing-ointment/2025/healing-ointment_front.jpg?rev=c41d50fa05b34fa59e5affe3b389b681",
  "vanicream-moisturizing-cream":
    "https://www.vanicream.com/dynamic-media/product/images/pump-tc22o-front.jpg?gravity=center&v=galleryMedia&k=u7YL8TUlAAq9Xaxn0U4ApA",
  "vanicream-gentle-facial-cleanser":
    "https://www.vanicream.com/dynamic-media/product/images/gentle-facial-cleanser-8-oz-front.jpg?gravity=center&v=galleryMedia&k=wpsSDw6D4yetnnA15I28ig",
  "neutrogena-hydro-boost-water-gel":
    "https://images.ctfassets.net/bcjr30vxh6td/3TfmeqVtWAAtF8LobCI3ss/d8071f4fa4a443a928cc00b98c84de95/NTG_USA_US_70501110478_681104748_HB_Hyaluronic_Acid_Water_Gel_Signature_1p7oz_00000.webp?w=800",
  "aveeno-calm-restore-oat-gel":
    "https://images.ctfassets.net/mgaihfszrtka/6K6lC4Dwg64DAbYjnlDTph/57ce9c4af1f7e96da2a6888737f4c070/7oz_oobwb-min-en-us-Aveeno?fm=webp&w=800",
  "eltamd-uv-clear-spf46":
    "https://eltamd.com/cdn/shop/files/UV_Clear_SPF_46_02500A_With_award_1200x1200.jpg?v=1773888112",
  "supergoop-unseen-sunscreen-spf40":
    "https://cdn.shopify.com/s/files/1/1503/5658/files/Unseen_PDP_1180x1604_5d03ff64-0ed3-4fbb-8bef-c6b7dfbaa0bd.png?v=1774797043",
  "larocheposay-toleriane-double-repair": "https://media.ulta.com/i/ulta/2509730",
  "tatcha-the-water-cream": "https://media.ulta.com/i/ulta/2634101",
  "clinique-ddmg":
    "https://www.sephora.com/productimages/sku/s789727-main-zoom.jpg",
  "first-aid-beauty-ultra-repair-cream":
    "https://www.sephora.com/productimages/sku/s2935625-main-zoom.jpg",
  "drunk-elephant-protini":
    "https://www.sephora.com/productimages/sku/s2025633-main-zoom.jpg",
  "the-ordinary-niacinamide-zinc":
    "https://www.sephora.com/productimages/sku/s2031391-main-zoom.jpg",
};

let s = fs.readFileSync(fp, "utf8");

const lines = s.split("\n");
const out = lines.map((line) => {
  const idm = line.match(/^\s*\{ id: "([^"]+)"/);
  if (!idm || !line.includes("...e, tags:") || line.includes("imageUrl:")) {
    return line;
  }
  const url = IMAGE_MAP[idm[1]] ?? "";
  return line.replace(/\.\.\.e, tags:/, `...e, imageUrl: ${JSON.stringify(url)}, tags:`);
});

fs.writeFileSync(fp, out.join("\n"));
console.log("Updated", fp, "entries:", Object.keys(IMAGE_MAP).length);
