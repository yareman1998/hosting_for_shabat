import React from 'react';
import useHostSearch from './hooks/useHostSearch';
import FindHostHeader from './components/FindHostHeader';
import SearchFilterPanel from './components/SearchFilterPanel';
import ResultsStatusBar from './components/ResultsStatusBar';
import HostsGrid from './components/HostsGrid';
import './FindHost.css';

export default function FindHost() {
  const {
    hosts,
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
  } = useHostSearch();

  return (
    <div className="find-host-page">
      {/* 1. Header Hero Section */}
      <FindHostHeader />

      {/* 2. Control Panel: Search, Filters & Sorting */}
      <SearchFilterPanel
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        kashrutFilter={kashrutFilter}
        onKashrutChange={setKashrutFilter}
        sortByMatch={sortByMatch}
        onSortChange={setSortByMatch}
        lodgingFilter={lodgingFilter}
        onLodgingToggle={handleLodgingToggle}
        availableOnlyFilter={availableOnlyFilter}
        onAvailableOnlyToggle={handleAvailableOnlyToggle}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* 3. Live Results Status Bar */}
      <ResultsStatusBar
        count={hosts.length}
        loading={loading}
        isDebouncing={isDebouncing}
      />

      {/* 4. Dynamic Hosts Grid, Loading & Empty States */}
      <HostsGrid
        hosts={hosts}
        loading={loading}
        error={error}
        onRetry={fetchHosts}
        onBookingRequest={handleBookingRequest}
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
