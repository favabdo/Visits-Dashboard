import React from 'react';
import BrandLogo from './BrandLogo';

export default function LoadingScreen({ label = 'جاري تجهيز اللوحة' }) {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center gap-4">
      <BrandLogo size={56} className="login-brand-stacked" />
      <span className="mt-1 block h-1 w-[132px] overflow-hidden rounded-full bg-accent-soft">
        <span className="loading-bar block h-full w-2/5 rounded-full" />
      </span>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}
