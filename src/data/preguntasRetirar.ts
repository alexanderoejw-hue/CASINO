export interface RetirarQuestion {
  id: number;
  question: string;
  options: {
    id: 'A' | 'B' | 'C' | 'D';
    text: string;
    feedback: string;
  }[];
  correctOptionId: 'A' | 'B' | 'C' | 'D';
}

const RAW_PREGUNTAS_RETIRAR = [
  {
    "id": 1,
    "pregunta": "Un estudiante deja de ir a sus entrenamientos de fútbol y se aleja de sus amigos porque prefiere quedarse en casa fumando marihuana. ¿De qué es señal esto?",
    "opciones": {
      "A": "Es una fase normal de la adolescencia",
      "B": "Solo necesita un descanso del deporte",
      "C": "Es un síntoma claro de Trastorno por Consumo de Cannabis (Adicción)",
      "D": "Es una muestra de madurez"
    },
    "retroalimentacion": {
      "A": "Aislarse por consumir no es normal",
      "B": "El problema central es el cambio de prioridades por la sustancia",
      "C": "SAMHSA (2024) indica que abandonar actividades importantes por consumir es un criterio de adicción",
      "D": "Es una señal de alarma de salud mental"
    },
    "correctOptionId": "C"
  },
  {
    "id": 2,
    "pregunta": "Si un amigo que consume marihuana muy seguido comienza a vomitar incontrolablemente cada semana y solo se alivia bañándose con agua muy caliente, ¿qué le podría estar pasando?",
    "opciones": {
      "A": "Comió algo echado a perder",
      "B": "Tiene el Síndrome de Hiperemesis Cannabinoide",
      "C": "Es alérgico al agua caliente",
      "D": "Tiene gripe estomacal eterna"
    },
    "retroalimentacion": {
      "A": "Las intoxicaciones alimentarias no duran semanas",
      "B": "NIDA (2024) explica que el uso constante de altas dosis puede causar este síndrome caracterizado por vómitos severos",
      "C": "El agua caliente, de hecho, alivia este síndrome temporalmente",
      "D": "La gripe estomacal pasa en pocos días"
    },
    "correctOptionId": "B"
  },
  {
    "id": 3,
    "pregunta": "¿Por qué empezar a fumar marihuana a los 14 o 15 años es más peligroso para la mente que empezar de adulto?",
    "opciones": {
      "A": "Porque los jóvenes no saben comprarla",
      "B": "Porque a esa edad los pulmones son más pequeños",
      "C": "Aumenta el riesgo de desarrollar problemas como esquizofrenia o desconexión de la realidad",
      "D": "Porque a esa edad es más cara"
    },
    "retroalimentacion": {
      "A": "El riesgo es biológico, no logístico",
      "B": "El daño principal es en el sistema nervioso",
      "C": "El CDC (2024) advierte que el uso temprano afecta el cerebro en formación y eleva el riesgo de psicosis",
      "D": "El costo económico no es el riesgo de salud principal"
    },
    "correctOptionId": "C"
  },
  {
    "id": 4,
    "pregunta": "¿Qué es el \"Síndrome Amotivacional\" asociado a veces al uso constante de marihuana?",
    "opciones": {
      "A": "Ganas intensas de hacer ejercicio",
      "B": "Pérdida de interés, energía y metas en la vida diaria",
      "C": "Una enfermedad contagiosa de la piel",
      "D": "Ser demasiado competitivo en la escuela"
    },
    "retroalimentacion": {
      "A": "Es lo contrario a la motivación",
      "B": "NIDA (2024) reporta que los usuarios crónicos a menudo muestran apatía y bajo rendimiento general",
      "C": "Es una condición psicológica y de comportamiento",
      "D": "Las personas con este síndrome pierden interés en competir o esforzarse"
    },
    "correctOptionId": "B"
  },
  {
    "id": 5,
    "pregunta": "¿Qué le pasa al cuerpo y mente de una persona adicta a la marihuana si intenta dejarla de golpe?",
    "opciones": {
      "A": "Siente una felicidad inmediata y duradera",
      "B": "Experimenta síntomas de abstinencia como enojo, insomnio y falta de hambre",
      "C": "Su cerebro se apaga por 24 horas",
      "D": "No pasa absolutamente nada, es fácil dejarla"
    },
    "retroalimentacion": {
      "A": "El proceso de dejarla es estresante al principio",
      "B": "SAMHSA (2024) detalla que la abstinencia incluye irritabilidad, ansiedad y problemas de sueño",
      "C": "Médicamente imposible",
      "D": "Para quienes tienen el trastorno, dejarla genera malestar físico y mental"
    },
    "correctOptionId": "B"
  },
  {
    "id": 6,
    "pregunta": "Muchos jóvenes dicen: \"Yo uso marihuana para calmar mi ansiedad escolar\". Según la ciencia, ¿qué ocurre realmente a largo plazo?",
    "opciones": {
      "A": "La marihuana cura la ansiedad para siempre",
      "B": "Funciona mejor que ir a terapia",
      "C": "Al inicio relaja, pero a la larga empeora los síntomas de ansiedad y depresión",
      "D": "Te vuelve inmune al estrés escolar"
    },
    "retroalimentacion": {
      "A": "No es una cura médica aprobada para esto",
      "B": "Oculta los síntomas pero no resuelve el problema",
      "C": "El CDC (2024) señala que el uso constante está ligado a un empeoramiento de los problemas de salud mental a largo plazo",
      "D": "De hecho, dificulta el aprendizaje y causa más estrés académico"
    },
    "correctOptionId": "C"
  },
  {
    "id": 7,
    "pregunta": "¿Cuánto tiempo puede quedarse rastreado el THC (químico de la marihuana) en tu cuerpo después de consumirla?",
    "opciones": {
      "A": "Un par de horas",
      "B": "Un día exacto",
      "C": "Se almacena en la grasa y puede detectarse semanas después",
      "D": "Nunca sale del cuerpo"
    },
    "retroalimentacion": {
      "A": "Ese es el tiempo que dura el efecto, no lo que tarda en salir del cuerpo",
      "B": "Tarda mucho más",
      "C": "NIDA (2024) explica que el THC es liposoluble y permanece en el cuerpo por varios días o semanas",
      "D": "El cuerpo eventualmente lo elimina por completo"
    },
    "correctOptionId": "C"
  },
  {
    "id": 8,
    "pregunta": "Un estudiante se da cuenta de que la marihuana le está causando problemas en casa y reprobó materias, pero siente que \"no puede\" parar de fumar. ¿Esto es evidencia de?",
    "opciones": {
      "A": "Falta de carácter",
      "B": "Un Trastorno por Consumo de Cannabis (CUD)",
      "C": "Que la marihuana que compró estaba caducada",
      "D": "Trastorno de déficit de atención"
    },
    "retroalimentacion": {
      "A": "La adicción es una enfermedad, no un problema moral",
      "B": "SAMHSA (2024) establece que seguir consumiendo a pesar de sufrir consecuencias negativas es un criterio claro de adicción",
      "C": "El problema es la adicción al THC, no su frescura",
      "D": "Es un problema de adicción, no necesariamente TDAH"
    },
    "correctOptionId": "B"
  },
  {
    "id": 9,
    "pregunta": "¿Qué son los \"antojos\" o \"cravings\" en una persona que intenta dejar la marihuana?",
    "opciones": {
      "A": "Ganas de comer muchos dulces",
      "B": "Un fuerte deseo o impulso incontrolable de consumir la droga",
      "C": "Necesidad de dormir todo el día",
      "D": "Ganas de platicar con extraños"
    },
    "retroalimentacion": {
      "A": "Eso pasa durante el consumo (munchies)",
      "B": "SAMHSA (2024) define el \"craving\" como una urgencia intensa por usar la sustancia, típica en la adicción",
      "C": "Eso es fatiga, no craving",
      "D": "El antojo se dirige exclusivamente a la droga"
    },
    "correctOptionId": "B"
  },
  {
    "id": 10,
    "pregunta": "¿Por qué la marihuana de uso médico (\"medicinal\") NO se receta a adolescentes para diversión o estrés común?",
    "opciones": {
      "A": "Porque los doctores son muy estrictos",
      "B": "Porque el cerebro adolescente aún está en formación y el THC puede dañarlo permanentemente",
      "C": "Porque los adolescentes no tienen dinero para pagarla",
      "D": "Porque a los jóvenes no les hace efecto"
    },
    "retroalimentacion": {
      "A": "Es una cuestión de salud neurológica",
      "B": "El CDC (2024) reitera que el THC interfiere con el desarrollo de conexiones cerebrales vitales antes de los 25 años",
      "C": "El motivo es médico, no económico",
      "D": "Sí les hace efecto, pero con mayores riesgos"
    },
    "correctOptionId": "B"
  },
  {
    "id": 11,
    "pregunta": "¿Qué relación hay entre fumar marihuana en la adolescencia y el riesgo de pensamientos suicidas?",
    "opciones": {
      "A": "La marihuana evita estos pensamientos",
      "B": "Aumenta significativamente el riesgo de depresión y pensamientos suicidas",
      "C": "Solo afecta si se escucha música triste",
      "D": "No hay ninguna relación demostrada"
    },
    "retroalimentacion": {
      "A": "Falso, no protege contra la depresión grave",
      "B": "El CDC (2024) advierte de una asociación fuerte entre el uso frecuente en adolescentes y un mayor riesgo de suicidio",
      "C": "El riesgo es bioquímico y psicológico",
      "D": "Los estudios de salud pública confirman la relación"
    },
    "correctOptionId": "B"
  },
  {
    "id": 12,
    "pregunta": "¿Qué medicamento existe actualmente (aprobado por médicos) para curar la adicción a la marihuana?",
    "opciones": {
      "A": "Pastillas de nicotina",
      "B": "Ibuprofeno",
      "C": "No existe ningún medicamento aprobado; el tratamiento es con terapia psicológica",
      "D": "Jarabe para la tos"
    },
    "retroalimentacion": {
      "A": "Son para dejar el tabaco",
      "B": "Es un analgésico común",
      "C": "NIDA (2024) aclara que la FDA no ha aprobado medicamentos para esto; la terapia cognitivo-conductual es el tratamiento principal",
      "D": "No tiene efecto sobre la adicción al THC"
    },
    "correctOptionId": "C"
  },
  {
    "id": 13,
    "pregunta": "¿Qué ocurre con la vida social real (no virtual) de los adolescentes que desarrollan adicción al cannabis?",
    "opciones": {
      "A": "Se vuelven los más populares de la escuela",
      "B": "Mejoran sus habilidades para hablar en público",
      "C": "Tienden a aislarse, perder viejos amigos y tener problemas familiares",
      "D": "Se vuelven muy agresivos y pelean a golpes diario"
    },
    "retroalimentacion": {
      "A": "A menudo ocurre lo contrario",
      "B": "El uso frecuente suele causar aislamiento",
      "C": "SAMHSA (2024) destaca los problemas interpersonales y el aislamiento como señales del trastorno",
      "D": "Aunque hay irritabilidad, el aislamiento y la apatía son más comunes"
    },
    "correctOptionId": "C"
  },
  {
    "id": 14,
    "pregunta": "\"Intenté dejar de fumar el fin de semana, pero me puse de tan mal humor que volví a fumar el lunes\". Esto es un ejemplo de:",
    "opciones": {
      "A": "Falta de motivación escolar",
      "B": "El ciclo de abstinencia y recaída de una adicción",
      "C": "Alergia a los fines de semana",
      "D": "Una técnica saludable de relajación"
    },
    "retroalimentacion": {
      "A": "Es un problema físico/químico",
      "B": "NIDA (2024) explica que el malestar de la abstinencia es la causa principal por la que los jóvenes recaen",
      "C": "Es un síndrome de abstinencia, no alergia",
      "D": "Retomar el consumo para evitar el mal humor confirma la dependencia"
    },
    "correctOptionId": "B"
  },
  {
    "id": 15,
    "pregunta": "Si la marihuana afecta tu \"materia blanca\" en el cerebro adolescente, ¿qué te costará más trabajo hacer en la escuela?",
    "opciones": {
      "A": "Correr en educación física",
      "B": "Dibujar cosas abstractas",
      "C": "Aprender reglas nuevas, resolver problemas complejos y mantener la atención",
      "D": "Escuchar al maestro por problemas de oído"
    },
    "retroalimentacion": {
      "A": "Afecta más los procesos cognitivos que los músculos",
      "B": "No afecta específicamente el arte",
      "C": "El CDC (2024) indica que la materia blanca (encargada de la comunicación neuronal) dañada afecta el aprendizaje complejo",
      "D": "No causa sordera"
    },
    "correctOptionId": "C"
  },
  {
    "id": 16,
    "pregunta": "¿Qué le dirías, basado en ciencia, a un compañero que asegura que \"la marihuana no hace daño porque no es una droga química como las pastillas\"?",
    "opciones": {
      "A": "Que tiene razón y mejor fumen juntos",
      "B": "Que el humo hace daño, pero los brownies son seguros",
      "C": "Que el THC altera químicamente las neuronas y el desarrollo del cerebro, sin importar su origen natural",
      "D": "Que solo hace daño si la fumas todos los días"
    },
    "retroalimentacion": {
      "A": "No es verdad",
      "B": "Ambos tienen riesgos graves",
      "C": "NIDA (2024) aclara que el THC imita químicos cerebrales (endocannabinoides), alterando el funcionamiento normal de las neuronas",
      "D": "Incluso el uso ocasional tiene riesgos en adolescentes"
    },
    "correctOptionId": "C"
  },
  {
    "id": 17,
    "pregunta": "Si un joven es diagnosticado con un Trastorno por Consumo de Cannabis \"Severo\", ¿qué significa médicamente?",
    "opciones": {
      "A": "Que fuma marihuana cara",
      "B": "Que cumple con 6 o más criterios clínicos de adicción y su vida está muy afectada",
      "C": "Que fuma frente a sus papás",
      "D": "Que tiene tos con sangre"
    },
    "retroalimentacion": {
      "A": "El precio no determina la enfermedad",
      "B": "SAMHSA (2024) clasifica la severidad basándose en la cantidad de síntomas (como tolerancia, abstinencia, problemas sociales). 6+ es severo",
      "C": "Eso es un problema de conducta, no el diagnóstico clínico",
      "D": "Es un síntoma respiratorio, no el diagnóstico del trastorno"
    },
    "correctOptionId": "B"
  },
  {
    "id": 18,
    "pregunta": "Un riesgo oculto de la marihuana actual (ya sea en flor o vapeadores) comprada en las calles o redes sociales es:",
    "opciones": {
      "A": "Que te cobren impuestos sorpresa",
      "B": "Que sea caducada y sepa mal",
      "C": "Que esté mezclada sin saberlo con drogas letales como el fentanilo",
      "D": "Que las plantas tengan espinas"
    },
    "retroalimentacion": {
      "A": "El mercado ilegal no cobra impuestos",
      "B": "El sabor no es el riesgo principal",
      "C": "NIDA (2024) alerta sobre el creciente peligro de contaminación cruzada en drogas ilícitas, causando sobredosis accidentales",
      "D": "El riesgo es químico"
    },
    "correctOptionId": "C"
  },
  {
    "id": 19,
    "pregunta": "¿De qué manera engaña la marihuana al \"sistema de recompensas\" del cerebro adolescente?",
    "opciones": {
      "A": "Hace que odies el chocolate",
      "B": "Libera dopamina de manera artificial, haciendo que las cosas normales (como hobbies) ya no parezcan divertidas sin la droga",
      "C": "Te hace creer que ganaste la lotería",
      "D": "Evita que sientas dolor si te cortas"
    },
    "retroalimentacion": {
      "A": "De hecho, suele dar hambre de dulces",
      "B": "NIDA (2024) explica que sobreestimular el sistema de dopamina \"adormece\" la capacidad del joven de disfrutar recompensas naturales",
      "C": "No causa ese tipo de alucinación específica",
      "D": "Aunque tiene efectos analgésicos, no bloquea el dolor agudo extremo de esa manera"
    },
    "correctOptionId": "B"
  },
  {
    "id": 20,
    "pregunta": "¿Qué opción describe mejor cómo prevenir una recaída si un joven ya decidió dejar de consumir marihuana?",
    "opciones": {
      "A": "Seguir juntándose con sus amigos que fuman pero prometer no hacerlo",
      "B": "Cambiar por cigarros de tabaco",
      "C": "Buscar apoyo psicológico, aprender a manejar el estrés y cambiar de rutinas",
      "D": "Encerrarse en su cuarto un mes solo"
    },
    "retroalimentacion": {
      "A": "Exponerse a la sustancia dispara los antojos (cravings)",
      "B": "Solo cambia una adicción por otra muy dañina",
      "C": "SAMHSA (2024) recomienda terapias conductuales y cambios en el estilo de vida para mantener la abstinencia",
      "D": "El aislamiento empeora la salud mental y la depresión"
    },
    "correctOptionId": "C"
  },
  {
    "id": 21,
    "pregunta": "Un amigo siempre fuma un \"porro\" los viernes. Ahora dice que necesita fumar 3 para sentir lo mismo. ¿Qué le está pasando?",
    "opciones": {
      "A": "Está madurando físicamente",
      "B": "Desarrolló \"Tolerancia\", que es una de las primeras señales de que su cuerpo se está volviendo adicto",
      "C": "La marihuana que compró venía \"rebajada\" con agua",
      "D": "Sus pulmones se hicieron más fuertes"
    },
    "retroalimentacion": {
      "A": "Esto no es signo de madurez",
      "B": "SAMHSA explica que la tolerancia es cuando el cerebro se acostumbra a la droga y pide más cantidad para lograr el mismo efecto inicial",
      "C": "Es un cambio en el cerebro, no en la planta",
      "D": "Sus receptores cerebrales se están desensibilizando"
    },
    "correctOptionId": "B"
  },
  {
    "id": 22,
    "pregunta": "Estás en una fiesta y alguien te ofrece un brownie \"especial\" diciendo que no pasa nada porque es comida. ¿Qué es lo más seguro que debes recordar?",
    "opciones": {
      "A": "Que si es de chocolate no hace daño",
      "B": "Que los comestibles tardan mucho en hacer efecto y es facilísimo sufrir una sobredosis de THC por desesperación",
      "C": "Que solo hace efecto si lo comes caliente",
      "D": "Que te ayudará a digerir mejor la cena"
    },
    "retroalimentacion": {
      "A": "El ingrediente base no anula la droga",
      "B": "El CDC y NIDA advierten que las intoxicaciones por comestibles son de las principales causas de visitas de adolescentes a urgencias",
      "C": "La temperatura de consumo no importa",
      "D": "Puede causar náuseas severas si te excedes"
    },
    "correctOptionId": "B"
  },
  {
    "id": 23,
    "pregunta": "Un compañero intenta dejar la marihuana, pero a los dos días anda muy irritable, agresivo, y no puede dormir. ¿Por qué le pasa esto?",
    "opciones": {
      "A": "Porque descubrió que no le gusta estar sobrio",
      "B": "Está experimentando el \"Síndrome de Abstinencia\", porque su cerebro exige la droga",
      "C": "Porque comió mucho azúcar ese día",
      "D": "Es una simple rabieta de adolescente"
    },
    "retroalimentacion": {
      "A": "Es una reacción química, no solo una preferencia",
      "B": "SAMHSA señala que el enojo, el insomnio y la ansiedad son síntomas físicos reales cuando una persona adicta intenta dejar la sustancia",
      "C": "Los síntomas son por falta de THC",
      "D": "Es una condición médica reconocida"
    },
    "correctOptionId": "B"
  },
  {
    "id": 24,
    "pregunta": "Se dice que la marihuana es una \"droga de entrada\" (gateway drug). ¿Qué significa esto para el cerebro de un adolescente?",
    "opciones": {
      "A": "Que la marihuana abre las puertas del éxito",
      "B": "Que acostumbra al sistema de recompensas del cerebro a necesitar sustancias químicas, haciéndolo más vulnerable a probar otras drogas",
      "C": "Que solo la venden en las entradas de los conciertos",
      "D": "Que te ayuda a hacer amigos en la entrada de la escuela"
    },
    "retroalimentacion": {
      "A": "Falso",
      "B": "NIDA indica que la exposición temprana al THC \"prepara\" las vías cerebrales para reaccionar más fuerte a otras drogas más peligrosas en el futuro",
      "C": "Es un concepto neurológico, no físico",
      "D": "No fomenta relaciones saludables"
    },
    "correctOptionId": "B"
  },
  {
    "id": 25,
    "pregunta": "Tu amiga fuma marihuana a escondidas porque dice que le quita el estrés de los exámenes. Un mes después, la notas más estresada y deprimida que antes. ¿Por qué?",
    "opciones": {
      "A": "Porque no está fumando suficiente",
      "B": "La marihuana puede apagar la ansiedad por unas horas, pero a largo plazo empeora trastornos como la depresión y la ansiedad",
      "C": "Porque los maestros la reprobaron a propósito",
      "D": "Porque necesita cambiar la marca de su vaporizador"
    },
    "retroalimentacion": {
      "A": "Fumar más empeorará el problema",
      "B": "El CDC alerta que el uso continuo para \"automedicarse\" altera los químicos del cerebro y agrava los problemas de salud mental originales",
      "C": "Sus síntomas emocionales son internos",
      "D": "El problema es el THC, no la marca"
    },
    "correctOptionId": "B"
  },
  {
    "id": 26,
    "pregunta": "Un joven se gasta todo el dinero de su mesada y de su trabajo de fin de semana en comprar \"cartuchos\" para vapear marihuana. ¿Esto es señal de qué?",
    "opciones": {
      "A": "Que no sabe ahorrar dinero",
      "B": "Es un criterio clínico de \"Trastorno por Consumo\" (adicción), ya que invierte muchos recursos en conseguir la droga",
      "C": "Que apoya la economía local",
      "D": "Que sus papás le dan mucho dinero"
    },
    "retroalimentacion": {
      "A": "Es un problema más profundo que educación financiera",
      "B": "SAMHSA indica que gastar dinero excesivo e invertir mucho tiempo en conseguir y consumir la sustancia es una señal clara de adicción",
      "C": "Está alimentando una enfermedad",
      "D": "Prioriza la droga sobre cualquier otra necesidad"
    },
    "correctOptionId": "B"
  },
  {
    "id": 27,
    "pregunta": "En las noticias salió que algunos jóvenes terminan hospitalizados tosiendo sangre después de vapear marihuana comprada en la calle. ¿Cuál suele ser la causa?",
    "opciones": {
      "A": "Fumaron la planta muy rápido",
      "B": "Se rieron mucho mientras fumaban",
      "C": "Los líquidos de vapeo ilegales suelen estar contaminados con químicos tóxicos como el Acetato de Vitamina E, que destruye los pulmones (EVALI)",
      "D": "Porque el vapor estaba muy frío"
    },
    "retroalimentacion": {
      "A": "Falso",
      "B": "Falso",
      "C": "El CDC vinculó un brote grave de lesiones pulmonares mortales (EVALI) al uso de cartuchos de THC contaminados del mercado negro",
      "D": "El problema son los químicos, no la temperatura"
    },
    "correctOptionId": "C"
  },
  {
    "id": 28,
    "pregunta": "Si alguien te presiona en una fiesta diciéndote: \"Ándale, pruébala, la marihuana cura el cáncer, es medicina\", ¿cuál es la mejor respuesta basada en ciencia?",
    "opciones": {
      "A": "\"Tienes razón, dame dos\"",
      "B": "\"La ciencia dice que el THC puede aliviar náuseas en algunos pacientes, pero NO cura el cáncer, y a mi edad daña mi cerebro\"",
      "C": "\"Solo la pruebo si es en pastel\"",
      "D": "\"Mejor dame un cigarro normal\""
    },
    "retroalimentacion": {
      "A": "Es ceder a la presión y a la desinformación",
      "B": "NIDA aclara que, aunque algunos medicamentos con cannabinoides alivian síntomas específicos (como náuseas por quimioterapia), la marihuana fumada no es una cura para ninguna enfermedad y daña a los menores",
      "C": "Sigue siendo dañina",
      "D": "Ambas sustancias son nocivas"
    },
    "correctOptionId": "B"
  },
  {
    "id": 29,
    "pregunta": "¿Qué riesgo legal y escolar tiene ser atrapado con un vaporizador de THC en la preparatoria?",
    "opciones": {
      "A": "Te dan un premio de consolación",
      "B": "Solo te quitan el vaporizador y te lo devuelven en verano",
      "C": "Puede llevar a la expulsión escolar, antecedentes legales y pérdida de becas u oportunidades universitarias",
      "D": "Te mandan a la biblioteca a estudiar"
    },
    "retroalimentacion": {
      "A": "Falso",
      "B": "Las consecuencias son más serias",
      "C": "Aparte de los riesgos a la salud documentados por el CDC, las instituciones tienen políticas de \"tolerancia cero\" que afectan drásticamente el futuro del estudiante",
      "D": "Las sanciones suelen involucrar suspensión o expulsión directa"
    },
    "correctOptionId": "C"
  },
  {
    "id": 30,
    "pregunta": "Un chavo del equipo de fútbol lleva meses fumando diario. Últimamente, se le olvidan las jugadas, corre más lento y pierde el balón. ¿A qué se debe?",
    "opciones": {
      "A": "Se compró unos tenis que no le quedan",
      "B": "El THC ha afectado su coordinación motora fina y su capacidad para recordar información rápida",
      "C": "Está guardando energía para el partido final",
      "D": "Es alérgico al pasto de la cancha"
    },
    "retroalimentacion": {
      "A": "Falso",
      "B": "El CDC explica que la marihuana afecta las áreas del cerebro responsables del equilibrio, postura, tiempo de reacción y memoria a corto plazo",
      "C": "Es un deterioro de sus habilidades",
      "D": "El deterioro es neurológico"
    },
    "correctOptionId": "B"
  },
  {
    "id": 31,
    "pregunta": "¿Cuál es el mayor peligro de usar gomitas de marihuana si hay niños pequeños en casa?",
    "opciones": {
      "A": "Que las gomitas se derritan en el calor",
      "B": "Que los niños las confundan con dulces normales y sufran intoxicaciones graves que requieran ir a emergencias",
      "C": "Que a los niños no les guste el sabor a fruta",
      "D": "Que las gomitas manchan la ropa"
    },
    "retroalimentacion": {
      "A": "Falso",
      "B": "NIDA advierte que los empaques llamativos engañan a los niños pequeños, y las dosis altas de THC en un cuerpo tan pequeño pueden causar coma o dificultad para respirar",
      "C": "Al contrario, por eso se las comen",
      "D": "El riesgo es de vida o muerte"
    },
    "correctOptionId": "B"
  },
  {
    "id": 32,
    "pregunta": "¿Qué relación hay entre el consumo muy frecuente de marihuana en jóvenes y la \"Psicosis\"?",
    "opciones": {
      "A": "Fumar te hace psicólogo",
      "B": "Evita que tengas pesadillas",
      "C": "Consumir mucha marihuana muy potente puede provocar alucinaciones, paranoia extrema o desconexión de la realidad",
      "D": "Te ayuda a entender mejor las películas de terror"
    },
    "retroalimentacion": {
      "A": "Falso",
      "B": "Falso",
      "C": "El CDC reporta que dosis altas de THC pueden inducir episodios de psicosis aguda, y el uso crónico eleva el riesgo de esquizofrenia en personas vulnerables",
      "D": "Te puede provocar ataques de pánico"
    },
    "correctOptionId": "C"
  },
  {
    "id": 33,
    "pregunta": "¿Qué debes hacer si te das cuenta de que tú o un amigo tienen problemas para dejar la marihuana?",
    "opciones": {
      "A": "Ocultarlo para que nadie se enoje",
      "B": "Tratar de dejarla cambiando por alcohol",
      "C": "Pedir ayuda a un psicólogo escolar, orientador o médico para recibir terapia de apoyo",
      "D": "Esperar a que se quite solo al cumplir 18 años"
    },
    "retroalimentacion": {
      "A": "Guardar el secreto agrava la adicción",
      "B": "Esto es sustitución de adicciones",
      "C": "SAMHSA y NIDA recomiendan buscar ayuda profesional; terapias como la Cognitivo-Conductual son las más efectivas para superar la adicción en jóvenes",
      "D": "Las adicciones no desaparecen mágicamente por la edad"
    },
    "correctOptionId": "C"
  },
  {
    "id": 34,
    "pregunta": "\"Mis papás fuman marihuana, así que no tiene nada de malo que yo lo haga a mis 16 años\". ¿Cuál es el error en ese pensamiento?",
    "opciones": {
      "A": "Que a los 16 deberías estar tomando café",
      "B": "Que el cerebro de sus papás ya terminó de formarse, pero el de un joven de 16 años puede sufrir daños cognitivos permanentes",
      "C": "Que los jóvenes deben comprar marcas diferentes",
      "D": "Que debe hacerlo hasta los 17"
    },
    "retroalimentacion": {
      "A": "Falso",
      "B": "El CDC es enfático: el impacto en la estructura del cerebro (materia blanca y conexiones neuronales) es irreversible si se interrumpe el desarrollo adolescente, a diferencia de un cerebro maduro",
      "C": "Falso",
      "D": "El desarrollo sigue hasta los 25"
    },
    "correctOptionId": "B"
  },
  {
    "id": 35,
    "pregunta": "Si notas que una amiga que solía sacar 10 en todo empieza a reprobar y le da igual su futuro después de empezar a fumar diario. ¿Qué le está sucediendo?",
    "opciones": {
      "A": "Descubrió que la escuela es aburrida",
      "B": "Posiblemente sufre de \"Síndrome Amotivacional\" o pérdida de interés y energía en sus metas debido al uso crónico de marihuana",
      "C": "Necesita dormir más tiempo en clases",
      "D": "Seguramente sus maestros le tienen envidia"
    },
    "retroalimentacion": {
      "A": "Es un síntoma provocado por la sustancia",
      "B": "NIDA describe que muchos jóvenes usuarios regulares desarrollan apatía severa, perdiendo interés en todo lo que antes les importaba",
      "C": "Necesita dejar la sustancia",
      "D": "Es un problema de rendimiento cognitivo"
    },
    "correctOptionId": "B"
  },
  {
    "id": 36,
    "pregunta": "¿Por qué es un mito peligroso creer que \"conducir bajo los efectos de la marihuana te hace manejar más despacio y con más cuidado\"?",
    "opciones": {
      "A": "Porque la marihuana hace que aceleres a 200 km/h",
      "B": "Porque manejar despacio también es malo",
      "C": "Porque distorsiona la percepción de la distancia, retrasa el tiempo de frenado y te distrae fácilmente de la calle",
      "D": "Porque te da sueño si enciendes la radio"
    },
    "retroalimentacion": {
      "A": "No suele causar agresividad al volante",
      "B": "Falso",
      "C": "El CDC indica que la marihuana altera gravemente la atención dividida y el tiempo de reacción, siendo causa importante de accidentes automovilísticos",
      "D": "La distracción es neurológica"
    },
    "correctOptionId": "C"
  },
  {
    "id": 37,
    "pregunta": "¿Qué suele pensar erróneamente un joven que está desarrollando adicción a la marihuana (\"Fase de Negación\")?",
    "opciones": {
      "A": "Que la marihuana es muy cara",
      "B": "\"Yo la controlo, puedo dejarla cuando quiera, no es para tanto\"",
      "C": "\"Debería estudiar medicina\"",
      "D": "\"Tengo que comer más verduras\""
    },
    "retroalimentacion": {
      "A": "Falso",
      "B": "SAMHSA advierte que la negación del problema, minimizando las consecuencias y justificando el consumo constante, es el síntoma psicológico clásico de cualquier adicción",
      "C": "Falso",
      "D": "Falso"
    },
    "correctOptionId": "B"
  },
  {
    "id": 38,
    "pregunta": "Tu amigo empezó a tener ataques de tos muy fuertes en las mañanas y a sacar flemas grises. Él jura que es asma. ¿Qué dice la ciencia si fuma marihuana a diario?",
    "opciones": {
      "A": "Que seguramente se contagió de un virus de computadora",
      "B": "Que la tos mañanera es señal de que sus pulmones están sanos",
      "C": "Que el humo constante de la marihuana causa inflamación crónica en los bronquios, produciendo tos y flemas igual que el tabaco",
      "D": "Que tiene alergia al sol de la mañana"
    },
    "retroalimentacion": {
      "A": "Falso",
      "B": "Falso",
      "C": "NIDA aclara que fumar marihuana frecuentemente produce problemas respiratorios crónicos, bronquitis y un mayor riesgo de infecciones pulmonares",
      "D": "El irritante es el humo"
    },
    "correctOptionId": "C"
  },
  {
    "id": 39,
    "pregunta": "¿Por qué es muy peligroso el mercado ilegal de marihuana, de acuerdo a recientes alertas médicas?",
    "opciones": {
      "A": "Porque te pueden dar menos peso del que pagaste",
      "B": "Porque muchas veces las drogas vienen contaminadas con Fentanilo, un opioide mortal capaz de causar una sobredosis con solo tocarlo o probarlo",
      "C": "Porque los empaques son feos",
      "D": "Porque no aceptan tarjeta de crédito"
    },
    "retroalimentacion": {
      "A": "Eso es una estafa comercial, no un riesgo médico",
      "B": "NIDA advierte repetidamente que muchas sustancias en la calle (incluidos vapes o flores falsificadas) son mezcladas con fentanilo para hacerlas más adictivas, causando miles de muertes accidentales",
      "C": "Falso",
      "D": "Falso"
    },
    "correctOptionId": "B"
  },
  {
    "id": 40,
    "pregunta": "Un adolescente decide dejar de usar marihuana porque notó que afecta su vida. ¿Qué estrategia es la MEJOR para no recaer?",
    "opciones": {
      "A": "Ir a fiestas donde todos fuman para probar su fuerza de voluntad",
      "B": "Encerrarse en su cuarto sin hablar con nadie por dos meses",
      "C": "Evitar a los amigos que consumen, buscar nuevos pasatiempos saludables como el ejercicio y hablar de cómo se siente con su familia o psicólogo",
      "D": "Empezar a tomar alcohol en las fiestas en lugar de fumar"
    },
    "retroalimentacion": {
      "A": "Eso es exponerse al riesgo innecesariamente",
      "B": "El aislamiento causa depresión",
      "C": "SAMHSA recomienda un cambio completo de estilo de vida: identificar y evitar los \"detonantes\" (personas, lugares) y crear una red de apoyo emocional fuerte",
      "D": "Sustituir una sustancia por otra sigue alimentando los problemas de adicción y salud"
    },
    "correctOptionId": "C"
  },
  {
    "id": 41,
    "pregunta": "¿Cómo impacta a largo plazo el consumo crónico de marihuana al \"núcleo accumbens\" (centro de placer) del cerebro?",
    "opciones": {
      "A": "Lo hace crecer físicamente",
      "B": "Desensibiliza los receptores de dopamina, dificultando sentir placer con actividades cotidianas como comer o socializar",
      "C": "Bloquea el dolor físico para siempre",
      "D": "Acelera la absorción de vitaminas en la sangre"
    },
    "retroalimentacion": {
      "A": "El cerebro no hipertrofia áreas como un músculo por el uso de sustancias",
      "B": "NIDA señala que el uso repetido adormece el circuito de recompensa natural, haciendo que solo la droga genere placer",
      "C": "Sus propiedades analgésicas son temporales y no curan patologías causantes de dolor",
      "D": "No tiene ninguna interacción metabólica con la síntesis de vitaminas"
    },
    "correctOptionId": "B"
  },
  {
    "id": 42,
    "pregunta": "Si un paciente adolescente pide ayuda médica por adicción al cannabis, ¿qué tratamiento recomendaría un especialista basado en las guías de SAMHSA?",
    "opciones": {
      "A": "Terapias conductuales y apoyo psicológico, pues no hay medicamentos aprobados por la FDA para esto",
      "B": "Recetar antidepresivos fuertes de inmediato",
      "C": "Internamiento obligatorio en un hospital psiquiátrico de un año",
      "D": "Darle cigarros de tabaco para que sustituya el vicio"
    },
    "retroalimentacion": {
      "A": "SAMHSA enfatiza intervenciones como la Terapia Cognitivo-Conductual (TCC) para modificar patrones de pensamiento y comportamiento",
      "B": "Los psicofármacos se usan si hay un diagnóstico psiquiátrico paralelo, no como cura directa para el Trastorno por Consumo de Cannabis",
      "C": "Los tratamientos suelen ser ambulatorios a menos que exista riesgo vital inminente",
      "D": "La sustitución de adicciones está médicamente contraindicada"
    },
    "correctOptionId": "A"
  },
  {
    "id": 43,
    "pregunta": "¿Qué síntoma clínico clave diferencia un uso recreativo ocasional de un \"Trastorno por Consumo de Cannabis\" leve o moderado?",
    "opciones": {
      "A": "Reírse mucho y tener ojos rojos",
      "B": "Continuar consumiendo a pesar de que el uso cause problemas sociales, escolares o familiares comprobados",
      "C": "Comprar pipas de colores",
      "D": "Fumar únicamente en fines de semana"
    },
    "retroalimentacion": {
      "A": "Esos son signos de intoxicación aguda, no criterios de un trastorno crónico",
      "B": "SAMHSA establece que el impacto negativo persistente en las esferas de la vida (y la incapacidad de detenerse) define el diagnóstico de adicción",
      "C": "Poseer parafernalia no es un criterio clínico diagnóstico del DSM-5",
      "D": "La frecuencia baja no constituye por sí sola un trastorno clínico sin disfunción social"
    },
    "correctOptionId": "B"
  },
  {
    "id": 44,
    "pregunta": "¿Por qué la \"materia blanca\" del cerebro es especialmente vulnerable al THC durante la adolescencia?",
    "opciones": {
      "A": "Porque es donde se almacena el agua del cerebro",
      "B": "Porque en la adolescencia se están creando las vías de comunicación rápidas (mielinización) que el THC interrumpe de forma permanente",
      "C": "Porque absorbe más humo que la materia gris",
      "D": "Porque contiene neuronas espejo"
    },
    "retroalimentacion": {
      "A": "El cerebro no tiene reservorios de agua separados de esta manera",
      "B": "El CDC advierte que el desarrollo estructural y la eficiencia de las conexiones neuronales se ven alteradas severamente",
      "C": "El humo no llega físicamente al cerebro; el THC llega por vía sanguínea a todos los tejidos",
      "D": "Las neuronas espejo están ubicadas principalmente en la corteza premotora, no son exclusivas ni definitorias de la materia blanca"
    },
    "correctOptionId": "B"
  },
  {
    "id": 45,
    "pregunta": "En términos de salud mental comprobada, ¿cómo actúa la marihuana en alguien diagnosticado con ansiedad social severa?",
    "opciones": {
      "A": "La cura definitivamente después de tres dosis",
      "B": "Puede ofrecer un alivio muy breve en el momento, pero a largo plazo incrementa la ansiedad basal y la dependencia emocional a la sustancia",
      "C": "Lo vuelve extrovertido para siempre",
      "D": "No tiene ninguna relación con las emociones o la conducta"
    },
    "retroalimentacion": {
      "A": "No existe cura farmacológica definitiva para los trastornos de ansiedad en tres dosis de ninguna sustancia",
      "B": "El CDC documenta el \"efecto rebote\" y el empeoramiento crónico de trastornos afectivos al usar cannabis como automedicación",
      "C": "La desinhibición es transitoria y a menudo acompañada de paranoia posterior",
      "D": "El sistema endocannabinoide está profundamente implicado en la regulación emocional"
    },
    "correctOptionId": "B"
  },
  {
    "id": 46,
    "pregunta": "¿Qué significa el concepto clínico de \"Tolerancia Cruzada\" en relación con el uso crónico de cannabis?",
    "opciones": {
      "A": "Que la planta tolera climas fríos y calientes",
      "B": "Que al acostumbrar al cerebro al THC, puede requerirse mayor dosis de otros depresores o anestésicos para sentir efecto, complicando procedimientos médicos",
      "C": "Que el usuario debe cruzar la calle para fumar legalmente",
      "D": "Que el usuario se vuelve más tolerante con las opiniones ajenas"
    },
    "retroalimentacion": {
      "A": "Es un término botánico, no médico",
      "B": "NIDA describe cómo las vías neurológicas desensibilizadas pueden alterar la respuesta del paciente a medicamentos quirúrgicos o sedantes",
      "C": "No es un término legal ni de tránsito",
      "D": "Es un fenómeno fisiológico, no una virtud social"
    },
    "correctOptionId": "B"
  },
  {
    "id": 47,
    "pregunta": "¿Qué es el metabolito \"11-hidroxi-THC\" y por qué representa un riesgo elevado en urgencias médicas?",
    "opciones": {
      "A": "Es una vitamina esencial producida al calentar la planta",
      "B": "Es el metabolito hiperpotente que produce el hígado al ingerir marihuana comestible, causando efectos mucho más fuertes e impredecibles que al fumarla",
      "C": "Es el nombre químico del cáñamo industrial",
      "D": "Un gas natural emitido por las hojas"
    },
    "retroalimentacion": {
      "A": "No tiene valor nutricional ni propiedades vitamínicas",
      "B": "NIDA explica la farmacocinética de primer paso hepático en los comestibles, siendo el principal culpable de intoxaciones agudas en jóvenes",
      "C": "El cáñamo se caracteriza por altos niveles de CBD y THC insignificante",
      "D": "Es una molécula sintetizada internamente en el hígado humano"
    },
    "correctOptionId": "B"
  },
  {
    "id": 48,
    "pregunta": "Durante el proceso de abstinencia de marihuana, un síntoma físico muy común que experimentan los jóvenes adictos (y que a menudo ignoran) es:",
    "opciones": {
      "A": "Crecimiento acelerado de uñas y cabello",
      "B": "Sudoración nocturna intensa, cambios de temperatura y escalofríos severos",
      "C": "Cambio espontáneo en el color del iris (ojos)",
      "D": "Visión de rayos X temporal"
    },
    "retroalimentacion": {
      "A": "No hay afectación en la queratina",
      "B": "SAMHSA lista la inestabilidad autonómica y de la temperatura corporal como un síntoma de abstinencia física comprobable",
      "C": "La genética ocular no se altera por la abstinencia",
      "D": "Médicamente imposible"
    },
    "correctOptionId": "B"
  },
  {
    "id": 49,
    "pregunta": "Según las instituciones de salud internacionales (como el CDC), ¿existe un nivel de consumo de marihuana 100% seguro durante el embarazo?",
    "opciones": {
      "A": "Sí, un cigarro al mes está permitido clínicamente",
      "B": "Sí, siempre y cuando se consuma en formato de té natural",
      "C": "No, no existe ninguna cantidad segura conocida, ya que el THC atraviesa la barrera placentaria inmediatamente",
      "D": "Sí, pero únicamente a partir del tercer trimestre"
    },
    "retroalimentacion": {
      "A": "No existe tal permisividad en las guías médicas",
      "B": "El THC extraído en infusiones sigue siendo nocivo para el feto",
      "C": "El CDC y SAMHSA advierten un riesgo de \"tolerancia cero\" debido a las graves disrupciones en la arquitectura cerebral del feto",
      "D": "El cerebro fetal está en desarrollo crítico durante todo el embarazo"
    },
    "correctOptionId": "C"
  },
  {
    "id": 50,
    "pregunta": "¿A nivel estructural, cómo afecta el cannabis al \"Hipocampo\" del cerebro en desarrollo de un adolescente?",
    "opciones": {
      "A": "Mejora exponencialmente la memoria de largo plazo",
      "B": "Acelera su crecimiento celular",
      "C": "Reduce el volumen celular y altera las neuronas encargadas de procesar y retener información nueva",
      "D": "Lo vuelve completamente inmune a tumores cerebrales"
    },
    "retroalimentacion": {
      "A": "El desempeño memorístico disminuye bajo los efectos",
      "B": "No promueve la neurogénesis masiva en humanos de esta manera",
      "C": "NIDA asocia el uso temprano y constante con anomalías morfológicas en el hipocampo, resultando en un menor rendimiento académico y retención",
      "D": "El THC no es una vacuna contra el cáncer cerebral"
    },
    "correctOptionId": "C"
  }
];

export const PREGUNTAS_RETIRAR: RetirarQuestion[] = RAW_PREGUNTAS_RETIRAR.map((item) => ({
  id: item.id,
  question: item.pregunta,
  options: [
    { id: 'A', text: item.opciones.A, feedback: item.retroalimentacion.A },
    { id: 'B', text: item.opciones.B, feedback: item.retroalimentacion.B },
    { id: 'C', text: item.opciones.C, feedback: item.retroalimentacion.C },
    { id: 'D', text: item.opciones.D, feedback: item.retroalimentacion.D },
  ],
  correctOptionId: item.correctOptionId as 'A' | 'B' | 'C' | 'D',
}));
