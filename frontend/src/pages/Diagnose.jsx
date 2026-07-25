import { useState } from 'react';
import { Link } from 'react-router-dom';
import ChatInput from '../components/DiagnosticChat/ChatInput';
import DiagnosticCard from '../components/DiagnosticChat/DiagnosticCard';
import { diagnose } from '../services/api';
import { createCase } from '../services/cases';
import { useLanguage } from '../context/LanguageContext';

/**
 * Diagnose page — chat interface
 *
 * State machine:
 *   idle     → user types symptom → submit
 *   loading  → POST /diagnose in flight; input + button disabled
 *   success  → card prepended to history; input cleared; back to idle
 *   error    → error message shown; input + button re-enabled for retry
 */
export default function Diagnose() {
  const { t, lang } = useLanguage();
  const [history,  setHistory]  = useState([]);    // DiagnosticCard data, newest first
  const [status,   setStatus]   = useState('idle'); // 'idle' | 'loading' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(symptom) {
    setStatus('loading');
    setErrorMsg('');

    try {
      const result = await diagnose(symptom, lang);
      // Prepend so newest result appears at top of the list (REQ-F16)
      setHistory((prev) => [result, ...prev]);
      setStatus('idle');

      // Fire-and-forget: persist as a case in the background.
      // A failed save must NEVER block or alter the diagnostic card shown.
      createCase({ ...result, language: lang }).catch((err) => {
        console.error('[PumpSense] Failed to persist case:', err.message);
      });
    } catch (err) {
      setErrorMsg(err.message ?? t('errors.generic'));
      setStatus('error');
    }
  }

  const isLoading = status === 'loading';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Minimal header with back navigation (REQ-F19) */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
          >
            <span aria-hidden="true">&larr;</span> {t('diagnose.back')}
          </Link>
          <span className="text-sm font-semibold text-gray-900 tracking-tight">
            {t('header.wordmark')}
          </span>
          {/* Spacer to keep title centered */}
          <span className="w-12" aria-hidden="true" />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 gap-6">
        {/* Page title */}
        <div className="w-full max-w-[640px]">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            {t('diagnose.pageTitle')}
          </h1>
          <p className="text-sm text-gray-500">
            {t('diagnose.pageSubtitle')}
          </p>
        </div>

        {/* Input — always visible; anchors the interaction */}
        <ChatInput
          onSubmit={handleSubmit}
          isLoading={isLoading}
          errorMsg={errorMsg}
        />

        {/* Diagnostic card history — newest first (REQ-F16) */}
        {history.length > 0 && (
          <section
            className="w-full max-w-[640px] flex flex-col gap-4"
            aria-label={t('card.header')}
          >
            {history.map((result, index) => (
              <DiagnosticCard
                key={index}
                symptom={result.symptom}
                cause={result.cause}
                action={result.action}
                confidence={result.confidence}
              />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
