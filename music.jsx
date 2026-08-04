const { useEffect, useRef } = React;

function MusicFloatingBtn({ isPlaying, onClick, currentTrack, currentTime, duration, onHover, onLeave, lang }) {
  return (
    <div 
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        position: 'fixed',
        bottom: 30, right: 30,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        zIndex: 50,
        cursor: 'pointer'
      }}
    >
      <style>{`
        @keyframes musicWave {
          0%, 100% { height: 4px; }
          50% { height: 14px; }
        }
      `}</style>
      {isPlaying && currentTrack && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-1)', padding: '4px 10px', borderRadius: 8, border: '1px solid var(--primary-i030)', boxShadow: 'var(--elevation-10)', pointerEvents: 'none', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary-i100)', whiteSpace: 'nowrap' }}>
            {currentTrack.title}
          </div>
          <div style={{ width: 1, height: 10, background: 'var(--border-subtle)' }} />
          <div style={{ fontSize: 9, color: 'var(--fg-3)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            -{formatMusicTime(Math.max(0, duration - currentTime))}
          </div>
        </div>
      )}
      <div 
        style={{
          width: 38, height: 38,
          borderRadius: '50%',
          background: isPlaying ? 'var(--primary-i100)' : 'var(--bg-2)',
          border: `2px solid ${isPlaying ? 'transparent' : 'var(--border-subtle)'}`,
          boxShadow: isPlaying ? '0 4px 15px rgba(0, 118, 219, 0.4)' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isPlaying ? '#fff' : 'var(--fg-3)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative'
        }}
        onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.borderColor = 'var(--primary-i100)'; }}
        onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = isPlaying ? 'transparent' : 'var(--border-subtle)'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 14 }}>
          {[0.1, 0.4, 0.2, 0.5, 0.3].map((delay, i) => (
            <div key={i} style={{ 
              width: 2, 
              height: isPlaying ? 14 : 2, 
              background: isPlaying ? '#fff' : 'var(--fg-3)', 
              borderRadius: 2,
              opacity: isPlaying ? 1 : 0.6,
              animation: isPlaying ? `musicWave 0.8s ease-in-out infinite ${delay}s` : 'none',
              transition: 'all 0.3s ease'
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MusicPlayerModal({ 
  onClose, tracks, currentTrack, onSelectTrack,
  isPlaying, onTogglePlay, onStop, onPlayRandom,
  volume, onChangeVolume,
  muted, onToggleMute,
  playMode, onChangePlayMode,
  currentTime, duration, onSeek,
  soundOn, toggleSound, lang, visualEffects = true,
  onShareTrack, onHoverShare, onLeaveShare,
  state, scrollToTrackId
}) {
  const isShuffle = playMode.includes('shuffle');
  const isLoop = playMode.includes('loop');
  const isStop = playMode === 'stop';
  const trackListRef = React.useRef(null);

  const hasPlayableTracks = React.useMemo(() => {
    if (!tracks || tracks.length === 0) return false;
    if (!state) return true;
    return tracks.some(t => (state.level >= (t.reqLevel || 0)) && ((state.prestigeCount || 0) >= (t.reqPrestige || 0)));
  }, [tracks, state]);

  React.useEffect(() => {
    if (trackListRef.current) {
      if (scrollToTrackId) {
        const el = trackListRef.current.querySelector(`[data-track-id="${scrollToTrackId}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (currentTrack) {
        const el = trackListRef.current.querySelector(`[data-track-id="${currentTrack.id}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentTrack, scrollToTrackId]);

  return (
    <window.Modal onClose={onClose} maxWidth={400}>
      <style>{`
        .music-slider { height: 2px; -webkit-appearance: none; background: var(--border-subtle); border-radius: 1px; outline: none; }
        .music-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 10px; height: 10px; border-radius: 50%; background: var(--primary-i100); cursor: pointer; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
        @keyframes discRotate { 
          from { transform: rotate(0deg) translate3d(0,0,0); } 
          to { transform: rotate(360deg) translate3d(0,0,0); } 
        }
      `}</style>
      <div style={{ paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="t-heading-s" style={{ margin: 0 }}>{lang === 'es' ? 'Reproductor de Música' : 'Music Player'}</h2>
        <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', color: 'var(--fg-3)', padding: 12, margin: -12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="fa-solid fa-xmark" style={{ fontSize: 20 }}></i>
        </button>
      </div>
      
      <div style={{ padding: 'var(--spacing-4)', background: 'var(--bg-2)', borderRadius: 'var(--radius-s)', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Volume Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', color: 'var(--fg-2)', minWidth: 100 }}>
            {lang === 'es' ? 'Volumen Música' : 'Music Volume'}
          </div>
          <button 
            onClick={() => onToggleMute()} 
            style={{ all: 'unset', cursor: 'pointer', color: muted ? 'var(--negative-i100)' : 'var(--fg-3)', fontSize: 14 }}
            title={lang === 'es' ? 'Silenciar' : 'Mute'}
          >
            <i className={`fa-solid ${muted ? 'fa-volume-xmark' : 'fa-volume-low'}`}></i>
          </button>
          <input 
            type="range" min="0" max="1" step="0.01" 
            value={muted ? 0 : volume} 
            onChange={e => onChangeVolume(parseFloat(e.target.value))} 
            className="music-slider" 
            style={{ flex: 1, cursor: 'pointer' }} 
          />
          <button 
            onClick={() => { onChangeVolume(1); if (muted) onToggleMute(); }} 
            style={{ all: 'unset', cursor: 'pointer', color: (volume === 1 && !muted) ? 'var(--primary-i100)' : 'var(--fg-3)', fontSize: 14 }}
            title={lang === 'es' ? 'Volumen Máximo' : 'Max Volume'}
          >
            <i className="fa-solid fa-volume-high"></i>
          </button>
        </div>
        

      </div>

      <button 
        onClick={() => { if (hasPlayableTracks) { window.playClickSound && window.playClickSound(); onPlayRandom(); } }}
        style={{ 
          all: 'unset', boxSizing: 'border-box', width: '100%', marginBottom: 8,
          background: 'var(--primary-i010)', color: 'var(--primary-i100)', 
          padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 700, 
          cursor: hasPlayableTracks ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, 
          border: '1px solid var(--primary-i030)', transition: 'all 0.2s',
          opacity: hasPlayableTracks ? 1 : 0.5
        }}
        onMouseOver={e => { if (hasPlayableTracks) e.currentTarget.style.background = 'var(--primary-i020)'; }}
        onMouseOut={e => { if (hasPlayableTracks) e.currentTarget.style.background = 'var(--primary-i010)'; }}
        disabled={!hasPlayableTracks}
      >
        <i className="fa-solid fa-play"></i> {lang === 'es' ? 'Reproducción aleatoria' : 'Random play'}
      </button>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button disabled={!hasPlayableTracks} onClick={() => { if (hasPlayableTracks) onChangePlayMode('shuffle'); }} style={{ flex: 1, padding: '5px 8px', background: isShuffle ? 'var(--primary-i010)' : 'var(--bg-1)', border: `1px solid ${isShuffle ? 'var(--primary-i100)' : 'var(--border-subtle)'}`, borderRadius: 6, color: isShuffle ? 'var(--primary-i100)' : 'var(--fg-3)', cursor: hasPlayableTracks ? 'pointer' : 'not-allowed', fontSize: 10.5, fontWeight: 500, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5, transition: 'all 150ms', opacity: hasPlayableTracks ? (isShuffle ? 1 : 0.8) : 0.4 }}>
          <i className="fa-solid fa-shuffle" style={{ fontSize: 11 }}></i> {lang === 'es' ? 'Aleatorio' : 'Shuffle'}
        </button>
        <button disabled={!hasPlayableTracks} onClick={() => { if (hasPlayableTracks) onChangePlayMode('loop'); }} style={{ flex: 1, padding: '5px 8px', background: isLoop ? 'var(--primary-i010)' : 'var(--bg-1)', border: `1px solid ${isLoop ? 'var(--primary-i100)' : 'var(--border-subtle)'}`, borderRadius: 6, color: isLoop ? 'var(--primary-i100)' : 'var(--fg-3)', cursor: hasPlayableTracks ? 'pointer' : 'not-allowed', fontSize: 10.5, fontWeight: 500, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5, transition: 'all 150ms', opacity: hasPlayableTracks ? (isLoop ? 1 : 0.8) : 0.4 }}>
          <i className="fa-solid fa-repeat" style={{ fontSize: 11 }}></i> {lang === 'es' ? 'Bucle' : 'Loop'}
        </button>
        <button disabled={!hasPlayableTracks} onClick={() => { if (hasPlayableTracks) onChangePlayMode('stop'); }} style={{ flex: 1, padding: '5px 8px', background: isStop ? 'var(--primary-i010)' : 'var(--bg-1)', border: `1px solid ${isStop ? 'var(--primary-i100)' : 'var(--border-subtle)'}`, borderRadius: 6, color: isStop ? 'var(--primary-i100)' : 'var(--fg-3)', cursor: hasPlayableTracks ? 'pointer' : 'not-allowed', fontSize: 10.5, fontWeight: 500, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5, transition: 'all 150ms', opacity: hasPlayableTracks ? (isStop ? 1 : 0.8) : 0.4 }}>
          <i className="fa-solid fa-ban" style={{ fontSize: 11 }}></i> {lang === 'es' ? 'Fin' : 'End'}
        </button>
      </div>

      <div ref={trackListRef} style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto', paddingRight: 4, minHeight: 0 }}>
        {tracks.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24, background: 'var(--bg-1)', borderRadius: 12, border: '1px dashed var(--border-subtle)' }}>
            <div style={{ fontSize: 40, color: 'var(--fg-4)', marginBottom: 16 }}><i className="fa-solid fa-music"></i></div>
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--fg-2)', fontSize: 16 }}>{lang === 'es' ? 'Sin música' : 'No music'}</h3>
            <p style={{ margin: 0, color: 'var(--fg-3)', fontSize: 13 }}>{lang === 'es' ? 'No hay canciones disponibles.' : 'No tracks available.'}</p>
          </div>
        ) : (
          tracks.map(t => {
            const isUnlocked = !state ? true : (state.level >= (t.reqLevel || 0)) && ((state.prestigeCount || 0) >= (t.reqPrestige || 0));
            const isCurrent = currentTrack?.id === t.id;
            const isPlayingThis = isCurrent && isPlaying;
            const progress = isCurrent ? (currentTime / (duration || 1)) : 0;
            const r = 13;
            const circ = 2 * Math.PI * r;
            const offset = circ - (progress * circ);

            return (
              <div key={t.id} data-track-id={t.id}
                onClick={() => { if (!isCurrent && isUnlocked) onSelectTrack(t); }}
                style={{ 
                  background: isCurrent ? 'var(--primary-i005)' : 'var(--bg-1)', 
                  border: `1px solid ${isCurrent ? 'var(--primary-i030)' : 'var(--border-subtle)'}`, 
                  borderRadius: 12, 
                  padding: '10px 14px', 
                  cursor: isUnlocked ? (isCurrent ? 'default' : 'pointer') : 'not-allowed', 
                  transition: 'all 150ms',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  height: 52,
                  boxSizing: 'border-box',
                  opacity: isUnlocked ? 1 : 0.6,
                  filter: isUnlocked ? 'none' : 'grayscale(1)'
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div style={{ 
                    width: 32, height: 32, 
                    borderRadius: '50%', 
                    background: 'var(--bg-3)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                    border: isCurrent ? '2px solid var(--primary-i100)' : '1px solid var(--border-subtle)',
                    animation: (isPlayingThis && visualEffects) ? 'discRotate 4s linear infinite' : 'none',
                    willChange: 'transform',
                    transform: 'translate3d(0,0,0)'
                  }}>
                    {isUnlocked ? (
                      <img src={t.cover || 'https://img.icons8.com/color/96/music-record.png'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <i className="fa-solid fa-lock" style={{ color: 'var(--fg-3)', fontSize: 14 }}></i>
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: isCurrent ? 'var(--primary-i100)' : 'var(--fg-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {isUnlocked ? t.title : (lang === 'es' ? 'Canción bloqueada' : 'Locked song')}
                    </div>
                    {isUnlocked ? (
                      isCurrent && <div style={{ fontSize: 10, color: 'var(--fg-3)', fontWeight: 600 }}>{isPlaying ? (lang === 'es' ? 'Reproduciendo...' : 'Playing...') : (lang === 'es' ? 'Pausado' : 'Paused')}</div>
                    ) : (
                      <div style={{ fontSize: 10, color: 'var(--warning-i100)', fontWeight: 600 }}>
                        {lang === 'es' ? 'Requiere:' : 'Requires:'} {t.reqLevel > 0 ? `Nvl ${t.reqLevel}` : ''} {t.reqPrestige > 0 ? `Prestigio ${t.reqPrestige}` : ''}
                      </div>
                    )}
                  </div>
                </div>
                
                {isUnlocked && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                   <button
                    onClick={(e) => { e.stopPropagation(); onShareTrack && onShareTrack(t); }}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      onHoverShare && onHoverShare({ x: rect.left + rect.width / 2, y: rect.top });
                    }}
                    onMouseLeave={() => {
                      onLeaveShare && onLeaveShare();
                    }}
                    className="app-btn"
                    style={{
                      all: 'unset',
                      cursor: 'pointer',
                      color: 'var(--fg-3)',
                      padding: 6,
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                    onMouseOver={e => { e.currentTarget.style.color = 'var(--primary-i100)'; e.currentTarget.style.background = 'var(--primary-i005)'; }}
                    onMouseOut={e => { e.currentTarget.style.color = 'var(--fg-3)'; e.currentTarget.style.background = 'transparent'; }}
                  >
                    <i className="fa-solid fa-share-nodes" style={{ fontSize: 13 }}></i>
                  </button>
                  {isCurrent ? (
                    <div 
                      onClick={(e) => { e.stopPropagation(); onTogglePlay(); }}
                      style={{ position: 'relative', width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <svg width="30" height="30" viewBox="0 0 30 30">
                        <circle cx="15" cy="15" r={r} fill="none" stroke="rgba(26,143,255,0.1)" strokeWidth="2.5" />
                        <circle cx="15" cy="15" r={r} fill="none" stroke="var(--primary-i100)" strokeWidth="2.5" 
                          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 15 15)" 
                          style={{ transition: 'stroke-dashoffset 0.3s linear' }} />
                      </svg>
                      <div style={{ position: 'absolute', width: 8, height: 8, background: 'var(--primary-i100)', borderRadius: 1.5 }}></div>
                    </div>
                  ) : (
                    <i className="fa-solid fa-play" style={{ fontSize: 12, color: 'var(--fg-3)', opacity: 0.6 }}></i>
                  )}
                </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </window.Modal>
  );
}

window.MusicFloatingBtn = MusicFloatingBtn;
window.MusicPlayerModal = MusicPlayerModal;

