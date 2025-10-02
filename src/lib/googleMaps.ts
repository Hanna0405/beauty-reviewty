import { Loader } from "@googlemaps/js-api-loader";

function assertEnv(name: string, val: string | undefined): string {
  if (!val) {
    throw new Error(`Missing env ${name}. Add it to .env.local and restart dev server.`);
  }
  return val;
}

const loaderOptions = {
  apiKey: assertEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY),
  version: "weekly",
  libraries: ["places"] as ("places")[],
  language: "en",
  region: "CA",
  id: "google-maps-script",
};

let _loader: Loader | null = null;

export function getMapsLoader(): Loader {
  if (!_loader) {
    _loader = new Loader(loaderOptions);
  }
  return _loader;
}

async function safeImport<T extends "maps" | "places">(lib: T) {
  try {
    const loader = getMapsLoader();
    // @ts-ignore types ok for js-api-loader
    return await loader.importLibrary(lib);
  } catch (err: any) {
    // Помогаем себе в отладке
    console.error("[GoogleMaps] Failed to import", lib, err?.message || err);
    throw err;
  }
}

export async function ensureMapsLib() {
  return safeImport("maps");
}

export async function ensurePlacesLib() {
  return safeImport("places");
}