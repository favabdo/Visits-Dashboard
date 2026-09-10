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
        <path
          d="M10.5 36.5c1.2-13.8 11.4-24.6 29.2-30.2 1.5-.5 2.8 1.1 2 2.5C36.4 17.6 30.8 27.8 29.2 41.2c-.4 3.4-4.6 4.6-7.2 2.4-4.6-3.8-11.8-3.6-11.5-7.1Z"
          fill="#2EE6C5"
        />
        <path
          d="M22.8 49.2C33.4 35 46.6 20.4 57.8 8.6c.5-.5 1.3 0 1.1.7-3.8 13.2-11 27.2-21.6 39.6-3.2 3.8-10.2 4.4-14.5.3Z"
          fill="#3B82F6"
        />
      </svg>
      <div className="login-brand-text">
        <p className="login-brand-name">Nile techno</p>
        {showTag ? <p className="login-brand-tag">Target · Manage · Grow</p> : null}
      </div>
    </div>
  );
}
