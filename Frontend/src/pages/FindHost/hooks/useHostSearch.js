import { useState, useEffect, useMemo, useCallback } from 'react';
import { listingsApi } from '../../../api/api';

export default function useHostSearch() {
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search input state and 300ms debouncing
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isDebouncing, setIsDebouncing] = useState(false);

  // Filter dropdown states
  const [kashrutFilter, setKashrutFilter] = useState('ALL');
  const [lodgingFilter, setLodgingFilter] = useState('ALL');
  const [availableOnlyFilter, setAvailableOnlyFilter] = useState(false);
  const [sortByMatch, setSortByMatch] = useState('DESC');

  // Toast message
  const [toastMessage, setToastMessage] = useState('');

  // 300ms Debouncing effect
  useEffect(() => {
    setIsDebouncing(true);
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setIsDebouncing(false);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch hosts from DB API
  const fetchHosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (debouncedSearch) params.city = debouncedSearch;
      if (kashrutFilter !== 'ALL') params.kashrut_level = kashrutFilter;

      const response = await listingsApi.searchHosts(params);
      const rawData = response.data || [];

      // Normalize DB response objects for presentation
      const mappedHosts = rawData.map((profile) => ({
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.host_name || profile.user?.full_name || 'משפחה מארחת',
        city: profile.city || 'לא צוין',
        kashrut_level: profile.kashrut_level || 'KOSHER',
        has_lodging: profile.availability_windows
          ? profile.availability_windows.includes('לינה')
          : true,
        available_spots: profile.available_spots !== undefined ? profile.available_spots : 3,
        match_percentage:
          profile.match_score !== undefined && profile.match_score !== null
            ? profile.match_score
            : 85,
        biography:
          profile.free_text_notes ||
          (profile.religious_orientation
            ? `אווירת בית: ${profile.religious_orientation}`
            : null) ||
          'נשמח מאוד לארח חיילים ולוחמים בסופי שבוע באווירה חמה, ארוחות שבת חגיגיות ויחס אישי.',
        tags: [
          profile.neighborhood,
          profile.religious_orientation,
          profile.kashrut_level === 'MEHADRIN' ? 'מהדרין' : 'כשר'
        ].filter(Boolean),
        image_url: profile.image_url || null
      }));

      setHosts(mappedHosts);
    } catch (err) {
      console.error('Error fetching hosts from DB:', err);
      setError('לא ניתן לטעון את רשימת המארחים משרת המסד נתונים. אנא ודא שהשרת פעיל ונסה שוב.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, kashrutFilter]);

  useEffect(() => {
    fetchHosts();
  }, [fetchHosts]);

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setKashrutFilter('ALL');
    setLodgingFilter('ALL');
    setAvailableOnlyFilter(false);
    setSortByMatch('DESC');
  };

  // Toggle lodging quick filter
  const handleLodgingToggle = () => {
    setLodgingFilter((prev) => (prev === 'LODGING_ONLY' ? 'ALL' : 'LODGING_ONLY'));
  };

  // Toggle available spots quick filter
  const handleAvailableOnlyToggle = () => {
    setAvailableOnlyFilter((prev) => !prev);
  };

  // Booking request feedback
  const handleBookingRequest = (host) => {
    setToastMessage(`בקשת אירוח נשלחה בהצלחה אל ${host.full_name}! ננעץ עבורך.`);
    setTimeout(() => setToastMessage(''), 4500);
  };

  // Computed filtered and sorted hosts
  const filteredHosts = useMemo(() => {
    return hosts
      .filter((host) => {
        const term = debouncedSearch.toLowerCase();
        const matchesSearch =
          !term ||
          host.city.toLowerCase().includes(term) ||
          host.full_name.toLowerCase().includes(term) ||
          host.biography.toLowerCase().includes(term) ||
          (host.tags && host.tags.some((tag) => tag.toLowerCase().includes(term)));

        const hostKashrut = String(host.kashrut_level || '').toLowerCase();
        const filterKashrut = String(kashrutFilter).toLowerCase();
        const matchesKashrut =
          kashrutFilter === 'ALL' ||
          hostKashrut === filterKashrut ||
          ((filterKashrut === 'glatt_mehadrin' || filterKashrut === 'mehadrin') &&
            (hostKashrut === 'glatt_mehadrin' || hostKashrut === 'mehadrin'));

        const matchesLodging =
          lodgingFilter === 'ALL' ||
          (lodgingFilter === 'LODGING_ONLY' && host.has_lodging);

        const matchesAvailability =
          !availableOnlyFilter || host.available_spots > 0;

        return (
          matchesSearch &&
          matchesKashrut &&
          matchesLodging &&
          matchesAvailability
        );
      })
      .sort((a, b) => {
        if (sortByMatch === 'DESC') {
          return b.match_percentage - a.match_percentage;
        }
        return a.match_percentage - b.match_percentage;
      });
  }, [
    hosts,
    debouncedSearch,
    kashrutFilter,
    lodgingFilter,
    availableOnlyFilter,
    sortByMatch
  ]);

  const hasActiveFilters = Boolean(
    searchTerm ||
      kashrutFilter !== 'ALL' ||
      lodgingFilter !== 'ALL' ||
      availableOnlyFilter
  );

  return {
    hosts: filteredHosts,
    loading,
    error,
    isDebouncing,
    searchTerm,
    setSearchTerm,
    kashrutFilter,
    setKashrutFilter,
    lodgingFilter,
    handleLodgingToggle,
    availableOnlyFilter,
    handleAvailableOnlyToggle,
    sortByMatch,
    setSortByMatch,
    handleResetFilters,
    handleBookingRequest,
    fetchHosts,
    toastMessage,
    hasActiveFilters
  };
}
