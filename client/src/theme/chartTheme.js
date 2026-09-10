export const tokens = {
  paper: '#e6e4dc',
  panel: '#f7f5ef',
  ink: '#121210',
  muted: '#666968',
  line: '#d5cfbd',
  camo: '#5d5411',
  camoSoft: '#7e7416',
  choco: '#8a4513',
  brown: '#825b3a',
  sand: '#867c65',
};

export const plotFont = {
  family: 'IBM Plex Sans Arabic, Segoe UI, sans-serif',
  color: tokens.ink,
};

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
    margin: { t: title ? 48 : 16, r: 12, b: 56, l: 48 },
    xaxis: {
      gridcolor: tokens.line,
      linecolor: tokens.line,
      tickfont: { size: 11, color: tokens.muted },
      title: { font: { size: 12, color: tokens.muted } },
      automargin: true,
    },
    yaxis: {
      gridcolor: tokens.line,
      linecolor: tokens.line,
      tickfont: { size: 11, color: tokens.muted },
      title: { font: { size: 12, color: tokens.muted } },
      zeroline: false,
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
