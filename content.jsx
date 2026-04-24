// ==========================================================================
// Tooth Clicker — Game content (generators, click upgrades, achievements)
// ==========================================================================

// ── App Version (single source of truth) ──────────────────────────────────
const APP_VERSION = 'alpha v0.009';
const VERSION_DATE = '2026-04-24';

const VERSION_HISTORY = [
  {
    v: 'alpha v0.009',
    date: '2026-04-24',
    es: 'Sistema de versiones centralizado, historial de versiones en modal Acerca de, versión visible en pantalla principal siempre actualizada',
    en: 'Centralized version system, version history in About modal, main screen version always up to date',
    latest: true,
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

function formatNumWithMode(n, mode = 'short', lang = 'es') {
  if (n === null || n === undefined || !isFinite(n)) return '0';
  if (n < 0) return '-' + formatNumWithMode(-n, mode, lang);
  if (n < 1000) return Math.floor(n).toLocaleString(lang === 'es' ? 'es-AR' : 'en-US');
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
  let baseCost = 15;
  let baseProduction = 0.1;
  for (let tier = 0; tier < GEN_TIERS.length; tier++) {
    const items = GEN_TIERS[tier].base;
    let idx = out.length;
    for (const it of items) {
      const cost = Math.round(baseCost);
      const prod = baseProduction;
      const unlock = idx === 0 ? 0 : Math.round(cost * 0.55);
      out.push({
        id: it.id, baseCost: cost, baseProduction: prod, unlockAt: unlock,
        icon: 'fa-solid ' + it.icon, es: it.es, en: it.en,
        desc_es: it.desc_es, desc_en: it.desc_en, tier,
      });
      idx++;
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
  let cost = 100;
  const MULT = 3.05;
  const types = ['flat','flat','flat','mult','perGen','flat','perAch','flat','perSec','flat','mult','perGen','timeBonus','flat'];
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
      flatVal *= 5;
    } else if (type === 'mult') {
      up.value = 2;
      up.es = esName + ' ' + romanize(Math.floor(i / 14) + 1);
      up.en = enName + ' ' + romanize(Math.floor(i / 14) + 1);
      up.desc_es = `×2 poder de click`;
      up.desc_en = `×2 click power`;
    } else if (type === 'perGen') {
      const genIdx = Math.min(GENERATORS.length - 1, Math.floor(i / 14) * 4);
      const gen = GENERATORS[genIdx];
      up.ref = gen.id; up.refName = { es: gen.es, en: gen.en }; up.value = 1;
      up.es = esName.replace('{gen}', gen.es.toLowerCase());
      up.en = enName.replace('{gen}', gen.en.toLowerCase());
      up.desc_es = `+1 % al click por cada ${gen.es.toLowerCase()}`;
      up.desc_en = `+1 % to click per ${gen.en.toLowerCase()} owned`;
    } else if (type === 'perAch') {
      up.value = 2; up.es = esName; up.en = enName;
      up.desc_es = `+2 % al click por cada logro desbloqueado`;
      up.desc_en = `+2 % to click per achievement unlocked`;
    } else if (type === 'perSec') {
      up.value = 1; up.es = esName; up.en = enName;
      up.desc_es = `+1 % de la producción por segundo se suma al click`;
      up.desc_en = `+1 % of per-second output added to click power`;
    } else if (type === 'timeBonus') {
      up.threshold = 3600 * (Math.floor(i / 14) + 1); up.value = 25;
      up.es = esName + ' ' + romanize(Math.floor(i / 14) + 1);
      up.en = enName + ' ' + romanize(Math.floor(i / 14) + 1);
      const hrs = up.threshold / 3600;
      up.desc_es = `+25 % al click tras ${hrs} h de juego`;
      up.desc_en = `+25 % to click after ${hrs} h played`;
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
  const clickMs = [1,10,50,100,500,1000,5000,10_000,25_000,50_000,100_000,250_000,500_000,1_000_000,2_500_000,5_000_000,10_000_000,25_000_000,50_000_000,100_000_000];
  const clickTitles = [
    ['Primer click','First click'],['Calentando','Warming up'],['Ritmo estable','Steady beat'],
    ['Dedo entrenado','Trained finger'],['Medio mil','Half a grand'],['Mil clicks','One thousand'],
    ['Fuerza bruta','Brute force'],['Callo en el dedo','Calloused finger'],['Velocista','Sprinter'],
    ['Escalador','Climber'],['Cien mil','A hundred thousand'],['Cuarto de millón','Quarter million'],
    ['Medio millón','Half million'],['Un millón de clicks','Million clicker'],['Aluvión','Avalanche'],
    ['Tormenta','Storm'],['Diez millones','Ten million'],['Clickapocalipsis','Clickapocalypse'],
    ['Cincuenta millones','Fifty million'],['Cien millones','Hundred million'],
  ];
  clickMs.forEach((v, i) => {
    const [es, en] = clickTitles[i];
    out.push({ id: 'click_' + i, check: (s) => s.totalClicks >= v, es, en,
      desc_es: `${v.toLocaleString('es-AR')} clicks totales`, desc_en: `${v.toLocaleString('en-US')} total clicks`, cat: 'clicks' });
  });

  const earnMs = [1e3,1e4,1e5,1e6,1e7,1e8,1e9,1e10,1e11,1e12,1e13,1e14,1e15,1e16,1e17,1e18,1e20,1e22,1e25,1e28,1e32,1e36,1e40,1e45,1e50,1e60,1e75,1e90,1e120,1e180];
  const earnTitles = [
    ['Mil dientes','Thousand teeth'],['Diez mil','Ten thousand'],['Cien mil','Hundred thousand'],
    ['Millón de sonrisas','Million smiles'],['Diez millones','Ten million'],['Cien millones','Hundred million'],
    ['Imperio dental','Dental empire'],['Diez mil millones','Ten billion'],['Cien mil millones','Hundred billion'],
    ['Billón','Trillion'],['Diez billones','Ten trillion'],['Cien billones','Hundred trillion'],
    ['Mil billones','Quadrillion'],['Hacia el infinito','Toward infinity'],['Sonrisa colosal','Colossal smile'],
    ['Trillón','Quintillion'],['Cifra cósmica','Cosmic figure'],['Cuatrillón','Sextillion'],
    ['Quintillón','Septillion'],['Numeración extraña','Strange numbering'],['Matemática arcana','Arcane math'],
    ['Nombres olvidados','Forgotten names'],['Más allá del vocabulario','Beyond vocabulary'],['Símbolos puros','Pure symbols'],
    ['Abismo numérico','Numerical abyss'],['Silencio estadístico','Statistical silence'],
    ['Susurro del infinito','Whisper of infinity'],['Más dientes que átomos','More teeth than atoms'],
    ['Números sin nombre','Nameless numbers'],['Final de la aritmética','End of arithmetic'],
  ];
  earnMs.forEach((v, i) => {
    const [es, en] = earnTitles[i];
    out.push({ id: 'earn_' + i, check: (s) => s.totalEarned >= v, es, en,
      desc_es: `Gana ${formatNumWithMode(v, 'short')} dientes en total`, desc_en: `Earn ${formatNumWithMode(v, 'short')} teeth in total`, cat: 'earned' });
  });

  const ownMs = [1,5,10,25,50,100,200,300,500,1000];
  const ownTitles = [
    ['Primer/a {gen}','First {gen}'],['Una docena corta','Short dozen'],['Decena de {gen}','Ten {gen}'],
    ['Equipo completo','Full team'],['Medio centenar','Half a hundred'],['Centenario','Centennial'],
    ['Doble centenar','Double hundred'],['Legión','Legion'],['Medio millar','Half thousand'],['Millar completo','Full thousand'],
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

  const prestMs = [1,2,5,10,25,50,100,250,500,1000,5000,10_000];
  const prestTitles = [
    ['Renacer','Rebirth'],['Doble vida','Double life'],['Sonrisa perpetua','Perpetual smile'],
    ['Decálogo dorado','Golden decalogue'],['Cuarto de centenar','Quarter century'],['Medio centenar','Half century'],
    ['Centenario dorado','Golden centennial'],['Cuarto de millar','Quarter thousand'],
    ['Medio millar dorado','Half golden thousand'],['Milésimo ciclo','Thousandth cycle'],
    ['Cinco milésimas','Five thousandth'],['Décimo millar','Ten thousandth'],
  ];
  prestMs.forEach((v, i) => {
    const [es, en] = prestTitles[i];
    out.push({ id: 'prest_' + i, check: (s) => (s.prestige || 0) >= v, es, en,
      desc_es: `Acumula ${v} sonrisas doradas`, desc_en: `Collect ${v} golden smiles`, cat: 'prestige' });
  });

  const goldMs = [1,5,10,25,50,100,250,500,1000,2500];
  const goldTitles = [
    ['Toque dorado','Golden touch'],['Cinco destellos','Five sparkles'],['Mano de Midas','Midas touch'],
    ['Cazador dorado','Golden hunter'],['Reflejos perfectos','Perfect reflexes'],['Centuria dorada','Golden century'],
    ['Leyenda viviente','Living legend'],['Coleccionista','Collector'],['Mil relámpagos','Thousand lightning'],['Dorado infinito','Infinite gold'],
  ];
  goldMs.forEach((v, i) => {
    const [es, en] = goldTitles[i];
    out.push({ id: 'gold_' + i, check: (s) => (s.goldenClicks || 0) >= v, es, en,
      desc_es: `Atrapa ${v} diente${v===1?'':'s'} dorado${v===1?'':'s'}`, desc_en: `Catch ${v} golden t${v===1?'ooth':'eeth'}`, cat: 'golden' });
  });

  const timeMs = [60*5,60*30,3600,3600*3,3600*10,3600*24,3600*48,3600*100,3600*500,3600*1000];
  const timeTitles = [
    ['Cinco minutos','Five minutes'],['Media hora','Half an hour'],['Una hora','One hour'],
    ['Tres horas','Three hours'],['Diez horas','Ten hours'],['Un día','A day'],
    ['Dos días','Two days'],['Cien horas','Hundred hours'],['Quinientas horas','Five hundred hours'],['Mil horas','Thousand hours'],
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

  const secrets = [
    { id: 'sec_speedrun', es: 'Velocidad relámpago', en: 'Lightning speed', desc_es: '1,000,000 de dientes en menos de 1h', desc_en: '1,000,000 teeth within the first hour', check: (s) => s.totalEarned >= 1_000_000 && s.timePlayed <= 3600 },
    { id: 'sec_clicker', es: 'Sin pasivos', en: 'Pure clicker', desc_es: '10,000 dientes sin comprar generadores', desc_en: '10,000 teeth without buying generators', check: (s) => s.totalEarned >= 10_000 && Object.values(s.generators || {}).reduce((a,b)=>a+b,0) === 0 },
    { id: 'sec_idle', es: 'Paciencia extrema', en: 'Extreme patience', desc_es: 'Jugá 1h sin hacer un solo click', desc_en: 'Play 1h without a single click', check: (s) => s.timePlayed >= 3600 && s.totalClicks === 0 },
    { id: 'sec_diverse', es: 'Todoterreno', en: 'All-terrain', desc_es: 'Ten al menos 1 de cada uno de los primeros 10 generadores', desc_en: 'Own at least 1 of each of the first 10 generators', check: (s) => GENERATORS.slice(0, 10).every(g => (s.generators?.[g.id] || 0) >= 1) },
    { id: 'sec_mono_brush', es: 'Solo cepillos', en: 'Brushes only', desc_es: 'Ten 200 cepillos y nada más', desc_en: 'Own 200 brushes and nothing else', check: (s) => (s.generators?.brush || 0) >= 200 && Object.entries(s.generators || {}).filter(([k,v]) => k !== 'brush' && v > 0).length === 0 },
    { id: 'sec_no_prest', es: 'Terco', en: 'Stubborn', desc_es: 'Alcanza 1B de dientes sin prestigiar', desc_en: 'Reach 1B teeth without prestiging', check: (s) => s.totalEarned >= 1e9 && (s.prestige || 0) === 0 },
    { id: 'sec_minimal', es: 'Minimalista', en: 'Minimalist', desc_es: 'Prestigia con menos de 10 generadores en total', desc_en: 'Prestige with fewer than 10 generators total', check: (s) => (s.prestige || 0) >= 1 && Object.values(s.generators || {}).reduce((a,b)=>a+b,0) < 10 },
    { id: 'sec_golden5', es: 'Racha dorada', en: 'Golden streak', desc_es: 'Atrapa 5 dientes dorados en una sesión corta', desc_en: 'Catch 5 golden teeth quickly', check: (s) => (s.goldenClicks || 0) >= 5 && s.timePlayed <= 3600 * 2 },
    { id: 'sec_marathon', es: 'Maratonista', en: 'Marathon runner', desc_es: 'Jugá 24h en total', desc_en: 'Play 24h in total', check: (s) => s.timePlayed >= 3600 * 24 },
    { id: 'sec_click_king', es: 'Rey del click', en: 'Click king', desc_es: '1M de dientes solo con clicks', desc_en: '1M teeth through clicks alone', check: (s) => (s.totalClicks || 0) * 10 >= 1e6 && s.totalEarned >= 1e6 },
    { id: 'sec_all_click_ups', es: 'Artesanía total', en: 'Total craftsmanship', desc_es: 'Compra todas las mejoras de click', desc_en: 'Buy every click upgrade', check: (s) => Object.values(s.clickUpgrades || {}).filter(Boolean).length >= CLICK_UPGRADES.length },
    { id: 'sec_50_prest', es: 'Ciclo eterno', en: 'Eternal cycle', desc_es: 'Prestigia 50 veces', desc_en: 'Prestige 50 times', check: (s) => (s.prestige || 0) >= 50 },
    { id: 'sec_atom_blessing', es: 'Bendición de Atom', en: 'Blessing of Atom', desc_es: '1e15 dientes totales', desc_en: '1e15 total teeth', check: (s) => s.totalEarned >= 1e15 },
    { id: 'sec_fairy_queen', es: 'Corte mágica', en: 'Magical court', desc_es: 'Ten 25 reinas de las haditas', desc_en: 'Own 25 fairy queens', check: (s) => (s.generators?.fairy_queen || 0) >= 25 },
    { id: 'sec_dragon_hoard', es: 'Tesoro del dragón', en: 'Dragon hoard', desc_es: 'Ten 100 dragones odontólogos', desc_en: 'Own 100 dragon dentists', check: (s) => (s.generators?.dragon || 0) >= 100 },
    { id: 'sec_omega', es: 'Omega alcanzado', en: 'Omega reached', desc_es: 'Ten un Omega Odontos', desc_en: 'Own an Omega Odontos', check: (s) => (s.generators?.omega || 0) >= 1 },
    { id: 'sec_patient', es: 'Como una piedra', en: 'Stone-still', desc_es: '10h de juego sin clicks manuales', desc_en: '10h played without manual clicks', check: (s) => s.timePlayed >= 3600 * 10 && s.totalClicks <= 10 },
    { id: 'sec_hydra', es: 'Hidra de dientes', en: 'Tooth hydra', desc_es: '50 de cada criatura mítica (tier 5)', desc_en: '50 of each mythic creature (tier 5)', check: (s) => ['dragon','leviathan','phoenix','kraken','titan'].every(id => (s.generators?.[id] || 0) >= 50) },
    { id: 'sec_divine', es: 'Panteón completo', en: 'Full pantheon', desc_es: 'Ten 10 de cada deidad (tier 6)', desc_en: 'Own 10 of each deity (tier 6)', check: (s) => ['templar','saint','seraph','god_minor','god_major'].every(id => (s.generators?.[id] || 0) >= 10) },
    { id: 'sec_balance', es: 'Equilibrio perfecto', en: 'Perfect balance', desc_es: 'Exactamente 42 de cada uno de los primeros 5 generadores', desc_en: 'Exactly 42 of each of the first 5 generators', check: (s) => GENERATORS.slice(0, 5).every(g => (s.generators?.[g.id] || 0) === 42) },
    { id: 'sec_lucky777', es: 'Triple siete', en: 'Triple seven', desc_es: 'Exactamente 777 clicks totales', desc_en: 'Exactly 777 total clicks', check: (s) => s.totalClicks === 777 },
    { id: 'sec_bigspender', es: 'Gran gastador', en: 'Big spender', desc_es: 'Gana 100M y ten menos de 100 dientes disponibles', desc_en: 'Earn 100M and keep less than 100 teeth in hand', check: (s) => s.totalEarned >= 1e8 && s.teeth < 100 },
    { id: 'sec_hoarder', es: 'Acumulador', en: 'Hoarder', desc_es: '1B de dientes acumulados sin gastar', desc_en: 'Hold 1B teeth without spending', check: (s) => s.teeth >= 1e9 },
    { id: 'sec_night_owl', es: 'Búho nocturno', en: 'Night owl', desc_es: 'Juega entre las 00:00 y 04:00', desc_en: 'Play between 00:00 and 04:00', check: (s) => { const h = new Date().getHours(); return h >= 0 && h < 4 && s.totalClicks > 0; } },
    { id: 'sec_early_bird', es: 'Madrugador', en: 'Early bird', desc_es: 'Juega entre las 05:00 y 07:00', desc_en: 'Play between 05:00 and 07:00', check: (s) => { const h = new Date().getHours(); return h >= 5 && h < 7 && s.totalClicks > 0; } },
    { id: 'sec_friday13', es: 'Viernes 13', en: 'Friday the 13th', desc_es: 'Juega un viernes 13', desc_en: 'Play on Friday the 13th', check: (s) => { const d = new Date(); return d.getDay() === 5 && d.getDate() === 13 && s.totalClicks > 0; } },
    { id: 'sec_palindrome', es: 'Palíndromo', en: 'Palindrome', desc_es: 'Clicks totales: 12321', desc_en: 'Exactly 12321 total clicks', check: (s) => s.totalClicks === 12321 },
    { id: 'sec_master', es: 'Maestro de Odontos', en: 'Master of Odontos', desc_es: 'Desbloquea todos los logros (excepto este)', desc_en: 'Unlock every achievement (except this)', check: (s) => Object.values(s.achievements || {}).filter(Boolean).length >= 300 },
    { id: 'sec_prodigy', es: 'Prodigio', en: 'Prodigy', desc_es: 'Alcanza 1e30 dientes en un solo prestigio', desc_en: 'Reach 1e30 teeth in a single prestige run', check: (s) => s.totalEarned >= 1e30 },
    { id: 'sec_wizard', es: 'Mago consumado', en: 'Accomplished wizard', desc_es: 'Ten 500 magos odontománticos', desc_en: 'Own 500 odonto-mancers', check: (s) => (s.generators?.wizard || 0) >= 500 },
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
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type; osc.frequency.value = freq; gain.gain.value = vol;
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + dur);
  } catch (e) {}
}

function computeClickPower(state, perSecond) {
  let flat = 1, mult = 1;
  const ups = state.clickUpgrades || {};
  const gens = state.generators || {};
  const achCount = Object.values(state.achievements || {}).filter(Boolean).length;
  const timePlayed = state.timePlayed || 0;
  for (const u of CLICK_UPGRADES) {
    if (!ups[u.id]) continue;
    if (u.type === 'flat') flat += u.value;
    else if (u.type === 'mult') mult *= u.value;
    else if (u.type === 'perGen') { const owned = gens[u.ref] || 0; mult *= (1 + (u.value / 100) * owned); }
    else if (u.type === 'perAch') { mult *= (1 + (u.value / 100) * achCount); }
    else if (u.type === 'perSec') { flat += (perSecond || 0) * (u.value / 100); }
    else if (u.type === 'timeBonus') { if (timePlayed >= u.threshold) mult *= (1 + u.value / 100); }
  }
  return { flat, mult, total: flat * mult };
}

Object.assign(window, { GENERATORS, CLICK_UPGRADES, ACHIEVEMENTS, genCost, formatNumWithMode, formatTime, playTone, computeClickPower, SHORT_SUFFIXES });
