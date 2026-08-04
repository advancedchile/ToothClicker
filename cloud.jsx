// Supabase Integration — Tooth Clicker
const SB_URL = 'https://yildqfjmxmxjqlkvemuk.supabase.co';
const SB_KEY = 'sb_publishable_Uz80b3C37riyF9WXBcSFLw_p1TlFDj9';

const _supabase = typeof supabase !== 'undefined' ? supabase.createClient(SB_URL, SB_KEY) : null;

// Clean /assets/ to assets/ recursively for configurations
function sanitizePaths(obj) {
  if (typeof obj === 'string') {
    if (obj.startsWith('/assets/')) return obj.substring(1);
    return obj;
  } else if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      obj[i] = sanitizePaths(obj[i]);
    }
  } else if (obj !== null && typeof obj === 'object') {
    for (const k in obj) {
      obj[k] = sanitizePaths(obj[k]);
    }
  }
  return obj;
}

// ── Leaderboard ─────────────────────────────────────────────────────────────
async function cloudFetchLeaderboard() {
  try {
    if (!_supabase) throw new Error('Supabase not initialized');
    
    // Fetch scores with cache-buster
    const { data: players, error } = await _supabase
      .from('players')
      .select('*')
      .order('prestige_count', { ascending: false })
      .order('level', { ascending: false })
      .order('total_earned', { ascending: false })
      .neq('name', 'cache-buster-' + Date.now()) // Force unique query
      .limit(100);

    if (error) throw error;

    // Fetch last reset from settings
    const { data: setRes } = await _supabase.from('settings').select('value').eq('key', 'lastResetAt').single();
    const lastResetAt = setRes ? setRes.value : 0;

    // Map DB fields to app fields
    const scores = [];
    for (const p of players) {
      let sd = p.save_data || null;
      if (typeof sd === 'string') {
        try { sd = JSON.parse(sd); } catch(e) {}
      }

      // Security check: Verify signature for non-admin players
      if (p.name !== 'James' && p.name !== 'James2' && p.name !== 'admin') {
        if (sd && typeof sd === 'object' && '_sig' in sd) {
          if (sd._sig !== window.generateSig({ ...sd, name: p.name })) {
            console.warn('[Security] Filtered invalid signature for:', p.name);
            continue; 
          }
        }
      }

      scores.push({
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
        sessionId: sd ? sd.sessionId : null,
        isOnline: sd ? sd.isOnline : false,
        saveData: sd
      });
    }

    return { ok: true, scores, lastResetAt };
  } catch (e) { 
    console.error("Leaderboard fetch error:", e);
    return { ok: false, error: e.message || 'network', scores: [], lastResetAt: 0 }; 
  }
}

async function cloudSubmitScore(entry) {
  if (!entry || !entry.name || !_supabase) return { ok: false, error: 'invalid' };
  try {
    const { data, error } = await _supabase.rpc('secure_submit_score', {
      p_name: entry.name,
      p_password: entry.password || null,
      p_total_earned: Math.floor(Number(entry.totalEarned || 0)),
      p_prestige: Math.floor(Number(entry.prestige || 0)),
      p_prestige_count: Math.floor(Number(entry.prestigeCount || 0)),
      p_time_played: Math.floor(Number(entry.timePlayed || 0)),
      p_clinic_name: (entry.clinicName && entry.clinicName.trim()) ? entry.clinicName.trim() : null,
      p_level: Math.floor(Number(entry.level || 0)),
      p_teeth: Math.floor(Number(entry.teeth || 0)),
      p_save_data: entry.saveData || null,
      p_ban_until: (entry.banUntil && entry.banUntil > 0) ? new Date(entry.banUntil).toISOString() : null,
      p_ban_indefinite: (entry.banUntil === -1) ? true : null
    });

    if (error || (data && !data.ok)) {
      console.error("[Cloud] Upsert FAILED for", entry.name, ":", error || data.error);
      throw new Error(error ? error.message : data.error);
    }
    
    console.log('[Cloud] Save OK for', entry.name);
    return { ok: true };
  } catch (e) { 
    console.error("[Cloud] Save EXCEPTION for", entry.name, ":", e);
    return { ok: false, error: e.message || 'network' }; 
  }
}

