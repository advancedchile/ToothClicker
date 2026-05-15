// Supabase Integration — Tooth Clicker
const SB_URL = 'https://yildqfjmxmxjqlkvemuk.supabase.co';
const SB_KEY = 'sb_publishable_Uz80b3C37riyF9WXBcSFLw_p1TlFDj9';

const _supabase = typeof supabase !== 'undefined' ? supabase.createClient(SB_URL, SB_KEY) : null;

// ── Leaderboard ─────────────────────────────────────────────────────────────
async function cloudFetchLeaderboard() {
  try {
    if (!_supabase) throw new Error('Supabase not initialized');
    
    // Fetch scores
    const { data: players, error } = await _supabase
      .from('players')
      .select('*')
      .order('prestige_count', { ascending: false })
      .order('level', { ascending: false })
      .order('total_earned', { ascending: false })
      .limit(100);

    if (error) throw error;

    // Fetch last reset from settings
    const { data: setRes } = await _supabase.from('settings').select('value').eq('key', 'lastResetAt').single();
    const lastResetAt = setRes ? setRes.value : 0;

    // Map DB fields to app fields
    const scores = players.map(p => ({
      name: p.name,
      totalEarned: Number(p.total_earned || 0),
      prestige: Number(p.prestige || 0),
      prestigeCount: Number(p.prestige_count || 0),
      timePlayed: Number(p.time_played || 0),
      clinicName: p.clinic_name || '',
      level: Number(p.level || 0),
      teeth: Number(p.teeth || 0),
      updatedAt: new Date(p.updated_at).getTime(),
      banUntil: p.ban_until ? new Date(p.ban_until).getTime() : 0,
      banIndefinite: !!p.ban_indefinite,
      sessionId: p.session_id || (p.save_data ? p.save_data.sessionId : null)
    }));

    return { ok: true, scores, lastResetAt };
  } catch (e) { 
    console.error("Leaderboard fetch error:", e);
    return { ok: false, error: e.message || 'network', scores: [], lastResetAt: 0 }; 
  }
}

async function cloudSubmitScore(entry) {
  if (!entry || !entry.name || !_supabase) return { ok: false, error: 'invalid' };
  try {
    const row = {
      name: entry.name,
      total_earned: Math.floor(Number(entry.totalEarned || 0)),
      prestige: Math.floor(Number(entry.prestige || 0)),
      prestige_count: Math.floor(Number(entry.prestigeCount || 0)),
      time_played: Math.floor(Number(entry.timePlayed || 0)),
      clinic_name: (entry.clinicName && entry.clinicName.trim()) ? entry.clinicName.trim() : null,
      level: Math.floor(Number(entry.level || 0)),
      teeth: Math.floor(Number(entry.teeth || 0)),
      updated_at: new Date().toISOString()
    };
    // Optional fields — only include if they have real values
    if (entry.password) row.password = entry.password;
    if (entry.saveData) row.save_data = entry.saveData;
    if (entry.banUntil && entry.banUntil > 0) {
      row.ban_until = new Date(entry.banUntil).toISOString();
      row.ban_indefinite = entry.banUntil === -1;
    }
    if (entry.sessionId) row.session_id = entry.sessionId;

    const { error } = await _supabase.from('players').upsert(row, { onConflict: 'name' });

    if (error) {
      console.error("[Cloud] Upsert FAILED for", entry.name, ":", error);
      throw error;
    }
    console.log('[Cloud] Save OK for', entry.name, '| clinic:', row.clinic_name, '| prestige:', row.prestige_count, '| total:', row.total_earned);
    return { ok: true };
  } catch (e) { 
    console.error("[Cloud] Save EXCEPTION for", entry.name, ":", e);
    return { ok: false, error: e.message || 'network' }; 
  }
}

