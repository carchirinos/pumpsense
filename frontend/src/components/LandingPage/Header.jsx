import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Inline globe SVG icon (from Lucide icon set — avoids adding a dependency).
 */
function GlobeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}

export default function Header() {
  const { lang, setLang, t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Wordmark */}
        <Link
          to="/"
          className="text-xl font-semibold text-gray-900 tracking-tight hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded transition-colors"
        >
          {t('header.wordmark')}
        </Link>

        {/* Right-side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Case History — secondary outlined button */}
          <Link
            to="/history"
            className="text-sm font-medium text-gray-700 border border-gray-300 hover:border-gray-400 hover:text-gray-900 bg-white hover:bg-gray-50 rounded-lg px-3 py-1.5 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            {t('history.link')}
          </Link>

          {/* Language toggle — segmented control with globe icon */}
          <div
            className="flex items-center border border-gray-300 rounded-lg overflow-hidden"
            role="group"
            aria-label="Language"
          >
            <button
              onClick={() => setLang('en')}
              className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-inset ${
                lang === 'en'
                  ? 'bg-gray-100 text-gray-900'
                  : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
              aria-pressed={lang === 'en'}
            >
              <GlobeIcon />
              <span className="hidden sm:inline">English</span>
              <span className="sm:hidden">EN</span>
            </button>
            <button
              onClick={() => setLang('es')}
              className={`text-xs font-medium px-2.5 py-1.5 cursor-pointer transition-colors border-l border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-inset ${
                lang === 'es'
                  ? 'bg-gray-100 text-gray-900'
                  : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
              aria-pressed={lang === 'es'}
            >
              <span className="hidden sm:inline">Español</span>
              <span className="sm:hidden">ES</span>
            </button>
          </div>

          {/* CTA — primary */}
          <Link
            to="/diagnose"
            className="bg-blue-600 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
          >
            {t('header.cta')}
          </Link>
        </div>
      </div>
    </header>
  );
}
