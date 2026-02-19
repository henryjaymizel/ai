const express = require('express');
const https = require('https');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// --- API Key Management (stored in keys.json) ---
const KEYS_FILE = path.join(__dirname, 'keys.json');

function loadKeys() {
  try {
    if (fs.existsSync(KEYS_FILE)) {
      return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
    }
  } catch (e) {}

  // Migrate from .env if keys.json doesn't exist
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/ODDS_API_KEY=(\S+)/);
    if (match && match[1]) {
      const keys = [{ key: match[1], label: 'Default', added: new Date().toISOString() }];
      saveKeys(keys);
      return keys;
    }
  }
  return [];
}

function saveKeys(keys) {
  fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
}

// --- HTTP helper ---
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try { resolve(JSON.parse(data)); }
          catch (e) { reject(new Error('JSON parse error')); }
        } else if (res.statusCode === 401) {
          reject(new Error('INVALID_KEY'));
        } else if (res.statusCode === 422) {
          resolve([]);
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

// Try a fetch with each key until one works. Returns { data, usedKey } or throws.
async function fetchWithKeys(urlTemplate) {
  const keys = loadKeys();
  if (keys.length === 0) throw new Error('NO_KEYS');

  for (const entry of keys) {
    const url = urlTemplate.replace('__API_KEY__', entry.key);
    try {
      const data = await fetchJSON(url);
      return { data, usedKey: entry.key };
    } catch (err) {
      if (err.message === 'INVALID_KEY') continue; // try next key
      throw err;
    }
  }
  throw new Error('ALL_KEYS_FAILED');
}

// --- League loading ---
let SOCCER_LEAGUES = [];
let LEAGUE_NAMES = {};

async function loadLeagues() {
  SOCCER_LEAGUES = [];
  LEAGUE_NAMES = {};
  try {
    const { data: sports } = await fetchWithKeys(
      'https://api.the-odds-api.com/v4/sports/?apiKey=__API_KEY__'
    );
    for (const s of sports) {
      if (s.key.startsWith('soccer_') && s.active && !s.has_outrights) {
        SOCCER_LEAGUES.push(s.key);
        LEAGUE_NAMES[s.key] = s.title;
      }
    }
    console.log(`Loaded ${SOCCER_LEAGUES.length} active soccer leagues`);
  } catch (err) {
    console.error('Failed to load leagues:', err.message);
    SOCCER_LEAGUES = [
      'soccer_epl', 'soccer_spain_la_liga', 'soccer_germany_bundesliga',
      'soccer_italy_serie_a', 'soccer_france_ligue_one', 'soccer_uefa_champs_league',
      'soccer_uefa_europa_league', 'soccer_efl_champ', 'soccer_usa_mls',
    ];
    LEAGUE_NAMES = {
      soccer_epl: 'EPL', soccer_spain_la_liga: 'La Liga',
      soccer_germany_bundesliga: 'Bundesliga', soccer_italy_serie_a: 'Serie A',
      soccer_france_ligue_one: 'Ligue 1', soccer_uefa_champs_league: 'Champions League',
      soccer_uefa_europa_league: 'Europa League', soccer_efl_champ: 'Championship',
      soccer_usa_mls: 'MLS',
    };
  }
}

// --- Value analysis ---
function analyzeValue(event) {
  const bookmakers = event.bookmakers;
  if (!bookmakers || bookmakers.length < 2) return null;

  const outcomeOdds = {};
  for (const bk of bookmakers) {
    const h2h = bk.markets.find(m => m.key === 'h2h');
    if (!h2h) continue;
    for (const outcome of h2h.outcomes) {
      if (!outcomeOdds[outcome.name]) outcomeOdds[outcome.name] = [];
      outcomeOdds[outcome.name].push({ bookmaker: bk.title, price: outcome.price });
    }
  }

  const outcomes = Object.keys(outcomeOdds);
  if (outcomes.length === 0) return null;

  const consensus = {};
  let totalConsensus = 0;
  for (const name of outcomes) {
    const prices = outcomeOdds[name].map(o => o.price);
    const avgImpliedProb = prices.reduce((s, p) => s + 1 / p, 0) / prices.length;
    consensus[name] = avgImpliedProb;
    totalConsensus += avgImpliedProb;
  }

  const fairProb = {};
  for (const name of outcomes) {
    fairProb[name] = consensus[name] / totalConsensus;
  }

  const valueBets = [];
  for (const name of outcomes) {
    let bestValue = -Infinity, bestBookmaker = '', bestOdds = 0;
    for (const entry of outcomeOdds[name]) {
      const value = (entry.price * fairProb[name] - 1) * 100;
      if (value > bestValue) {
        bestValue = value;
        bestBookmaker = entry.bookmaker;
        bestOdds = entry.price;
      }
    }

    const allPrices = outcomeOdds[name].map(o => o.price);
    const avgOdds = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;

    valueBets.push({
      outcome: name,
      fairProbability: fairProb[name],
      bestOdds,
      bestBookmaker,
      valuePercent: bestValue,
      avgOdds: +avgOdds.toFixed(2),
      numBookmakers: outcomeOdds[name].length,
    });
  }

  return valueBets;
}

// --- Routes ---
app.use(express.json());
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});
app.use(express.static(path.join(__dirname, 'public'), { etag: false, lastModified: false }));

