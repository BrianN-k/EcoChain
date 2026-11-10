import { useEffect } from 'react';
import { Loader2, X, Inbox, ExternalLink } from 'lucide-react';

export function Spinner({ className = 'h-4 w-4' }) {
  return <Loader2 className={`animate-spin ${className}`} />;
}

export function Button({ variant = 'primary', loading, children, className = '', ...props }) {
  return (
    <button className={`btn btn-${variant} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function Card({ className = '', children }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div>
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const badgeStyles = {
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-200',
  APPROVED: 'bg-sky-50 text-sky-700 ring-sky-200',
  REJECTED: 'bg-red-50 text-red-700 ring-red-200',
  REWARD_PROCESSING: 'bg-violet-50 text-violet-700 ring-violet-200',
  PROCESSING: 'bg-violet-50 text-violet-700 ring-violet-200',
  REWARDED: 'bg-mint text-forest ring-emerald/30',
  CONFIRMED: 'bg-mint text-forest ring-emerald/30',
  FAILED: 'bg-red-50 text-red-700 ring-red-200',
  ACTIVE: 'bg-mint text-forest ring-emerald/30',
  SUSPENDED: 'bg-red-50 text-red-700 ring-red-200',
  DEMO: 'bg-slate-100 text-slate-600 ring-slate-200',
};
const labels = { REWARD_PROCESSING: 'Reward processing', REWARDED: 'Rewarded', PROCESSING: 'Processing' };

export function Badge({ status, children }) {
  const text = children || labels[status] || status.charAt(0) + status.slice(1).toLowerCase();
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${badgeStyles[status] || badgeStyles.DEMO}`}>
      {text}
    </span>
  );
}

export function DemoBadge() {
  return <Badge status="DEMO">Demo data</Badge>;
}

export function StatCard({ icon: Icon, label, value, hint, loading }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint text-forest">
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      {loading ? (
        <div className="skeleton mt-3 h-8 w-24" />
      ) : (
        <p className="mt-2 text-2xl font-bold tracking-tight text-ink">{value}</p>
      )}
      {hint && !loading && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </Card>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, text, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mint text-forest">
        <Icon className="h-6 w-6" />
      </span>
      <h4 className="mt-4 font-semibold text-ink">{title}</h4>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SkeletonRows({ rows = 5 }) {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-10 w-full" />
      ))}
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 backdrop-blur-sm sm:items-center" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-lg animate-fadeUp rounded-2xl bg-white shadow-lift" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-ink"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({ label, error, children, hint }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// Responsive table wrapper: scrolls sideways on small screens.
export function Table({ head, children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px]">
        <thead className="bg-slate-50/70">
          <tr>{head.map((h) => <th key={h} className="th">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export function TxLink({ hash, base }) {
  if (!hash) return <span className="text-muted">-</span>;
  return (
    <a href={`${base}/tx/${hash}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-xs text-emerald hover:underline">
      {hash.slice(0, 10)}...{hash.slice(-6)} <ExternalLink className="h-3 w-3" />
    </a>
  );
}

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' });
export const fmtNum = (n, dp = 2) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: dp });
export const cap = (s) => (s ? s.charAt(0) + s.slice(1).toLowerCase() : '');