async function cloudAuthenticate(name, password) {
  try {
    if (!_supabase) throw new Error('No Supabase');
    const newSessionId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    const { data: res, error } = await _supabase.rpc('secure_authenticate', {
      p_name: name,
      p_password: password,
      p_new_session_id: newSessionId
    });

    if (error) throw new Error(error.message);
    if (!res || !res.ok) throw new Error(res ? res.error : 'User not found');
    
    const data = res.player;

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
    
    const { data: res, error } = await _supabase.rpc('secure_register_player', {
      p_name: name,
      p_password: password,
      p_total_earned: Math.floor(Number(initialData.totalEarned || 0)),
      p_prestige: Math.floor(Number(initialData.prestige || 0)),
      p_prestige_count: Math.floor(Number(initialData.prestigeCount || 0)),
      p_time_played: Math.floor(Number(initialData.timePlayed || 0)),
      p_clinic_name: initialData.clinicName || '',
      p_level: Math.floor(Number(initialData.level || 0)),
      p_teeth: Math.floor(Number(initialData.teeth || 0)),
      p_save_data: { ...initialData, sessionId: sessionId }
    });
    
    if (error) throw new Error(error.message);
    if (!res || !res.ok) throw new Error(res ? res.error : 'Registro fallido');
    
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
        sessionId: sd ? sd.sessionId : null
      } 
    };
  } catch (e) { return { ok: false, error: e.message }; }
}

