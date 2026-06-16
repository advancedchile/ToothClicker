export function generateSig(state) {
  const t = state.totalEarned || 0;
  const p = state.prestigeCount || 0;
  const n = state.name || '';
  const x = state.timePlayed || 0;
  
  const raw = `${n}-${t}-${p}-${Math.floor(x / 100)}`;
  
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < raw.length; i++) {
    hash ^= raw.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16);
}
