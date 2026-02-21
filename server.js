const express = require('express');
const https = require('https');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const SETTINGS_FILE = path.join(__dirname, 'settings.json');

// --- File helpers ---
function loadJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

function saveJSON(file, data) {
  try { fs.writeFileSync(file, JSON.stringify(data, null, 2)); } catch { /* read-only fs */ }
}

// --- Configuration ---
function getConfig() {
  const file = loadJSON(SETTINGS_FILE, {});
  return {
    apiKey: process.env.APOLLO_API_KEY || file.apiKey || '',
    apiKeyFromEnv: !!process.env.APOLLO_API_KEY,
  };
}

// --- Apollo API ---
function apolloRequest(method, apiPath, apiKey, params = {}, body = null) {
  return new Promise((resolve, reject) => {
    // Build query string, supporting array values (e.g. organization_domains[]=x)
    const qsParts = [];
    for (const [k, v] of Object.entries(params)) {
      if (v == null || v === '') continue;
      if (Array.isArray(v)) {
        for (const item of v) {
          qsParts.push(`${encodeURIComponent(k)}[]=${encodeURIComponent(item)}`);
        }
      } else {
        qsParts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
      }
    }
    const qs = qsParts.join('&');
    const fullPath = qs ? `${apiPath}?${qs}` : apiPath;

    const options = {
      hostname: 'api.apollo.io',
      path: fullPath,
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          reject(new Error('Invalid JSON from Apollo API'));
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function normalizeDomain(d) {
  if (!d) return '';
  return d
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
    .trim();
}

// --- Express setup ---
app.use(express.json());
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
app.use(express.static(path.join(__dirname, 'public'), { etag: false }));

// ==================== SETTINGS ====================

app.get('/api/settings', (req, res) => {
  const cfg = getConfig();
  res.json({
    hasApiKey: !!cfg.apiKey,
    maskedKey: cfg.apiKey ? cfg.apiKey.slice(0, 8) + '...' + cfg.apiKey.slice(-4) : '',
    apiKeyFromEnv: cfg.apiKeyFromEnv,
  });
});

app.post('/api/settings', (req, res) => {
  const cfg = getConfig();
  if (cfg.apiKeyFromEnv && req.body.apiKey !== undefined) {
    return res.status(400).json({ error: 'API key is configured via environment variable' });
  }
  const s = loadJSON(SETTINGS_FILE, {});
  if (req.body.apiKey !== undefined) s.apiKey = req.body.apiKey.trim();
  saveJSON(SETTINGS_FILE, s);
  res.json({ success: true });
});

// ==================== DOMAIN LOOKUP ====================

app.post('/api/lookup', async (req, res) => {
  const query = (req.body.domain || '').trim();
  if (!query) return res.status(400).json({ error: 'Enter a company domain' });

  const cfg = getConfig();
  if (!cfg.apiKey) return res.status(400).json({ error: 'Set your Apollo API key first' });

  const domain = normalizeDomain(query);

  try {
    // Step 1: Enrich the organization to get company info
    let org = null;
    try {
      const { status: orgStatus, data: orgData } = await apolloRequest(
        'GET',
        '/api/v1/organizations/enrich',
        cfg.apiKey,
        { domain }
      );
      if (orgStatus === 200 && orgData.organization) {
        org = orgData.organization;
      }
    } catch (e) {
      console.error('Org enrich failed:', e.message);
    }

    // Step 2: Search for people at this domain
    // Try multiple Apollo endpoints - different keys have access to different ones
    const people = [];
    let totalEntries = 0;
    let searchError = null;

    // Apollo search filters go as query params (with array syntax), not JSON body
    const endpoints = [
      { path: '/api/v1/mixed_people/search', params: { organization_domains: [domain], per_page: 100, page: 1 } },
      { path: '/api/v1/mixed_people/search', params: { q_organization_domains: domain, per_page: 100, page: 1 } },
    ];

    let workingEndpoint = null;

    for (const ep of endpoints) {
      try {
        const { status, data } = await apolloRequest('POST', ep.path, cfg.apiKey, ep.params);
        if (status === 200 && data.people && data.people.length > 0) {
          workingEndpoint = ep;
          const pagination = data.pagination || {};
          totalEntries = pagination.total_entries || 0;
          people.push(...data.people);

          // Fetch additional pages
          let page = 2;
          const maxPages = 5;
          while (page <= maxPages && page <= (pagination.total_pages || 1)) {
            const nextParams = { ...ep.params, page };
            const next = await apolloRequest('POST', ep.path, cfg.apiKey, nextParams);
            if (next.status === 200 && next.data.people && next.data.people.length) {
              people.push(...next.data.people);
            } else {
              break;
            }
            page++;
            await new Promise(r => setTimeout(r, 300));
          }
          break;
        }
        // If 403/401 or no results, try next endpoint variant
      } catch (e) {
        console.error(`Endpoint ${ep.path} failed:`, e.message);
      }
    }

    if (!workingEndpoint && people.length === 0) {
      searchError = 'People search is not available with your Apollo API key. Only company info is shown.';
    }

    res.json({
      org: org ? {
        name: org.name,
        domain: org.primary_domain || domain,
        industry: org.industry,
        employeeCount: org.estimated_num_employees,
        city: org.city,
        state: org.state,
        country: org.country,
        logoUrl: org.logo_url,
        websiteUrl: org.website_url,
        linkedinUrl: org.linkedin_url,
        description: org.short_description,
      } : null,
      people: people.map(p => ({
        name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim(),
        title: p.title,
        email: p.email,
        linkedinUrl: p.linkedin_url,
        photoUrl: p.photo_url,
        city: p.city,
        state: p.state,
        country: p.country,
        seniority: p.seniority,
        departments: p.departments,
      })),
      total: totalEntries,
      error: searchError,
    });
  } catch (err) {
    console.error('Lookup error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Catch-all for unknown /api routes
app.use('/api', (req, res) => res.status(404).json({ error: 'Unknown API endpoint' }));

// Global error handler - always return JSON, never HTML
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  const cfg = getConfig();
  console.log(`Company Lookup running on port ${PORT}`);
  console.log(`Apollo API key: ${cfg.apiKey ? 'configured' : 'not set'}${cfg.apiKeyFromEnv ? ' (env)' : ''}`);
});
