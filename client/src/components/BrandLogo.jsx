import { useId } from 'react';

export default function BrandLogo({ size = 58, showTag = false }) {
  return (
    <div className="login-brand">
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M11 33c5.5-14 13.5-22.5 24-27"
          stroke="#2EE6C5"
          strokeWidth="10.5"
          strokeLinecap="round"
        />
        <path
          d="M20.5 39.5c8.2-12.5 16.5-23 23-31.5"
          stroke="#3B82F6"
          strokeWidth="10.5"
          strokeLinecap="round"
        />
      </svg>
      <div>
        <p className="login-brand-name">Nile techno</p>
        {showTag ? <p className="login-brand-tag">Target · Manage · Grow</p> : null}
      </div>
    </div>
  );
}
