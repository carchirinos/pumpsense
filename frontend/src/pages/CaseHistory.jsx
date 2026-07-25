import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getCases, updateCase } from '../services/cases';
import CaseFilters, { DEFAULT_FILTERS } from '../components/CaseHistory/CaseFilters';
import CaseList from '../components/CaseHistory/CaseList';

/**
 * Normalises a string for accent-insensitive comparison.
 * Strips combining diacritical marks after NFD decomposition, then lowercases.
 */
function normalizeText(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/**
 * Filters cases client-side with AND semantics.
 * An empty/null filter value means that dimension is inactive.
 */
function filterCases(cases, filters) {
  return cases.filter((c) => {
    // Free-text symptom search — accent-insensitive
    if (filters.search) {
      if (!normalizeText(c.symptom ?? '').includes(normalizeText(filters.search))) {
        return false;
      }
    }

    // Status — compare against English stored value; empty means "all"
    if (filters.status && c.status !== filters.status) {
      return false;
    }

    // Technician name — case-insensitive substring (not exact equality)
    if (filters.technicianName) {
      if (!(c.technicianName ?? '').toLowerCase().includes(filters.technicianName.toLowerCase())) {
        return false;
      }
    }

    // Date range — compare local date against picker values (both inclusive)
    if (filters.from || filters.to) {
      const localDate = new Date(c.createdAt).toLocaleDateString('en-CA'); // YYYY-MM-DD in local TZ
      if (filters.from && localDate < filters.from) return false;
      if (filters.to && localDate > filters.to) return false;
    }

    return true;
  });
}

export default function CaseHistory() {
  const { t } = useLanguage();
  const [cases, setCases]       = useState([]);
  const [filters, setFilters]   = useState({ ...DEFAULT_FILTERS });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]       = useState('');

  // Fetch all cases on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getCases();
        if (!cancelled) setCases(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Filtered view — recomputed only when cases or filters change
  const filteredCases = useMemo(
    () => filterCases(cases, filters),
    [cases, filters],
  );

  /**
   * Updates a case via PATCH and replaces it in local state from the server response.
   * Does NOT optimistically mutate — waits for success before updating the UI.
   * Throws on failure so CaseList can surface the error.
   */
  async function handleUpdateCase(id, data) {
    setError('');
    try {
      const updated = await updateCase(id, data);
      // Replace the case in-place from the server response
      setCases((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (err) {
      setError(err.message);
      throw err; // Re-throw so CaseList knows the submission failed
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
          >
            <span aria-hidden="true">&larr;</span> {t('diagnose.back')}
          </Link>
          <span className="text-sm font-semibold text-gray-900 tracking-tight">
            {t('header.wordmark')}
          </span>
          <span className="w-12" aria-hidden="true" />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 gap-6">
        {/* Page heading */}
        <div className="w-full max-w-5xl">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            {t('history.pageTitle')}
          </h1>
          <p className="text-sm text-gray-500">
            {t('history.pageSubtitle')}
          </p>
        </div>

        {/* Filters */}
        <div className="w-full max-w-5xl">
          <CaseFilters filters={filters} onChange={setFilters} />
        </div>

        {/* Error banner */}
        {error && (
          <div className="w-full max-w-5xl">
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              {error}
            </p>
          </div>
        )}

        {/* Case list */}
        <div className="w-full max-w-5xl">
          <CaseList
            cases={cases}
            filteredCases={filteredCases}
            isLoading={isLoading}
            onUpdateCase={handleUpdateCase}
          />
        </div>
      </main>
    </div>
  );
}
