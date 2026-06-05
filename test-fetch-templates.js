const { createClient } = require('@supabase/supabase-js');
const SB_URL = 'https://yildqfjmxmxjqlkvemuk.supabase.co';
const SB_KEY = 'sb_publishable_Uz80b3C37riyF9WXBcSFLw_p1TlFDj9';
const supabase = createClient(SB_URL, SB_KEY);
async function run() {
  const { data, error } = await supabase.from('templates').select('id, name');
  if (error) { console.error(error); return; }
  console.log("Templates:", data);
}
run();