// Serve the app on /app too, to bypass any proxy cache on /
app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// List all stored API keys (masked)
app.get('/api/keys', (req, res) => {
  const keys = loadKeys();
  res.json(keys.map((k, i) => ({
    index: i,
    label: k.label || `Key ${i + 1}`,
    masked: k.key.slice(0, 6) + '...' + k.key.slice(-4),
    added: k.added,
  })));
});

// Add a new API key
app.post('/api/keys', async (req, res) => {
  const key = (req.body.key || '').trim();
  const label = (req.body.label || '').trim() || 'Key';
  if (!key) return res.status(400).json({ error: 'API key is required' });

  // Validate key
  let validated = false;
  try {
    await fetchJSON(`https://api.the-odds-api.com/v4/sports/?apiKey=${key}`);
    validated = true;
  } catch (err) {
    if (err.message === 'INVALID_KEY') {
      return res.status(400).json({ error: 'Invalid API key — rejected by the-odds-api.com' });
    }
    // Key format looks plausible but API unreachable/rate-limited — accept it
    console.log(`Key validation inconclusive (${err.message}), accepting key anyway`);
  }

  const keys = loadKeys();
  // Don't add duplicates
  if (keys.some(k => k.key === key)) {
    return res.status(400).json({ error: 'This key is already saved' });
  }

  keys.push({ key, label, added: new Date().toISOString() });
  saveKeys(keys);

  // Reload leagues with the new key available
  if (SOCCER_LEAGUES.length === 0) await loadLeagues();

  const warning = validated ? undefined : 'Key saved but could not verify with the-odds-api.com — it will be tested when fetching odds.';
  res.json({ success: true, total: keys.length, warning });
});

// Delete an API key by index
app.delete('/api/keys/:index', (req, res) => {
  const keys = loadKeys();
  const idx = parseInt(req.params.index);
  if (isNaN(idx) || idx < 0 || idx >= keys.length) {
    return res.status(400).json({ error: 'Invalid key index' });
  }
  keys.splice(idx, 1);
  saveKeys(keys);
  res.json({ success: true, total: keys.length });
});

// Get today's value bets
app.get('/api/value-bets', async (req, res) => {
  const keys = loadKeys();
  if (keys.length === 0) {
    return res.status(400).json({ error: 'NO_KEYS' });
  }

  if (SOCCER_LEAGUES.length === 0) await loadLeagues();

  const now = new Date();
  // Today: from now to end of today (or next 24h to catch all today's matches)
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  // Also look back a few hours to include matches that started recently
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const commenceFrom = start.toISOString();
  const commenceTo = end.toISOString();

  try {
    const allValueBets = [];

    // Fetch in batches of 5 to avoid overwhelming the API
    for (let i = 0; i < SOCCER_LEAGUES.length; i += 5) {
      const batch = SOCCER_LEAGUES.slice(i, i + 5);
      const results = await Promise.allSettled(
        batch.map(async (league) => {
          const url = `https://api.the-odds-api.com/v4/sports/${league}/odds/?apiKey=__API_KEY__&regions=us,uk,eu,au&markets=h2h&oddsFormat=decimal&commenceTimeFrom=${encodeURIComponent(commenceFrom)}&commenceTimeTo=${encodeURIComponent(commenceTo)}`;
          const { data: events } = await fetchWithKeys(url);
          return { league, events };
        })
      );

      for (const result of results) {
        if (result.status !== 'fulfilled') continue;
        const { league, events } = result.value;
        if (!events || events.length === 0) continue;

        for (const event of events) {
          const analysis = analyzeValue(event);
          if (!analysis) continue;

          const bestOutcome = analysis.reduce((best, cur) =>
            cur.valuePercent > best.valuePercent ? cur : best
          );

          // Only include if there's positive value
          if (bestOutcome.valuePercent <= 0) continue;

          allValueBets.push({
            league: LEAGUE_NAMES[league] || league,
            homeTeam: event.home_team,
            awayTeam: event.away_team,
            kickoff: event.commence_time,
            bestBet: bestOutcome,
            allOutcomes: analysis,
          });
        }
      }
    }

    allValueBets.sort((a, b) => b.bestBet.valuePercent - a.bestBet.valuePercent);

    const today = now.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    res.json({ date: today, totalMatches: allValueBets.length, valueBets: allValueBets });
  } catch (err) {
    if (err.message === 'ALL_KEYS_FAILED') {
      return res.status(400).json({ error: 'ALL_KEYS_FAILED' });
    }
    if (err.message === 'NO_KEYS') {
      return res.status(400).json({ error: 'NO_KEYS' });
    }
    res.status(500).json({ error: err.message });
  }
});

loadLeagues().then(() => {
  app.listen(PORT, () => {
    console.log(`Soccer Value Bets running at http://localhost:${PORT}`);
    const keys = loadKeys();
    console.log(`API keys configured: ${keys.length}`);
  });
});
