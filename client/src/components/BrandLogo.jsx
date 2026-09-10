import { useId } from 'react';

export default function BrandLogo({ size = 56, showTag = false }) {
  const gid = `nile-n-${useId().replace(/:/g, '')}`;

  return (
    <div className="login-brand">
      <svg
        className="login-brand-mark"
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gid} x1="18" y1="12" x2="46" y2="52" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2EE6C5" />
            <stop offset="1" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
        <g transform="rotate(-12 32 32)">
          <rect x="12" y="8" width="12" height="48" rx="6" fill="#2EE6C5" />
          <rect x="40" y="8" width="12" height="48" rx="6" fill="#3B82F6" />
          <path
            d="M18 13 L46 51"
            stroke={`url(#${gid})`}
            strokeWidth="10"
            strokeLinecap="round"
          />
        </g>
      </svg>
      <div className="login-brand-text">
        <p className="login-brand-name">Nile techno</p>
        {showTag ? <p className="login-brand-tag">Target · Manage · Grow</p> : null}
      </div>
    </div>
  );
}
