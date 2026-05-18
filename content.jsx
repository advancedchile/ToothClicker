// ==========================================================================
// Tooth Clicker — Game content (generators, click upgrades, achievements)
// ==========================================================================

// ── App Version (single source of truth) ──────────────────────────────────
const APP_VERSION = 'v0.5.5-beta';
const VERSION_DATE = '2026-05-18';

const VERSION_HISTORY = [
  {
    v: 'v0.5.5-beta',
    date: '2026-05-18',
    es: 'Versión móvil disponible. Ahora los mensajes de líderes y colaboradores tienen una imagen personalizada. Optimización de la academia. Premios por logros y niveles. Mejoras en la seguridad de login y signup',
    en: 'Mobile version available. Leader and collaborator messages now feature custom avatar images. Academy optimization. Achievement and level rewards. Login and signup security enhancements.',
    latest: true,
  },
  {
    v: 'v0.5.1-beta',
    date: '2026-05-11',
    es: 'Reproductor Musical: Implementación de reproductor global dinámico, corrección de bugs de renderizado del menú tour y simulación de partículas completada.',
    en: 'Music Player: Implemented dynamic global music player, fixed tour menu rendering bugs, and completed particle simulation.',
    latest: false,
  },
  {
    v: 'v0.0.35-beta',
    date: '2026-05-10',
    es: 'Panel Admin Premium: Mensajes con efectos acelerados, partículas dinámicas desde bordes, previsualización real y UI mejorada.',
    en: 'Premium Admin Panel: Messages with faster effects, dynamic edge particles, real-time preview, and improved UI.',
    latest: false,
  },
  {
    v: 'v0.0.34-beta',
    date: '2026-05-10',
    es: 'Personalización Visual: Añadido sistema de efectos, colores, partículas y posiciones para mensajes personalizados.',
    en: 'Visual Customization: Added effects, colors, particles, and positions for custom messages.',
    latest: false,
  },
  {
    v: 'v0.0.33-beta',
    date: '2026-05-10',
    es: 'Historial Visual: Añadido modal dedicado para ver el log completo de versiones anteriores.',
    en: 'Visual History: Added dedicated modal to view the complete version log.',
    latest: false,
  },
  {
    v: 'v0.0.32-beta',
    date: '2026-05-10',
    es: 'Sistema de Versiones: Implementación de revisiones escalables (v0.0.x). Añadido botón de "Borrar todo" en feedback y filtros de ranking.',
    en: 'Versioning System: Scalable revision tracking (v0.0.x). Added "Clear all" button in feedback and ranking filters.',
    latest: false,
  },
  {
    v: 'v0.0.3-beta',
    date: '2026-05-10',
    es: 'Fase Beta: Implementación de feedback persistente con JSONBin, panel admin mejorado, logros de CPS y recompensas por participación.',
    en: 'Beta Phase: Persistent feedback system with JSONBin, improved admin panel, CPS achievements and participation rewards.',
    latest: false,
  },
  {
    v: 'alpha v0.009',
    date: '2026-04-24',
    es: 'Sistema de versiones centralizado, historial de versiones en modal Acerca de, versión visible en pantalla principal siempre actualizada',
    en: 'Centralized version system, version history in About modal, main screen version always up to date',
    latest: false,
  },
  {
    v: 'alpha v0.008',
    date: null,
    es: '18 dientes ilustrados con progresión por prestigio, galería de evolución en pestaña Prestigio, notificación de nuevo diente desbloqueado, selector de diente activo',
    en: '18 illustrated teeth with prestige progression, evolution gallery in Prestige tab, new tooth unlock notification, active tooth selector',
    latest: false,
  },
  {
    v: 'alpha v0.007',
    date: null,
    es: 'Compra masiva de generadores: selector x1 / x10 / x25 / x50 / x100 / x1000 con cálculo de costo acumulado',
    en: 'Bulk generator purchase: x1 / x10 / x25 / x50 / x100 / x1000 selector with cumulative cost calculation',
    latest: false,
  },
  {
    v: 'alpha v0.006',
    date: null,
    es: 'Modal "Acerca de" en menú del juego, opción de formato numérico (corto, largo, ingeniería, científico)',
    en: '"About" modal in game menu, number format option (short, long, engineering, scientific)',
    latest: false,
  },
  {
    v: 'alpha v0.005',
    date: null,
    es: 'Panel de administrador, gestión de usuarios, reset de leaderboard global',
    en: 'Admin panel, user management, global leaderboard reset',
    latest: false,
  },
  {
    v: 'alpha v0.004',
    date: null,
    es: 'Multiusuario: múltiples perfiles por dispositivo, pantalla de bienvenida rediseñada',
    en: 'Multi-user: multiple profiles per device, redesigned welcome screen',
    latest: false,
  },
  {
    v: 'alpha v0.003',
    date: null,
    es: 'Ganancias offline (cap 2h), modal de bienvenida con resumen de progreso perdido',
    en: 'Offline earnings (2h cap), welcome modal with missed progress summary',
    latest: false,
  },
  {
    v: 'alpha v0.002',
    date: null,
    es: 'Ranking global en la nube (JSONBin), leaderboard en pantalla de inicio y en juego',
    en: 'Global cloud ranking (JSONBin), leaderboard on start screen and in-game',
    latest: false,
  },
  {
    v: 'alpha v0.001',
    date: null,
    es: 'Versión inicial: 120+ generadores, 100+ mejoras de click, 300+ logros, sistema de prestigio, guardado local por usuario',
    en: 'Initial version: 120+ generators, 100+ click upgrades, 300+ achievements, prestige system, local save per user',
    latest: false,
  },
];

const SHORT_SUFFIXES = [
  '', 'K', 'M', 'B', 'T',
  'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No',
  'Dc', 'Ud', 'Dd', 'Td', 'Qad', 'Qid', 'Sxd', 'Spd', 'Ocd', 'Nod',
  'Vg', 'Uv', 'Dv', 'Tv', 'Qav', 'Qiv', 'Sxv', 'Spv', 'Ocv', 'Nov',
  'Tg', 'Utg', 'Dtg', 'Ttg', 'Qatg', 'Qitg', 'Sxtg', 'Sptg', 'Octg', 'Notg',
];

const LONG_NAMES_ES = [
  '', ' mil', ' millones', ' mil millones', ' billones', ' mil billones',
  ' trillones', ' mil trillones', ' cuatrillones', ' mil cuatrillones',
  ' quintillones', ' mil quintillones', ' sextillones', ' mil sextillones',
  ' septillones', ' mil septillones', ' octillones', ' mil octillones',
  ' nonillones', ' mil nonillones', ' decillones', ' mil decillones',
  ' undecillones', ' duodecillones', ' tredecillones', ' cuatuordecillones',
  ' quindecillones', ' sexdecillones', ' septendecillones', ' octodecillones',
  ' novemdecillones', ' vigintillones',
];