async function cloudAuthenticate(name, password) {
  try {
    if (!_supabase) throw new Error('No Supabase');
    const { data, error } = await _supabase
      .from('players')
      .select('*')
      .eq('name', name)
      .single();

    if (error) throw new Error('User not found');
    if (data.password && data.password !== password) throw new Error('Invalid password');
    
    // Generate a new session ID for this login
    const newSessionId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    // Update the player row with the new session and current stats (sync)
    const { error: updateError } = await _supabase.from('players').upsert({ 
      name: name,
      session_id: newSessionId,
      updated_at: new Date().toISOString()
    }, { onConflict: 'name' });

    if (updateError) console.error('[Cloud] Failed to update session ID:', updateError);

    // Return the full player data to sync the progress
    let sd = data.save_data;
    if (typeof sd === 'string') { try { sd = JSON.parse(sd); } catch(e) {} }

    return { 
      ok: true, 
      player: {
        ...data,
        saveData: sd,
        name: data.name,
        totalEarned: Number(data.total_earned || 0),
        prestige: Number(data.prestige || 0),
        prestigeCount: Number(data.prestige_count || 0),
        timePlayed: Number(data.time_played || 0),
        clinicName: data.clinic_name || null,
        level: Number(data.level || 0),
        teeth: Number(data.teeth || 0),
        banUntil: data.ban_until ? new Date(data.ban_until).getTime() : 0,
        banIndefinite: !!data.ban_indefinite,
        password: data.password,
        sessionId: newSessionId
      }
    };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function cloudRegister(name, password, initialData = {}) {
  try {
    if (!_supabase) throw new Error('No Supabase');
    const sessionId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const { error } = await _supabase.from('players').insert({
      name,
      password,
      total_earned: Math.floor(Number(initialData.totalEarned || 0)),
      prestige: Math.floor(Number(initialData.prestige || 0)),
      prestige_count: Math.floor(Number(initialData.prestigeCount || 0)),
      time_played: Math.floor(Number(initialData.timePlayed || 0)),
      clinic_name: initialData.clinicName || '',
      level: Math.floor(Number(initialData.level || 0)),
      teeth: Math.floor(Number(initialData.teeth || 0)),
      updated_at: new Date().toISOString(),
      save_data: { ...initialData, sessionId: sessionId }
    });
    if (error) throw error;
    console.log('[Cloud] Register OK for', name);
    return { ok: true, sessionId };
  } catch (e) {
    console.error('[Cloud] Register FAILED for', name, ':', e);
    return { ok: false, error: e.message };
  }
}

async function cloudFetchPlayer(name) {
  try {
    if (!_supabase) throw new Error('No Supabase');
    const { data, error } = await _supabase.from('players').select('*').eq('name', name).single();
    if (error) throw error;
    
    let sd = data.save_data;
    if (typeof sd === 'string') { try { sd = JSON.parse(sd); } catch(e) {} }
    
    return { 
      ok: true, 
      player: {
        ...data,
        sessionId: data.session_id || (sd ? sd.sessionId : null)
      } 
    };
  } catch (e) { return { ok: false, error: e.message }; }
}

async function cloudDeleteScore(name) {
  try {
    if (!_supabase) return { ok: false };
    const { error } = await _supabase.from('players').delete().eq('name', name);
    if (error) throw error;
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
}

async function cloudResetAll() {
  try {
    if (!_supabase) return { ok: false };
    const lastResetAt = Date.now();
    await _supabase.from('players').delete().neq('name', 'James'); // Clear all but James
    await _supabase.from('settings').upsert({ key: 'lastResetAt', value: lastResetAt });
    return { ok: true, lastResetAt };
  } catch (e) { return { ok: false, error: e.message }; }
}

// ── Admin accounts ──────────────────────────────────────────────────────────
async function cloudLoadAdminAccounts() {
  try {
    if (!_supabase) return { ok: true, accounts: ['James'] };
    const { data, error } = await _supabase.from('admins').select('name');
    if (error) throw error;
    return { ok: true, accounts: data.map(a => a.name) };
  } catch (e) { return { ok: false, error: e.message, accounts: ['James'] }; }
}

async function cloudSaveAdminAccounts(accounts) {
  try {
    if (!_supabase) return { ok: false };
    await _supabase.from('admins').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    const { error } = await _supabase.from('admins').insert(accounts.map(name => ({ name })));
    if (error) throw error;
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
}

// ── Feedback ────────────────────────────────────────────────────────────────
async function cloudSubmitFeedback(entry) {
  try {
    if (!_supabase) return { ok: false };
    const { error } = await _supabase.from('feedback').insert({
      name: entry.name,
      message: entry.message,
      created_at: new Date().toISOString()
    });
    if (error) throw error;
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
}

async function cloudFetchFeedback() {
  try {
    if (!_supabase) return { ok: true, feedback: [] };
    const { data, error } = await _supabase.from('feedback').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return { ok: true, feedback: data.map(f => ({ ...f, createdAt: new Date(f.created_at).getTime() })) };
  } catch (e) { return { ok: false, error: e.message, feedback: [] }; }
}

async function cloudDeleteFeedback(timestamp) {
  try {
    if (!_supabase) return { ok: false };
    const { error } = await _supabase.from('feedback').delete().eq('created_at', new Date(timestamp).toISOString());
    if (error) throw error;
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
}

// ── Custom Messages ─────────────────────────────────────────────────────────
async function cloudLoadCustomMessages() {
  try {
    if (!_supabase) throw new Error('No Supabase');
    const { data, error } = await _supabase.from('custom_messages').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    const messages = data.map(m => ({
      name: m.name,
      text: m.text,
      milestone: m.milestone,
      color: m.color,
      createdAt: new Date(m.created_at).getTime()
    }));
    return { ok: true, messages, source: 'cloud' };
  } catch (e) {
    const local = localStorage.getItem('tc_custom_messages_v1');
    return { ok: true, messages: local ? JSON.parse(local) : [], source: 'local' };
  }
}

async function cloudSaveCustomMessages(messages) {
  try {
    localStorage.setItem('tc_custom_messages_v1', JSON.stringify(messages));
    if (!_supabase) return { ok: true, source: 'local' };
    
    await _supabase.from('custom_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { error } = await _supabase.from('custom_messages').insert(messages.map(m => ({
      name: m.name,
      text: m.text,
      milestone: m.milestone,
      color: m.color,
      created_at: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString()
    })));
    if (error) throw error;
    return { ok: true, source: 'cloud' };
  } catch (e) { return { ok: true, source: 'local', warning: e.message }; }
}

// ── Settings ────────────────────────────────────────────────────────────────
async function cloudFetchSettings() {
  try {
    if (!_supabase) return { ok: true, settings: { cpsThreshold: 20 } };
    const { data, error } = await _supabase.from('settings').select('value').eq('key', 'global').single();
    if (error) throw error;
    return { ok: true, settings: data.value };
  } catch (e) { return { ok: false, error: e.message, settings: { cpsThreshold: 20 } }; }
}

async function cloudSaveSettings(settings) {
  try {
    if (!_supabase) return { ok: false };
    const { error } = await _supabase.from('settings').upsert({ key: 'global', value: settings });
    if (error) throw error;
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
}

async function cloudClearAllPlayers() {
  try {
    if (!_supabase) return { ok: false };
    await _supabase.from('players').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await _supabase.from('admins').delete().neq('name', 'James');
    await _supabase.from('feedback').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await _supabase.from('custom_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
}

Object.assign(window, {
  cloudLoadAdminAccounts,
  cloudSaveAdminAccounts,
  cloudFetchLeaderboard,
  cloudSubmitScore,
  cloudDeleteScore,
  cloudFetchFeedback,
  cloudDeleteFeedback,
  cloudLoadCustomMessages,
  cloudSaveCustomMessages,
  cloudClearAllPlayers,
  cloudFetchSettings,
  cloudSaveSettings,
  cloudResetAll,
  cloudAuthenticate,
  cloudRegister,
  cloudFetchPlayer
});
