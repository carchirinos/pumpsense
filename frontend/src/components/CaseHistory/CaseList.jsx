import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import CaseCard from './CaseCard';
import ResolveForm from './ResolveForm';

/**
 * CaseList — renders the filtered case list with result count,
 * loading state, empty states, and inline resolve/cancel forms.
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

  // Track which card has an open form and which action it's for
  const [activeForm, setActiveForm] = useState(null); // { id, targetStatus } | null
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleFormSubmit(id, data) {
    setIsSubmitting(true);
    try {
      await onUpdateCase(id, data);
      setActiveForm(null);
    } finally {
      setIsSubmitting(false);
    }
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
    </div>
  );
}
