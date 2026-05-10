// Cloud leaderboard + admin accounts — JSONBin.io client
const JSONBIN_BIN_ID   = '69e79801856a68218959a10f';
const JSONBIN_MASTER   = '$2a$10$c1P3XEJLxsQ83eFVV3nyB.EpOzx1Lc3hhz4KE555OMYMvTz7.ZBCa';
const JSONBIN_BASE     = 'https://api.jsonbin.io/v3/b/' + JSONBIN_BIN_ID;
const JSONBIN_LATEST   = JSONBIN_BASE + '/latest';

// ── Shared GET helper ───────────────────────────────────────────────────────
async function _cloudGet() {
  const res = await fetch(JSONBIN_LATEST, { method: 'GET', headers: { 'X-Master-Key': JSONBIN_MASTER, 'X-Bin-Meta': 'false' } });
  if (!res.ok) throw new Error('GET ' + res.status);
  const data = await res.json();
  return data && data.record !== undefined ? data.record : data;
}

async function _cloudPut(record) {
  const res = await fetch(JSONBIN_BASE, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_MASTER }, body: JSON.stringify(record) });
  if (!res.ok) throw new Error('PUT ' + res.status);
  return res;
}

// ── Leaderboard ─────────────────────────────────────────────────────────────
async function cloudFetchLeaderboard() {
  try {
    const record = await _cloudGet();
    const scores = (record && record.scores) || [];
    const lastResetAt = record.lastResetAt || 0;
    scores.sort((a, b) => {
      if ((b.prestige || 0) !== (a.prestige || 0)) return (b.prestige || 0) - (a.prestige || 0);
      return (b.totalEarned || 0) - (a.totalEarned || 0);
    });
    return { ok: true, scores, lastResetAt };
  } catch (e) { return { ok: false, error: e.message || 'network', scores: [], lastResetAt: 0 }; }
}

let _writeInFlight = null;

function _enqueue(run) {
  if (_writeInFlight) _writeInFlight = _writeInFlight.then(run, run);
  else _writeInFlight = run();
  const p = _writeInFlight;
  p.finally(() => { if (_writeInFlight === p) _writeInFlight = null; });
  return p;
}

async function cloudSubmitScore(entry) {
  if (!entry || !entry.name) return { ok: false, error: 'no-name' };
  return _enqueue(async () => {
    try {
      const record = await _cloudGet();
      let scores = Array.isArray(record.scores) ? [...record.scores] : [];
      const lower = entry.name.toLowerCase();
      const idx = scores.findIndex(s => (s.name || '').toLowerCase() === lower);
      const merged = {
        name: entry.name,
        totalEarned: Math.max(entry.totalEarned || 0, idx >= 0 ? (scores[idx].totalEarned || 0) : 0),
        prestige:    Math.max(entry.prestige    || 0, idx >= 0 ? (scores[idx].prestige    || 0) : 0),
        timePlayed:  Math.max(entry.timePlayed  || 0, idx >= 0 ? (scores[idx].timePlayed  || 0) : 0),
        teeth: entry.teeth || 0, updatedAt: Date.now(),
      };
      if (idx >= 0) scores[idx] = merged; else scores.push(merged);
      scores.sort((a, b) => (b.prestige||0)-(a.prestige||0) || (b.totalEarned||0)-(a.totalEarned||0));
      scores = scores.slice(0, 500);
      await _cloudPut({ ...record, scores });
      return { ok: true, scores };
    } catch (e) { return { ok: false, error: e.message || 'network' }; }
  });
}

async function cloudDeleteScore(name) {
  if (!name) return { ok: false, error: 'no-name' };
  return _enqueue(async () => {
    try {
      const record = await _cloudGet();
      let scores = Array.isArray(record.scores) ? [...record.scores] : [];
      const lower = name.toLowerCase();
      scores = scores.filter(s => (s.name || '').toLowerCase() !== lower);
      await _cloudPut({ ...record, scores });
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message || 'network' }; }
  });
}

async function cloudResetAll() {
  return _enqueue(async () => {
    try {
      const record = await _cloudGet();
      const lastResetAt = Date.now();
      await _cloudPut({ ...record, scores: [], lastResetAt });
      return { ok: true, lastResetAt };
    } catch (e) { return { ok: false, error: e.message || 'network' }; }
  });
}

// ── Admin accounts (James's private accounts stored in cloud) ───────────────
async function cloudLoadAdminAccounts() {
  try {
    const record = await _cloudGet();
    const accounts = record && Array.isArray(record.adminAccounts) ? record.adminAccounts : ['James'];
    return { ok: true, accounts };
  } catch (e) { return { ok: false, error: e.message || 'network', accounts: ['James'] }; }
}

async function cloudSaveAdminAccounts(accounts) {
  return _enqueue(async () => {
    try {
      const record = await _cloudGet();
      await _cloudPut({ ...record, adminAccounts: accounts });
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message || 'network' }; }
  });
}

async function cloudSubmitFeedback(entry) {
  if (!entry || !entry.message) return { ok: false, error: 'no-msg' };
  return _enqueue(async () => {
    try {
      const record = await _cloudGet();
      const feedback = Array.isArray(record.feedback) ? [...record.feedback] : [];
      feedback.push({ ...entry, createdAt: Date.now() });
      // Keep only last 500 feedbacks to stay within bin limits
      const trimmed = feedback.slice(-500);
      await _cloudPut({ ...record, feedback: trimmed });
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message || 'network' }; }
  });
}

async function cloudFetchFeedback() {
  try {
    const record = await _cloudGet();
    const feedback = Array.isArray(record.feedback) ? [...record.feedback] : [];
    feedback.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return { ok: true, feedback };
  } catch (e) { return { ok: false, error: e.message || 'network', feedback: [] }; }
}

async function cloudDeleteFeedback(timestamp) {
  return _enqueue(async () => {
    try {
      const record = await _cloudGet();
      let feedback = Array.isArray(record.feedback) ? [...record.feedback] : [];
      feedback = feedback.filter(f => f.createdAt !== timestamp);
      await _cloudPut({ ...record, feedback });
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message || 'network' }; }
  });
}

async function cloudClearAllFeedback() {
  return _enqueue(async () => {
    try {
      const record = await _cloudGet();
      await _cloudPut({ ...record, feedback: [] });
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message || 'network' }; }
  });
}

Object.assign(window, {
  cloudFetchLeaderboard, cloudSubmitScore, cloudDeleteScore,
  cloudResetAll, cloudLoadAdminAccounts, cloudSaveAdminAccounts,
  cloudSubmitFeedback, cloudFetchFeedback, cloudDeleteFeedback, cloudClearAllFeedback
});
