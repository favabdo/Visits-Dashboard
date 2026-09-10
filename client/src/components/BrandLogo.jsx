export default function BrandLogo({ size = 40, showTag = false, markHeight }) {
  const height = markHeight || size;
  const width = Math.round((height * 60) / 80);

  return (
    <div className="login-brand">
      <img
        className="login-brand-mark"
        src="/nile-mark.png?v=1"
        alt=""
        width={width}
        height={height}
      />
      <div className="login-brand-text">
        <p className="login-brand-name">Nile techno</p>
        {showTag ? <p className="login-brand-tag">Target · Manage · Grow</p> : null}
      </div>
    </div>
  );
}
