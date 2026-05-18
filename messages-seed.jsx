// ==========================================================================
// Tooth Clicker — Boss Messages Seed Generator
// ==========================================================================

(function() {
  const BOSS_PLAYERS = [
    { name: 'Dani', role: 'cto', cargo: 'CTO' },
    { name: 'Memo', role: 'cto', cargo: 'CTO' },
    { name: 'José María', role: 'ceo', cargo: 'Gerente general' },
    { name: 'Andrea', role: 'designer', cargo: 'Jefa area de diseño' },
    { name: 'Payo', role: 'dev', cargo: 'Jefe de programadores' },
    { name: 'Martín', role: 'pm', cargo: 'PM' },
    { name: 'Cris', role: 'dev', cargo: 'Jefe de programadores' },
    { name: 'Daver', role: 'dev', cargo: 'Programador' },
    { name: 'Juanmi', role: 'marketing', cargo: 'Lider de marketing' },
    { name: 'María José', role: 'marketing', cargo: 'Gerente de marketing' },
    { name: 'Daniela', role: 'designer', cargo: 'Designer' },
    { name: 'Cotefi', role: 'designer', cargo: 'Designer' },
    { name: 'Juli', role: 'pm', cargo: 'PM' },
    { name: 'Cami', role: 'pm', cargo: 'PM' },
    { name: 'Pascal', role: 'pm', cargo: 'Jefe de los PMs' },
    { name: 'Nico', role: 'dev', cargo: 'programador' },
    { name: 'Pancho', role: 'dev', cargo: 'programador' },
    { name: 'Fabi', role: 'dev', cargo: 'programador' },
    { name: 'Mari', role: 'pm', cargo: 'PM' },
    { name: 'Ale', role: 'dev', cargo: 'Programadora' },
    { name: 'Tatán', role: 'pm', cargo: 'PM' },
    { name: 'Tomi', role: 'pm', cargo: 'Jefe de proyectos' },
    { name: 'Lucho', role: 'support', cargo: 'Soporte' },
    { name: 'James', role: 'designer', cargo: 'Designer' },
    { name: 'Chalo', role: 'dev', cargo: 'Frontend' },
    { name: 'Juan', role: 'dev', cargo: 'Frontend' },
    { name: 'Mati', role: 'dev', cargo: 'Devops' },
    { name: 'Rafa', role: 'dev', cargo: 'Programador' },
    { name: 'Yisus', role: 'dev', cargo: 'Programador' },
    { name: 'May', role: 'pm', cargo: 'PM' },
    { name: 'Sofi', role: 'pm', cargo: 'PM' },
    { name: 'Feña', role: 'designer', cargo: 'Designer' },
    { name: 'Leo', role: 'dev', cargo: 'programador' },
    { name: 'Patito', role: 'sales', cargo: 'Sales manager' },
    { name: 'John', role: 'vp', cargo: 'VP de ingeniería' },
    { name: 'Palo', role: 'hr', cargo: 'Head of talent' },
    { name: 'Manu', role: 'dev', cargo: 'programador' },
    { name: 'Gabo', role: 'dev', cargo: 'Solution Engineering Lead' },
    { name: 'Carlos', role: 'accounting', cargo: 'Head of acounting adn administration' },
    { name: 'Vania', role: 'data', cargo: 'Data Engineering' },
    { name: 'Gianni', role: 'dev', cargo: 'Devops Engineering' }
  ];

  const colorsByRole = {
    cto: '#ff9800',
    ceo: '#e11d24',
    designer: '#e91e63',
    dev: '#1a8fff',
    pm: '#9c27b0',
    marketing: '#00bcd4',
    support: '#009688',
    sales: '#4caf50',
    vp: '#2196f3',
    hr: '#3f51b5',
    accounting: '#607d8b',
    data: '#795548'
  };

  const ROLE_TEMPLATES = {
    cto: [
      "¿Quién subió esto a prod sin probar en staging? El login da error 500 pero tú dale al click.",
      "¿Otra refactorización de arquitectura? Por favor arregla primero la base de datos de staging.",
      "Borré accidentalmente la base de datos de producción entera. Ups, espero que tengas un respaldo.",
      "Tu código tiene tantos bugs y malas prácticas que parece escrito por un mono con sobredosis de café.",
      "¿Qué parte exacta de los manuales de 'código limpio' falló catastróficamente al escribir esto?",
      "Un solo bug crítico más en el flujo de pagos y te juro que te quito todos los accesos a producción.",
      "¿De verdad hiciste un commit directo a master sin pasar por revisión de código? La audacia me asusta.",
      "Veo que tu rama tiene más advertencias y warnings de compilación que líneas de código útil o legible.",
      "La seguridad informática es un concepto meramente opcional para nuestro equipo hoy, ¿verdad?",
      "Tu rama de desarrollo actual tiene más de 45 conflictos graves con master. Buena suerte con el merge.",
      "El servidor principal está al 99% de capacidad y tú sigues perdiendo valioso tiempo clickeando acá.",
      "Escribiste un loop infinito tan mal diseñado que literalmente quemó todo el clúster de Kubernetes.",
      "¿La contraseña de la base de datos de prod sigue siendo '123456'? Pregunto por un amigo de soporte.",
      "Tu mayor y más relevante aporte al sprint de esta semana fue desgastar el mouse con este clicker.",
      "Nuestra API pública tarda 12 segundos enteros en responder una consulta simple. Excelente trabajo.",
      "¿Por qué el microservicio de facturación está intentando minar criptomonedas? Explícame esto ya."
    ],
    ceo: [
      "El cliente más importante de la empresa quiere esta funcionalidad lista para ayer. ¡Corre a programar!",
      "Le prometí al principal inversor de riesgo que incorporaríamos IA en cada diente para el lunes.",
      "Menos clicks inútiles en este juego y mucha más sinergia y alineación corporativa de alto impacto.",
      "Los reportes de KPIs trimestrales dan absoluta pena. Haz algo realmente útil por la compañía hoy.",
      "¿De verdad estás validando hipótesis de mercado o simplemente estás procrastinando con descaro?",
      "Cerramos la ronda de inversión ángel de forma exitosa. Para festejar, hay pizza fría en la cocina.",
      "Si algún cliente o inversor te llega a preguntar, todo este software ya está terminado y testeado.",
      "Necesito de verdad que te pongas la camiseta corporativa y trabajes con total pasión por la causa.",
      "¿Qué te parece si hacemos un workshop intensivo de integración de equipos este sábado a las 8 AM?",
      "Todo el directorio internacional nos está observando de cerca hoy. Sigue clickeando con elegancia.",
      "Para optimizar los costos de electricidad de la startup: apaga tu monitor mientras no estés aquí.",
      "Tu nivel de dedicación a este proyecto es exactamente proporcional al cansancio de tu dedo índice.",
      "El precio de nuestra acción cayó un 15% hoy. Dale más rápido a ese diente para subir el valor bursátil.",
      "Esto no es explotación de programadores en absoluto, es pasión dental disruptiva y revolucionaria.",
      "Tu bono por desempeño anual y tu estabilidad laboral dependen enteramente de los clicks en ese diente.",
      "¿Estás trabajando de verdad en tu backlog de Jira o simplemente te quedaste dormido sobre el teclado?"
    ],
    designer: [
      "Ese botón principal de la interfaz está corrido exactamente 2px a la izquierda. ¡Qué horror visual!",
      "Falta un contraste brutal de accesibilidad. Por favor, usa únicamente nuestra paleta corporativa.",
      "Figma es mi pasión y mi refugio creativo, pero ver tu código implementado es mi mayor tortura.",
      "¿Por qué decidiste de la nada cambiar la tipografía oficial por una sin licencia que parece fea?",
      "El manual de diseño no es una simple sugerencia que puedas ignorar. ¡Impleméntalo al pie de la letra!",
      "Te suplico que uses la grilla oficial de 8px para alinear todos los componentes de la interfaz.",
      "Ese tono fosforescente de verde literalmente daña mis retinas. Quítalo de inmediato de mi vista.",
      "El logotipo corporativo debe ser considerablemente más grande, brillante y con sombras modernas.",
      "Odio con toda mi alma la tipografía Comic Sans, por favor no me tientes a renunciar a esta startup.",
      "Falta muchísimo espacio en blanco para que el diseño respire de manera elegante y sofisticada.",
      "Esas sombras gigantes no tienen ningún tipo de sentido estético ni coherencia ahí. Quítalas ya.",
      "Esto no es para nada pixel perfect respecto al entregable oficial. Rehaz toda la maqueta, por favor.",
      "Diseñé un Figma hermoso, minimalista y moderno, y tú codificaste esta monstruosidad de los 2000.",
      "¿Bordes redondeados de 50px en un botón cuadrado clásico de formulario? Me va a dar algo terrible.",
      "Ese degradado de color morado y verde parece sacado de una presentación escolar de los años 90.",
      "La consistencia visual de la marca es sagrada, respeta los espaciados oficiales que definí en Figma."
    ],
    dev: [
      "Ese error no ocurre en mi máquina local de desarrollo, así que es 100% tu problema. Buena suerte.",
      "Un solo commit y push directo más a producción hoy y rompemos por completo todo el build de la app.",
      "Te aseguro que eso no es un bug crítico, es simplemente un feature de comportamiento muy oculto.",
      "Hice el deploy directamente a producción el viernes a las 18:00 PM y apagué mi teléfono móvil.",
      "¿Quién fue el genio que metió una librería externa de 40MB solo para centrar un simple texto?",
      "El código heredado de hace cinco años no se toca bajo ninguna circunstancia, nos da pánico tocarlo.",
      "Pasé 4 horas enteras buscando un maldito punto y coma que faltaba. Necesito café intravenoso ya.",
      "Este query de SQL tarda más de 5 minutos enteros en responder. Por favor optimízalo de inmediato.",
      "¿Documentación técnica? El código autoexplicativo que escribo es mi obra de arte más pura y bella.",
      "El backend está completamente caído. Culpemos rápidamente a AWS o a la conexión de internet de Chile.",
      "Añadí tres parches temporales definitivos al código de facturación para poder salir a producción hoy.",
      "El conflicto de merge de git de este viernes arruinó por completo mis planes de fin de semana.",
      "Sinceramente no tengo idea de por qué esta función corre bien, pero no la toques bajo ninguna excusa.",
      "¿Pruebas unitarias automatizadas? Para eso tengo usuarios finales reales que testean directo en prod.",
      "Tengo 20 pestañas del navegador abiertas con StackOverflow buscando cómo convertir un string a int.",
      "Mi código compila a la perfección a la primera y eso me genera una desconfianza extremadamente alta."
    ],
    pm: [
      "¿Cómo vas exactamente con tu tarea asignada para esta mañana? Necesito un reporte de estado urgente.",
      "Hay daily standup obligatoria de equipo en exactamente 5 minutos. Por favor conéctate de inmediato.",
      "Metí tres tareas urgentes nuevas al sprint actual que debe cerrarse hoy. Confío en que llegas bien.",
      "El cliente cambió radicalmente de opinión sobre el alcance del proyecto otra vez. Hay que rehacer todo.",
      "¿Podrías encargarte de hacer esto súper rápido hoy mismo antes de que finalice tu jornada laboral?",
      "¿Estimaste esta complejidad técnica en horas de desarrollo reales o en días de pura fantasía?",
      "Tu tarjeta de Jira lleva clavada en la columna de 'Doing' más de tres semanas. Actualízala ahora.",
      "Hagamos una breve y productiva reunión de sync rápido que solo durará una hora entera de tu tarde.",
      "El entregable oficial de este hito de negocio era para el lunes a primera hora. Estamos muy atrasados.",
      "Redefinamos por completo el alcance inicial del MVP para incluir todo lo que el cliente sueña.",
      "Tengo una pregunta técnica de solo dos minutos que probablemente nos tome toda la mañana resolver.",
      "Bloqueé por completo toda tu tarde de desarrollo con tres reuniones de alineación estratégica.",
      "¿Es viable implementar este cambio técnico de arquitectura para hoy antes de las 5 de la tarde?",
      "Esta tarea específica tiene prioridad ultra-alta del gerente, todo lo demás en tu backlog se detiene.",
      "Por favor recuerda actualizar detalladamente tu Jira con comentarios técnicos antes de irte hoy.",
      "Buen avance general en el prototipo, pero lamentablemente nos falta implementar el 95% restante."
    ],
    marketing: [
      "Necesito de forma urgente redactar un post de LinkedIn que se vuelva viral sobre el éxito bucal.",
      "Aumentamos la tasa de leads y conversiones en un impresionante 2%. ¡Somos los reyes del mercado!",
      "El costo por click está sumamente alto, por favor haz clicks reales para optimizar el presupuesto.",
      "La campaña masiva de email marketing de esta mañana rebotó en un 95%. Hay que reescribir los copys.",
      "Inventemos un término tecnológico de moda hoy para sonar sumamente innovadores en las redes sociales.",
      "¿La identidad visual de nuestra marca transmite suficiente felicidad dental y frescura bucal hoy?",
      "Hagamos un webinar interactivo en vivo sobre la correcta técnica de limpieza y blanqueamiento dental.",
      "Escribe un blogpost optimizado para SEO con exactamente 3000 palabras clave sobre el cuidado del diente.",
      "Nuestro buyer persona objetivo odia hacer clicks repetitivos. Hay que replantear la estrategia de UI.",
      "Necesitamos generar contenido extremadamente viral y engagement masivo en nuestra cuenta de TikTok.",
      "El funnel de ventas y conversión de clientes está completamente roto en la parte superior. Analízalo.",
      "Usemos colores considerablemente más amigables y pasteles en todas nuestras interfaces de cara al usuario.",
      "¿Ese copy publicitario de la campaña dental tiene el suficiente punch comercial para generar ventas?",
      "Por favor, calcula con total precisión el ROI y el impacto financiero directo de este simulador.",
      "El manual oficial de marca y paleta de colores corporativa cambió de nuevo. Actualiza todas las piezas.",
      "Publica de inmediato en todas nuestras redes sociales que somos líderes mundiales indiscutidos."
    ],
    support: [
      "El usuario olvidó su contraseña de acceso por cuarta vez consecutiva esta semana. Resetea su cuenta.",
      "¿Probaste reiniciando tu módem de internet local? Por favor inténtalo antes de abrir un ticket formal.",
      "Ticket #4502 prioritario: 'Hago click en el diente gigante de la pantalla y no me regala dientes reales'.",
      "Tenemos un cliente sumamente furioso en la línea telefónica dos pidiendo hablar con un dev. ¡Sálvame!",
      "El reporte dice que no funciona absolutamente nada del software dental. El típico reporte exagerado.",
      "Trata al usuario final con extrema paciencia y respira profundamente antes de responder el chat.",
      "¿Podrías revisar este ticket técnico de máxima prioridad antes de que el cliente cancele la cuenta?",
      "El cliente insiste en que reportó un fantasma cibernético en la pantalla azul de la aplicación.",
      "¿Hablaste con el usuario de manera calmada y le explicaste que el problema es su propio navegador?",
      "Recibimos otro reporte más de pantalla azul de la muerte en el cliente de Chile. Revisa los registros.",
      "El soporte técnico oficial de la empresa no hace magia milagrosa, pero estamos bastante cerca hoy.",
      "El usuario de soporte insiste rotundamente en que la caída de toda la base de datos es culpa tuya.",
      "Por favor revisa de inmediato los logs de error del servidor para el cliente corporativo de Chile.",
      "¿La base de datos de producción cuenta realmente con registros limpios y sin duplicaciones feas?",
      "El cliente borró accidentalmente toda su cuenta corporativa y su progreso sin querer. Restáuralo ya.",
      "Me acaban de insultar en tres idiomas diferentes por el chat de soporte técnico. Un lunes grandioso."
    ],
    sales: [
      "Acabo de cerrar una venta corporativa gigante de un feature que todavía no existe. ¡A programar!",
      "Le aseguré al cliente que nuestra aplicación hace café expreso de forma automática. Impleméntalo hoy.",
      "La demostración del software dental falló estrepitosamente en vivo. Qué vergüenza internacional.",
      "Necesito que apruebes un descuento comercial del 90% para esta cuenta antes de las 5 de la tarde.",
      "El cliente firmará el contrato de servicios de inmediato si agregamos este botón rojo hoy mismo.",
      "¿Podemos viajar mañana a primera hora a la oficina central de nuestro cliente en Santiago de Chile?",
      "Tengo diez llamadas de ventas de alta prioridad pendientes en mi agenda para el resto de la tarde.",
      "El pipeline comercial de ventas de este trimestre está repleto de maravillosa promesas de humo.",
      "Le vendí al nuevo cliente corporativo la versión premium ilimitada sin consultar al equipo de dev.",
      "¿Por qué la demostración del juego anda tan increíblemente lento en la tablet del cliente?",
      "El cliente corporativo gigante exige una integración inmediata de nuestro sistema clicker con SAP.",
      "¿Me podrías acompañar a una reunión técnica de ventas para responder preguntas de arquitectura?",
      "Superamos con creces la cuota comercial de ventas del mes. Prepárate para el festejo del viernes.",
      "Prometí soporte técnico personalizado de tu parte las 24 horas del día, los 7 días de la semana.",
      "¿Nuestra aplicación cumple formalmente con todas las estrictas normativas ISO de seguridad médica?",
      "Si no cerramos este contrato de software dental hoy antes de que acabe el día, no cobramos la comisión."
    ],
    vp: [
      "La arquitectura distribuida de microservicios falló catastróficamente por falta de redundancia.",
      "Necesitamos comenzar a aplicar metodologías ágiles reales en lugar de esta simulación burocrática.",
      "Rediseñemos por completo el flujo de integración y despliegue continuo (CI/CD) de la aplicación.",
      "El backlog de deuda técnica del proyecto es inmenso hoy. Menos clicks y más refactorización limpia.",
      "¿Cómo escalamos arquitectónicamente este sistema para soportar más de 1 millón de clicks por segundo?",
      "Quiero reportes semanales detallados de la cobertura de código de los tests unitarios en Jenkins.",
      "Usemos de forma obligatoria Kubernetes para desplegar este clicker dental en la nube de AWS.",
      "La inmensa deuda técnica acumulada nos va a devorar vivos en el próximo sprint. Hay que priorizar.",
      "Estandaricemos de una vez por todas las herramientas de desarrollo y los editores de código del equipo.",
      "El rendimiento general de las consultas a la base de datos bajó un preocupante 15% en producción.",
      "Hagamos una sesión de code review extremadamente estricta hoy mismo para todas las ramas pendientes.",
      "La infraestructura actual de servidores en la nube nos está costando una absoluta fortuna mensual.",
      "Quiero ver diagramas detallados de la arquitectura de datos antes de aprobar el siguiente despliegue.",
      "¿Quién autorizó este parche de código tan horrible y poco optimizado en el validador de clicks?",
      "Menos código espagueti con variables globales y más patrones de diseño orientados a objetos, por favor.",
      "El sistema distribuido de colas de mensajería está completamente saturado de peticiones pendientes."
    ],
    hr: [
      "Por favor, completa detalladamente la encuesta anual de clima y satisfacción laboral antes del viernes.",
      "Hoy tenemos pizza party de integración en la oficina. Asistencia sumamente obligatoria para todos.",
      "¿Cómo te sientes emocionalmente en tu equipo de desarrollo hoy? Hagamos una sesión de feedback.",
      "Hagamos una dinámica de team building de confianza ciega para mejorar la comunicación interna.",
      "Tu evaluación de desempeño de 360 grados está lista para ser revisada detalladamente con tu jefe.",
      "Buscamos de forma urgente un programador fullstack ninja 10x que trabaje por pura pasión y café.",
      "Por favor actualiza tu perfil profesional en el portal corporativo de la empresa esta misma tarde.",
      "Recuerda subir de forma digital todos tus recibos de gastos de viaje y viáticos al portal de rendición.",
      "¡Buenas noticias! Tenemos frutas frescas gratis disponibles en la cocina de la oficina hoy.",
      "Feliz cumpleaños de parte de todo el equipo de la startup dental, te regalamos un click virtual gratis.",
      "¿Leíste a conciencia el nuevo código de conducta y convivencia profesional que enviamos ayer?",
      "Evitemos el estrés y el burnout laboral del equipo haciendo una sesión grupal de yoga el miércoles.",
      "Hagamos un after office integrador este jueves por la tarde para celebrar el hito del sprint.",
      "¿Tu currículum sigue completamente actualizado en LinkedIn? He visto que andas buscando otros rumbos.",
      "El onboarding de bienvenida para los nuevos integrantes del equipo dura 4 horas obligatorias hoy.",
      "Lamento informarte que tu solicitud de vacaciones para esta temporada alta fue formalmente rechazada."
    ],
    accounting: [
      "Falta subir la factura oficial del servidor de AWS para poder cerrar los libros contables del mes.",
      "Lamentablemente no contamos con presupuesto aprobado para comprar licencias profesionales este año.",
      "El balance financiero de fin de mes simplemente no cuadra. Hay un desfase de dinero preocupante.",
      "Por favor sube de inmediato la boleta digital del café de la reunión con el cliente de te de ayer.",
      "La conciliación bancaria de la cuenta corporativa dio un error de descuadre bastante grave hoy.",
      "Por favor, no realices gastos en herramientas de software innecesarias sin autorización previa.",
      "Hay una nueva retención de impuestos a las transacciones de servicios digitales en Chile.",
      "Recuerda pagar las patentes comerciales de la empresa antes del vencimiento para evitar multas.",
      "Tu informe de gastos de representación de la semana pasada presenta inconsistencias importantes.",
      "Usa preferentemente el sistema de transporte público corporativo en lugar de taxis de lujo, gracias.",
      "El flujo de caja y la liquidez de la startup están sumamente ajustados durante esta semana.",
      "¿Me podrías explicar detalladamente por qué gastaste $100 dólares de la empresa en stickers de risa?",
      "Los números financieros no mienten jamás, pero tu reporte de horas de esta semana parece de ficción.",
      "El presupuesto asignado al área de marketing digital se redujo drásticamente a la mitad para el mes.",
      "Presenta tus rendiciones de gastos y viáticos de forma digital antes del día 5 de forma obligatoria.",
      "Aprobé tu viático para el viaje a Chile con cautela, pero por favor no abuses de los gastos extras."
    ],
    data: [
      "La base de datos analítica de BigQuery explotó anoche debido a un query sumamente ineficiente.",
      "El reporte semanal de retención y abandono de usuarios del juego dental arrojó números negativos.",
      "Por favor optimiza esa consulta de SQL gigante inmediatamente, está tardando horas en responder.",
      "El dashboard interactivo de Tableau de métricas clave corporativas no está cargando nada hoy.",
      "Faltan registros importantes de telemetría de clics en nuestro reporte analítico consolidado.",
      "Hagamos un modelo de aprendizaje automático predictivo sobre la probabilidad de clickear el diente.",
      "La calidad de los datos de comportamiento cargados esta semana es sumamente pésima y poco confiable.",
      "¿Quién fue el programador que modificó el esquema de la base de datos de producción sin avisar?",
      "El pipeline de datos y extracción diaria (ETL) se cayó estrepitosamente a mitad de la noche de ayer.",
      "Usa exclusivamente BigQuery para realizar consultas analíticas pesadas sobre los clics del juego.",
      "Los datos analíticos duros no mienten en absoluto: tu desempeño de clicks hoy es sumamente bajo.",
      "La métrica clave de conversión de leads del software dental bajó a un rotundo cero esta mañana.",
      "El data lake de producción corporativo está sumamente contaminado con registros de prueba falsos.",
      "¿Por qué razón hay tantos valores nulos e inconsistentes en el campo de nombre de los usuarios?",
      "Añadí telemetría detallada a cada uno de tus clics en pantalla para analizar tu patrón de juego.",
      "El clúster de Spark para procesamiento de grandes datos está completamente colgado e inactivo hoy."
    ]
  };

  const AUTHORITATIVE_BOSS_MESSAGES = [
    { who: 'José María', text: 'Llevas {horas} hora/s dándole al diente. A mi oficina ahora. Hay que hablar de tu futuro.', color: '#e11d24' },
    { who: 'Dani', text: '¿{horas} hora/s jugando? Lindo clicker, pero la API de prod sigue caída. Prioridades, por favor.', color: '#ff9800' },
    { who: 'Memo', text: '{horas} hora/s de juego. Espero que el refactor de la base de datos esté listo para el lunes.', color: '#ff9800' },
    { who: 'Pascal', text: '{horas} hora/s jugando. Tu Jira tiene 12 blockers asignados. ¡A mover esas tarjetas ya!', color: '#9c27b0' },
    { who: 'Andrea', text: '¿{horas} hora/s haciendo click? Espero que las pantallas del cliente ya estén pixel perfect.', color: '#e91e63' },
    { who: 'Payo', text: '{horas} hora/s seguida/s. El pull request tiene 80 comentarios pendientes. Responde ya.', color: '#3f51b5' },
    { who: 'Cris', text: '{horas} hora/s jugando. Los tests siguen fallando en staging. Menos clicks y más código.', color: '#3f51b5' },
    { who: 'John', text: 'Llevas {horas} hora/s jugando. La deuda técnica subió un 40% y tú aquí perdiendo el tiempo.', color: '#2196f3' },
    { who: 'Palo', text: '{horas} hora/s clickeando. Ven a Recursos Humanos, queremos hacer un sync sobre tu motivación.', color: '#009688' },
    { who: 'Carlos', text: '¿{horas} hora/s de clicks? La auditoría externa empezó y tus rendiciones siguen en cero.', color: '#607d8b' },
    { who: 'Gabo', text: 'Llevas {horas} hora/s jugando. El cliente cancelará el contrato si la demo no funciona hoy.', color: '#1a8fff' }
  ];

  const animations = ['none', 'pulse', 'shake', 'float', 'rainbow'];
  const particlesOptions = ['none', 'stars', 'teeth', 'fire', 'confetti'];
  const positions = ['bottom', 'top', 'center'];
  const sizes = ['small', 'medium', 'large'];

  function replaceHoras(text, hours) {
    const hrStr = hours === 1 ? "1 hora" : `${hours} horas`;
    const hrSegStr = hours === 1 ? "1 hora seguida" : `${hours} horas seguidas`;
    return text.replace(/{horas} hora\/s seguida\/s/g, hrSegStr)
               .replace(/{horas} hora\/s/g, hrStr);
  }

  function getBossMessagesSeed() {
    const msgs = [];
    let count = 1;
    BOSS_PLAYERS.forEach((player) => {
      const templates = ROLE_TEMPLATES[player.role] || ROLE_TEMPLATES.dev;
      templates.forEach((tpl, tplIdx) => {
        const fullText = tpl;
        
        // Determinar algunos efectos consistentes pero variados
        const pos = positions[(player.name.charCodeAt(0) + tplIdx) % positions.length];
        const sz = sizes[(player.name.charCodeAt(1) || 0 + tplIdx) % sizes.length];
        const anim = animations[(player.name.charCodeAt(2) || 0 + tplIdx) % animations.length];
        const part = particlesOptions[(player.name.charCodeAt(3) || 0 + tplIdx) % particlesOptions.length];

        msgs.push({
          id: `m-seed-${count}`,
          who: player.name,
          text: fullText,
          milestone: -1, 
          color: colorsByRole[player.role] || '#1a8fff',
          position: pos,
          size: sz,
          animation: anim,
          particles: part,
          createdAt: Date.now() + count
        });
        count++;
      });
    });
    return msgs;
  }

  const EMPLOYEE_NAMES = BOSS_PLAYERS.map(p => p.name);

  Object.assign(window, {
    getBossMessagesSeed,
    AUTHORITATIVE_BOSS_MESSAGES,
    replaceHoras,
    EMPLOYEE_NAMES
  });
})();
