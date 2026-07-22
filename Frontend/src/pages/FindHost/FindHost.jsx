
import { useNavigate } from 'react-router-dom';
import useHostSearch from '../../hooks/useHostSearch';
import FindHostHeader from '../../components/FindHost/FindHostHeader';
import SearchFilterPanel from '../../components/FindHost/SearchFilterPanel';
import HostsGrid from '../../components/FindHost/HostsGrid';
import './FindHost.css';

export default function FindHost() {
  const navigate = useNavigate();
  const {
    hosts,
    loading,
    error,
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
    sortBy,
    setSortBy,
    handleResetFilters,
    fetchHosts,
    toastMessage,
    hasActiveFilters
  } = useHostSearch();

  const handleSelectHost = (host) => {
    if (host?.id) {
      navigate(`/find-host/${host.id}`, { state: { host } });
    }
  };

  return (
    <div className="find-host-page">
      {/* 1. Header Hero Section */}
      <FindHostHeader />

      {/* 2. Control Panel: Search, Filters & Sorting */}
      <SearchFilterPanel
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        regionFilter={regionFilter}
        onRegionChange={setRegionFilter}
        kashrutFilter={kashrutFilter}
        onKashrutChange={setKashrutFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        lodgingFilter={lodgingFilter}
        onLodgingToggle={handleLodgingToggle}
        availableOnlyFilter={availableOnlyFilter}
        onAvailableOnlyToggle={handleAvailableOnlyToggle}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
        count={hosts.length}
      />

      {/* 3. Dynamic Hosts Grid, Loading & Empty States */}
      <HostsGrid
        hosts={hosts}
        loading={loading}
        error={error}
        onRetry={fetchHosts}
        onBookingRequest={handleSelectHost}
        onResetFilters={handleResetFilters}
      />

      {/* 5. Success Toast Feedback Banner */}
      {toastMessage && (
        <div className="toast-success-banner">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
