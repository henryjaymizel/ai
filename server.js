const express = require('express');
const https = require('https');
const path = require('path');
const fs = require('fs');

// Load .env file if present
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([\w]+)\s*=\s*(.+)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

// The Odds API - free tier (500 req/month)
let ODDS_API_KEY = process.env.ODDS_API_KEY || '';

// Fetch the active soccer league list dynamically from the API
let SOCCER_LEAGUES = [];
let LEAGUE_NAMES = {};

async function loadLeagues() {
  if (!ODDS_API_KEY) return;
  try {
    const sports = await fetchJSON(`https://api.the-odds-api.com/v4/sports/?apiKey=${ODDS_API_KEY}`);
    for (const s of sports) {
      if (s.key.startsWith('soccer_') && s.active && !s.has_outrights) {
        SOCCER_LEAGUES.push(s.key);
        LEAGUE_NAMES[s.key] = s.title;
      }
    }
    console.log(`Loaded ${SOCCER_LEAGUES.length} active soccer leagues`);
  } catch (err) {
    console.error('Failed to load leagues:', err.message);
    // Fallback to hardcoded list
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

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`JSON parse error: ${e.message}`));
          }
        } else if (res.statusCode === 401) {
          reject(new Error('Invalid API key. Get a free key at https://the-odds-api.com'));
        } else if (res.statusCode === 422) {
          // Unknown sport/league — skip silently
          resolve([]);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

function getDateRange(daysAhead) {
  const now = new Date();

  // Start: tomorrow at midnight
  const start = new Date(now);
  start.setDate(start.getDate() + 1);
  start.setHours(0, 0, 0, 0);

  // End: daysAhead days from now (default 1 = just tomorrow)
  const end = new Date(start);
  end.setDate(end.getDate() + (daysAhead || 1));

  const startLabel = start.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
  const endDate = new Date(end);
  endDate.setDate(endDate.getDate() - 1);
  const endLabel = endDate.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });

  const label = daysAhead > 1
    ? `${startLabel} – ${endLabel}`
    : start.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });

  return { start: start.toISOString(), end: end.toISOString(), label };
}

/**
 * Calculate value bets by comparing each bookmaker's odds to the market average.
 *
 * Value = (Bookmaker Implied Probability is LOWER than consensus) meaning
 * the bookmaker is offering better odds than the market average.
 *
 * We compute:
 *  - Average implied probability across all bookmakers for each outcome
 *  - Remove the overround (vig) to get "fair" probabilities
 *  - Compare each bookmaker's offered odds to the fair probability
 *  - Value % = (decimal_odds * fair_probability - 1) * 100
 *    Positive value % means the odds offered are better than fair
 */
function analyzeValue(event) {
  const bookmakers = event.bookmakers;
  if (!bookmakers || bookmakers.length < 2) return null;

  // Collect all h2h (moneyline) odds: { outcome_name -> [{ bookmaker, price }] }
  const outcomeOdds = {};
  for (const bk of bookmakers) {
    const h2h = bk.markets.find(m => m.key === 'h2h');
    if (!h2h) continue;
    for (const outcome of h2h.outcomes) {
      if (!outcomeOdds[outcome.name]) outcomeOdds[outcome.name] = [];
      outcomeOdds[outcome.name].push({
        bookmaker: bk.title,
        price: outcome.price,
      });
    }
  }

  const outcomes = Object.keys(outcomeOdds);
  if (outcomes.length === 0) return null;

  // Calculate consensus (average) implied probability per outcome
  const consensus = {};
  let totalConsensus = 0;
  for (const name of outcomes) {
    const prices = outcomeOdds[name].map(o => o.price);
    const avgImpliedProb = prices.reduce((s, p) => s + 1 / p, 0) / prices.length;
    consensus[name] = avgImpliedProb;
    totalConsensus += avgImpliedProb;
  }

  // Remove overround to get fair probabilities
  const fairProb = {};
  for (const name of outcomes) {
    fairProb[name] = consensus[name] / totalConsensus;
  }

  // Find value in each outcome across bookmakers
  const valueBets = [];
  for (const name of outcomes) {
    let bestValue = -Infinity;
    let bestBookmaker = '';
    let bestOdds = 0;

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
    const minOdds = Math.min(...allPrices);
    const maxOdds = Math.max(...allPrices);

    valueBets.push({
      outcome: name,
      fairProbability: fairProb[name],
      bestOdds,
      bestBookmaker,
      valuePercent: bestValue,
      avgOdds: +avgOdds.toFixed(2),
      minOdds,
      maxOdds,
      oddsSpread: +(maxOdds - minOdds).toFixed(2),
      numBookmakers: outcomeOdds[name].length,
      allOdds: outcomeOdds[name],
    });
  }

  return valueBets;
}

