import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export default function Header() {
  const { lang, setLang, t } = useLanguage();

  function toggleLanguage() {
    setLang(lang === 'en' ? 'es' : 'en');
  }

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
        <div className="flex items-center gap-2">
          {/* Case History link */}
          <Link
            to="/history"
            className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded px-2 py-1.5"
          >
            {t('history.link')}
          </Link>

          {/* Language toggle */}
          <button
            onClick={toggleLanguage}
            aria-label={t('header.langAriaLabel')}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 border border-gray-300 hover:border-gray-400 rounded-lg px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            {t('header.lang')}
          </button>

          {/* CTA */}
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
