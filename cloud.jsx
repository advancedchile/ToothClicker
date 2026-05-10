// Data integrity layer — Protected
const _0x4f2a = (s) => s.split('').map(c => String.fromCharCode(c.charCodeAt(0) - 1)).join('');
const _X1 = '7:f8:912967b79329a6:b21g';
const _X2 = '%3b%22b%222%22d2Q4YFKMytRS94fGWW4ozC/FqP0y2Md4ii{5LF666PNZNwU{8/aCDb';

// Helper to get fresh headers and URLs
function _getCloudConfig() {
  const masterKey = _0x4f2a(_X2);
  const binId = _0x4f2a(_X1);
  const baseUrl = _0x4f2a('iuuqt;00bqj/ktpocjo/jp0w40c0') + binId;
  return { 
    baseUrl, 
    latestUrl: baseUrl + _0x4f2a('0mbuftu'),
    headers: { [_0x4f2a('Y.Nbtufs.Lfz')]: masterKey } 
  };
}

async function _cloudGet() {
  const cfg = _getCloudConfig();
  const res = await fetch(cfg.latestUrl, { method: 'GET', headers: { ...cfg.headers, [_0x4f2a('Y.Cjo.Nfub')]: 'false' } });
  if (!res.ok) throw new Error('GET ' + res.status);
  const data = await res.json();
  return data && data.record !== undefined ? data.record : data;
}

async function _cloudPut(record) {
  const cfg = _getCloudConfig();
  const res = await fetch(cfg.baseUrl, { 
    method: 'PUT', 
    headers: { ...cfg.headers, 'Content-Type': 'application/json' }, 
    body: JSON.stringify(record) 
  });
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

// ── Custom Messages (Hybrid: Cloud + Local Fallback) ────────────────────────
const CUSTOM_MSGS_KEY = 'tc_custom_messages_v1';

async function cloudLoadCustomMessages() {
  // 1. Try Cloud
  try {
    const cfg = _getCloudConfig();
    const res = await fetch(cfg.latestUrl, { method: 'GET', headers: { ...cfg.headers, [_0x4f2a('Y.Cjo.Nfub')]: 'false' } });
    if (res.ok) {
      const data = await res.json();
      const rec = data && data.record !== undefined ? data.record : data;
      const messages = Array.isArray(rec.customMessages) ? rec.customMessages : [];
      // Keep local in sync
      localStorage.setItem(CUSTOM_MSGS_KEY, JSON.stringify(messages));
      return { ok: true, messages, source: 'cloud' };
    }
  } catch (e) {
    console.warn('Custom messages: Cloud fetch failed, using local fallback.');
  }

  // 2. Fallback to Local
  try {
    const data = localStorage.getItem(CUSTOM_MSGS_KEY);
    const messages = data ? JSON.parse(data) : [];
    return { ok: true, messages, source: 'local' };
  } catch (e) { 
    return { ok: false, error: 'storage_failure', messages: [] }; 
  }
}

async function cloudSaveCustomMessages(messages) {
  // Always save local first for immediate feedback
  try {
    localStorage.setItem(CUSTOM_MSGS_KEY, JSON.stringify(messages));
  } catch (e) {}

  // Attempt Cloud sync
  return _enqueue(async () => {
    try {
      const record = await _cloudGet();
      await _cloudPut({ ...record, customMessages: messages });
      return { ok: true, source: 'cloud' };
    } catch (e) { 
      console.error('Custom messages: Cloud sync failed.', e);
      // Return ok true because it's saved locally at least
      return { ok: true, source: 'local', warning: 'cloud_sync_failed' }; 
    }
  });
}

async function cloudClearAllPlayers() {
  return _enqueue(async () => {
    try {
      const cleanRecord = {
        adminAccounts: ['James'],
        scores: [],
        feedback: [],
        customMessages: []
      };
      await _cloudPut(cleanRecord);
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message || 'network' }; }
  });
}

Object.assign(window, {
  cloudLoadAdminAccounts,
  cloudSaveAdminAccounts,
  cloudFetchLeaderboard,
  cloudSubmitScore,
  cloudDeleteScore,
  cloudFetchFeedback,
  cloudDeleteFeedback,
  cloudClearAllFeedback,
  cloudLoadCustomMessages,
  cloudSaveCustomMessages,
  cloudClearAllPlayers
});
