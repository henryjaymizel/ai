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
const ODDS_API_KEY = process.env.ODDS_API_KEY || '';

// All soccer leagues supported by The Odds API
const SOCCER_LEAGUES = [
  'soccer_epl',
  'soccer_spain_la_liga',
  'soccer_germany_bundesliga',
  'soccer_italy_serie_a',
  'soccer_france_ligue_one',
  'soccer_uefa_champs_league',
  'soccer_uefa_europa_league',
  'soccer_brazil_campeonato',
  'soccer_netherlands_eredivisie',
  'soccer_portugal_primeira_liga',
  'soccer_turkey_super_league',
  'soccer_usa_mls',
  'soccer_mexico_ligamx',
  'soccer_efl_champ',
  'soccer_argentina_primera_division',
  'soccer_uefa_europa_conference_league',
];

const LEAGUE_NAMES = {
  soccer_epl: 'English Premier League',
  soccer_spain_la_liga: 'La Liga (Spain)',
  soccer_germany_bundesliga: 'Bundesliga (Germany)',
  soccer_italy_serie_a: 'Serie A (Italy)',
  soccer_france_ligue_one: 'Ligue 1 (France)',
  soccer_uefa_champs_league: 'UEFA Champions League',
  soccer_uefa_europa_league: 'UEFA Europa League',
  soccer_brazil_campeonato: 'Campeonato Brasileiro',
  soccer_netherlands_eredivisie: 'Eredivisie (Netherlands)',
  soccer_portugal_primeira_liga: 'Primeira Liga (Portugal)',
  soccer_turkey_super_league: 'Super Lig (Turkey)',
  soccer_usa_mls: 'MLS (USA)',
  soccer_mexico_ligamx: 'Liga MX (Mexico)',
  soccer_efl_champ: 'EFL Championship (England)',
  soccer_argentina_primera_division: 'Primera Division (Argentina)',
  soccer_uefa_europa_conference_league: 'UEFA Conference League',
};

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

function getTomorrowRange() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  return {
    start: tomorrow.toISOString(),
    end: dayAfter.toISOString(),
    label: tomorrow.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  };
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

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/value-bets', async (req, res) => {
  if (!ODDS_API_KEY) {
    return res.status(400).json({
      error: 'No API key configured. Set ODDS_API_KEY environment variable. Get a free key at https://the-odds-api.com',
    });
  }

  const { start, end, label } = getTomorrowRange();

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

app.listen(PORT, () => {
  console.log(`Soccer Betting Value app running at http://localhost:${PORT}`);
  if (!ODDS_API_KEY) {
    console.log('WARNING: No ODDS_API_KEY set. Get a free key at https://the-odds-api.com');
  }
});
