import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import api from '../api/client';

// Evidence photos are protected: the browser must send the login token to fetch them,
// so an <img src> cannot be used directly. We fetch the file as a blob instead.
export default function Evidence({ url, className = 'h-64 w-full rounded-xl object-cover' }) {
  const [src, setSrc] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!url) return;
    let objectUrl;
    let cancelled = false;
    api
      .get(url.replace(/^\/api/, ''), { responseType: 'blob' })
      .then((r) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(r.data);
        setSrc(objectUrl);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  if (!url || failed) {
    return (
      <div className="flex h-40 w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-muted">
        <ImageOff className="mb-2 h-6 w-6" />
        {failed ? 'Could not load the image' : 'No evidence photo provided'}
      </div>
    );
  }
  if (!src) return <div className="skeleton h-64 w-full" />;
  return <img src={src} alt="Recycling evidence" className={className} />;
}
