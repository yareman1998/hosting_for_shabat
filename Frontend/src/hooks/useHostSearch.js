import { useState, useEffect, useMemo, useCallback } from 'react';
import { listingsApi } from "../api/api";

// Region city mapping helper
const REGION_CITY_MAP = {
  'מרכז': ['תל אביב', 'רמת גן', 'פתח תקווה', 'ראשון לציון', 'חולון', 'בת ים', 'נתניה', 'הרצליה', 'כפר סבא', 'רעננה', 'מרכז', 'גבעתיים', 'מודיעין'],
  'ירושלים': ['ירושלים', 'בית שמש', 'מעלה אדומים', 'אפרת', 'גוש עציון', 'ירושלים והסביבה'],
  'צפון': ['חיפה', 'טבריה', 'צפת', 'עכו', 'נהריה', 'גולן', 'קריות', 'צפון', 'עפולה', 'כרמיאל', 'נצרת'],
  'דרום': ['באר שבע', 'אשדוד', 'אשקלון', 'אילת', 'שדרות', 'דרום', 'נתיבות', 'אופקים', 'ערד']
};

const CACHE_KEY = 'shabbat_hosts_cache';

const getCachedHosts = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch (e) {
    console.warn('Failed to parse cached hosts from localStorage:', e);
    return [];
  }
};

export default function useHostSearch() {
  const [hosts, setHosts] = useState(() => getCachedHosts());
  const [loading, setLoading] = useState(() => getCachedHosts().length === 0);
  const [error, setError] = useState(null);

  // Search input state and 300ms debouncing
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isDebouncing, setIsDebouncing] = useState(false);

  // Filter dropdown & button states
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [kashrutFilter, setKashrutFilter] = useState('ALL');
  const [lodgingFilter, setLodgingFilter] = useState('ALL');
  const [availableOnlyFilter, setAvailableOnlyFilter] = useState(false);
  const [sortBy, setSortBy] = useState('AI');

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

  // Fetch hosts from DB API once on refresh / mount
  const fetchHosts = useCallback(async () => {
    // Only set full loading UI if we don't have cached hosts yet
    setHosts((prevHosts) => {
      if (!prevHosts || prevHosts.length === 0) {
        setLoading(true);
      }
      return prevHosts;
    });
    setError(null);
    try {
      // Fetch all listings without backend query filtering params
      const response = await listingsApi.searchHosts();
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
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(mappedHosts));
      } catch (e) {
        console.warn('Failed to save hosts to localStorage:', e);
      }
    } catch (err) {
      console.error('Error fetching hosts from DB:', err);
      // Only show blocking error if there are no cached hosts available
      setHosts((currentHosts) => {
        if (!currentHosts || currentHosts.length === 0) {
          setError('לא ניתן לטעון את רשימת המארחים משרת המסד נתונים. אנא ודא שהשרת פעיל ונסה שוב.');
        }
        return currentHosts;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHosts();
  }, [fetchHosts]);

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setRegionFilter('ALL');
    setKashrutFilter('ALL');
    setLodgingFilter('ALL');
    setAvailableOnlyFilter(false);
    setSortBy('AI');
  };

  // Toggle lodging quick filter
  const handleLodgingToggle = () => {
    setLodgingFilter((prev) => (prev === 'LODGING_ONLY' ? 'ALL' : 'LODGING_ONLY'));
  };

  // Toggle available spots quick filter
  const handleAvailableOnlyToggle = () => {
    setAvailableOnlyFilter((prev) => !prev);
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

        // Region filter
        let matchesRegion = true;
        if (regionFilter !== 'ALL') {
          const hostCity = host.city.toLowerCase();
          const regionCities = REGION_CITY_MAP[regionFilter] || [regionFilter];
          matchesRegion =
            regionCities.some((c) => hostCity.includes(c.toLowerCase())) ||
            (host.tags && host.tags.some((t) => t.toLowerCase().includes(regionFilter.toLowerCase())));
        }

        const hostKashrut = String(host.kashrut_level || '').toLowerCase();
        const filterKashrut = String(kashrutFilter).toLowerCase();
        const matchesKashrut =
          kashrutFilter === 'ALL' ||
          hostKashrut === filterKashrut ||
          ((filterKashrut === 'glatt_mehadrin' || filterKashrut === 'mehadrin') &&
            (hostKashrut === 'glatt_mehadrin' || hostKashrut === 'mehadrin' || hostKashrut === 'glatt_mehadrin / חלק')) ||
          (filterKashrut === 'kosher' && (hostKashrut === 'kosher' || hostKashrut === 'כשר'));

        const matchesLodging =
          lodgingFilter === 'ALL' ||
          (lodgingFilter === 'LODGING_ONLY' && host.has_lodging);

        const matchesAvailability =
          !availableOnlyFilter || host.available_spots > 0;

        return (
          matchesSearch &&
          matchesRegion &&
          matchesKashrut &&
          matchesLodging &&
          matchesAvailability
        );
      })
      .sort((a, b) => {
        if (sortBy === 'AI' || sortBy === 'DESC') {
          return b.match_percentage - a.match_percentage;
        }
        if (sortBy === 'ASC') {
          return a.match_percentage - b.match_percentage;
        }
        if (sortBy === 'RATING') {
          return (b.rating || b.match_percentage) - (a.rating || a.match_percentage);
        }
        if (sortBy === 'SPOTS') {
          return b.available_spots - a.available_spots;
        }
        if (sortBy === 'NAME') {
          return a.full_name.localeCompare(b.full_name, 'he');
        }
        return 0;
      });
  }, [
    hosts,
    debouncedSearch,
    regionFilter,
    kashrutFilter,
    lodgingFilter,
    availableOnlyFilter,
    sortBy
  ]);

  const hasActiveFilters = Boolean(
    searchTerm ||
      regionFilter !== 'ALL' ||
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
    regionFilter,
    setRegionFilter,
    kashrutFilter,
    setKashrutFilter,
    lodgingFilter,
    handleLodgingToggle,
    availableOnlyFilter,
    handleAvailableOnlyToggle,
    sortByMatch: sortBy,
    setSortByMatch: setSortBy,
    sortBy,
    setSortBy,
    handleResetFilters,
    fetchHosts,
    toastMessage,
    hasActiveFilters
  };
}
