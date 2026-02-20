const express = require('express');
const https = require('https');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const SETTINGS_FILE = path.join(__dirname, 'settings.json');
const TEAM_CACHE_FILE = path.join(__dirname, 'team-cache.json');

// --- File helpers ---
function loadJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// --- Apollo API ---
function apolloRequest(method, apiPath, apiKey, params = {}, body = null) {
  return new Promise((resolve, reject) => {
    const qs = Object.entries(params)
      .filter(([, v]) => v != null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
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

// --- Helpers ---
function normalizeDomain(d) {
  if (!d) return '';
  return d
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
    .trim();
}

function isCompanyMatch(a, b) {
  if (!a || !b) return false;
  a = a.toLowerCase().trim();
  b = b.toLowerCase().trim();
  if (a === b) return true;
  const strip = s =>
    s
      .replace(
        /\b(inc|llc|ltd|corp|corporation|co|company|group|holdings|technologies|technology|tech|software|services|solutions)\b\.?/gi,
        ''
      )
      .replace(/[.,]/g, '')
      .trim();
  const sa = strip(a);
  const sb = strip(b);
  if (sa.length >= 3 && sb.length >= 3) {
    if (sa === sb) return true;
    if (sa.includes(sb) || sb.includes(sa)) return true;
  }
  return false;
}

// --- Sync state ---
let syncStatus = { active: false, fetched: 0, total: 0, error: null };

// --- Express setup ---
app.use(express.json());
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
app.use(express.static(path.join(__dirname, 'public'), { etag: false }));

// ==================== SETTINGS ====================

app.get('/api/settings', (req, res) => {
  const s = loadJSON(SETTINGS_FILE, {});
  res.json({
    hasApiKey: !!s.apiKey,
    maskedKey: s.apiKey ? s.apiKey.slice(0, 8) + '...' + s.apiKey.slice(-4) : '',
    companyDomain: s.companyDomain || '',
  });
});

app.post('/api/settings', (req, res) => {
  const s = loadJSON(SETTINGS_FILE, {});
  if (req.body.apiKey !== undefined) s.apiKey = req.body.apiKey.trim();
  if (req.body.companyDomain !== undefined)
    s.companyDomain = normalizeDomain(req.body.companyDomain);
  saveJSON(SETTINGS_FILE, s);
  res.json({ success: true });
});

// ==================== TEAM SYNC ====================

app.get('/api/team/status', (req, res) => {
  const cache = loadJSON(TEAM_CACHE_FILE, {});
  res.json({
    syncing: syncStatus.active,
    fetched: syncStatus.fetched,
    total: syncStatus.total,
    error: syncStatus.error,
    lastSync: cache.lastSync || null,
    teamSize: (cache.people || []).length,
    companyDomain: cache.companyDomain || '',
  });
});

app.post('/api/team/sync', (req, res) => {
  if (syncStatus.active) return res.status(409).json({ error: 'Sync already in progress' });

  const s = loadJSON(SETTINGS_FILE, {});
  if (!s.apiKey) return res.status(400).json({ error: 'Set your Apollo API key first' });
  if (!s.companyDomain) return res.status(400).json({ error: 'Set your company domain first' });

  syncStatus = { active: true, fetched: 0, total: 0, error: null };
  res.json({ started: true });

  // Run sync in background
  (async () => {
    try {
      const people = [];
      let page = 1;
      let totalPages = 1;

      while (page <= totalPages && page <= 100) {
        const { status, data } = await apolloRequest(
          'POST',
          '/api/v1/mixed_people/api_search',
          s.apiKey,
          {},
          {
            q_organization_domains: s.companyDomain,
            page,
            per_page: 100,
          }
        );

        if (status !== 200) {
          throw new Error(`Apollo returned HTTP ${status}: ${JSON.stringify(data).slice(0, 200)}`);
        }

        const pagination = data.pagination || {};
        totalPages = Math.min(pagination.total_pages || 1, 100);
        syncStatus.total = pagination.total_entries || 0;

        if (data.people && data.people.length) {
          people.push(...data.people);
          syncStatus.fetched = people.length;
        } else {
          break;
        }

        page++;
        // Respect rate limits
        await new Promise(r => setTimeout(r, 300));
      }

      saveJSON(TEAM_CACHE_FILE, {
        lastSync: new Date().toISOString(),
        companyDomain: s.companyDomain,
        people: people.map(p => ({
          id: p.id,
          name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim(),
          firstName: p.first_name,
          lastName: p.last_name,
          title: p.title,
          email: p.email,
          linkedinUrl: p.linkedin_url,
          photoUrl: p.photo_url,
          city: p.city,
          state: p.state,
          country: p.country,
          headline: p.headline,
          seniority: p.seniority,
          departments: p.departments,
          employmentHistory: (p.employment_history || []).map(e => ({
            orgName: e.organization_name,
            orgId: e.organization_id,
            title: e.title,
            startDate: e.start_date,
            endDate: e.end_date,
            current: e.current,
          })),
        })),
      });

      syncStatus = { active: false, fetched: people.length, total: people.length, error: null };
      console.log(`Team sync complete: ${people.length} people cached`);
    } catch (err) {
      syncStatus = { ...syncStatus, active: false, error: err.message };
      console.error('Sync error:', err.message);
    }
  })();
});

// ==================== SEARCH ====================

app.post('/api/search', async (req, res) => {
  const query = (req.body.query || '').trim();
  if (!query) return res.status(400).json({ error: 'Enter a company domain, email, or LinkedIn URL' });

  const s = loadJSON(SETTINGS_FILE, {});
  if (!s.apiKey) return res.status(400).json({ error: 'Set your Apollo API key first' });

  const cache = loadJSON(TEAM_CACHE_FILE, {});
  if (!cache.people || !cache.people.length) {
    return res.status(400).json({ error: 'Sync your team first before searching' });
  }

  try {
    let targetDomain = '';
    let targetName = '';
    let targetPerson = null;
    let targetOrg = null;
    let targetOrgId = null;
    let inputType = 'domain';

    // --- Resolve target ---
    if (query.includes('linkedin.com')) {
      inputType = 'linkedin';
      const { status, data } = await apolloRequest('POST', '/api/v1/people/match', s.apiKey, {
        linkedin_url: query,
      });
      if (status === 200 && data.person) {
        targetPerson = data.person;
        targetName = data.person.organization?.name || '';
        targetDomain = normalizeDomain(
          data.person.organization?.primary_domain ||
            data.person.organization?.website_url ||
            ''
        );
        targetOrgId = data.person.organization?.id;
        targetOrg = data.person.organization;
      }
    } else if (query.includes('@')) {
      inputType = 'email';
      const { status, data } = await apolloRequest('POST', '/api/v1/people/match', s.apiKey, {
        email: query,
      });
      if (status === 200 && data.person) {
        targetPerson = data.person;
        targetName = data.person.organization?.name || '';
        targetDomain = normalizeDomain(
          data.person.organization?.primary_domain ||
            data.person.organization?.website_url ||
            ''
        );
        targetOrgId = data.person.organization?.id;
        targetOrg = data.person.organization;
      }
    } else {
      targetDomain = normalizeDomain(query);
      const { status, data } = await apolloRequest(
        'GET',
        '/api/v1/organizations/enrich',
        s.apiKey,
        { domain: targetDomain }
      );
      if (status === 200 && data.organization) {
        targetName = data.organization.name || '';
        targetOrgId = data.organization.id;
        targetOrg = data.organization;
      }
    }

    if (!targetDomain && !targetName) {
      return res.json({
        connections: [],
        reverseConnections: [],
        target: null,
        message: 'Could not identify the target company. Try a different input.',
      });
    }

    // --- Search cached team for connections ---
    const connections = [];
    const domainBase = targetDomain ? targetDomain.split('.')[0] : '';

    for (const person of cache.people) {
      const matchingJobs = [];

      for (const job of person.employmentHistory || []) {
        // Skip their current job (that's at OUR company)
        if (job.current) continue;

        let matched = false;

        // Match by Apollo org ID
        if (targetOrgId && job.orgId && job.orgId === targetOrgId) matched = true;

        // Match by company name
        if (!matched && targetName && isCompanyMatch(job.orgName, targetName)) matched = true;

        // Match by domain base (e.g., "microsoft" from "microsoft.com")
        if (!matched && domainBase && domainBase.length >= 4) {
          const jobOrgLower = (job.orgName || '').toLowerCase();
          if (jobOrgLower.includes(domainBase)) matched = true;
        }

        if (matched) matchingJobs.push(job);
      }

      if (matchingJobs.length > 0) {
        connections.push({
          person: {
            name: person.name,
            title: person.title,
            email: person.email,
            linkedinUrl: person.linkedinUrl,
            photoUrl: person.photoUrl,
            location: [person.city, person.state, person.country].filter(Boolean).join(', '),
            seniority: person.seniority,
          },
          matches: matchingJobs.map(m => ({
            role: m.title,
            company: m.orgName,
            startDate: m.startDate,
            endDate: m.endDate,
          })),
        });
      }
    }

    // --- Reverse search: people at target company who used to work at our company ---
    const reverseConnections = [];
    try {
      const searchBody = {};
      if (targetDomain) searchBody.q_organization_domains = targetDomain;
      else if (targetName) searchBody.q_organization_name = targetName;
      searchBody.page = 1;
      searchBody.per_page = 100;

      const { status, data: revData } = await apolloRequest(
        'POST',
        '/api/v1/mixed_people/api_search',
        s.apiKey,
        {},
        searchBody
      );

      if (status === 200 && revData.people) {
        const ourDomain = normalizeDomain(s.companyDomain);
        const ourBase = ourDomain ? ourDomain.split('.')[0] : '';

        // Try to determine our company name from cached data
        let ourCompanyName = '';
        for (const p of cache.people) {
          const currentJob = (p.employmentHistory || []).find(e => e.current);
          if (currentJob && currentJob.orgName) {
            ourCompanyName = currentJob.orgName;
            break;
          }
        }

        for (const person of revData.people) {
          for (const job of person.employment_history || []) {
            if (job.current) continue;

            let matched = false;
            const jobOrg = (job.organization_name || '').toLowerCase();

            if (ourBase && ourBase.length >= 4 && jobOrg.includes(ourBase)) matched = true;
            if (!matched && ourCompanyName && isCompanyMatch(job.organization_name, ourCompanyName))
              matched = true;

            if (matched) {
              reverseConnections.push({
                person: {
                  name:
                    person.name ||
                    `${person.first_name || ''} ${person.last_name || ''}`.trim(),
                  title: person.title,
                  linkedinUrl: person.linkedin_url,
                  photoUrl: person.photo_url,
                  location: [person.city, person.state, person.country]
                    .filter(Boolean)
                    .join(', '),
                },
                matches: [
                  {
                    role: job.title,
                    company: job.organization_name,
                    startDate: job.start_date,
                    endDate: job.end_date,
                  },
                ],
              });
              break;
            }
          }
        }
      }
    } catch (e) {
      console.error('Reverse search failed:', e.message);
    }

    // --- Build response ---
    res.json({
      connections,
      reverseConnections,
      target: {
        domain: targetDomain,
        name: targetName,
        person: targetPerson
          ? {
              name: `${targetPerson.first_name || ''} ${targetPerson.last_name || ''}`.trim(),
              title: targetPerson.title,
              email: targetPerson.email,
              linkedinUrl: targetPerson.linkedin_url,
            }
          : null,
        org: targetOrg
          ? {
              name: targetOrg.name,
              industry: targetOrg.industry,
              employeeCount: targetOrg.estimated_num_employees,
              city: targetOrg.city,
              state: targetOrg.state,
              country: targetOrg.country,
              logoUrl: targetOrg.logo_url,
              websiteUrl: targetOrg.website_url,
            }
          : null,
      },
      inputType,
      teamSize: cache.people.length,
      hasEmploymentData: cache.people.some(
        p => p.employmentHistory && p.employmentHistory.length > 1
      ),
    });
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Catch-all for unknown /api routes
app.use('/api', (req, res) => res.status(404).json({ error: 'Unknown API endpoint' }));

app.listen(PORT, () => {
  console.log(`Connection Finder running at http://localhost:${PORT}`);
  const s = loadJSON(SETTINGS_FILE, {});
  console.log(`Apollo API key: ${s.apiKey ? 'configured' : 'not set'}`);
  console.log(`Company domain: ${s.companyDomain || 'not set'}`);
});
