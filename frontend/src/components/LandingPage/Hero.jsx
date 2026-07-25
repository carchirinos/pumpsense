import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

// Stable Unsplash direct-serve URL — industrial pump / factory floor
const HERO_IMAGE_URL =
  'https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?auto=format&fit=crop&w=1920&q=80';

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section
      className="relative min-h-[600px] lg:min-h-[700px] flex items-center justify-center bg-gray-900 bg-cover bg-center"
      style={{ backgroundImage: `url(${HERO_IMAGE_URL})` }}
      aria-label="Hero section — industrial pump facility"
    >
      {/* Dark overlay for text legibility */}
      <div className="absolute inset-0 bg-black/55" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 sm:px-6 max-w-3xl mx-auto">
        <p className="text-sm font-medium uppercase tracking-widest text-blue-300 mb-4">
          {t('hero.eyebrow')}
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4">
          {t('hero.headline')}
        </h1>
        <p className="text-lg text-gray-200 leading-relaxed mb-8 max-w-xl mx-auto">
          {t('hero.subheadline')}
        </p>
        <Link
          to="/diagnose"
          className="inline-block bg-blue-600 hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent text-white text-lg font-medium px-8 py-3 rounded-xl transition-colors"
        >
          {t('hero.cta')}
        </Link>
      </div>
    </section>
  );
}
