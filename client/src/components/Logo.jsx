// EcoChain logo: a hexagon (a block in a chain) containing a leaf.
export function LogoMark({ className = 'h-9 w-9' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#14532D" />
      <path d="M32 11l16 9.2v18.4L32 47.8 16 38.600V20.200z" fill="none" stroke="#DCFCE7" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M32 40c-7 0-11-4.500-11-10 7-.3 11 3.500 11 10z" fill="#4ADE80" />
      <path d="M32 40c7 0 11-4.500 11-10-7-.3-11 3.500-11 10z" fill="#16A34A" />
      <path d="M32 40V26" stroke="#DCFCE7" strokeWidth="2.500" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ light = false }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className={`text-xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-forest'}`}>
        Eco<span className="text-emerald">Chain</span>
      </span>
    </span>
  );
}
