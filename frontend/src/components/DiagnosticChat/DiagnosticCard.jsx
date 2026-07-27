import { useLanguage } from '../../context/LanguageContext';

const CONFIDENCE_CLASSES = {
  high:   'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low:    'bg-red-100 text-red-800',
};

/**
 * DiagnosticCard
 *
 * Renders a structured work-order-style card with four labeled sections.
 * Never a chat bubble — the card layout itself communicates the AI response.
 *
 * @param {{ symptom: string, cause: string, action: string, confidence: 'high'|'medium'|'low' }} props
 */
export default function DiagnosticCard({ symptom, cause, action, confidence }) {
  const { t } = useLanguage();

  const badgeClasses = CONFIDENCE_CLASSES[confidence] ?? CONFIDENCE_CLASSES.low;
  // Confidence label is translated; fall back to capitalized key if unknown
  const badgeLabel = t(`card.confidence.${confidence}`)
    ?? (confidence ? confidence.charAt(0).toUpperCase() + confidence.slice(1) : '—');

  // Preserve numbered action steps — split on \n and render each on its own line
  const actionLines = action.split('\n').filter(Boolean);

  return (
    <article
      className="animate-card-enter bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm w-full max-w-[640px] mx-auto"
      aria-label={t('card.header')}
    >
      {/* Card header bar */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
        <p className="text-xs font-medium uppercase tracking-widest text-gray-500">
          {t('card.header')}
        </p>
      </div>

      {/* Symptom — gray surface */}
      <div className="bg-gray-50 px-4 py-4 border-b border-gray-200">
        <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-1">
          {t('card.symptom')}
        </p>
        <p className="text-gray-800 text-sm leading-relaxed">{symptom}</p>
      </div>

      {/* Likely Cause — amber left border */}
      <div className="border-l-4 border-amber-400 pl-3 pr-4 py-4 border-b border-gray-200">
        <p className="text-xs font-medium uppercase tracking-widest text-amber-600 mb-1">
          {t('card.cause')}
        </p>
        <p className="text-gray-800 text-sm leading-relaxed">{cause}</p>
      </div>

      {/* Recommended Action — steel blue left border */}
      <div className="border-l-4 border-blue-600 pl-3 pr-4 py-4 border-b border-gray-200">
        <p className="text-xs font-medium uppercase tracking-widest text-blue-700 mb-2">
          {t('card.action')}
        </p>
        <div className="text-gray-800 text-sm leading-relaxed space-y-1">
          {actionLines.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>

      {/* Confidence badge — color + text label (REQ-F21) */}
      <div className="px-4 py-3 flex items-center gap-2">
        <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
          {t('card.confidence')}
        </p>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeClasses}`}>
          {badgeLabel}
        </span>
      </div>
    </article>
  );
}
