import { useState } from 'react';
import { Link } from 'react-router-dom';
import ChatInput from '../components/DiagnosticChat/ChatInput';
import DiagnosticCard from '../components/DiagnosticChat/DiagnosticCard';
import RelatedCases from '../components/DiagnosticChat/RelatedCases';
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
    <div className="min-h-screen bg-gray-100 flex flex-col">
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
          <Link
            to="/history"
            className="text-sm font-medium text-gray-700 border border-gray-400 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 rounded-lg px-3 py-1.5 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            {t('history.link')}
          </Link>
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

        {/* Decorative pump schematic — hidden on mobile to keep input above fold */}
        <div className="hidden sm:block w-full max-w-[640px]" aria-hidden="true">
          <svg
            viewBox="0 0 400 140"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto opacity-[0.5]"
          >
            {/* Suction line */}
            <line x1="20" y1="70" x2="120" y2="70" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" />
            {/* Pump casing (volute) */}
            <circle cx="200" cy="70" r="50" stroke="#2563EB" strokeWidth="3" />
            {/* Impeller blades */}
            <path d="M200 40 L215 70 L200 100" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M200 40 L185 70 L200 100" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M172 55 L200 70 L172 85" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M228 55 L200 70 L228 85" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Shaft */}
            <line x1="200" y1="120" x2="200" y2="140" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" />
            <rect x="180" y="125" width="40" height="15" rx="3" stroke="#2563EB" strokeWidth="2.5" fill="none" />
            {/* Discharge line */}
            <line x1="250" y1="70" x2="280" y2="70" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" />
            <line x1="280" y1="70" x2="280" y2="30" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" />
            <line x1="280" y1="30" x2="380" y2="30" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" />
            {/* Suction arrow */}
            <polygon points="50,62 50,78 35,70" fill="#2563EB" />
            {/* Discharge arrow */}
            <polygon points="360,23 360,37 375,30" fill="#2563EB" />
            {/* Labels — visual only, no text for a11y since aria-hidden on parent */}
            <circle cx="200" cy="70" r="4" fill="#2563EB" />
          </svg>
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
              <div key={index} className="flex flex-col gap-3">
                <DiagnosticCard
                  symptom={result.symptom}
                  cause={result.cause}
                  action={result.action}
                  confidence={result.confidence}
                />
                <RelatedCases relatedCases={result.relatedCases} />
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
