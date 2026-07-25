import { useLanguage } from '../../context/LanguageContext';

const CATEGORY_KEYS = [
  {
    id: 'cavitation',
    tagKey:  'categories.cavitation.tag',
    nameKey: 'categories.cavitation.name',
    descKey: 'categories.cavitation.description',
    tagClasses: 'bg-amber-100 text-amber-800',
  },
  {
    id: 'bearing-failure',
    tagKey:  'categories.bearing.tag',
    nameKey: 'categories.bearing.name',
    descKey: 'categories.bearing.description',
    tagClasses: 'bg-blue-100 text-blue-800',
  },
  {
    id: 'seal-leak',
    tagKey:  'categories.seal.tag',
    nameKey: 'categories.seal.name',
    descKey: 'categories.seal.description',
    tagClasses: 'bg-red-100 text-red-800',
  },
];

export default function FailureCategories() {
  const { t } = useLanguage();

  return (
    <section className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          {t('categories.heading')}
        </h2>
        <p className="text-gray-500 mb-8">
          {t('categories.subheading')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CATEGORY_KEYS.map((cat) => (
            <div
              key={cat.id}
              className="bg-white border border-gray-200 rounded-xl p-6"
            >
              {/* Category tag — no icons, colored pill only */}
              <span
                className={`inline-block text-xs font-medium px-2 py-1 rounded-full mb-3 ${cat.tagClasses}`}
              >
                {t(cat.tagKey)}
              </span>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t(cat.nameKey)}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {t(cat.descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
