const { useState } = React;

function FeedbackModal({ onClose, lang, username, onSuccess, state, setState }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const PROFANITY = ['puto', 'puta', 'mierda', 'carajo', 'fuck', 'shit', 'idiot', 'estupido', 'estupida', 'idiota', 'bitch', 'asshole', 'pendejo', 'pendeja', 'culiao', 'culia', 'maricon', 'zorra', 'bastard', 'crap', 'damn', 'faggot'];

  const count = state.feedbackCount || 0;
  const isLimit = count >= 2;

  const handleSend = () => {
    if (!text.trim()) {
      setError(lang === 'es' ? 'El mensaje es requerido' : 'Message is required');
      return;
    }
    const lower = text.toLowerCase();
    const found = PROFANITY.find(w => lower.includes(w));
    if (found) {
      setError(lang === 'es' ? 'Tu mensaje debe ser corregido ya que contiene lenguaje inapropiado.' : 'Your message must be corrected as it contains inappropriate language.');
      return;
    }
    setLoading(true);
    
    // Direct sending via JSONBin (window.cloudSubmitFeedback)
    window.cloudSubmitFeedback({
      username: username,
      message: text,
      lang: lang
    })
    .then(res => {
      if (res.ok) {
        console.log('Feedback saved to JSONBin');
        // Achievement & Teeth Reward
        setState((prev) => {
          const isFirst = !prev.feedbackSent;
          return { 
            ...prev, 
            feedbackSent: true, 
            feedbackCount: (prev.feedbackCount || 0) + 1,
            teeth: isFirst ? (prev.teeth || 0) + 100 : (prev.teeth || 0), 
            totalEarned: isFirst ? (prev.totalEarned || 0) + 100 : (prev.totalEarned || 0) 
          };
        });
        setLoading(false);
        onSuccess();
      } else {
        throw new Error(res.error);
      }
    })
    .catch(error => {
      console.error('Error saving feedback:', error);
      // Fallback: show success to user anyway to avoid frustration, but log it
      setLoading(false);
      onSuccess();
    });
  };

  return (
    <window.Modal onClose={onClose} maxWidth={460}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {isLimit ? (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--positive-i010)', color: 'var(--positive-i100)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>
              <i className="fa-solid fa-heart"></i>
            </div>
            <div className="t-heading-m" style={{ marginBottom: 12 }}>
              {lang === 'es' ? '¡Tu opinión es invaluable!' : 'Your feedback is invaluable!'}
            </div>
            <div className="t-body-m" style={{ color: 'var(--fg-2)', lineHeight: 1.6, marginBottom: 20 }}>
              {lang === 'es' 
                ? '¡Muchas gracias! Ya hemos recibido tus dos comentarios y son sumamente valiosos para nosotros. Por ahora no es necesario que envíes más, ¡pero apreciamos enormemente tu compromiso con la consulta!'
                : 'Thank you so much! We have already received your two messages and they are extremely valuable to us. For now, it is not necessary for you to send more, but we truly appreciate your commitment to our practice!'}
            </div>
            <button onClick={onClose} className="t-heading-xs" style={{ ...primaryBtnStyle, width: '100%' }}>
              {lang === 'es' ? 'Entendido, ¡gracias!' : 'Got it, thanks!'}
            </button>
          </div>
        ) : (
          <>
            <div>
              <div className="t-heading-m">{lang === 'es' ? 'Enviar Feedback' : 'Send Feedback'}</div>
              <div className="t-body-s" style={{ color: 'var(--fg-3)', marginTop: 4 }}>
                {lang === 'es' ? 'Tu opinión nos ayuda a mejorar la consulta.' : 'Your feedback helps us improve the practice.'}
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <textarea
                value={text}
                onChange={(e) => {
                  if (e.target.value.length <= 200) {
                    setText(e.target.value);
                    setError('');
                  }
                }}
                placeholder={lang === 'es' ? 'Escribe aquí tu feedback...' : 'Type your feedback here...'}
                style={{
                  width: '100%', height: 120, padding: 12, borderRadius: 8,
                  border: `1.5px solid ${error ? 'var(--negative-i100)' : 'var(--border-subtle)'}`,
                  background: 'var(--bg-2)', color: 'var(--fg-1)',
                  fontFamily: 'inherit', fontSize: 14, resize: 'none', outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ position: 'absolute', bottom: 8, right: 12, fontSize: 11, color: text.length >= 190 ? 'var(--negative-i100)' : 'var(--fg-4)' }}>
                {text.length}/200
              </div>
            </div>

            {error && (
              <div style={{ color: 'var(--negative-i100)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                <i className="fa-solid fa-circle-exclamation"></i> {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} className="t-heading-xs" style={{ ...secondaryBtnStyle, flex: 1 }}>
                {lang === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button 
                onClick={handleSend} 
                disabled={loading}
                className="t-heading-xs" 
                style={{ ...primaryBtnStyle, flex: 2, opacity: loading ? 0.7 : 1, position: 'relative' }}
              >
                {loading ? (
                  <i className="fa-solid fa-circle-notch fa-spin"></i>
                ) : (
                  lang === 'es' ? 'Enviar Mensaje' : 'Send Message'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </window.Modal>
  );
}

window.FeedbackModal = FeedbackModal;
