export function bandColor(band) {
  switch (band) {
    case 'developing': return 'text-red-600 bg-red-50';
    case 'proficient': return 'text-yellow-600 bg-yellow-50';
    case 'elite': return 'text-green-600 bg-green-50';
    default: return 'text-gray-600 bg-gray-50';
  }
}

export function bandBg(band) {
  switch (band) {
    case 'developing': return '#ef4444';
    case 'proficient': return '#eab308';
    case 'elite': return '#22c55e';
    default: return '#9ca3af';
  }
}

export function bandLabel(band) {
  return band ? band.charAt(0).toUpperCase() + band.slice(1) : '—';
}

export function formatScore(score) {
  return score != null ? score.toFixed(1) : '—';
}

export function deltaArrow(delta) {
  if (delta > 0) return '▲';
  if (delta < 0) return '▼';
  return '→';
}

export function deltaColor(delta) {
  if (delta > 0) return 'text-green-600';
  if (delta < 0) return 'text-red-600';
  return 'text-gray-500';
}

export function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

export function segmentLabel(seg) {
  if (seg === 'mid_market') return 'Mid-Market';
  if (seg === 'smb') return 'SMB';
  if (seg === 'enterprise') return 'Enterprise';
  return seg || '—';
}

export function pillarName(key) {
  switch (key) {
    case 'p1': return 'GTM Workflow';
    case 'p2': return 'System Mapping';
    case 'p3': return 'Solution Mapping';
    default: return key;
  }
}
