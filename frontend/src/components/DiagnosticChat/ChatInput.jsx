import { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

/**
 * ChatInput
 *
 * Controlled symptom input form. Handles:
 *   - Empty-submit validation (REQ-F11)
 *   - Loading state: disables input + button, shows spinner (REQ-F13)
 *   - API error display with retry (REQ-F17)
 *   - Accessible label association (REQ-F23)
 *   - Visible focus ring (REQ-F22)
 *
 * @param {{ onSubmit: (symptom: string) => Promise<void>, isLoading: boolean, errorMsg: string }} props
 */
export default function ChatInput({ onSubmit, isLoading, errorMsg }) {
  const { t } = useLanguage();
  const [symptom, setSymptom]             = useState('');
  const [validationMsg, setValidationMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = symptom.trim();

    if (!trimmed) {
      setValidationMsg(t('errors.emptySymptom'));
      return;
    }

    setValidationMsg('');
    await onSubmit(trimmed);

    // Clear input on success (errorMsg will be empty after a clean response)
    if (!errorMsg) {
      setSymptom('');
    }
  }

  const showError = errorMsg || validationMsg;

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-[640px] mx-auto"
      noValidate
    >
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        {/* Label — associated with textarea via htmlFor/id (REQ-F23) */}
        <label
          htmlFor="symptom-input"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {t('input.label')}
        </label>

        <textarea
          id="symptom-input"
          value={symptom}
          onChange={(e) => {
            setSymptom(e.target.value);
            if (validationMsg) setValidationMsg('');
          }}
          disabled={isLoading}
          rows={3}
          placeholder={t('input.placeholder')}
          className="w-full border border-gray-300 rounded-xl p-3 text-sm text-gray-900 resize-none leading-relaxed placeholder-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:bg-gray-50 disabled:text-gray-400 transition"
          aria-describedby={showError ? 'input-error' : undefined}
        />

        {/* Validation / API error */}
        {showError && (
          <p
            id="input-error"
            role="alert"
            className="text-sm text-red-600 mt-1"
          >
            {errorMsg || validationMsg}
          </p>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          className="mt-3 w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          {isLoading ? (
            <>
              <LoadingSpinner />
              <span>{t('input.submitting')}</span>
            </>
          ) : (
            t('input.submit')
          )}
        </button>
      </div>
    </form>
  );
}
