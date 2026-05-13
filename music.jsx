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
  isPlaying, onTogglePlay, onStop,
  volume, onChangeVolume,
  muted, onToggleMute,
  playMode, onChangePlayMode,
  currentTime, duration, onSeek,
  soundOn, toggleSound, lang
}) {
  const isShuffle = playMode.includes('shuffle');
  const isLoop = playMode.includes('loop');
  const isStop = playMode === 'stop';
  const trackListRef = React.useRef(null);

  React.useEffect(() => {
    if (trackListRef.current && currentTrack) {
      const el = trackListRef.current.querySelector(`[data-track-id="${currentTrack.id}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  return (
    <Modal onClose={onClose} maxWidth={400}>
      <style>{`
        .music-slider { height: 2px; -webkit-appearance: none; background: var(--border-subtle); border-radius: 1px; outline: none; }
        .music-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 10px; height: 10px; border-radius: 50%; background: var(--primary-i100); cursor: pointer; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
      `}</style>
      <div style={{ paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="t-heading-s" style={{ margin: 0 }}>{lang === 'es' ? 'Reproductor de Música' : 'Music Player'}</h2>
        <button onClick={onClose} style={{ all: 'unset', cursor: 'pointer', color: 'var(--fg-3)' }}>
          <i className="fa-solid fa-xmark" style={{ fontSize: 18 }}></i>
        </button>
      </div>
      
      <div style={{ padding: 'var(--spacing-4)', background: 'var(--bg-2)', borderRadius: 'var(--radius-s)', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{lang === 'es' ? 'Volumen Música' : 'Music Volume'}</div>
          <button onClick={onToggleMute} style={{ all: 'unset', cursor: 'pointer', color: muted ? 'var(--negative-i100)' : 'var(--fg-2)' }}>
            <i className={`fa-solid ${muted ? 'fa-volume-xmark' : 'fa-volume-high'}`}></i>
          </button>
        </div>
        <input type="range" min="0" max="1" step="0.01" value={muted ? 0 : volume} onChange={e => onChangeVolume(parseFloat(e.target.value))} className="music-slider" style={{ width: '100%', cursor: 'pointer' }} />
        
        <div style={{ height: 1, background: 'var(--border-subtle)', margin: '16px 0' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{lang === 'es' ? 'Efectos de Sonido' : 'Sound Effects'}</div>
          <button onClick={toggleSound} style={{ all: 'unset', cursor: 'pointer', color: soundOn ? 'var(--positive-i100)' : 'var(--fg-3)', fontSize: 20 }}>
            <i className={`fa-solid ${soundOn ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => onChangePlayMode('shuffle')} style={{ flex: 1, padding: '8px', background: isShuffle ? 'var(--primary-i010)' : 'var(--bg-2)', border: `1px solid ${isShuffle ? 'var(--primary-i100)' : 'var(--border-subtle)'}`, borderRadius: 6, color: isShuffle ? 'var(--primary-i100)' : 'var(--fg-2)', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, transition: 'all 150ms' }}>
          <i className="fa-solid fa-shuffle"></i> {lang === 'es' ? 'Aleatorio' : 'Shuffle'}
        </button>
        <button onClick={() => onChangePlayMode('loop')} style={{ flex: 1, padding: '8px', background: isLoop ? 'var(--primary-i010)' : 'var(--bg-2)', border: `1px solid ${isLoop ? 'var(--primary-i100)' : 'var(--border-subtle)'}`, borderRadius: 6, color: isLoop ? 'var(--primary-i100)' : 'var(--fg-2)', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, transition: 'all 150ms' }}>
          <i className="fa-solid fa-repeat"></i> {lang === 'es' ? 'Bucle' : 'Loop'}
        </button>
        <button onClick={() => onChangePlayMode('stop')} style={{ flex: 1, padding: '8px', background: isStop ? 'var(--primary-i010)' : 'var(--bg-2)', border: `1px solid ${isStop ? 'var(--primary-i100)' : 'var(--border-subtle)'}`, borderRadius: 6, color: isStop ? 'var(--primary-i100)' : 'var(--fg-2)', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, transition: 'all 150ms' }}>
          <i className="fa-solid fa-ban"></i> {lang === 'es' ? 'Fin' : 'End'}
        </button>
      </div>

      <div ref={trackListRef} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
        {tracks.map(t => {
          const isCurrent = currentTrack?.id === t.id;
          return (
            <div key={t.id} data-track-id={t.id}
              onClick={() => { if (!isCurrent) onSelectTrack(t); }}
              style={{ background: isCurrent ? 'var(--primary-i005)' : 'transparent', border: `1px solid ${isCurrent ? 'var(--primary-i020)' : 'var(--border-subtle)'}`, borderRadius: 10, padding: '12px 14px', cursor: isCurrent ? 'default' : 'pointer', transition: 'all 150ms' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isCurrent ? 8 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={t.cover || 'https://img.icons8.com/color/96/music-record.png'} alt="" style={{ width: 30, height: 30, borderRadius: 6, objectFit: 'cover', background: 'var(--bg-3)' }} />
                  <div style={{ fontWeight: 600, fontSize: 14, color: isCurrent ? 'var(--primary-i100)' : 'var(--fg-1)' }}>{t.title}</div>
                </div>
                {!isCurrent && <i className="fa-solid fa-play" style={{ fontSize: 10, color: 'var(--fg-3)', opacity: 0.6 }}></i>}
              </div>
              
              {isCurrent && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={(e) => { e.stopPropagation(); onTogglePlay(); }} style={{ all: 'unset', cursor: 'pointer', color: 'var(--primary-i100)', width: 14 }}>
                    <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`} style={{ fontSize: 14 }}></i>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onStop(); }} style={{ all: 'unset', cursor: 'pointer', color: 'var(--negative-i100)', width: 14 }}>
                    <i className="fa-solid fa-stop" style={{ fontSize: 14 }}></i>
                  </button>
                  <input 
                    type="range" min="0" max={duration || 100} step="0.1" value={currentTime || 0} 
                    onClick={e => e.stopPropagation()}
                    onChange={e => onSeek(parseFloat(e.target.value))} 
                    className="music-slider"
                    style={{ flex: 1, cursor: 'pointer' }} 
                  />
                  <span style={{ fontSize: 11, color: 'var(--fg-3)', fontVariantNumeric: 'tabular-nums', minWidth: 40, textAlign: 'right' }}>
                    -{formatMusicTime(Math.max(0, duration - currentTime))}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