async function cloudDeleteScore(name, password = null, adminPassword = null) {
  try {
    if (!_supabase) return { ok: false };
    const { data: res, error } = await _supabase.rpc('secure_delete_score', {
      p_name: name,
      p_password: password,
      p_admin_password: adminPassword
    });
    if (error) throw new Error(error.message);
    if (!res || !res.ok) throw new Error(res ? res.error : 'Borrado fallido');
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
}

// ── Google Auth ─────────────────────────────────────────────────────────────
async function cloudLoginWithGoogle() {
  if (!_supabase) return { ok: false, error: 'No Supabase' };
  try {
    const { data, error } = await _supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname
      }
    });
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function cloudLinkGoogleAccount(name, password) {
  if (!_supabase) return { ok: false, error: 'No Supabase' };
  try {
    const { data, error } = await _supabase.rpc('secure_link_google_account', {
      p_name: name,
      p_password: password
    });
    if (error) throw new Error(error.message);
    if (!data || !data.ok) throw new Error(data ? data.error : 'Error al vincular');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function cloudFetchPlayerByAuth() {
  if (!_supabase) return { ok: false };
  try {
    const { data, error } = await _supabase.rpc('fetch_player_by_auth');
    if (error) throw error;
    if (!data || !data.ok) throw new Error(data ? data.error : 'Error fetching auth player');
    
    if (!data.found) return { ok: true, found: false };
    
    let p = data.player;
    let sd = p.save_data;
    if (typeof sd === 'string') { try { sd = JSON.parse(sd); } catch(e) {} }
    
    if (!sd) sd = {};
    sd.googleLinked = true;
    
    return { 
      ok: true, 
      found: true,
      player: {
        ...p,
        saveData: sd,
        name: p.name,
        totalEarned: Number(p.total_earned || 0),
        prestige: Number(p.prestige || 0),
        prestigeCount: Number(p.prestige_count || 0),
        timePlayed: Number(p.time_played || 0),
        clinicName: p.clinic_name || null,
        level: Number(p.level || 0),
        teeth: Number(p.teeth || 0),
        banUntil: p.ban_until ? new Date(p.ban_until).getTime() : 0,
        banIndefinite: !!p.ban_indefinite,
        password: p.password,
        sessionId: sd ? sd.sessionId : null
      }
    };
  } catch(e) { return { ok: false, error: e.message }; }
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
      name: entry.name || entry.username || 'Anónimo',
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
    const messages = data.map(m => {
      let rawText = m.text || '';
      let extraData = {};
      if (rawText.includes("||extra:")) {
        const parts = rawText.split("||extra:");
        rawText = parts[0];
        try { extraData = JSON.parse(parts[1]); } catch(e) {}
      }
      
      let cleanText = rawText;
      let image = null;
      let questionData = null;
      if (cleanText.includes("||question:")) {
        const parts = cleanText.split("||question:");
        cleanText = parts[0];
        try { questionData = JSON.parse(parts[1].split("||image:")[0]); } catch(e) {}
        // image may follow after question
        if (parts[1] && parts[1].includes("||image:")) {
          image = parts[1].split("||image:")[1] || null;
        }
      }
      if (!questionData && cleanText.includes("||image:")) {
        const parts = cleanText.split("||image:");
        cleanText = parts[0];
        image = parts[1] || null;
      }
      const msg = {
        id: m.id || Math.random().toString(36).substr(2, 9),
        who: m.name,
        text: cleanText,
        image: image,
        milestone: m.milestone,
        color: m.color,
        createdAt: new Date(m.created_at).getTime()
      };
      if (questionData) {
        msg.msgType = 'question';
        msg.questionAnswer = questionData.answer;
        msg.options = questionData.options;
        msg.correctOptionIndex = questionData.correctOptionIndex;
        msg.explanationText = questionData.explanationText;
        msg.correctReward = questionData.correctReward || { type: 'none', amount: 0 };
        msg.wrongReward = questionData.wrongReward || { type: 'none', amount: 0 };
      }
      msg.text = cleanText;
      msg.position = extraData.position || m.position;
      msg.size = extraData.size || m.size;
      msg.animation = extraData.animation || m.animation;
      msg.particles = extraData.particles || m.particles;
      msg.levelReq = extraData.levelReq || m.levelReq || 0;
      
      msg.ledBgColor = extraData.ledBgColor;
      msg.ledColor = extraData.ledColor;
      msg.ledBrightness = extraData.ledBrightness;
      msg.ledSpeed = extraData.ledSpeed;
      msg.ledDirection = extraData.ledDirection;
      msg.ledTextSize = extraData.ledTextSize;
      return msg;
    });
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
    const { error } = await _supabase.from('custom_messages').insert(messages.map(m => {
      let dbText = m.text || '';
      if (m.msgType === 'question') {
        dbText += '||question:' + JSON.stringify({
          answer: m.questionAnswer,
          options: m.options,
          correctOptionIndex: m.correctOptionIndex,
          explanationText: m.explanationText,
          correctReward: m.correctReward,
          wrongReward: m.wrongReward
        });
      }
      if (m.image) dbText += '||image:' + m.image;
      
      const extraData = {
        position: m.position,
        size: m.size,
        animation: m.animation,
        particles: m.particles,
        levelReq: m.levelReq,
        ledBgColor: m.ledBgColor,
        ledColor: m.ledColor,
        ledBrightness: m.ledBrightness,
        ledSpeed: m.ledSpeed,
        ledDirection: m.ledDirection,
        ledTextSize: m.ledTextSize
      };
      dbText += '||extra:' + JSON.stringify(extraData);

      return {
        name: m.name || m.who,
        text: dbText,
        milestone: m.milestone,
        color: m.color,
        created_at: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString()
      };
    }));
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

// ── Version Control settings ────────────────────────────────────────────────
async function cloudFetchVersionMetadata() {
  try {
    if (!_supabase) return { ok: true, history: [], latestSha: '' };
    const { data: vHist } = await _supabase.from('settings').select('value').eq('key', 'version_history').single();
    const { data: vSha } = await _supabase.from('settings').select('value').eq('key', 'latest_commit_sha').single();
    return {
      ok: true,
      history: vHist ? vHist.value : [],
      latestSha: vSha ? vSha.value : ''
    };
  } catch (e) {
    return { ok: false, error: e.message, history: [], latestSha: '' };
  }
}

async function cloudSaveVersionHistory(history, latestSha) {
  try {
    if (!_supabase) return { ok: false };
    const { error: err1 } = await _supabase.from('settings').upsert({ key: 'version_history', value: history });
    if (err1) throw err1;
    const { error: err2 } = await _supabase.from('settings').upsert({ key: 'latest_commit_sha', value: latestSha });
    if (err2) throw err2;
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

Object.assign(window, {
  cloudLoadAdminAccounts,
  cloudSaveAdminAccounts,
  cloudFetchLeaderboard,
  cloudSubmitScore,
  cloudDeleteScore,
  cloudLoginWithGoogle,
  cloudLinkGoogleAccount,
  cloudFetchPlayerByAuth,
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
  cloudFetchPlayer,
  cloudFetchVersionMetadata,
  cloudSaveVersionHistory
});

window.cloudFetchGameContent = async function() {
  try {
    if (!_supabase) return { ok: true, content: null };
    const { data, error } = await _supabase.from('settings').select('value').eq('key', 'game_content').single();
    if (error) {
      if (error.code === 'PGRST116') return { ok: true, content: null }; 
      return { ok: false, error: error.message };
    }
    
    if (data.value && data.value.useExternalTemplate && data.value.path) {
      // It's an external template! Fetch it.
      const res = await fetch(data.value.path);
      if (!res.ok) throw new Error("Failed to load external template from " + data.value.path);
      const content = await res.json();
      return { ok: true, content: content };
    }
    
    return { ok: true, content: data.value };
  } catch (e) {
    return { ok: false, error: e.message };
  }
};

window.cloudSaveGameContent = async function(content) {
  try {
    if (!_supabase) return { ok: false, error: 'No Supabase' };
    
    // Sanitize paths before saving to avoid leading slashes breaking GH Pages
    const sanitizedContent = sanitizePaths(JSON.parse(JSON.stringify(content)));
    
    const { error } = await _supabase.from('settings').upsert({ key: 'game_content', value: sanitizedContent });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
};

// ── Content Templates ──────────────────────────────────────────────────────────
window.cloudFetchTemplates = async function() {
  try {
    if (!_supabase) return { ok: true, templates: [] };
    const { data, error } = await _supabase.from('settings').select('value').eq('key', 'content_templates').single();
    if (error) {
      if (error.code === 'PGRST116') return { ok: true, templates: [] }; // no rows
      return { ok: false, error: error.message };
    }
    return { ok: true, templates: data.value || [] };
  } catch (e) {
    return { ok: false, error: e.message };
  }
};

window.cloudFetchTemplateContent = async function(id) {
  try {
    if (!_supabase) return { ok: true, content: null };

    // First, check if it's an external template to fetch from local file
    const { data: listData } = await _supabase.from('settings').select('value').eq('key', 'content_templates').single();
    if (listData && listData.value) {
      const templateMeta = listData.value.find(t => t.id === id);
      if (templateMeta && templateMeta.isExternal && templateMeta.path) {
        // Fetch from local path with a cache buster
        const res = await fetch(`${templateMeta.path}?t=${Date.now()}`);
        if (res.ok) {
          const content = await res.json();
          return { ok: true, content };
        }
        console.warn(`Could not fetch external template from ${templateMeta.path}, falling back to Supabase...`);
      }
    }

    const { data, error } = await _supabase.from('settings').select('value').eq('key', 'template_' + id).single();
    if (error) {
      if (error.code === 'PGRST116') return { ok: true, content: null }; 
      return { ok: false, error: error.message };
    }
    return { ok: true, content: data.value };
  } catch (e) {
    return { ok: false, error: e.message };
  }
};

window.cloudSaveTemplate = async function(id, name, content) {
  try {
    if (!_supabase) return { ok: false, error: 'No Supabase' };
    
    // Sanitize paths before saving
    const sanitizedContent = sanitizePaths(JSON.parse(JSON.stringify(content)));

    // Save content
    const { error: err1 } = await _supabase.from('settings').upsert({ key: 'template_' + id, value: sanitizedContent });
    if (err1) throw err1;

    // 2. Update metadata in the list
    let templates = [];
    const { data: listData, error: listErr } = await _supabase.from('settings').select('value').eq('key', 'content_templates').single();
    if (!listErr && listData) templates = listData.value || [];

    const existingIndex = templates.findIndex(t => t.id === id);
    if (existingIndex >= 0) {
      templates[existingIndex].name = name;
      templates[existingIndex].updatedAt = Date.now();
      templates[existingIndex].isExternal = false;
      delete templates[existingIndex].path;
    } else {
      templates.push({ id, name, createdAt: Date.now(), updatedAt: Date.now() });
    }

    const { error: err2 } = await _supabase.from('settings').upsert({ key: 'content_templates', value: templates });
    if (err2) throw err2;

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
};

window.cloudRegisterExternalTemplate = async function(id, name, path) {
  try {
    if (!_supabase) return { ok: false, error: 'No Supabase' };
    
    let templates = [];
    const { data: listData, error: listErr } = await _supabase.from('settings').select('value').eq('key', 'content_templates').single();
    if (!listErr && listData) templates = listData.value || [];

    const existingIndex = templates.findIndex(t => t.id === id);
    if (existingIndex >= 0) {
      templates[existingIndex].name = name;
      templates[existingIndex].path = path;
      templates[existingIndex].isExternal = true;
      templates[existingIndex].updatedAt = Date.now();
    } else {
      templates.push({ id, name, path, isExternal: true, createdAt: Date.now(), updatedAt: Date.now() });
    }

    const { error: err2 } = await _supabase.from('settings').upsert({ key: 'content_templates', value: templates });
    if (err2) throw err2;

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
};

window.cloudDeleteTemplate = async function(id) {
  try {
    if (!_supabase) return { ok: false, error: 'No Supabase' };
    
    // Delete content
    await _supabase.from('settings').delete().eq('key', 'template_' + id);

    // Update list
    let templates = [];
    const { data: listData, error: listErr } = await _supabase.from('settings').select('value').eq('key', 'content_templates').single();
    if (!listErr && listData) templates = listData.value || [];
    
    templates = templates.filter(t => t.id !== id);
    await _supabase.from('settings').upsert({ key: 'content_templates', value: templates });

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
};

window.cloudPublishTemplate = async function(id, templateContent) {
  try {
    if (!_supabase) return { ok: false, error: 'No Supabase' };
    
    // 1. Fetch current live game content
    const { data: liveData } = await _supabase.from('settings').select('value').eq('key', 'game_content').single();
    const liveContent = liveData ? liveData.value : null;

    // 2. Fetch all players (pagination just in case)
    let allPlayers = [];
    let page = 0;
    const pageSize = 1000;
    while (true) {
      const { data: players, error: errPlayers } = await _supabase
        .from('players')
        .select('*')
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (errPlayers) throw errPlayers;
      if (!players || players.length === 0) break;
      allPlayers = allPlayers.concat(players);
      if (players.length < pageSize) break;
      page++;
    }

    // 3. Save to archive
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveKey = 'archive_' + timestamp;
    const archivePayload = {
      timestamp: Date.now(),
      templateId: id,
      oldContent: liveContent,
      players: allPlayers
    };
    
    const { error: errArchive } = await _supabase.from('settings').upsert({ key: archiveKey, value: archivePayload });
    if (errArchive) throw errArchive;

    // 4. Overwrite game content with template content (or external pointer)
    const newGameContent = templateContent.isExternalPointer ? templateContent.pointerObj : templateContent;
    
    // Inject the template ID into the game content so admin-templates.jsx can know which internal template is currently live
    if (!newGameContent.useExternalTemplate) {
      newGameContent._templateId = id;
    }

    const { error: errPublish } = await _supabase.from('settings').upsert({ key: 'game_content', value: newGameContent });
    if (errPublish) throw errPublish;

    // 5. Wipe all players (reset progress)
    await _supabase.from('players').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Reset lastResetAt to now
    await _supabase.from('settings').upsert({ key: 'lastResetAt', value: Date.now() });

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
};

// ── Seasons ────────────────────────────────────────────────────────────────
window.cloudGetSeasonConfig = async function() {
  try {
    if (!_supabase) return { ok: true, config: null };
    const { data, error } = await _supabase.from('settings').select('value').eq('key', 'active_season_config').single();
    if (error) {
      if (error.code === 'PGRST116') return { ok: true, config: null };
      return { ok: false, error: error.message };
    }
    return { ok: true, config: data.value };
  } catch (e) {
    return { ok: false, error: e.message };
  }
};

window.cloudSaveSeasonConfig = async function(config) {
  try {
    if (!_supabase) return { ok: false, error: 'No Supabase' };
    
    if (config === null) {
      const { error } = await _supabase.from('settings').delete().eq('key', 'active_season_config');
      if (error) return { ok: false, error: error.message };
    } else {
      const { error } = await _supabase.from('settings').upsert({ key: 'active_season_config', value: config });
      if (error) return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
};

window.cloudGetSeasonLogs = async function() {
  try {
    if (!_supabase) return { ok: true, logs: [] };
    const { data, error } = await _supabase.from('settings').select('value').eq('key', 'season_logs').single();
    if (error) {
      if (error.code === 'PGRST116') return { ok: true, logs: [] };
      return { ok: false, error: error.message };
    }
    return { ok: true, logs: data.value || [] };
  } catch (e) {
    return { ok: false, error: e.message };
  }
};

window.cloudSaveSeasonLog = async function(logEntry) {
  try {
    if (!_supabase) return { ok: false, error: 'No Supabase' };
    const res = await window.cloudGetSeasonLogs();
    const logs = res.ok ? res.logs : [];
    logs.unshift(logEntry); // Add to beginning
    const { error } = await _supabase.from('settings').upsert({ key: 'season_logs', value: logs });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
};

window.cloudTriggerSeasonWipe = async function(seasonConfig) {
  try {
    if (!_supabase) return { ok: false, error: 'No Supabase' };
    
    // 1. Fetch template content or pointer
    let templates = [];
    const { data: listData } = await _supabase.from('settings').select('value').eq('key', 'content_templates').single();
    if (listData && listData.value) templates = listData.value;
    const templateMeta = templates.find(t => t.id === seasonConfig.templateId);
    if (!templateMeta) throw new Error("Plantilla no encontrada en la lista");

    let templateContent = null;
    if (templateMeta.isExternal) {
      templateContent = { useExternalTemplate: true, path: templateMeta.path };
    } else {
      const tRes = await window.cloudFetchTemplateContent(seasonConfig.templateId);
      if (!tRes.ok) throw new Error("Error fetching template: " + tRes.error);
      templateContent = tRes.content;
      if (!templateContent) throw new Error("Plantilla no encontrada");
    }

    // 2. Fetch all players and determine top 5
    let allPlayers = [];
    let page = 0;
    const pageSize = 1000;
    while (true) {
      const { data: players, error: errPlayers } = await _supabase
        .from('players')
        .select('*')
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (errPlayers) throw errPlayers;
      if (!players || players.length === 0) break;
      allPlayers = allPlayers.concat(players);
      if (players.length < pageSize) break;
      page++;
    }

    // Sort players to get top 5 (same logic as leaderboard)
    const sortedPlayers = [...allPlayers].sort((a, b) => {
      if (b.prestige_count !== a.prestige_count) return (b.prestige_count || 0) - (a.prestige_count || 0);
      if (b.level !== a.level) return (b.level || 0) - (a.level || 0);
      return (b.total_earned || 0) - (a.total_earned || 0);
    });
    
    const top5 = sortedPlayers.slice(0, 5).map(p => ({
      name: p.name,
      prestigeCount: p.prestige_count || 0,
      level: p.level || 0,
      teeth: p.teeth || 0,
      totalEarned: p.total_earned || 0
    }));

    // 3. Create season log entry
    const logEntry = {
      id: seasonConfig.id || ('season_' + Date.now()),
      name: seasonConfig.name,
      startDate: seasonConfig.createdAt || (Date.now() - 86400000), // Fallback
      endDate: Date.now(),
      totalParticipants: allPlayers.length,
      top5: top5
    };
    
    await window.cloudSaveSeasonLog(logEntry);

    // 4. Save to archive
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveKey = 'archive_season_' + timestamp;
    const { data: liveData } = await _supabase.from('settings').select('value').eq('key', 'game_content').single();
    const liveContent = liveData ? liveData.value : null;

    const archivePayload = {
      timestamp: Date.now(),
      seasonLog: logEntry,
      oldContent: liveContent,
      players: allPlayers
    };
    await _supabase.from('settings').upsert({ key: archiveKey, value: archivePayload });

    // 5. Overwrite game content with template content
    // Inject template ID for tracking
    if (!templateContent.useExternalTemplate) {
      templateContent._templateId = seasonConfig.templateId;
    }
    const { error: errPublish } = await _supabase.from('settings').upsert({ key: 'game_content', value: templateContent });
    if (errPublish) throw errPublish;

    // 6. Wipe all players (reset progress)
    await _supabase.from('players').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // 7. Reset lastResetAt to now
    await _supabase.from('settings').upsert({ key: 'lastResetAt', value: Date.now() });

    // Note: We DO NOT clear the active season config here! 
    // The active season config represents the currently running live season.
    // It is needed by the game to show the Welcome Modal to new players,
    // and by the admin to show the remaining time.

    return { ok: true, seasonConfig }; 
  } catch (e) {
    return { ok: false, error: e.message };
  }
};
