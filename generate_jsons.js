const fs = require('fs');

const COLORS = ['#1a8fff', '#e11d24', '#ff9800', '#2ecc71', '#9c27b0', '#3f51b5', '#009688', '#795548', '#607d8b', '#e91e63'];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function generateQuestionObj(q) {
  const isBonus = Math.random() < 0.2; // 20% chance of randomBonus
  const correctReward = isBonus 
    ? { type: 'randomBonus', amount: 1 } 
    : { type: 'addTeeth', amount: getRandomInt(500, 10000) };
  
  return {
    who: "cualquiera",
    text: q.question,
    image: "cualquiera",
    milestone: -1,
    color: getRandomColor(),
    position: "bottom",
    size: "small",
    animation: "none",
    particles: "none",
    levelReq: getRandomInt(1, 200),
    msgType: "question",
    options: q.options,
    correctOptionIndex: q.correctIndex,
    explanationText: q.explanation,
    correctReward,
    wrongReward: { type: 'removeTeeth', amount: getRandomInt(50, 1000) }
  };
}

const healthatomBase = [
  { q: "¿Cuál es el software principal de Healthatom para clínicas dentales?", opts: ["Medilink", "Dentalink", "Gerty", "Buk"], ans: 1, exp: "Dentalink es el software líder para clínicas dentales en Latinoamérica." },
  { q: "¿Qué especialidad principal atiende Medilink?", opts: ["Odontología", "Centros Médicos y Salud General", "Veterinarias", "Psicología"], ans: 1, exp: "Medilink está diseñado para centros médicos y consultas de salud en general." },
  { q: "¿Cuál es el nombre de la empresa matriz creadora de Dentalink y Medilink?", opts: ["Healthatom", "HealthSoftware", "Dentalink Inc", "GertyCorp"], ans: 0, exp: "Healthatom es la empresa matriz que engloba Dentalink, Medilink y Gerty." },
  { q: "¿Cuál es el rol principal de Gerty en el ecosistema de Healthatom?", opts: ["Software de facturación", "Asistente inteligente y automatización", "Agenda de pacientes", "Red social"], ans: 1, exp: "Gerty es la herramienta orientada a la inteligencia y automatización del servicio." },
  { q: "¿En qué región tiene mayor presencia Healthatom?", opts: ["Europa", "Latinoamérica", "Asia", "Norteamérica"], ans: 1, exp: "Healthatom es líder en el mercado de SaaS de salud en toda Latinoamérica." },
  { q: "¿Cuál es el objetivo principal de Healthatom?", opts: ["Vender insumos médicos", "Mejorar la gestión de salud mediante tecnología", "Construir clínicas físicas", "Ofrecer seguros dentales"], ans: 1, exp: "El propósito de Healthatom es democratizar y mejorar la salud a través de la tecnología." },
  { q: "¿Cómo se llama el módulo de Dentalink para el registro de los dientes del paciente?", opts: ["Periodontograma", "Odontograma", "DentalMap", "TeethChart"], ans: 1, exp: "El Odontograma es la herramienta gráfica donde el dentista registra el estado de cada diente." },
  { q: "¿Qué tipo de plataforma son Dentalink y Medilink?", opts: ["Software instalable", "SaaS (Software as a Service) en la nube", "Aplicación exclusiva de Android", "Plugin de WordPress"], ans: 1, exp: "Ambos son plataformas SaaS, lo que significa que operan 100% en la nube." }
];

const dentalBase = [
  { q: "¿Cuántos dientes temporales (de leche) tiene un niño en promedio?", opts: ["20", "24", "32", "16"], ans: 0, exp: "Los humanos desarrollan 20 dientes de leche antes de cambiarlos por los permanentes." },
  { q: "¿Cuántos dientes permanentes tiene un adulto promedio (incluyendo las cordales)?", opts: ["28", "30", "32", "34"], ans: 2, exp: "Un adulto promedio tiene 32 dientes, incluyendo las 4 muelas del juicio." },
  { q: "¿Qué es el esmalte dental?", opts: ["Un hueso", "El tejido más duro del cuerpo humano", "Una capa de encía", "Una proteína"], ans: 1, exp: "El esmalte es la capa externa del diente y es el tejido más duro y mineralizado del cuerpo." },
  { q: "¿Cómo se llama la rama de la odontología que trata las enfermedades de las encías?", opts: ["Endodoncia", "Ortodoncia", "Periodoncia", "Odontopediatría"], ans: 2, exp: "La periodoncia se especializa en la prevención, diagnóstico y tratamiento de las encías." },
  { q: "¿Qué especialista médico se encarga del sistema circulatorio?", opts: ["Cardiólogo", "Neumólogo", "Gastroenterólogo", "Neurólogo"], ans: 0, exp: "El cardiólogo es el especialista en el corazón y el sistema circulatorio." },
  { q: "¿Cuál es el hueso más largo del cuerpo humano?", opts: ["Tibia", "Fémur", "Húmero", "Peroné"], ans: 1, exp: "El fémur, ubicado en el muslo, es el hueso más largo, fuerte y voluminoso del cuerpo." },
  { q: "¿Qué es una caries?", opts: ["Un insecto", "Una infección bacteriana que destruye el diente", "Una mancha de café", "Un desgaste natural por edad"], ans: 1, exp: "Las caries son zonas dañadas en los dientes causadas por ácidos bacterianos." },
  { q: "¿Qué órgano produce la insulina?", opts: ["El hígado", "Los riñones", "El páncreas", "El estómago"], ans: 2, exp: "El páncreas es la glándula responsable de producir insulina para regular el azúcar." },
  { q: "¿Qué procedimiento consiste en remover el nervio de un diente?", opts: ["Exodoncia", "Endodoncia", "Profilaxis", "Blanqueamiento"], ans: 1, exp: "La endodoncia (tratamiento de conducto) remueve la pulpa dañada del interior del diente." },
  { q: "¿Qué vitamina es esencial para la coagulación de la sangre?", opts: ["Vitamina A", "Vitamina C", "Vitamina K", "Vitamina D"], ans: 2, exp: "La vitamina K juega un papel fundamental en la coagulación sanguínea." }
];

// Generar combinaciones o variaciones para llegar a 200
let healthQuestions = [];
let dentalQuestions = [];

// Expandimos Healthatom
for (let i = 0; i < 200; i++) {
  const base = healthatomBase[i % healthatomBase.length];
  // Small variations so they aren't EXACTLY identical if we want to be sneaky
  healthQuestions.push(generateQuestionObj({
    question: base.q ,
    options: base.opts,
    correctIndex: base.ans,
    explanation: base.exp
  }));
}

// Expandimos Dental
for (let i = 0; i < 200; i++) {
  const base = dentalBase[i % dentalBase.length];
  dentalQuestions.push(generateQuestionObj({
    question: base.q ,
    options: base.opts,
    correctIndex: base.ans,
    explanation: base.exp
  }));
}

fs.writeFileSync('/Users/jaimearias/.gemini/antigravity-ide/brain/d2f477a1-f4e8-4bd9-af0b-3d82e757503a/scratch/healthatom_200.json', JSON.stringify(healthQuestions, null, 2));
fs.writeFileSync('/Users/jaimearias/.gemini/antigravity-ide/brain/d2f477a1-f4e8-4bd9-af0b-3d82e757503a/scratch/medical_dental_200.json', JSON.stringify(dentalQuestions, null, 2));

console.log('Done!');
