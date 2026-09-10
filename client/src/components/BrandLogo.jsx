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
          <linearGradient id={gid} x1="38" y1="20" x2="26" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2EE6C5" />
            <stop offset="1" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
        <g transform="rotate(-40 32 32)">
          <rect x="4" y="14" width="40" height="16" rx="8" fill="#2EE6C5" />
          <rect x="20" y="34" width="40" height="16" rx="8" fill="#3B82F6" />
          <path
            d="M38 20 L26 44"
            stroke={`url(#${gid})`}
            strokeWidth="11"
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
