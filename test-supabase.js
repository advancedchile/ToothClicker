const { createClient } = require('@supabase/supabase-js');
const SB_URL = 'https://yildqfjmxmxjqlkvemuk.supabase.co';
const SB_KEY = 'sb_publishable_Uz80b3C37riyF9WXBcSFLw_p1TlFDj9';

const _supabase = createClient(SB_URL, SB_KEY);
async function run() {
  const { data, error } = await _supabase.from('settings').select('value').eq('key', 'game_content').single();
  if (error) { console.error(error); return; }
  let contentStr = typeof data.value === 'string' ? data.value : JSON.stringify(data.value);
  console.log("Starts with:", contentStr.substring(0, 100));
  console.log("Contains /assets:", contentStr.includes('"/assets/'));
  console.log("Contains public/assets:", contentStr.includes('"public/assets/'));
  console.log("Contains assets/:", contentStr.includes('"assets/'));
}
run();
