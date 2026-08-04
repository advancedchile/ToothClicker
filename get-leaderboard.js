const { createClient } = require('@supabase/supabase-js');

const SB_URL = 'https://yildqfjmxmxjqlkvemuk.supabase.co';
const SB_KEY = 'sb_publishable_Uz80b3C37riyF9WXBcSFLw_p1TlFDj9';

const supabase = createClient(SB_URL, SB_KEY);

async function run() {
  const { data, error } = await supabase.from('leaderboard').select('*').limit(2);
  console.log('Leaderboard data:', data);
  console.log('Error:', error);
}

run();
