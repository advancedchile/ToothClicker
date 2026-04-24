// Cloud leaderboard — JSONBin.io client
const JSONBIN_BIN_ID   = '69e79801856a68218959a10f';
const JSONBIN_MASTER   = '$2a$10$c1P3XEJLxsQ83eFVV3nyB.EpOzx1Lc3hhz4KE555OMYMvTz7.ZBCa';
const JSONBIN_BASE     = 'https://api.jsonbin.io/v3/b/' + JSONBIN_BIN_ID;
const JSONBIN_LATEST   = JSONBIN_BASE + '/latest';

async function cloudFetchLeaderboard() {
  try {
    const res = await fetch(JSONBIN_LATEST, { method: 'GET', headers: { 'X-Master-Key': JSONBIN_MASTER, 'X-Bin-Meta': 'false' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const record = data && data.record !== undefined ? data.record : data;
    const scores = (record && record.scores) || [];
    scores.sort((a, b) => {
      if ((b.prestige || 0) !== (a.prestige || 0)) return (b.prestige || 0) - (a.prestige || 0);
      return (b.totalEarned || 0) - (a.totalEarned || 0);
    });
    return { ok: true, scores };
  } catch (e) { return { ok: false, error: e.message || 'network', scores: [] }; }
}

let _writeInFlight = null;

async function cloudSubmitScore(entry) {
  if (!entry || !entry.name) return { ok: false, error: 'no-name' };
  const run = async () => {
    try {
      const getRes = await fetch(JSONBIN_LATEST, { method: 'GET', headers: { 'X-Master-Key': JSONBIN_MASTER, 'X-Bin-Meta': 'false' } });
      if (!getRes.ok) throw new Error('GET ' + getRes.status);
      const getData = await getRes.json();
      const record = getData && getData.record !== undefined ? getData.record : getData;
      let scores = (record && Array.isArray(record.scores)) ? [...record.scores] : [];
      const lower = entry.name.toLowerCase();
      const idx = scores.findIndex(s => (s.name || '').toLowerCase() === lower);
      const merged = {
        name: entry.name,
        totalEarned: Math.max(entry.totalEarned || 0, idx >= 0 ? (scores[idx].totalEarned || 0) : 0),
        prestige: Math.max(entry.prestige || 0, idx >= 0 ? (scores[idx].prestige || 0) : 0),
        timePlayed: Math.max(entry.timePlayed || 0, idx >= 0 ? (scores[idx].timePlayed || 0) : 0),
        teeth: entry.teeth || 0, updatedAt: Date.now(),
      };
      if (idx >= 0) scores[idx] = merged; else scores.push(merged);
      scores.sort((a, b) => { if ((b.prestige||0) !== (a.prestige||0)) return (b.prestige||0)-(a.prestige||0); return (b.totalEarned||0)-(a.totalEarned||0); });
      scores = scores.slice(0, 500);
      const putRes = await fetch(JSONBIN_BASE, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_MASTER }, body: JSON.stringify({ scores }) });
      if (!putRes.ok) throw new Error('PUT ' + putRes.status);
      return { ok: true, scores };
    } catch (e) { return { ok: false, error: e.message || 'network' }; }
  };
  if (_writeInFlight) _writeInFlight = _writeInFlight.then(run, run); else _writeInFlight = run();
  const result = await _writeInFlight;
  setTimeout(() => { if (_writeInFlight) _writeInFlight = null; }, 0);
  return result;
}

async function cloudDeleteScore(name) {
  if (!name) return { ok: false, error: 'no-name' };
  const run = async () => {
    try {
      const getRes = await fetch(JSONBIN_LATEST, { method: 'GET', headers: { 'X-Master-Key': JSONBIN_MASTER, 'X-Bin-Meta': 'false' } });
      if (!getRes.ok) throw new Error('GET ' + getRes.status);
      const getData = await getRes.json();
      const record = getData && getData.record !== undefined ? getData.record : getData;
      let scores = (record && Array.isArray(record.scores)) ? [...record.scores] : [];
      const lower = name.toLowerCase();
      scores = scores.filter(s => (s.name || '').toLowerCase() !== lower);
      const putRes = await fetch(JSONBIN_BASE, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_MASTER }, body: JSON.stringify({ scores }) });
      if (!putRes.ok) throw new Error('PUT ' + putRes.status);
      return { ok: true };
    } catch (e) { return { ok: false, error: e.message || 'network' }; }
  };
  if (_writeInFlight) _writeInFlight = _writeInFlight.then(run, run); else _writeInFlight = run();
  const result = await _writeInFlight;
  setTimeout(() => { if (_writeInFlight) _writeInFlight = null; }, 0);
  return result;
}

async function cloudResetAll() {
  try {
    const putRes = await fetch(JSONBIN_BASE, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_MASTER }, body: JSON.stringify({ scores: [] }) });
    if (!putRes.ok) throw new Error('PUT ' + putRes.status);
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message || 'network' }; }
}

Object.assign(window, { cloudFetchLeaderboard, cloudSubmitScore, cloudDeleteScore, cloudResetAll });
