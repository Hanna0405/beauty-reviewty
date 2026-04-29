import { execSync } from "child_process";
import fs from "fs";

const url = process.argv[2];
execSync(
  `curl.exe -sL -A "Mozilla/5.0" "${url.replace(/"/g, '\\"')}" -o tmp-page.html`,
  { cwd: process.cwd(), stdio: "inherit" },
);
const h = fs.readFileSync("tmp-page.html", "utf8");
let m =
  h.match(/property="twitter:image"\s+content="([^"]+)"/i) ||
  h.match(/property='twitter:image'\s+content='([^']+)'/i);
if (!m)
  m =
    h.match(/property="og:image"\s+content="([^"]+)"/i) ||
    h.match(/property='og:image'\s+content='([^']+)'/i);
console.log(m ? m[1] : "NOT_FOUND");
