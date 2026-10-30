import { useEffect, useState } from 'react';
import { FILES_BUCKET, supabase } from '../lib/supabase';

const cache = new Map(); // path -> { url, exp }

/** Returns a short-lived signed URL for a private Storage object. */
export function useSignedUrl(path) {
  const [url, setUrl] = useState(() => (path ? cache.get(path)?.url ?? null : null));

  useEffect(() => {
    if (!path) {
      setUrl(null);
      return;
    }
    const hit = cache.get(path);
    if (hit && hit.exp > Date.now()) {
      setUrl(hit.url);
      return;
    }
    let cancelled = false;
    supabase.storage
      .from(FILES_BUCKET)
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (cancelled || !data) return;
        cache.set(path, { url: data.signedUrl, exp: Date.now() + 3500 * 1000 });
        setUrl(data.signedUrl);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return url;
}