app.use(express.json());
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/key-status', (req, res) => {
  res.json({ hasKey: !!ODDS_API_KEY });
});

app.post('/api/set-key', async (req, res) => {
  const key = (req.body.key || '').trim();
  if (!key) {
    return res.status(400).json({ error: 'API key is required' });
  }

  // Validate the key by making a test request
  try {
    await fetchJSON(`https://api.the-odds-api.com/v4/sports/?apiKey=${key}`);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid API key: ' + err.message });
  }

  // Save to .env file
  if (fs.existsSync(envPath)) {
    let content = fs.readFileSync(envPath, 'utf8');
    if (content.match(/^ODDS_API_KEY=.*/m)) {
      content = content.replace(/^ODDS_API_KEY=.*/m, `ODDS_API_KEY=${key}`);
    } else {
      content += `\nODDS_API_KEY=${key}\n`;
    }
    fs.writeFileSync(envPath, content);
  } else {
    fs.writeFileSync(envPath, `ODDS_API_KEY=${key}\n`);
  }

  // Update in-memory key and reload leagues
  ODDS_API_KEY = key;
  process.env.ODDS_API_KEY = key;
  SOCCER_LEAGUES = [];
  LEAGUE_NAMES = {};
  await loadLeagues();

  res.json({ success: true, leagues: SOCCER_LEAGUES.length });
});

app.get('/api/value-bets', async (req, res) => {
  if (!ODDS_API_KEY) {
    return res.status(400).json({
      error: 'No API key configured. Set ODDS_API_KEY environment variable. Get a free key at https://the-odds-api.com',
    });
  }

  const days = Math.min(Math.max(parseInt(req.query.days) || 1, 1), 7);
  const { start, end, label } = getDateRange(days);

  try {
    // Fetch odds for all soccer leagues in parallel
    const results = await Promise.allSettled(
      SOCCER_LEAGUES.map(league => {
        const url = `https://api.the-odds-api.com/v4/sports/${league}/odds/?apiKey=${ODDS_API_KEY}&regions=us,uk,eu,au&markets=h2h&oddsFormat=decimal&commenceTimeFrom=${encodeURIComponent(start)}&commenceTimeTo=${encodeURIComponent(end)}`;
        return fetchJSON(url).then(events => ({ league, events }));
      })
    );

    const allValueBets = [];

    for (const result of results) {
      if (result.status !== 'fulfilled') continue;
      const { league, events } = result.value;
      if (!events || events.length === 0) continue;

      for (const event of events) {
        const analysis = analyzeValue(event);
        if (!analysis) continue;

        // Find the single best value outcome for this match
        const bestOutcome = analysis.reduce((best, cur) =>
          cur.valuePercent > best.valuePercent ? cur : best
        );

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

    // Sort by highest value first
    allValueBets.sort((a, b) => b.bestBet.valuePercent - a.bestBet.valuePercent);

    res.json({
      date: label,
      totalMatches: allValueBets.length,
      valueBets: allValueBets,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

loadLeagues().then(() => {
  app.listen(PORT, () => {
    console.log(`Soccer Betting Value app running at http://localhost:${PORT}`);
    if (!ODDS_API_KEY) {
      console.log('WARNING: No ODDS_API_KEY set. Get a free key at https://the-odds-api.com');
    }
  });
});
