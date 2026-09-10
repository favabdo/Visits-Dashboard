export default function BrandLogo({ size = 56, showTag = false }) {
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
        <g transform="rotate(-40 32 32)">
          <rect x="4" y="14" width="40" height="16" rx="8" fill="#2EE6C5" />
          <rect x="20" y="34" width="40" height="16" rx="8" fill="#3B82F6" />
        </g>
      </svg>
      <div className="login-brand-text">
        <p className="login-brand-name">Nile techno</p>
        {showTag ? <p className="login-brand-tag">Target · Manage · Grow</p> : null}
      </div>
    </div>
  );
}
