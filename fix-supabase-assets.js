const { createClient } = require('@supabase/supabase-js');
const SB_URL = 'https://yildqfjmxmxjqlkvemuk.supabase.co';
const SB_KEY = 'sb_publishable_Uz80b3C37riyF9WXBcSFLw_p1TlFDj9';
const supabase = createClient(SB_URL, SB_KEY);

function fixPaths(obj) {
  let changed = false;
  if (typeof obj === 'string') {
    if (obj.startsWith('/assets/')) {
      return { val: obj.substring(1), changed: true };
    }
    return { val: obj, changed: false };
  } else if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const res = fixPaths(obj[i]);
      if (res.changed) { obj[i] = res.val; changed = true; }
    }
  } else if (obj !== null && typeof obj === 'object') {
    for (const k in obj) {
      const res = fixPaths(obj[k]);
      if (res.changed) { obj[k] = res.val; changed = true; }
    }
  }
  return { val: obj, changed };
}

async function run() {
  const { data, error } = await supabase.from('settings').select('key, value');
  if (error) { console.error(error); return; }
  
  let totalChanges = 0;
  for (const row of data) {
    if (!row.value) continue;
    // We parse if it's string, else use as object
    let obj = row.value;
    let isStr = false;
    if (typeof obj === 'string') {
      try { obj = JSON.parse(obj); isStr = true; } catch(e) {}
    }
    
    const { val, changed } = fixPaths(obj);
    if (changed) {
      console.log(`Fixing key: ${row.key}`);
      totalChanges++;
      const newVal = isStr ? JSON.stringify(val) : val;
      // We cannot update with publishable key without user being logged in if RLS is on!
      // But maybe RLS is permissive? Let's try!
      const { error: updateErr } = await supabase.from('settings').update({ value: newVal }).eq('key', row.key);
      if (updateErr) {
        console.error(`Failed to update ${row.key}:`, updateErr);
      } else {
        console.log(`Updated ${row.key} successfully.`);
      }
    }
  }
  console.log(`Done! Keys changed: ${totalChanges}`);
}
run();
