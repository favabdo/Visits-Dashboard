import { useId } from 'react';

const PATH_A = 'M38 20 C 33 26, 31 38, 26 44';
const PATH_B = 'M38 20 C 41 30, 23 34, 26 44';
const PATH_C = 'M38 20 C 30 28, 34 36, 26 44';

export default function BrandLogo({ size = 56, showTag = false, className = '' }) {
  const gid = `nile-n-${useId().replace(/:/g, '')}`;

  return (
    <div className={className ? `login-brand ${className}` : 'login-brand'}>
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
            <stop offset="0%" stopColor="#2EE6C5">
              <animate
                attributeName="stop-color"
                values="#2EE6C5;#5EEAD4;#3B82F6;#2EE6C5"
                dur="4s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="#3B82F6">
              <animate
                attributeName="stop-color"
                values="#3B82F6;#2EE6C5;#60A5FA;#3B82F6"
                dur="4s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>
        </defs>
        <g className="login-brand-motion" transform="rotate(-40 32 32)">
          <rect x="4" y="14" width="40" height="16" rx="8" fill="#2EE6C5" />
          <rect x="20" y="34" width="40" height="16" rx="8" fill="#3B82F6" />
          <path
            d={PATH_A}
            stroke={`url(#${gid})`}
            strokeWidth="11"
            strokeLinecap="round"
          >
            <animate
              attributeName="d"
              values={`${PATH_A};${PATH_B};${PATH_C};${PATH_A}`}
              dur="3.6s"
              repeatCount="indefinite"
              calcMode="spline"
              keyTimes="0;0.33;0.66;1"
              keySplines="0.45 0 0.2 1;0.45 0 0.2 1;0.45 0 0.2 1"
            />
          </path>
          <path
            className="login-brand-flow"
            d={PATH_A}
            stroke="#fff"
            strokeOpacity="0.42"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="7 22"
          >
            <animate
              attributeName="d"
              values={`${PATH_A};${PATH_B};${PATH_C};${PATH_A}`}
              dur="3.6s"
              repeatCount="indefinite"
              calcMode="spline"
              keyTimes="0;0.33;0.66;1"
              keySplines="0.45 0 0.2 1;0.45 0 0.2 1;0.45 0 0.2 1"
            />
          </path>
        </g>
      </svg>
      <div className="login-brand-text">
        <p className="login-brand-name">Nile techno</p>
        {showTag ? <p className="login-brand-tag">Target · Manage · Grow</p> : null}
      </div>
    </div>
  );
}
