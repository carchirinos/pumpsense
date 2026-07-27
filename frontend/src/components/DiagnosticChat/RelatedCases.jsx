import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import CaseDetailModal from '../CaseHistory/CaseDetailModal';

/**
 * Truncates a string to maxLen characters, appending "…" if truncated.
 */
function truncate(str, maxLen = 80) {
  if (!str || str.length <= maxLen) return str ?? '';
  return str.slice(0, maxLen) + '…';
}

/**
 * RelatedCases — compact supporting evidence section below a diagnostic card.
 *
 * Renders ONLY when relatedCases is non-empty. Clicking "View case" opens
 * a detail modal in place — the user never navigates away from the diagnostic.
 *
 * @param {{ relatedCases: Array<{ caseNumber: string, symptom: string, cause?: string, action?: string, resolutionNote: string, technicianName?: string }> }} props
 */
export default function RelatedCases({ relatedCases }) {
  const { t } = useLanguage();
  const [modalCase, setModalCase] = useState(null);

  if (!relatedCases || relatedCases.length === 0) return null;

  return (
    <div className="animate-card-enter w-full max-w-[640px] mx-auto">
      <p className="text-sm font-semibold text-gray-900 mb-3">
        {t('related.heading')}
      </p>
      <div className="space-y-3">
        {relatedCases.map((rc) => (
          <div
            key={rc.caseNumber}
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="text-xs font-mono text-gray-400 mr-2">
                  {rc.caseNumber}
                </span>
                <span className="text-sm text-gray-800">
                  {truncate(rc.symptom, 60)}
                </span>
                {rc.resolutionNote && (
                  <p className="text-sm text-gray-600 mt-1.5">
                    <span className="font-medium text-gray-500">{t('related.resolution')}:</span>{' '}
                    {truncate(rc.resolutionNote, 80)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setModalCase(rc)}
                className="shrink-0 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded cursor-pointer"
              >
                {t('related.viewCase')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail modal — no resolve/cancel actions (these are already resolved reference cases) */}
      {modalCase && (
        <CaseDetailModal
          caseData={{ ...modalCase, status: 'resolved' }}
          onClose={() => setModalCase(null)}
        />
      )}
    </div>
  );
}
