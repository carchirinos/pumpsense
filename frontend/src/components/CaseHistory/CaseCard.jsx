import { useLanguage } from '../../context/LanguageContext';

const STATUS_BADGE_CLASSES = {
  open:      'bg-blue-100 text-blue-800',
  resolved:  'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

/**
 * Formats an ISO timestamp using Intl.DateTimeFormat in the active language locale.
 *
 * @param {string} iso - ISO 8601 timestamp
 * @param {string} lang - 'en' or 'es'
 * @returns {string}
 */
function formatDate(iso, lang) {
  if (!iso) return '—';
  const locale = lang === 'es' ? 'es-MX' : 'en-US';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

/**
 * Truncates a string to maxLen characters, appending "…" if truncated.
 */
function truncate(str, maxLen = 80) {
  if (!str || str.length <= maxLen) return str ?? '';
  return str.slice(0, maxLen) + '…';
}

/**
 * CaseCard — presentational component for a single case row.
 *
 * @param {{
 *   caseData: object,
 *   onResolve: () => void,
 *   onCancel: () => void,
 * }} props
 */
export default function CaseCard({ caseData, onResolve, onCancel }) {
  const { t, lang } = useLanguage();

  const isOpen = caseData.status === 'open';
  const badgeClasses = STATUS_BADGE_CLASSES[caseData.status] ?? STATUS_BADGE_CLASSES.open;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow">
      {/* Header row: truncated symptom + badge + date */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <p className="text-sm text-gray-900 font-medium flex-1">
          {truncate(caseData.symptom)}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeClasses}`}>
            {t(`status.${caseData.status}`)}
          </span>
          <span className="text-xs text-gray-400">
            {formatDate(caseData.createdAt, lang)}
          </span>
        </div>
      </div>

      {/* Actions for open cases */}
      {isOpen && (
        <div className="flex items-center gap-3 mt-2">
          <button
            type="button"
            onClick={onResolve}
            className="text-xs font-medium text-green-700 hover:text-green-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded px-1"
          >
            {t('history.resolve')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded px-1"
          >
            {t('history.cancelCase')}
          </button>
        </div>
      )}

      {/* Resolution details for closed cases */}
      {!isOpen && caseData.resolvedAt && (
        <div className="mt-2 border-t border-gray-100 pt-2 space-y-1 text-xs text-gray-500">
          <p>
            <span className="font-medium">{t('history.resolvedAt')}:</span>{' '}
            {formatDate(caseData.resolvedAt, lang)}
          </p>
          {caseData.technicianName && (
            <p>
              <span className="font-medium">{t('history.resolvedBy')}:</span>{' '}
              {caseData.technicianName}
            </p>
          )}
          {caseData.resolutionNote && (
            <p>
              <span className="font-medium">{t('history.noteDisplay')}:</span>{' '}
              {caseData.resolutionNote}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
