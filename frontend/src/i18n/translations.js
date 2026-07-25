/**
 * PumpSense UI translations.
 *
 * Structure: translations[lang][key]
 * Supported languages: 'en' | 'es'
 *
 * Keys follow a dot-notation naming convention:
 *   header.*          — top navigation
 *   hero.*            — landing hero section
 *   categories.*      — failure category cards
 *   testimonials.*    — testimonials section
 *   footer.*          — footer
 *   diagnose.*        — chat / diagnose page
 *   card.*            — diagnostic result card section labels
 *   errors.*          — error and validation messages
 */

const translations = {
  en: {
    // ── Header ──────────────────────────────────────────────────────────────
    'header.wordmark':    'PumpSense',
    'header.cta':         'Try it now',
    'header.lang':        'ES',          // label shown to switch TO Spanish
    'header.langAriaLabel': 'Switch to Spanish',

    // ── Hero ────────────────────────────────────────────────────────────────
    'hero.eyebrow':       'AI-Powered Diagnostics',
    'hero.headline':      'Diagnose pump failures in seconds',
    'hero.subheadline':   'Describe what you observe and PumpSense returns a likely cause and step-by-step action — grounded in industrial pump failure patterns.',
    'hero.cta':           'Diagnose a Pump Issue',

    // ── Failure categories ───────────────────────────────────────────────────
    'categories.heading':       'Common Failure Patterns',
    'categories.subheading':    'PumpSense is grounded in the most frequent industrial pump failures.',
    'categories.cavitation.tag':         'Pressure & Flow',
    'categories.cavitation.name':        'Cavitation',
    'categories.cavitation.description': 'Vapor bubble collapse erodes the impeller and causes pressure loss.',
    'categories.bearing.tag':            'Mechanical',
    'categories.bearing.name':           'Bearing Failure',
    'categories.bearing.description':    'Worn or under-lubricated bearings produce grinding noise and heat.',
    'categories.seal.tag':               'Leakage',
    'categories.seal.name':              'Seal Leak',
    'categories.seal.description':       'Damaged mechanical seals allow fluid to escape around the shaft.',

    // ── Testimonials ─────────────────────────────────────────────────────────
    'testimonials.heading':    'Trusted by Maintenance Teams',
    'testimonials.subheading': 'Used by technicians and engineers across industrial facilities.',
    'testimonials.jr.quote':   'Diagnosed a cavitation issue in under a minute. Used to take us half a day of back-and-forth.',
    'testimonials.jr.name':    'James R.',
    'testimonials.jr.role':    'Senior Maintenance Technician',
    'testimonials.jr.company': 'Gulf Coast Refinery',
    'testimonials.mc.quote':   'The action steps are specific enough to hand straight to the crew. No interpretation needed.',
    'testimonials.mc.name':    'Maria C.',
    'testimonials.mc.role':    'Plant Engineer',
    'testimonials.mc.company': 'Midwest Water Authority',
    'testimonials.dt.quote':   'We caught a bearing failure early because of PumpSense. Saved us an unplanned shutdown.',
    'testimonials.dt.name':    'Derek T.',
    'testimonials.dt.role':    'Reliability Engineer',
    'testimonials.dt.company': 'Pacific Industrial',

    // ── Footer ────────────────────────────────────────────────────────────────
    'footer.tagline':  'AI diagnostics for industrial pumps',

    // ── Diagnose page ─────────────────────────────────────────────────────────
    'diagnose.pageTitle':       'Pump Diagnostics',
    'diagnose.pageSubtitle':    'Describe the symptom you observe and receive a structured diagnosis.',
    'diagnose.back':            'Back',

    // ── Chat input ────────────────────────────────────────────────────────────
    'input.label':        'Describe what you observe',
    'input.placeholder':  'e.g. The pump is vibrating hard and lost pressure...',
    'input.submit':       'Run Diagnosis',
    'input.submitting':   'Analyzing…',

    // ── Diagnostic card labels ────────────────────────────────────────────────
    'card.header':     'Diagnostic Result',
    'card.symptom':    'Symptom',
    'card.cause':      'Likely Cause',
    'card.action':     'Recommended Action',
    'card.confidence': 'Confidence',
    'card.confidence.high':   'High',
    'card.confidence.medium': 'Medium',
    'card.confidence.low':    'Low',

    // ── Errors & validation ────────────────────────────────────────────────────
    'errors.emptySymptom': 'Please describe the symptom before submitting.',
    'errors.generic':      'Something went wrong. Please try again.',
    'errors.noteRequired': 'Please enter a resolution note.',
    'errors.nameRequired': 'Please enter your name.',

    // ── Case History ──────────────────────────────────────────────────────────
    'history.link':             'Case History',
    'history.pageTitle':        'Case History',
    'history.pageSubtitle':     'Browse, filter, and resolve past diagnostics.',
    'history.loading':          'Loading cases…',
    'history.filterSearch':     'Search symptoms',
    'history.filterStatus':     'Status',
    'history.filterTechnician': 'Technician',
    'history.filterFrom':       'From',
    'history.filterTo':         'To',
    'history.showAll':          'Show all',
    'history.resultCount':      'Showing {n} of {total} cases',
    'history.emptyState':       'No cases match your filters.',
    'history.noData':           'No cases recorded yet.',
    'history.resolve':          'Mark as resolved',
    'history.cancelCase':       'Cancel case',
    'history.cancel':           'Cancel',
    'history.submit':           'Submit',
    'history.noteLabel':        'Resolution note',
    'history.notePlaceholder':  'Describe what was done to resolve the issue…',
    'history.nameLabel':        'Technician name',
    'history.namePlaceholder':  'Your name',
    'history.resolvedAt':       'Resolved at',
    'history.resolvedBy':       'Resolved by',
    'history.noteDisplay':      'Note',

    // ── Status display names (English stored values → display) ────────────────
    'status.open':       'Open',
    'status.resolved':   'Resolved',
    'status.cancelled':  'Cancelled',
    'status.all':        'All',
  },

  es: {
    // ── Header ──────────────────────────────────────────────────────────────
    'header.wordmark':    'PumpSense',
    'header.cta':         'Probar ahora',
    'header.lang':        'EN',          // label shown to switch TO English
    'header.langAriaLabel': 'Cambiar a inglés',

    // ── Hero ────────────────────────────────────────────────────────────────
    'hero.eyebrow':       'Diagnóstico con Inteligencia Artificial',
    'hero.headline':      'Diagnostica fallos de bombas en segundos',
    'hero.subheadline':   'Describe lo que observas y PumpSense devuelve la causa probable y los pasos a seguir — basado en patrones reales de fallos en bombas industriales.',
    'hero.cta':           'Diagnosticar un problema',

    // ── Failure categories ────────────────────────────────────────────────────
    'categories.heading':       'Patrones de Fallo Comunes',
    'categories.subheading':    'PumpSense se basa en los fallos más frecuentes de bombas industriales.',
    'categories.cavitation.tag':         'Presión y Caudal',
    'categories.cavitation.name':        'Cavitación',
    'categories.cavitation.description': 'El colapso de burbujas de vapor erosiona el impulsor y provoca pérdida de presión.',
    'categories.bearing.tag':            'Mecánico',
    'categories.bearing.name':           'Fallo de Rodamiento',
    'categories.bearing.description':    'Los rodamientos desgastados o con lubricación insuficiente generan ruido y calor.',
    'categories.seal.tag':               'Fuga',
    'categories.seal.name':              'Fuga de Sello',
    'categories.seal.description':       'Los sellos mecánicos dañados permiten que el fluido escape alrededor del eje.',

    // ── Testimonials ──────────────────────────────────────────────────────────
    'testimonials.heading':    'Con la confianza de los equipos de mantenimiento',
    'testimonials.subheading': 'Utilizado por técnicos e ingenieros en instalaciones industriales.',
    'testimonials.jr.quote':   'Diagnosticamos un problema de cavitación en menos de un minuto. Antes nos llevaba medio día.',
    'testimonials.jr.name':    'James R.',
    'testimonials.jr.role':    'Técnico de Mantenimiento Senior',
    'testimonials.jr.company': 'Gulf Coast Refinery',
    'testimonials.mc.quote':   'Los pasos de acción son suficientemente específicos para entregarlos directamente al equipo. Sin interpretaciones.',
    'testimonials.mc.name':    'Maria C.',
    'testimonials.mc.role':    'Ingeniera de Planta',
    'testimonials.mc.company': 'Midwest Water Authority',
    'testimonials.dt.quote':   'Detectamos un fallo de rodamiento a tiempo gracias a PumpSense. Evitamos una parada no planificada.',
    'testimonials.dt.name':    'Derek T.',
    'testimonials.dt.role':    'Ingeniero de Fiabilidad',
    'testimonials.dt.company': 'Pacific Industrial',

    // ── Footer ────────────────────────────────────────────────────────────────
    'footer.tagline':  'Diagnóstico con IA para bombas industriales',

    // ── Diagnose page ─────────────────────────────────────────────────────────
    'diagnose.pageTitle':    'Diagnóstico de Bombas',
    'diagnose.pageSubtitle': 'Describe el síntoma que observas y recibe un diagnóstico estructurado.',
    'diagnose.back':         'Volver',

    // ── Chat input ────────────────────────────────────────────────────────────
    'input.label':        'Describe lo que observas',
    'input.placeholder':  'Ej. La bomba vibra mucho y ha perdido presión...',
    'input.submit':       'Ejecutar diagnóstico',
    'input.submitting':   'Analizando…',

    // ── Diagnostic card labels ────────────────────────────────────────────────
    'card.header':     'Resultado del Diagnóstico',
    'card.symptom':    'Síntoma',
    'card.cause':      'Causa Probable',
    'card.action':     'Acción Recomendada',
    'card.confidence': 'Confianza',
    'card.confidence.high':   'Alta',
    'card.confidence.medium': 'Media',
    'card.confidence.low':    'Baja',

    // ── Errors & validation ────────────────────────────────────────────────────
    'errors.emptySymptom': 'Por favor, describe el síntoma antes de enviar.',
    'errors.generic':      'Algo salió mal. Por favor, inténtalo de nuevo.',
    'errors.noteRequired': 'Por favor, ingresa una nota de resolución.',
    'errors.nameRequired': 'Por favor, ingresa tu nombre.',

    // ── Case History ──────────────────────────────────────────────────────────
    'history.link':             'Historial',
    'history.pageTitle':        'Historial de Casos',
    'history.pageSubtitle':     'Navega, filtra y resuelve diagnósticos anteriores.',
    'history.loading':          'Cargando casos…',
    'history.filterSearch':     'Buscar síntomas',
    'history.filterStatus':     'Estado',
    'history.filterTechnician': 'Técnico',
    'history.filterFrom':       'Desde',
    'history.filterTo':         'Hasta',
    'history.showAll':          'Mostrar todos',
    'history.resultCount':      'Mostrando {n} de {total} casos',
    'history.emptyState':       'No hay casos que coincidan con los filtros.',
    'history.noData':           'Aún no hay casos registrados.',
    'history.resolve':          'Marcar como resuelto',
    'history.cancelCase':       'Cancelar caso',
    'history.cancel':           'Cancelar',
    'history.submit':           'Enviar',
    'history.noteLabel':        'Nota de resolución',
    'history.notePlaceholder':  'Describe lo que se hizo para resolver el problema…',
    'history.nameLabel':        'Nombre del técnico',
    'history.namePlaceholder':  'Tu nombre',
    'history.resolvedAt':       'Resuelto el',
    'history.resolvedBy':       'Resuelto por',
    'history.noteDisplay':      'Nota',

    // ── Status display names (English stored values → display) ────────────────
    'status.open':       'Abierto',
    'status.resolved':   'Resuelto',
    'status.cancelled':  'Cancelado',
    'status.all':        'Todos',
  },
};

export default translations;
