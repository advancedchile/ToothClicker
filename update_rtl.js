const { createClient } = require('@supabase/supabase-js');
const SB_URL = 'https://yildqfjmxmxjqlkvemuk.supabase.co';
const SB_KEY = 'sb_publishable_Uz80b3C37riyF9WXBcSFLw_p1TlFDj9';
const supabase = createClient(SB_URL, SB_KEY);

async function run() {
  const { data: rows, error } = await supabase.from('custom_messages').select('*');

  if (error) {
    console.error('Fetch error:', error);
    return;
  }

  let updatedCount = 0;

  for (let row of rows) {
    let rawText = row.text || '';
    let extraData = {};
    if (rawText.includes("||extra:")) {
      const parts = rawText.split("||extra:");
      rawText = parts[0];
      try { extraData = JSON.parse(parts[1]); } catch(e) {}
    }
    
    let cleanText = rawText;
    let isQuestion = false;
    if (cleanText.includes("||question:")) {
      isQuestion = true;
      const parts = cleanText.split("||question:");
      cleanText = parts[0];
    }
    
    // Only update normal messages
    if (!isQuestion) {
      // Update extraData ledDirection to rtl
      extraData.ledDirection = 'rtl';
      
      // Re-encode text
      const newText = rawText + '||extra:' + JSON.stringify(extraData);
      
      const { error: updateError } = await supabase
        .from('custom_messages')
        .update({
          text: newText
        })
        .eq('id', row.id);
        
      if (updateError) {
        console.error(`Error updating message ${row.id}:`, updateError);
      } else {
        updatedCount++;
        if (updatedCount % 50 === 0) console.log(`Updated ${updatedCount}...`);
      }
    }
  }

  console.log(`Finished updating ${updatedCount} normal messages to RTL.`);
}

run();
