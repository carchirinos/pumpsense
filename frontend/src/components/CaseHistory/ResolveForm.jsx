import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

/**
 * ResolveForm — inline form for both resolve and cancel actions.
 *
 * The target status ("resolved" or "cancelled") is passed as a prop;
 * this component doesn't decide which status to set.
 *
 * @param {{
 *   targetStatus: 'resolved' | 'cancelled',
 *   isSubmitting: boolean,
 *   onSubmit: (data: { status: string, resolutionNote: string, technicianName: string }) => void,
 *   onCancel: () => void,
 * }} props
 */
export default function ResolveForm({ targetStatus, isSubmitting, onSubmit, onCancel }) {
  const { t } = useLanguage();
  const [note, setNote]             = useState('');
  const [name, setName]             = useState('');
  const [validationMsg, setValidationMsg] = useState('');

  function handleSubmit(e) {
    e.preventDefault();

    const trimmedNote = note.trim();
    const trimmedName = name.trim();

    if (!trimmedNote) {
      setValidationMsg(t('errors.noteRequired'));
      return;
    }
    if (!trimmedName) {
      setValidationMsg(t('errors.nameRequired'));
      return;
    }

    setValidationMsg('');
    onSubmit({
      status: targetStatus,
      resolutionNote: trimmedNote,
      technicianName: trimmedName,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 border-t border-gray-100 pt-3 space-y-3">
      {/* Resolution note */}
      <div>
        <label htmlFor="resolve-note" className="block text-xs font-medium text-gray-500 mb-1">
          {t('history.noteLabel')}
        </label>
        <textarea
          id="resolve-note"
          value={note}
          onChange={(e) => { setNote(e.target.value); setValidationMsg(''); }}
          disabled={isSubmitting}
          rows={2}
          placeholder={t('history.notePlaceholder')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none placeholder-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:bg-gray-50 disabled:text-gray-400"
        />
      </div>

      {/* Technician name */}
      <div>
        <label htmlFor="resolve-name" className="block text-xs font-medium text-gray-500 mb-1">
          {t('history.nameLabel')}
        </label>
        <input
          id="resolve-name"
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setValidationMsg(''); }}
          disabled={isSubmitting}
          placeholder={t('history.namePlaceholder')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:bg-gray-50 disabled:text-gray-400"
        />
      </div>

      {/* Validation error */}
      {validationMsg && (
        <p role="alert" className="text-xs text-red-600">{validationMsg}</p>
      )}

      {/* Buttons */}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          {isSubmitting ? '…' : t('history.submit')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="text-sm font-medium text-gray-500 hover:text-gray-800 px-3 py-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          {t('history.cancel')}
        </button>
      </div>
    </form>
  );
}
