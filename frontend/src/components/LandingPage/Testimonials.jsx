import { useLanguage } from '../../context/LanguageContext';

const TESTIMONIAL_KEYS = [
  { id: 'jr', initials: 'JR', quoteKey: 'testimonials.jr.quote', nameKey: 'testimonials.jr.name', roleKey: 'testimonials.jr.role', companyKey: 'testimonials.jr.company' },
  { id: 'mc', initials: 'MC', quoteKey: 'testimonials.mc.quote', nameKey: 'testimonials.mc.name', roleKey: 'testimonials.mc.role', companyKey: 'testimonials.mc.company' },
  { id: 'dt', initials: 'DT', quoteKey: 'testimonials.dt.quote', nameKey: 'testimonials.dt.name', roleKey: 'testimonials.dt.role', companyKey: 'testimonials.dt.company' },
];

export default function Testimonials() {
  const { t } = useLanguage();

  return (
    <section className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          {t('testimonials.heading')}
        </h2>
        <p className="text-gray-500 mb-8">
          {t('testimonials.subheading')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIAL_KEYS.map((item) => (
            <figure
              key={item.id}
              className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-4"
            >
              <blockquote className="text-gray-700 text-sm leading-relaxed flex-1">
                &ldquo;{t(item.quoteKey)}&rdquo;
              </blockquote>

              <figcaption className="flex items-center gap-3">
                {/* Initials avatar — no human photography */}
                <div
                  className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold shrink-0"
                  aria-hidden="true"
                >
                  {item.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t(item.nameKey)}</p>
                  <p className="text-xs text-gray-500">
                    {t(item.roleKey)}, {t(item.companyKey)}
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
