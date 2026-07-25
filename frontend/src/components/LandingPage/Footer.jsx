import { useLanguage } from '../../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-gray-900 text-gray-400 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
        <p className="font-medium text-gray-300">{t('header.wordmark')}</p>
        <p>{t('footer.tagline')}</p>
        <p>&copy; {new Date().getFullYear()} {t('header.wordmark')}</p>
      </div>
    </footer>
  );
}
