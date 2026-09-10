export const tokens = {
  paper: '#eef4fb',
  panel: '#ffffff',
  ink: '#0a1b36',
  muted: '#64748b',
  line: '#e6edf5',
  grid: '#eef2f8',
  blue: '#3b82f6',
  blueDeep: '#2563eb',
  blueLight: '#60a5fa',
  teal: '#14b8a6',
  tealBright: '#2ee6c5',
  slate: '#6b8499',
  amber: '#f59e0b',
  emerald: '#10b981',
};

export const plotFont = {
  family: '"IBM Plex Sans Arabic", "Plus Jakarta Sans", "Segoe UI", sans-serif',
  color: tokens.ink,
};

// تدرّج باهت يُستخدم كخلفية لمساحة الاتجاه
export const areaFill = 'rgba(59, 130, 246, 0.10)';

export function baseLayout(title) {
  return {
    title: title
      ? {
          text: title,
          font: { ...plotFont, size: 15, weight: 600 },
          x: 1,
          xanchor: 'right',
          pad: { b: 8 },
        }
      : undefined,
    font: plotFont,
    paper_bgcolor: tokens.panel,
    plot_bgcolor: tokens.panel,
    margin: { t: title ? 48 : 16, r: 14, b: 56, l: 48 },
    hoverlabel: {
      bgcolor: tokens.ink,
      bordercolor: tokens.ink,
      font: { family: plotFont.family, size: 12, color: '#ffffff' },
      align: 'right',
    },
    hovermode: 'closest',
    xaxis: {
      gridcolor: tokens.grid,
      linecolor: tokens.line,
      zeroline: false,
      tickfont: { size: 11, color: tokens.muted },
      title: { font: { size: 12, color: tokens.muted } },
      automargin: true,
    },
    yaxis: {
      gridcolor: tokens.grid,
      linecolor: tokens.line,
      zeroline: false,
      tickfont: { size: 11, color: tokens.muted },
      title: { font: { size: 12, color: tokens.muted } },
      automargin: true,
    },
    legend: {
      orientation: 'h',
      y: -0.22,
      font: { size: 12, color: tokens.muted },
    },
  };
}

export const plotConfig = {
  displayModeBar: false,
  responsive: true,
};
