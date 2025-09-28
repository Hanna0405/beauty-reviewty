// scripts/check-firebase-dupes.cjs
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const allow = new Set([
 'src/lib/firebase.client.ts',
 'src/lib/firebase.ts',
 'src/lib/firebase-admin.ts',
].map(p => p.replace(/\\/g, '/')));
const exts = new Set(['.ts', '.tsx', '.js', '.jsx']);

function walk(dir, out=[]) {
 for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
 const p = path.join(dir, e.name);
 if (e.isDirectory()) walk(p, out);
 else if (exts.has(path.extname(p))) out.push(p.replace(/\\/g,'/'));
 }
 return out;
}

const files = walk(path.join(root, 'src'));
const offenders = [];

for (const f of files) {
 const relPath = f.replace(root.replace(/\\/g, '/') + '/', '').replace(/\\/g, '/');
 if (allow.has(relPath)) continue;
 const txt = fs.readFileSync(f, 'utf8');
 const hasInit = /initializeApp\s*\(/.test(txt);
 const importApp = /from\s*['"]firebase\/app['"]/.test(txt);
 const hardcodedCfg = /(apiKey\s*:\s*['"]|firebaseConfig\s*=\s*\{)/.test(txt);
 const envDirect = /process\.env\.NEXT_PUBLIC_FIREBASE_/i.test(txt);
 if (hasInit || (importApp && (hardcodedCfg || envDirect))) offenders.push(relPath);
}

if (offenders.length) {
 console.error('\n[check-firebase-dupes] Дубли/инициализация client SDK вне src/lib/firebase.client.ts:');
 offenders.forEach(f => console.error(' -', f));
 console.error('\nИсправь: удали initializeApp/import "firebase/app" из этих файлов и импортируй {auth,db,storage} из "@/lib/firebase.client" (или "@/lib/firebase").');
 process.exit(1);
} else {
 console.log('[check-firebase-dupes] OK — дублей нет.');
}