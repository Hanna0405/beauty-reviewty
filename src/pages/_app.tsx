/* src/pages/_app.tsx */
import type { AppProps } from "next/app";

// Safe import of global CSS if it exists (do not crash if the path is wrong in dev)
try {
  // adjust the path below if your globals live elsewhere
  require("../app/globals.css");
} catch (e) {
  if (process.env.NODE_ENV !== "production") {
    console.warn("[_app] globals.css not found (dev only):", (e as Error).message);
  }
}

// If you have a provider, import it safely; otherwise render Component directly.
// Example: AuthProvider
let Providers: React.FC<{ children: React.ReactNode }> | null = null;
try {
  // Comment out if you don't have it:
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require("../context/AuthContext");
  Providers = (mod.AuthProvider ?? null) as typeof Providers;
} catch {
  Providers = null;
}

export default function MyApp({ Component, pageProps }: AppProps) {
  const content = <Component {...pageProps} />;

  // Wrap with providers only if they exist (avoid crashes from bad imports)
  if (Providers) {
    const P = Providers;
    return <P>{content}</P>;
  }
  return content;
}