const LONG_NAMES_EN = [
  '', ' thousand', ' million', ' billion', ' trillion', ' quadrillion',
  ' quintillion', ' sextillion', ' septillion', ' octillion', ' nonillion',
  ' decillion', ' undecillion', ' duodecillion', ' tredecillion',
  ' quattuordecillion', ' quindecillion', ' sexdecillion', ' septendecillion',
  ' octodecillion', ' novemdecillion', ' vigintillion',
];

function formatNumWithMode(n, mode = 'short', lang = 'es', keepDecimals = false) {
  if (n === null || n === undefined || !isFinite(n)) return '0';
  if (n < 0) return '-' + formatNumWithMode(-n, mode, lang, keepDecimals);
  if (n < 1000) {
    if (keepDecimals) return n.toLocaleString(lang === 'es' ? 'es-AR' : 'en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
    return Math.floor(n).toLocaleString(lang === 'es' ? 'es-AR' : 'en-US');
  }
  if (mode === 'scientific') {
    return n.toExponential(2).replace('e+', ' × 10^').replace('e-', ' × 10^-');
  }
  if (mode === 'engineering') {
    const exp = Math.floor(Math.log10(Math.abs(n)) / 3) * 3;
    const mant = n / Math.pow(10, exp);
    return mant.toFixed(2) + 'e' + exp;
  }
  if (mode === 'long') {
    if (lang === 'en') {
      const names = LONG_NAMES_EN;
      const idx = Math.min(names.length - 1, Math.floor(Math.log10(n) / 3));
      if (idx <= 0) return Math.floor(n).toLocaleString('en-US');
      const mant = n / Math.pow(1000, idx);
      return trim(mant, 2) + names[idx];
    } else {
      const names = LONG_NAMES_ES;
      const log = Math.log10(n);
      if (log < 3) return Math.floor(n).toLocaleString('es-AR');
      const halfIdx = Math.floor(log / 3);
      const capped = Math.min(halfIdx, names.length - 1);
      const divisor = Math.pow(1000, capped);
      const mant = n / divisor;
      return trim(mant, 2) + names[capped];
    }
  }
  const idx = Math.min(SHORT_SUFFIXES.length - 1, Math.floor(Math.log10(n) / 3));
  if (idx <= 0) return Math.floor(n).toLocaleString('en-US');
  const mant = n / Math.pow(1000, idx);
  return trim(mant, 2) + SHORT_SUFFIXES[idx];
}

function trim(n, d) {
  return n.toFixed(d).replace(/\.?0+$/, '');
}

const GEN_TIERS = [
  { base: [
    { id: 'brush',        icon: 'fa-broom',           es: 'Cepillo de dientes',        en: 'Toothbrush',           desc_es: 'Un cepillo vibrante que recolecta solo.',           desc_en: 'A vibrating brush that collects on its own.' },
    { id: 'floss',        icon: 'fa-ribbon',          es: 'Hilo dental',               en: 'Dental floss',         desc_es: 'Pulido meticuloso entre cada molar.',                desc_en: 'Meticulous polishing between every molar.' },
    { id: 'mouthwash',    icon: 'fa-prescription-bottle', es: 'Enjuague bucal',        en: 'Mouthwash',            desc_es: 'Elimina bacterias en piloto automático.',            desc_en: 'Obliterates bacteria on autopilot.' },
    { id: 'toothpaste',   icon: 'fa-toothbrush',      es: 'Pasta dental premium',      en: 'Premium toothpaste',   desc_es: 'Menta fresca que hipnotiza a los dientes.',          desc_en: 'Fresh mint that mesmerizes teeth.' },
  ] },
  { base: [
    { id: 'assistant',    icon: 'fa-user',            es: 'Asistente dental',          en: 'Dental assistant',     desc_es: 'Prepara y limpia cada consulta.',                    desc_en: 'Preps and cleans every appointment.' },
    { id: 'hygienist',    icon: 'fa-user-nurse',      es: 'Higienista',                en: 'Hygienist',            desc_es: 'Profilaxis profunda en serie.',                      desc_en: 'Deep cleaning, in bulk.' },
    { id: 'dentist',      icon: 'fa-user-doctor',     es: 'Odontólogo/a',              en: 'Dentist',              desc_es: 'Consultas y tratamientos completos.',                desc_en: 'Full consultations and treatments.' },
    { id: 'orthodontist', icon: 'fa-user-doctor',     es: 'Ortodoncista',              en: 'Orthodontist',         desc_es: 'Alinea sonrisas con precisión quirúrgica.',           desc_en: 'Aligns smiles with surgical precision.' },
    { id: 'endodontist',  icon: 'fa-user-doctor',     es: 'Endodoncista',              en: 'Endodontist',          desc_es: 'Salva nervios que otros abandonan.',                  desc_en: 'Saves nerves others abandon.' },
    { id: 'periodontist', icon: 'fa-user-doctor',     es: 'Periodoncista',             en: 'Periodontist',         desc_es: 'Cuida encías al milímetro.',                          desc_en: 'Gum care, millimeter by millimeter.' },
  ] },
  { base: [
    { id: 'office',       icon: 'fa-house',           es: 'Consultorio privado',       en: 'Private practice',     desc_es: 'Un consultorio con lista de espera.',                desc_en: 'A practice with a waiting list.' },
    { id: 'clinic',       icon: 'fa-hospital',        es: 'Clínica odontológica',      en: 'Dental clinic',        desc_es: 'Equipo multidisciplinario bajo un techo.',           desc_en: 'Multidisciplinary team, one roof.' },
    { id: 'lab',          icon: 'fa-flask-vial',      es: 'Laboratorio dental',        en: 'Dental lab',           desc_es: 'Produce coronas y prótesis a escala.',               desc_en: 'Crafts crowns and prosthetics at scale.' },
    { id: 'franchise',    icon: 'fa-building',        es: 'Franquicia regional',       en: 'Regional franchise',   desc_es: 'Cadena con protocolos unificados.',                  desc_en: 'Chain with unified protocols.' },
    { id: 'university',   icon: 'fa-graduation-cap',  es: 'Facultad de odontología',   en: 'Dental school',        desc_es: 'Forma generaciones enteras de odontólogos.',         desc_en: 'Trains entire generations of dentists.' },
    { id: 'megaclinic',   icon: 'fa-city',            es: 'Mega-clínica urbana',       en: 'Urban mega-clinic',    desc_es: 'Atiende una ciudad entera.',                         desc_en: 'Serves an entire city.' },
  ] },
  { base: [
    { id: 'xray',         icon: 'fa-magnifying-glass',es: 'Centro de radiología',      en: 'Radiology center',     desc_es: 'Panorámicas tridimensionales a demanda.',            desc_en: 'On-demand 3D panoramics.' },
    { id: 'scanner',      icon: 'fa-camera',          es: 'Escáner intraoral',         en: 'Intraoral scanner',    desc_es: 'Mapa digital de cada arcada.',                       desc_en: 'Digital map of every arch.' },
    { id: 'mill',         icon: 'fa-industry',        es: 'Fresadora CAD/CAM',         en: 'CAD/CAM mill',         desc_es: 'Corona perfecta en 20 minutos.',                     desc_en: 'A perfect crown in 20 minutes.' },
    { id: 'ai',           icon: 'fa-microchip',       es: 'IA diagnóstica',            en: 'Diagnostic AI',        desc_es: 'Detecta caries antes que existan.',                  desc_en: 'Spots caries before they exist.' },
    { id: 'robot',        icon: 'fa-robot',           es: 'Brazo robótico quirúrgico', en: 'Robotic surgical arm', desc_es: 'Ortognática sin temblor humano.',                    desc_en: 'Orthognathic surgery with zero tremor.' },
    { id: 'nanobot',      icon: 'fa-atom',            es: 'Enjambre de nanobots',      en: 'Nanobot swarm',        desc_es: 'Un ejército microscópico por molar.',                desc_en: 'A microscopic army per molar.' },
  ] },
  { base: [
    { id: 'fairy',        icon: 'fa-wand-sparkles',   es: 'Hadita de los dientes',     en: 'Tooth fairy',          desc_es: 'Deja monedas, se lleva incisivos.',                  desc_en: 'Leaves coins, takes incisors.' },
    { id: 'fairy_queen',  icon: 'fa-crown',           es: 'Reina de las haditas',      en: 'Fairy queen',          desc_es: 'Comanda todas las haditas del mundo.',               desc_en: 'Commands every fairy worldwide.' },
    { id: 'wizard',       icon: 'fa-hat-wizard',      es: 'Mago odontomántico',        en: 'Odonto-mancer',        desc_es: 'Conjura caninos de la nada.',                        desc_en: 'Conjures canines from thin air.' },
    { id: 'druid',        icon: 'fa-leaf',            es: 'Druida de marfil',          en: 'Ivory druid',          desc_es: 'Cultiva dientes como si fueran plantas.',            desc_en: 'Grows teeth like they were plants.' },
    { id: 'alchemist',    icon: 'fa-flask',           es: 'Alquimista del esmalte',    en: 'Enamel alchemist',     desc_es: 'Convierte cobre en esmalte puro.',                   desc_en: 'Turns copper into pure enamel.' },
  ] },
  { base: [
    { id: 'dragon',       icon: 'fa-dragon',          es: 'Dragón odontólogo',         en: 'Dragon dentist',       desc_es: 'Cura caries con aliento de menta.',                  desc_en: 'Heals caries with minty breath.' },
    { id: 'leviathan',    icon: 'fa-fish',            es: 'Leviatán de los mares',     en: 'Deep leviathan',       desc_es: 'Cada escama es un molar perfecto.',                  desc_en: 'Each scale, a perfect molar.' },
    { id: 'phoenix',      icon: 'fa-fire',            es: 'Fénix de porcelana',        en: 'Porcelain phoenix',    desc_es: 'Renace con los dientes más blancos.',                desc_en: 'Reborn with whiter teeth.' },
    { id: 'kraken',       icon: 'fa-water',           es: 'Kraken de ocho cepillos',   en: 'Eight-brush kraken',   desc_es: 'Higiene submarina profesional.',                     desc_en: 'Professional underwater hygiene.' },
    { id: 'titan',        icon: 'fa-person',          es: 'Titán de la sonrisa',       en: 'Smile titan',          desc_es: 'Su risa hace temblar continentes.',                  desc_en: 'His laughter shakes continents.' },
  ] },
  { base: [
    { id: 'templar',      icon: 'fa-shield-halved',   es: 'Templar del esmalte',       en: 'Enamel templar',       desc_es: 'Cruzada eterna contra las caries.',                  desc_en: 'Eternal crusade against caries.' },
    { id: 'saint',        icon: 'fa-dove',            es: 'Santa de los molares',      en: 'Saint of molars',      desc_es: 'Canonizada por sonrisa perfecta.',                   desc_en: 'Canonized for a perfect smile.' },
    { id: 'seraph',       icon: 'fa-feather',         es: 'Serafín dental',            en: 'Dental seraph',        desc_es: 'Seis alas, treinta y dos dientes.',                  desc_en: 'Six wings, thirty-two teeth.' },
    { id: 'god_minor',    icon: 'fa-sun',             es: 'Dios menor de la sonrisa',  en: 'Minor smile god',      desc_es: 'Aceptado en el panteón dental.',                     desc_en: 'Admitted to the dental pantheon.' },
    { id: 'god_major',    icon: 'fa-moon',            es: 'Deidad del incisivo',       en: 'Incisor deity',        desc_es: 'Los dientes de leche son su ofrenda.',               desc_en: 'Baby teeth are its offering.' },
  ] },
  { base: [
    { id: 'country_dep',  icon: 'fa-landmark',        es: 'Ministerio dental nacional',en: 'National dental ministry', desc_es: 'Un país entero cepilla a la vez.',             desc_en: 'A whole country brushes at once.' },
    { id: 'continent',    icon: 'fa-globe',           es: 'Unión odontológica continental', en: 'Continental dental union', desc_es: 'Cinco continentes, una sola sonrisa.',       desc_en: 'Five continents, one smile.' },
    { id: 'planet',       icon: 'fa-earth-americas',  es: 'Consorcio dental planetario',en: 'Planetary dental consortium', desc_es: 'La Tierra entera es tu paciente.',           desc_en: 'Earth itself is your patient.' },
    { id: 'moon_base',    icon: 'fa-circle',          es: 'Base dental lunar',         en: 'Lunar dental base',    desc_es: 'Gravedad baja, productividad alta.',                 desc_en: 'Low gravity, high productivity.' },
    { id: 'mars_colony',  icon: 'fa-rocket',          es: 'Colonia odontológica marciana', en: 'Martian dental colony', desc_es: 'Polvo rojo, dientes blancos.',                   desc_en: 'Red dust, white teeth.' },
  ] },
  { base: [
    { id: 'starport',     icon: 'fa-rocket',          es: 'Puerto estelar de ortodoncia', en: 'Orthodontic starport', desc_es: 'Importa esmalte de cien sistemas.',              desc_en: 'Imports enamel from a hundred systems.' },
    { id: 'dyson',        icon: 'fa-sun',             es: 'Esfera de Dyson dental',    en: 'Dental Dyson sphere',  desc_es: 'Captura la energía de una estrella para pulir.',     desc_en: 'Harvests a star for polishing power.' },
    { id: 'galaxy_bank',  icon: 'fa-landmark-flag',   es: 'Banco dental galáctico',    en: 'Galactic dental bank', desc_es: 'Custodia dientes de diez mil razas.',                desc_en: 'Safeguards teeth from ten thousand species.' },
    { id: 'cluster',      icon: 'fa-star',            es: 'Cúmulo dental',             en: 'Dental cluster',       desc_es: 'Millones de estrellas orbitando una muela.',         desc_en: 'Millions of stars orbit a single molar.' },
  ] },
  { base: [
    { id: 'timeloop',     icon: 'fa-infinity',        es: 'Bucle temporal de higiene', en: 'Hygiene time loop',    desc_es: 'Se cepilla ayer, hoy y mañana a la vez.',            desc_en: 'Brushes yesterday, today, and tomorrow at once.' },
    { id: 'multiverse',   icon: 'fa-diagram-project', es: 'Nodo multiversal',          en: 'Multiversal node',     desc_es: 'Recolecta dientes de universos paralelos.',          desc_en: 'Harvests teeth from parallel universes.' },
    { id: 'singularity',  icon: 'fa-circle-dot',      es: 'Singularidad odontológica', en: 'Odontological singularity', desc_es: 'Consciencia dental que abarca todo.',          desc_en: 'Dental consciousness spanning everything.' },
    { id: 'void',         icon: 'fa-circle',          es: 'Vacío entre dientes',       en: 'Void between teeth',   desc_es: 'El espacio negativo que todo lo produce.',           desc_en: 'The negative space that produces all.' },
    { id: 'omega',        icon: 'fa-om',              es: 'Omega Odontos',             en: 'Omega Odontos',        desc_es: 'El diente final. La sonrisa última.',                desc_en: 'The final tooth. The ultimate smile.' },
  ] },
];

function buildGenerators() {
  const out = [];
  let baseCost = 33.75;
  let baseProduction = 0.2;
  for (let tier = 0; tier < GEN_TIERS.length; tier++) {
    const items = GEN_TIERS[tier].base;
    for (const it of items) {
      const idx = out.length;
      const cost = Math.round(baseCost);
      const prod = idx === 0 ? baseProduction : Math.round(baseProduction);
      const unlock = idx === 0 ? 0 : Math.round(cost * 0.55);
      out.push({
        id: it.id, baseCost: cost, baseProduction: prod, unlockAt: unlock,
        icon: 'fa-solid ' + it.icon, es: it.es, en: it.en,
        desc_es: it.desc_es, desc_en: it.desc_en, tier,
      });
      baseCost *= 7.5;
      baseProduction *= 6.6;
    }
  }
  return out;
}

const GENERATORS = buildGenerators();

const UPGRADE_NAMES = {
  flat: [
    ['Mango ergonómico', 'Ergonomic handle'],['Cabezal ultrasonido', 'Ultrasonic head'],
    ['Guantes de precisión', 'Precision gloves'],['Lupa quirúrgica', 'Surgical loupe'],
    ['Láser de pulido', 'Polishing laser'],['Sistema robotizado', 'Robotic system'],
    ['Nano-cepillo cuántico', 'Quantum nano-brush'],['Guante exo-mecánico', 'Exo-mechanical glove'],
    ['Dedal de titanio', 'Titanium thimble'],['Pincel diamantado', 'Diamond brush'],
    ['Lápiz de plasma', 'Plasma stylus'],['Hoja vibrosónica', 'Vibrosonic blade'],
    ['Aguja de cristal', 'Crystal needle'],['Estilete celeste', 'Celestial stylus'],
    ['Martillo del esmalte', 'Enamel hammer'],['Taladro de obsidiana', 'Obsidian drill'],
    ['Vara de la sonrisa', 'Wand of the smile'],['Garra de ortodoncia', 'Orthodontic claw'],
    ['Colmillo del arcángel', 'Archangel fang'],['Cetro odontológico', 'Dental scepter'],
    ['Hoja cósmica', 'Cosmic blade'],['Dedo del creador', 'Creator finger'],
  ],
  mult: [
    ['Mano firme', 'Firm hand'],['Muñeca entrenada', 'Trained wrist'],
    ['Ojo clínico', 'Clinical eye'],['Técnica impecable', 'Flawless technique'],
    ['Intuición odontológica', 'Dental intuition'],['Trance profesional', 'Professional trance'],
    ['Flujo maestro', 'Master flow'],['Canalización dental', 'Dental channeling'],
    ['Velocidad sobrenatural', 'Supernatural speed'],['Percepción expandida', 'Expanded perception'],
    ['Estado primordial', 'Primordial state'],['Conciencia absoluta', 'Absolute awareness'],
  ],
  perGen: [
    ['Sindicato de {gen}', 'Guild of {gen}'],['Formación continua: {gen}', 'Training: {gen}'],
    ['Doctrina del/de la {gen}', 'Doctrine of {gen}'],['Inspiración: {gen}', 'Inspiration: {gen}'],
    ['Pacto con {gen}', 'Pact with {gen}'],['Bendición del/de la {gen}', 'Blessing of {gen}'],
    ['Legado del/de la {gen}', 'Legacy of {gen}'],['Culto a {gen}', 'Cult of {gen}'],
  ],
  perAch: [
    ['Vitrina de logros', 'Trophy cabinet'],['Reputación profesional', 'Professional reputation'],
    ['Mentor legendario', 'Legendary mentor'],['Orgullo acumulado', 'Accumulated pride'],
    ['Ceremonial de triunfos', 'Ceremony of triumphs'],
  ],
  perSec: [
    ['Resonancia pasiva', 'Passive resonance'],['Sincronía productiva', 'Productive sync'],
    ['Rebote cíclico', 'Cyclical bounce'],['Onda amplificada', 'Amplified wave'],
    ['Eco perpetuo', 'Perpetual echo'],
  ],
  timeBonus: [
    ['Oficio del/de la veterano/a', "Veteran's craft"],['Meditación prolongada', 'Prolonged meditation'],
    ['Paciencia milenaria', 'Millennial patience'],['Constancia absoluta', 'Absolute constancy'],
  ],
};

const UPGRADE_ICONS = {
  flat: ['fa-hand-pointer', 'fa-bolt', 'fa-wrench', 'fa-screwdriver', 'fa-gem'],
  mult: ['fa-fire', 'fa-star', 'fa-wand-magic-sparkles', 'fa-sun'],
  perGen: ['fa-people-group', 'fa-book', 'fa-graduation-cap'],
  perAch: ['fa-trophy', 'fa-medal', 'fa-ribbon'],
  perSec: ['fa-repeat', 'fa-rotate', 'fa-wave-square'],
  timeBonus: ['fa-hourglass-half', 'fa-clock', 'fa-stopwatch'],
};

function buildClickUpgrades() {
  const out = [];
  let cost = 1125; // Increased by 125% (original 500 * 2.25)
  const MULT = 4.2;
  const types = ['flat','flat','flat','mult','mult','flat','perAch','flat','mult','flat','mult','mult','timeBonus','flat'];
  let flatVal = 1;
  const nameIdx = { flat: 0, mult: 0, perGen: 0, perAch: 0, perSec: 0, timeBonus: 0 };
  for (let i = 0; i < 120; i++) {
    const type = types[i % types.length];
    const nameList = UPGRADE_NAMES[type];
    const iconList = UPGRADE_ICONS[type];
    const idx = nameIdx[type]++ % nameList.length;
    const [esName, enName] = nameList[idx];
    const icon = iconList[idx % iconList.length];
    const up = { id: 'u' + i, cost: Math.round(cost), unlockAt: Math.round(cost * 0.6), type, icon: 'fa-solid ' + icon };
    if (type === 'flat') {
      up.value = Math.max(1, Math.round(flatVal));
      up.es = esName + ' ' + romanize(Math.floor(i / 14) + 1);
      up.en = enName + ' ' + romanize(Math.floor(i / 14) + 1);
      up.desc_es = `+${formatNumWithMode(up.value, 'short')} dientes por click`;
      up.desc_en = `+${formatNumWithMode(up.value, 'short')} teeth per click`;
      flatVal *= 4.5;
    } else if (type === 'mult') {
      up.value = 1.75;
      up.es = esName + ' ' + romanize(Math.floor(i / 14) + 1);
      up.en = enName + ' ' + romanize(Math.floor(i / 14) + 1);
      up.desc_es = `×1.75 poder de click`;
      up.desc_en = `×1.75 click power`;
    } else if (type === 'perAch') {
      up.value = 1.5;
      up.es = esName + ' ' + romanize(Math.floor(i / 14) + 1);
      up.en = enName + ' ' + romanize(Math.floor(i / 14) + 1);
      up.desc_es = `+1.5 % al click por cada logro desbloqueado`;
      up.desc_en = `+1.5 % to click per achievement unlocked`;
    } else if (type === 'timeBonus') {
      up.threshold = 3600 * (Math.floor(i / 14) + 1); up.value = 20;
      up.es = esName + ' ' + romanize(Math.floor(i / 14) + 1);
      up.en = enName + ' ' + romanize(Math.floor(i / 14) + 1);
      const hrs = up.threshold / 3600;
      up.desc_es = `+20 % al click tras ${hrs} h de juego`;
      up.desc_en = `+20 % to click after ${hrs} h played`;
    }
    out.push(up);
    cost *= MULT;
  }
  return out;
}

function romanize(n) {
  const vals = [[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
  let r = '';
  for (const [v, s] of vals) while (n >= v) { r += s; n -= v; }
  return r || 'I';
}

const CLICK_UPGRADES = buildClickUpgrades();

function buildAchievements() {
  const out = [];
  const clickMs = [100, 1000, 5000, 15000, 50000, 100000, 250000, 500000, 1000000, 2500000, 5000000, 10000000, 25000000, 50000000, 100000000, 250000000, 500000000, 1000000000, 5000000000, 10000000000];
  const clickTitles = [
    ['Dedo inquieto','Restless finger'],['Entrenamiento básico','Basic training'],['Ritmo constante','Steady rhythm'],
    ['Dedo de acero','Steel finger'],['Media tonelada','Half ton'],['Cien mil golpes','Hundred thousand strikes'],
    ['Poder puro','Pure power'],['Maestro del click','Click master'],['Velocista sónico','Sonic sprinter'],
    ['Escalador de montañas','Mountain climber'],['Un millón','One million'],['Tormenta de clicks','Click storm'],
    ['Aluvión incesante','Relentless avalanche'],['Fuerza de la naturaleza','Force of nature'],['Golpe sísmico','Seismic strike'],
    ['Martillo cósmico','Cosmic hammer'],['Clickapocalipsis','Clickapocalypse'],['Fractura espacial','Spatial fracture'],
    ['Cincuenta mil millones','Fifty billion'],['Cien mil millones','Hundred billion'],
  ];
  clickMs.forEach((v, i) => {
    const [es, en] = clickTitles[i];
    out.push({ id: 'click_' + i, check: (s) => s.totalClicks >= v, es, en,
      desc_es: `${v.toLocaleString('es-AR')} clicks totales`, desc_en: `${v.toLocaleString('en-US')} total clicks`, cat: 'clicks' });
  });

  const earnMs = [1e6, 1e8, 1e10, 1e12, 1e14, 1e16, 1e18, 1e21, 1e24, 1e27, 1e30, 1e35, 1e40, 1e45, 1e50, 1e60, 1e70, 1e80, 1e90, 1e100, 1e120, 1e140, 1e160, 1e180, 1e200, 1e220, 1e250, 1e280, 1e300, 1e308];
  const earnTitles = [
    ['Millón inicial','Initial million'],['Cien millones','Hundred million'],['Diez mil millones','Ten billion'],
    ['Billón','Trillion'],['Cien billones','Hundred trillion'],['Trillón','Quintillion'],['Trillón absoluto','Absolute quintillion'],
    ['Septillón','Septillion'],['Octillón','Octillion'],['Nonillón','Nonillion'],['Decillón','Decillion'],
    ['Quindecillón','Quindecillion'],['Vigintillón','Vigintillion'],['Trigintillón','Trigintillion'],
    ['Cuadragintillón','Quadragintillion'],['Quinquagintillón','Quinquagintillion'],['Sexagintillón','Sexagintillion'],
    ['Septuagintillón','Septuagintillion'],['Octogintillón','Octogintillion'],['Nonagintillón','Nonagintillion'],
    ['Centillón','Centillion'],['Doscientos ceros','Two hundred zeros'],['Vacío numérico','Numerical void'],
    ['Esmalte cósmico','Cosmic enamel'],['Molar universal','Universal molar'],['Sonrisa absoluta','Absolute smile'],
    ['Singularidad dental','Dental singularity'],['Más allá de la realidad','Beyond reality'],
    ['Final del camino','End of the road'],['El número de Dios','God\'s number'],
  ];
  earnMs.forEach((v, i) => {
    const [es, en] = earnTitles[i];
    out.push({ id: 'earn_' + i, check: (s) => (s.lifetimeEarned || s.totalEarned) >= v, es, en,
      desc_es: `Gana ${formatNumWithMode(v, 'short')} dientes en total`, desc_en: `Earn ${formatNumWithMode(v, 'short')} teeth in total`, cat: 'earned' });
  });

  const ownMs = [25, 100, 250, 500, 1000, 2500, 5000, 7500, 10000, 25000];
  const ownTitles = [
    ['Cuarto de centenar','Quarter hundred'],['Centenario','Centennial'],['Dos cincuenta','Two fifty'],
    ['Medio millar','Half thousand'],['Millar completo','Full thousand'],['Doble millar y medio','Two thousand five hundred'],
    ['Cinco mil','Five thousand'],['Siete mil quinientos','Seven thousand five hundred'],['Diez mil','Ten thousand'],['Ejército dental','Dental army'],
  ];
  for (let g = 0; g < Math.min(20, GENERATORS.length); g++) {
    const gen = GENERATORS[g];
    ownMs.forEach((v, i) => {
      const [esT, enT] = ownTitles[i];
      out.push({ id: 'own_' + gen.id + '_' + v, check: (s) => (s.generators?.[gen.id] || 0) >= v,
        es: esT.replace('{gen}', gen.es.toLowerCase()), en: enT.replace('{gen}', gen.en.toLowerCase()),
        desc_es: `Ten ${v} ${gen.es.toLowerCase()}`, desc_en: `Own ${v} ${gen.en.toLowerCase()}`, cat: 'gen' });
    });
  }

  const prestMs = [10, 50, 250, 1000, 5000, 25000, 100000, 500000, 1000000, 10000000, 50000000, 100000000];
  const prestTitles = [
    ['Primeros diez','First ten'],['Cincuenta ciclos','Fifty cycles'],['Cuarto de millar','Quarter thousand'],
    ['Ciclo milenario','Millenary cycle'],['Cinco mil veces','Five thousand times'],['Veinticinco mil','Twenty-five thousand'],
    ['Cien mil renaceres','Hundred thousand rebirths'],['Medio millón','Half million'],
    ['Un millón dorado','Golden million'],['Diez millones','Ten million'],
    ['Cincuenta millones','Fifty million'],['Cien millones','Hundred million'],
  ];
  prestMs.forEach((v, i) => {
    const [es, en] = prestTitles[i];
    out.push({ id: 'prest_' + i, check: (s) => (s.prestige || 0) >= v, es, en,
      desc_es: `Acumula ${v} sonrisas doradas`, desc_en: `Collect ${v} golden smiles`, cat: 'prestige' });
  });

  const goldMs = [10, 50, 100, 250, 500, 1000, 5000, 10000, 25000, 50000, 100000, 1000000];
  const goldTitles = [
    ['Diez destellos','Ten sparkles'],['Medio centenar','Half hundred'],['Centenario dorado','Golden centennial'],['Cuarto de millar','Quarter thousand'],
    ['Medio millar','Half thousand'],['Mil relámpagos','Thousand lightning'],['Cinco mil','Five thousand'],['Diez mil destellos','Ten thousand sparkles'],
    ['Cazador legendario','Legendary hunter'],['Cincuenta mil','Fifty thousand'],['Cien mil','Hundred thousand'],['Dorado absoluto','Absolute gold'],
  ];
  goldMs.forEach((v, i) => {
    const [es, en] = goldTitles[i];
    out.push({ id: 'gold_' + i, check: (s) => (s.goldenClicks || 0) >= v, es, en,
      desc_es: `Atrapa ${v} diente${v===1?'':'s'} dorado${v===1?'':'s'}`, desc_en: `Catch ${v} golden t${v===1?'ooth':'eeth'}`, cat: 'golden' });
  });

  const bonusTypes = [
    { key: 'specialGoldClicks', es: 'Diente de oro especial', en: 'Special gold tooth', cat: 'gold_special' },
    { key: 'diamondClicks', es: 'Diente de diamante', en: 'Diamond tooth', cat: 'diamond' },
    { key: 'crystalClicks', es: 'Diente de cristal', en: 'Crystal tooth', cat: 'crystal' }
  ];
  const bonusMs = [100, 250, 500, 1000];
  bonusTypes.forEach(bt => {
    bonusMs.forEach(v => {
      out.push({
        id: bt.key + '_' + v,
        check: (s) => (s[bt.key] || 0) >= v,
        es: `${bt.es} x${v}`,
        en: `${bt.en} x${v}`,
        desc_es: `Atrapa ${v} ${bt.es.toLowerCase()}s`,
        desc_en: `Catch ${v} ${bt.en.toLowerCase()}s`,
        cat: bt.cat
      });
    });
  });

  const timeMs = [3600, 3600*12, 86400, 86400*3, 86400*7, 86400*30, 86400*90, 86400*180, 86400*365, 86400*1000];
  const timeTitles = [
    ['Una hora','One hour'],['Medio día','Half a day'],['Un día','A day'],
    ['Tres días','Three days'],['Una semana','A week'],['Un mes','A month'],
    ['Tres meses','Three months'],['Seis meses','Six months'],['Un año','A year'],['Mil días','Thousand days'],
  ];
  timeMs.forEach((v, i) => {
    const [es, en] = timeTitles[i];
    out.push({ id: 'time_' + i, check: (s) => (s.timePlayed || 0) >= v, es, en,
      desc_es: `Juega ${v<3600?Math.round(v/60)+' minutos':Math.round(v/3600)+' horas'}`,
      desc_en: `Play for ${v<3600?Math.round(v/60)+' minutes':Math.round(v/3600)+' hours'}`, cat: 'time' });
  });

  const upMs = [1,5,10,25,50,75,100,110,115,120];
  const upTitles = [
    ['Primera mejora','First upgrade'],['Caja completa','Full box'],['Decena artesanal','Crafted ten'],
    ['Artesano serio','Serious craftsman'],['Maestro','Master'],['Gran maestro','Grandmaster'],
    ['Centenario','Centennial'],['Casi todo','Almost everything'],['Colección completa','Complete collection'],['Perfeccionista','Perfectionist'],
  ];
  upMs.forEach((v, i) => {
    const [es, en] = upTitles[i];
    out.push({ id: 'up_' + i, check: (s) => Object.values(s.clickUpgrades || {}).filter(Boolean).length >= v, es, en,
      desc_es: `Compra ${v} mejoras de click`, desc_en: `Buy ${v} click upgrades`, cat: 'upgrades' });
  });

  const achMs = [10,25,50,100,150,200,250,275,290,300];
  const achTitles = [
    ['Coleccionista novato','Novice collector'],['Cuarto de centenar','Quarter hundred'],
    ['Medio centenar','Half hundred'],['Cien logros','Hundred achievements'],
    ['Ciento cincuenta','One-fifty'],['Doscientos','Two hundred'],['Doscientos cincuenta','Two-fifty'],
    ['Casi completo','Almost complete'],['Casi todos','Nearly all'],['Completista','Completionist'],
  ];
  achMs.forEach((v, i) => {
    const [es, en] = achTitles[i];
    out.push({ id: 'ach_' + i, check: (s) => Object.values(s.achievements || {}).filter(Boolean).length >= v, es, en,
      desc_es: `Desbloquea ${v} logros`, desc_en: `Unlock ${v} achievements`, cat: 'meta' });
  });

  const speedMs = [5, 7, 10, 12, 15, 16, 20, 25, 35, 50, 75, 100];
  const speedTitles = [
    ['Dedo veloz','Fast finger'],['Ritmo de ametralladora','Machine gun rhythm'],['Superviviente del click','Click survivor'],
    ['Reflejos relámpago','Lightning reflexes'],['Velocidad sónica','Sonic speed'],['Tormenta de clicks','Click storm'],
    ['¿Humano o máquina?','Human or machine?'],['Procesador biológico','Biological processor'],['Súper Computadora','Super Computer'],
    ['Dios del Click','Click God'],['Velocidad de la Luz','Light Speed'],['Singularidad del Diente','Tooth Singularity']
  ];
  speedMs.forEach((v, i) => {
    const [es, en] = speedTitles[i];
    out.push({ id: 'speed_' + i, check: (s) => (s.maxCPS || 0) >= v, es, en,
      desc_es: `Alcanza ${v} clicks por segundo`, desc_en: `Reach ${v} clicks per second`, cat: 'speed' });
  });

  out.push({ id: 'feedback_first', check: (s) => s.feedbackSent, es: 'Crítico de Dientes', en: 'Tooth Critic', desc_es: 'Envía tu primer feedback', desc_en: 'Send your first feedback', cat: 'social' });

  const secrets = [
    { id: 'sec_speedrun', es: 'Velocidad de la luz', en: 'Light speed', desc_es: '1,000,000,000 de dientes en menos de 30 min', desc_en: '1,000,000,000 teeth within the first 30 min', check: (s) => (s.lifetimeEarned || s.totalEarned) >= 1_000_000_000 && s.timePlayed <= 1800 },
    { id: 'sec_clicker', es: 'Clicker fundamentalista', en: 'Fundamentalist clicker', desc_es: '1,000,000 dientes sin comprar generadores', desc_en: '1,000,000 teeth without buying generators', check: (s) => (s.lifetimeEarned || s.totalEarned) >= 1_000_000 && Object.values(s.generators || {}).reduce((a,b)=>a+b,0) === 0 },
    { id: 'sec_idle', es: 'Estatua de marfil', en: 'Ivory statue', desc_es: 'Jugá 24h sin hacer un solo click', desc_en: 'Play 24h without a single click', check: (s) => s.timePlayed >= 86400 && s.totalClicks === 0 },
    { id: 'sec_diverse', es: 'Coleccionista total', en: 'Total collector', desc_es: 'Ten al menos 100 de cada uno de los primeros 15 generadores', desc_en: 'Own at least 100 of each of the first 15 generators', check: (s) => GENERATORS.slice(0, 15).every(g => (s.generators?.[g.id] || 0) >= 100) },
    { id: 'sec_mono_brush', es: 'Obsesión por la limpieza', en: 'Cleaning obsession', desc_es: 'Ten 5000 cepillos y nada más', desc_en: 'Own 5000 brushes and nothing else', check: (s) => (s.generators?.brush || 0) >= 5000 && Object.entries(s.generators || {}).filter(([k,v]) => k !== 'brush' && v > 0).length === 0 },
    { id: 'sec_no_prest', es: 'Inmortal', en: 'Immortal', desc_es: 'Alcanza 1Qa de dientes sin prestigiar', desc_en: 'Reach 1Qa teeth without prestiging', check: (s) => (s.lifetimeEarned || s.totalEarned) >= 1e15 && (s.prestige || 0) === 0 },
    { id: 'sec_minimal', es: 'Eficiencia extrema', en: 'Extreme efficiency', desc_es: 'Llega a 1B de producción/s con menos de 20 generadores en total', desc_en: 'Reach 1B production/s with fewer than 20 generators total', check: (s) => { const ps = window.computePerSecond && window.computePerSecond(s); return (ps || 0) >= 1e9 && Object.values(s.generators || {}).reduce((a,b)=>a+b,0) < 20; } },
    { id: 'sec_golden5', es: 'Imán dorado', en: 'Golden magnet', desc_es: 'Atrapa 50 dientes dorados en una sola sesión', desc_en: 'Catch 50 golden teeth in a single session', check: (s) => (s.goldenClicks || 0) >= 50 && s.timePlayed <= 3600 },
    { id: 'sec_marathon', es: 'Eternidad', en: 'Eternity', desc_es: 'Jugá 1000h en total', desc_en: 'Play 1000h in total', check: (s) => s.timePlayed >= 3600 * 1000 },
    { id: 'sec_click_king', es: 'Dios del click', en: 'Click god', desc_es: '1B de dientes solo con clicks', desc_en: '1B teeth through clicks alone', check: (s) => (s.totalClicks || 0) * 10 >= 1e9 && (s.lifetimeEarned || s.totalEarned) >= 1e9 },
    { id: 'sec_all_click_ups', es: 'Artesanía total', en: 'Total craftsmanship', desc_es: 'Compra todas las mejoras de click', desc_en: 'Buy every click upgrade', check: (s) => Object.values(s.clickUpgrades || {}).filter(Boolean).length >= CLICK_UPGRADES.length },
    { id: 'sec_50_prest', es: 'Ciclo infinito', en: 'Infinite cycle', desc_es: 'Prestigia 1000 veces', desc_en: 'Prestige 1000 times', check: (s) => (s.prestigeCount || 0) >= 1000 },
    { id: 'sec_atom_blessing', es: 'Omnisciencia dental', en: 'Dental omniscience', desc_es: '1e100 dientes totales', desc_en: '1e100 total teeth', check: (s) => (s.lifetimeEarned || s.totalEarned) >= 1e100 },
    { id: 'sec_fairy_queen', es: 'Imperio de fantasía', en: 'Fantasy empire', desc_es: 'Ten 500 reinas de las haditas', desc_en: 'Own 500 fairy queens', check: (s) => (s.generators?.fairy_queen || 0) >= 500 },
    { id: 'sec_dragon_hoard', es: 'Tesoro del multiverso', en: 'Multiverse hoard', desc_es: 'Ten 1000 dragones odontólogos', desc_en: 'Own 1000 dragon dentists', check: (s) => (s.generators?.dragon || 0) >= 1000 },
    { id: 'sec_omega', es: 'Omega alcanzado', en: 'Omega reached', desc_es: 'Ten 10 Omega Odontos', desc_en: 'Own 10 Omega Odontos', check: (s) => (s.generators?.omega || 0) >= 10 },
    { id: 'sec_patient', es: 'Zen dental', en: 'Dental Zen', desc_es: '100h de juego sin un solo click manual', desc_en: '100h played without a single manual click', check: (s) => s.timePlayed >= 3600 * 100 && s.totalClicks === 0 },
    { id: 'sec_hydra', es: 'Zoológico mítico', en: 'Mythic zoo', desc_es: '500 de cada criatura mítica (tier 5)', desc_en: '500 of each mythic creature (tier 5)', check: (s) => ['dragon','leviathan','phoenix','kraken','titan'].every(id => (s.generators?.[id] || 0) >= 500) },
    { id: 'sec_divine', es: 'Olimpo dental', en: 'Dental Olympus', desc_es: '250 de cada deidad (tier 6)', desc_en: '250 of each deity (tier 6)', check: (s) => ['templar','saint','seraph','god_minor','god_major'].every(id => (s.generators?.[id] || 0) >= 250) },
    { id: 'sec_balance', es: 'Armonía perfecta', en: 'Perfect harmony', desc_es: 'Exactamente 420 de cada uno de los primeros 10 generadores', desc_en: 'Exactly 420 of each of the first 10 generators', check: (s) => GENERATORS.slice(0, 10).every(g => (s.generators?.[g.id] || 0) === 420) },
    { id: 'sec_lucky777', es: 'Jackpot de marfil', en: 'Ivory jackpot', desc_es: 'Exactamente 7,777,777 clicks totales', desc_en: 'Exactly 7,777,777 total clicks', check: (s) => s.totalClicks === 7777777 },
    { id: 'sec_bigspender', es: 'Magnate dental', en: 'Dental tycoon', desc_es: 'Gana 1Qa y ten 0 dientes disponibles', desc_en: 'Earn 1Qa and keep 0 teeth in hand', check: (s) => s.totalEarned >= 1e15 && s.teeth === 0 },
    { id: 'sec_hoarder', es: 'Agujero negro dental', en: 'Dental black hole', desc_es: '1Qa de dientes acumulados sin gastar', desc_en: 'Hold 1Qa teeth without spending', check: (s) => s.teeth >= 1e15 },
    { id: 'sec_night_owl', es: 'Vigilante nocturno', en: 'Night watchman', desc_es: 'Juega 10h entre las 00:00 y 04:00', desc_en: 'Play 10h between 00:00 and 04:00', check: (s) => { const h = new Date().getHours(); return h >= 0 && h < 4 && s.totalClicks > 0 && s.timePlayed >= 36000; } },
    { id: 'sec_early_bird', es: 'Halcón del alba', en: 'Dawn falcon', desc_es: 'Juega 10h entre las 05:00 y 07:00', desc_en: 'Play 10h between 05:00 and 07:00', check: (s) => { const h = new Date().getHours(); return h >= 5 && h < 7 && s.totalClicks > 0 && s.timePlayed >= 36000; } },
    { id: 'sec_friday13', es: 'Maldición del viernes', en: 'Friday curse', desc_es: 'Juega un viernes 13 por 5h', desc_en: 'Play on Friday the 13th for 5h', check: (s) => { const d = new Date(); return d.getDay() === 5 && d.getDate() === 13 && s.timePlayed >= 3600 * 5; } },
    { id: 'sec_palindrome', es: 'Simetría absoluta', en: 'Absolute symmetry', desc_es: 'Clicks totales: 1,234,321', desc_en: 'Exactly 1,234,321 total clicks', check: (s) => s.totalClicks === 1234321 },
    { id: 'sec_master', es: 'Dios de Tooth Clicker', en: 'God of Tooth Clicker', desc_es: 'Desbloquea todos los logros', desc_en: 'Unlock every achievement', check: (s) => Object.values(s.achievements || {}).filter(Boolean).length >= 400 },
    { id: 'sec_prodigy', es: 'Heredero del trono', en: 'Heir to the throne', desc_es: 'Alcanza 1e100 dientes en un solo prestigio', desc_en: 'Reach 1e100 teeth in a single prestige run', check: (s) => s.totalEarned >= 1e100 },
    { id: 'sec_wizard', es: 'Mago supremo', en: 'Supreme wizard', desc_es: 'Ten 5000 magos odontománticos', desc_en: 'Own 5000 odonto-mancers', check: (s) => (s.generators?.wizard || 0) >= 5000 },
  ];
  for (const sec of secrets) out.push({ ...sec, cat: 'secret', secret: true });
  return out;
}

const ACHIEVEMENTS = buildAchievements();

const COST_SCALE = 1.15;
function genCost(base, owned) { return base * Math.pow(COST_SCALE, owned); }

function formatTime(s) {
  const total = Math.floor(s);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function playTone(freq, dur = 0.08, type = 'sine', vol = 0.05) {
  try {
    const ctx = window._audioCtx || (window._audioCtx = new (window.AudioContext || window.webkitAudioContext)());
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type; osc.frequency.value = freq; gain.gain.value = vol;
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + dur);
  } catch (e) {}
}

function computeClickPower(state) {
  let flat = 1, mult = 1;
  const ups = state.clickUpgrades || {};
  const achCount = Object.values(state.achievements || {}).filter(Boolean).length;
  const timePlayed = state.timePlayed || 0;
  for (const u of CLICK_UPGRADES) {
    if (!ups[u.id]) continue;
    if (u.type === 'flat') flat += u.value;
    else if (u.type === 'mult') mult *= u.value;
    else if (u.type === 'perAch') { mult *= (1 + (u.value / 100) * achCount); }
    else if (u.type === 'timeBonus') { if (timePlayed >= u.threshold) mult *= (1 + u.value / 100); }
  }
  return { flat, mult, total: flat * mult };
}

Object.assign(window, { APP_VERSION, VERSION_HISTORY, GENERATORS, CLICK_UPGRADES, ACHIEVEMENTS, genCost, formatNumWithMode, formatTime, playTone, computeClickPower, SHORT_SUFFIXES });
