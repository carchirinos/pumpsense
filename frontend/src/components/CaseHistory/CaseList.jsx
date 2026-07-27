import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import CaseCard from './CaseCard';
import ResolveForm from './ResolveForm';
import CaseDetailModal from './CaseDetailModal';

/**
 * CaseList — renders the filtered case list with result count,
 * loading state, empty states, inline resolve/cancel forms, and case detail modal.
 *
 * @param {{
 *   cases: object[],
 *   filteredCases: object[],
 *   isLoading: boolean,
 *   onUpdateCase: (id: string, data: object) => Promise<void>,
 * }} props
 */
export default function CaseList({ cases, filteredCases, isLoading, onUpdateCase }) {
  const { t } = useLanguage();

  // Track which card has an open inline form and which action it's for
  const [activeForm, setActiveForm] = useState(null); // { id, targetStatus } | null
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal state
  const [modalCase, setModalCase] = useState(null); // case object | null
  const [modalAction, setModalAction] = useState(null); // { targetStatus } | null

  async function handleFormSubmit(id, data) {
    setIsSubmitting(true);
    try {
      await onUpdateCase(id, data);
      setActiveForm(null);
      // If modal is open for this case, close the action form but keep modal open
      // with updated data (parent replaces the case in state)
      setModalAction(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  function openModal(caseData) {
    setModalCase(caseData);
    setModalAction(null);
  }

  function closeModal() {
    setModalCase(null);
    setModalAction(null);
  }

  // --- Loading state ---
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  // --- Empty state: no cases exist at all ---
  if (cases.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-8">
        {t('history.noData')}
      </p>
    );
  }

  // --- Result count ---
  const countText = t('history.resultCount')
    .replace('{n}', String(filteredCases.length))
    .replace('{total}', String(cases.length));

  // Keep modal in sync with updated case data from parent
  const modalCaseData = modalCase
    ? filteredCases.find(c => c.id === modalCase.id) ?? modalCase
    : null;

  return (
    <div className="space-y-4">
      {/* Result count */}
      <p className="text-xs text-gray-500">{countText}</p>

      {/* Empty state: cases exist but none match filters */}
      {filteredCases.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-6">
          {t('history.emptyState')}
        </p>
      )}

      {/* Case cards */}
      {filteredCases.map((c) => (
        <div key={c.id}>
          <CaseCard
            caseData={c}
            onClick={() => openModal(c)}
            onResolve={() => setActiveForm({ id: c.id, targetStatus: 'resolved' })}
            onCancel={() => setActiveForm({ id: c.id, targetStatus: 'cancelled' })}
          />
          {/* Inline form when this card's action is active */}
          {activeForm?.id === c.id && (
            <div className="bg-white border border-gray-200 border-t-0 rounded-b-xl px-4 pb-4 -mt-1">
              <ResolveForm
                targetStatus={activeForm.targetStatus}
                isSubmitting={isSubmitting}
                onSubmit={(data) => handleFormSubmit(c.id, data)}
                onCancel={() => setActiveForm(null)}
              />
            </div>
          )}
        </div>
      ))}

      {/* Case detail modal */}
      {modalCaseData && (
        <CaseDetailModal caseData={modalCaseData} onClose={closeModal}>
          {/* Resolve/Cancel actions inside modal for open cases */}
          {modalCaseData.status === 'open' && !modalAction && (
            <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setModalAction({ targetStatus: 'resolved' })}
                className="text-xs font-medium text-green-700 hover:text-green-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded px-1"
              >
                {t('history.resolve')}
              </button>
              <button
                type="button"
                onClick={() => setModalAction({ targetStatus: 'cancelled' })}
                className="text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded px-1"
              >
                {t('history.cancelCase')}
              </button>
            </div>
          )}
          {modalCaseData.status === 'open' && modalAction && (
            <ResolveForm
              targetStatus={modalAction.targetStatus}
              isSubmitting={isSubmitting}
              onSubmit={(data) => handleFormSubmit(modalCaseData.id, data)}
              onCancel={() => setModalAction(null)}
            />
          )}
        </CaseDetailModal>
      )}
    </div>
  );
}
