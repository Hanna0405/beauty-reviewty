import { useEffect, useState } from "react";

export function useStableStorageUrl(initial?: string, fullPath?: string) {
  const [src, setSrc] = useState<string | undefined>(initial);

  useEffect(() => {
    const s = initial || "";
    const looksSigned = /X-Goog-Expires=|X-Goog-Signature=/.test(s);
    if (!looksSigned && s) return; // already stable
    const q = s
      ? `url=${encodeURIComponent(s)}`
      : fullPath
      ? `path=${encodeURIComponent(fullPath)}`
      : "";
    if (!q) return;

    fetch(`/api/storage/stable?${q}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.url) setSrc(d.url);
      })
      .catch(() => {});
  }, [initial, fullPath]);

  return src ?? initial;
}
