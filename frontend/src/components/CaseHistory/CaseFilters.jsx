import { useLanguage } from '../../context/LanguageContext';

const DEFAULT_FILTERS = {
  search: '',
  status: '',
  technicianName: '',
  from: '',
  to: '',
};

/**
 * CaseFilters — presentational filter controls.
 *
 * Owns no state; receives the current filter object and emits changes
 * upward via onChange({ ...filters, [key]: value }).
 *
 * @param {{ filters: object, onChange: (filters: object) => void }} props
 */
export default function CaseFilters({ filters, onChange }) {
  const { t } = useLanguage();

  function update(key, value) {
    onChange({ ...filters, [key]: value });
  }

  function handleShowAll() {
    onChange({ ...DEFAULT_FILTERS });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow space-y-4">
      {/* Row 1: search + status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Free-text symptom search */}
        <div>
          <label htmlFor="filter-search" className="block text-xs font-medium text-gray-500 mb-1">
            {t('history.filterSearch')}
          </label>
          <input
            id="filter-search"
            type="text"
            value={filters.search}
            onChange={(e) => update('search', e.target.value)}
            placeholder={t('history.filterSearch')}
            className="w-full border border-gray-300 bg-gray-50 rounded-lg px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:bg-white focus-visible:ring-2 focus-visible:ring-blue-600"
          />
        </div>

        {/* Status dropdown */}
        <div>
          <label htmlFor="filter-status" className="block text-xs font-medium text-gray-500 mb-1">
            {t('history.filterStatus')}
          </label>
          <select
            id="filter-status"
            value={filters.status}
            onChange={(e) => update('status', e.target.value)}
            className="w-full border border-gray-300 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:bg-white focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <option value="">{t('status.all')}</option>
            <option value="open">{t('status.open')}</option>
            <option value="resolved">{t('status.resolved')}</option>
            <option value="cancelled">{t('status.cancelled')}</option>
          </select>
        </div>
      </div>

      {/* Row 2: technician + date range */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Technician name */}
        <div>
          <label htmlFor="filter-tech" className="block text-xs font-medium text-gray-500 mb-1">
            {t('history.filterTechnician')}
          </label>
          <input
            id="filter-tech"
            type="text"
            value={filters.technicianName}
            onChange={(e) => update('technicianName', e.target.value)}
            placeholder={t('history.filterTechnician')}
            className="w-full border border-gray-300 bg-gray-50 rounded-lg px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:bg-white focus-visible:ring-2 focus-visible:ring-blue-600"
          />
        </div>

        {/* Date from */}
        <div>
          <label htmlFor="filter-from" className="block text-xs font-medium text-gray-500 mb-1">
            {t('history.filterFrom')}
          </label>
          <input
            id="filter-from"
            type="date"
            value={filters.from}
            onChange={(e) => update('from', e.target.value)}
            className="w-full border border-gray-300 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:bg-white focus-visible:ring-2 focus-visible:ring-blue-600"
          />
        </div>

        {/* Date to */}
        <div>
          <label htmlFor="filter-to" className="block text-xs font-medium text-gray-500 mb-1">
            {t('history.filterTo')}
          </label>
          <input
            id="filter-to"
            type="date"
            value={filters.to}
            onChange={(e) => update('to', e.target.value)}
            className="w-full border border-gray-300 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:bg-white focus-visible:ring-2 focus-visible:ring-blue-600"
          />
        </div>
      </div>

      {/* Show all button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleShowAll}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded px-2 py-1"
        >
          {t('history.showAll')}
        </button>
      </div>
    </div>
  );
}

export { DEFAULT_FILTERS };
