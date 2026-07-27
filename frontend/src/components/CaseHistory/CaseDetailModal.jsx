import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../context/LanguageContext';

const STATUS_BADGE_CLASSES = {
  open:      'bg-blue-100 text-blue-800',
  resolved:  'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

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
 * CaseDetailModal — full case detail overlay.
 *
 * @param {{
 *   caseData: object,
 *   onClose: () => void,
 *   children?: React.ReactNode  (optional slot for resolve/cancel form)
 * }} props
 */
export default function CaseDetailModal({ caseData, onClose, children }) {
  const { t, lang } = useLanguage();
  const overlayRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Prevent body scroll and store focus on mount, restore on unmount
  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      previousFocusRef.current?.focus?.();
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Close on backdrop click
  function handleBackdropClick(e) {
    if (e.target === overlayRef.current) onClose();
  }

  const isOpen = caseData.status === 'open';
  const isClosed = !isOpen;
  const badgeClasses = STATUS_BADGE_CLASSES[caseData.status] ?? STATUS_BADGE_CLASSES.open;
  const displayNumber = caseData.caseNumber ?? caseData.id?.slice(0, 8).toUpperCase() ?? '';

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label={t('modal.caseDetail')}
    >
      <div className="relative bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between rounded-t-xl z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-400">{displayNumber}</span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeClasses}`}>
              {t(`status.${caseData.status}`)}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label={t('modal.close')}
            className="text-gray-400 hover:text-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Symptom */}
          {caseData.symptom && (
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-1">
                {t('card.symptom')}
              </p>
              <p className="text-sm text-gray-900 leading-relaxed">{caseData.symptom}</p>
            </div>
          )}

          {/* Cause */}
          {caseData.cause && (
            <div className="border-l-4 border-amber-400 pl-3">
              <p className="text-xs font-medium uppercase tracking-widest text-amber-600 mb-1">
                {t('modal.cause')}
              </p>
              <p className="text-sm text-gray-800 leading-relaxed">{caseData.cause}</p>
            </div>
          )}

          {/* Action */}
          {caseData.action && (
            <div className="border-l-4 border-blue-600 pl-3">
              <p className="text-xs font-medium uppercase tracking-widest text-blue-700 mb-1">
                {t('modal.action')}
              </p>
              <div className="text-sm text-gray-800 leading-relaxed space-y-1">
                {caseData.action.split('\n').filter(Boolean).map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          )}

          {/* Confidence */}
          {caseData.confidence && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-widest text-gray-400">
                {t('card.confidence')}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE_CLASSES[caseData.confidence] ?? 'bg-gray-100 text-gray-800'}`}>
                {t(`card.confidence.${caseData.confidence}`) ?? caseData.confidence}
              </span>
            </div>
          )}

          {/* Created date */}
          {caseData.createdAt && (
            <p className="text-xs text-gray-400">
              {t('modal.created')}: {formatDate(caseData.createdAt, lang)}
            </p>
          )}

          {/* Resolution details (closed cases only) */}
          {isClosed && caseData.resolvedAt && (
            <div className="border-t border-gray-100 pt-3 space-y-2">
              <p className="text-xs text-gray-500">
                <span className="font-medium">{t('history.resolvedAt')}:</span>{' '}
                {formatDate(caseData.resolvedAt, lang)}
              </p>
              {caseData.technicianName && (
                <p className="text-xs text-gray-500">
                  <span className="font-medium">{t('history.resolvedBy')}:</span>{' '}
                  {caseData.technicianName}
                </p>
              )}
              {caseData.resolutionNote && (
                <p className="text-xs text-gray-500">
                  <span className="font-medium">{t('history.noteDisplay')}:</span>{' '}
                  {caseData.resolutionNote}
                </p>
              )}
            </div>
          )}

          {/* Optional slot: resolve/cancel form injected by parent */}
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
