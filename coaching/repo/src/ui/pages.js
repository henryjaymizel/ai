/**
 * UI page definitions and data fetching — PRD 03
 * Defines what data each page needs and the authorization rules.
 */

const PAGES = {
  '/': {
    name: 'Org Overview',
    requiredRole: ['vp', 'admin'],
    async getData(db, user) {
      return { scope: 'org', scope_id: 'org' };
    },
  },
  '/director/:id': {
    name: 'Director View',
    requiredRole: ['vp', 'director', 'admin'],
    async getData(db, user, params) {
      return { scope: 'director', scope_id: params.id };
    },
  },
  '/manager/:id': {
    name: 'Manager View',
    requiredRole: ['vp', 'director', 'manager', 'admin'],
    async getData(db, user, params) {
      return { scope: 'manager', scope_id: params.id };
    },
  },
  '/rep/:id': {
    name: 'Rep View',
    requiredRole: ['vp', 'director', 'manager', 'ae', 'sdr', 'se', 'admin'],
    async getData(db, user, params) {
      return { scope: 'rep', scope_id: params.id };
    },
  },
  '/deal/:id': {
    name: 'Deal View',
    requiredRole: ['vp', 'director', 'manager', 'ae', 'sdr', 'se', 'admin'],
    async getData(db, user, params) {
      return { type: 'deal', deal_id: params.id };
    },
  },
  '/call/:id': {
    name: 'Call View',
    requiredRole: ['vp', 'director', 'manager', 'ae', 'sdr', 'se', 'admin'],
    async getData(db, user, params) {
      return { type: 'call', call_id: params.id };
    },
  },
  '/settings/prompt': {
    name: 'Prompt Editor',
    requiredRole: ['manager', 'admin'],
    async getData(db) {
      return { type: 'prompt_editor' };
    },
  },
};

// REQ-UI-011: Authorization check
function checkPageAccess(page, user, params) {
  const pageDef = PAGES[page];
  if (!pageDef) return { allowed: false, reason: 'Page not found' };
  if (!pageDef.requiredRole.includes(user.role)) {
    return { allowed: false, reason: 'Insufficient role' };
  }

  // Reps can only see their own data
  if (user.role === 'ae' || user.role === 'sdr' || user.role === 'se') {
    if (params?.id && params.id !== user.id) {
      return { allowed: false, reason: 'Reps can only view their own data' };
    }
  }

  return { allowed: true };
}

// REQ-UI-007: Time period bucketing
function bucketByPeriod(evaluations, periodType) {
  const buckets = new Map();

  for (const eval_ of evaluations) {
    const date = new Date(eval_.evaluated_at);
    let key;

    if (periodType === 'weekly') {
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay() + 1);
      key = startOfWeek.toISOString().split('T')[0];
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(eval_);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, evals]) => ({
      period,
      avg_score: Math.round((evals.reduce((s, e) => s + e.overall_score, 0) / evals.length) * 10) / 10,
      count: evals.length,
      criterion_avgs: aggregateCriteria(evals),
    }));
}

function aggregateCriteria(evaluations) {
  const sums = {};
  const counts = {};
  for (const eval_ of evaluations) {
    for (const [k, v] of Object.entries(eval_.scores || {})) {
      sums[k] = (sums[k] || 0) + v;
      counts[k] = (counts[k] || 0) + 1;
    }
  }
  const avgs = {};
  for (const k of Object.keys(sums)) {
    avgs[k] = Math.round((sums[k] / counts[k]) * 10) / 10;
  }
  return avgs;
}

// REQ-UI-008: Trend direction
function trendDirection(current, previous) {
  if (!previous) return 'flat';
  const diff = current - previous;
  if (diff > 0.2) return 'up';
  if (diff < -0.2) return 'down';
  return 'flat';
}

module.exports = { PAGES, checkPageAccess, bucketByPeriod, aggregateCriteria, trendDirection };
