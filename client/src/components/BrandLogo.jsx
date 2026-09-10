import { useId } from 'react';

export default function BrandLogo({ size = 40 }) {
  const gid = useId().replace(/:/g, '');

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
          d="M8 40V8h9.2L32.5 28.4V8H40v32h-9.2L15.5 19.6V40H8Z"
          fill={`url(#${gid})`}
        />
        <defs>
          <linearGradient id={gid} x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2DD4C0" />
            <stop offset="0.45" stopColor="#38BDF8" />
            <stop offset="1" stopColor="#2563EB" />
          </linearGradient>
        </defs>
      </svg>
      <div>
        <p className="login-brand-name">Nile techno</p>
        <p className="login-brand-tag">Target · Manage · Grow</p>
      </div>
    </div>
  );
}
