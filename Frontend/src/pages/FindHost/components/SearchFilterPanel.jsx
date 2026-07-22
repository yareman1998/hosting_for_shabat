import React from 'react';

export default function SearchFilterPanel({
  searchTerm,
  onSearchChange,
  kashrutFilter,
  onKashrutChange,
  sortByMatch,
  onSortChange,
  lodgingFilter,
  onLodgingToggle,
  availableOnlyFilter,
  onAvailableOnlyToggle,
  onResetFilters,
  hasActiveFilters
}) {
  return (
    <section className="search-filter-panel">
      <div className="search-primary-row">
        {/* Search Input */}
        <div className="input-field-group">
          <label htmlFor="host-search-input">
            חפש לפי עיר, שם מארח או תגיות:
          </label>
          <div className="search-input-wrapper">
            <input
              id="host-search-input"
              type="text"
              placeholder="לדוגמה: תל אביב, ירושלים..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Kashrut Dropdown */}
        <div className="input-field-group">
          <label htmlFor="kashrut-select">רמת כשרות:</label>
          <div className="select-wrapper">
            <select
              id="kashrut-select"
              value={kashrutFilter}
              onChange={(e) => onKashrutChange(e.target.value)}
            >
              <option value="ALL">כל רמות הכשרות</option>
              <option value="glatt_mehadrin">מהדרין / חלק</option>
              <option value="kosher">כשר</option>
              <option value="basic">כשר בסיסי</option>
              <option value="none">ללא כשרות</option>
            </select>
          </div>
        </div>

        {/* Sort Dropdown */}
        <div className="input-field-group">
          <label htmlFor="sort-select">מיון התאמת AI:</label>
          <div className="select-wrapper">
            <select
              id="sort-select"
              value={sortByMatch}
              onChange={(e) => onSortChange(e.target.value)}
            >
              <option value="DESC">התאמה גבוהה לנמוכה</option>
              <option value="ASC">התאמה נמוכה לגבוהה</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Filter Pills */}
      <div className="search-secondary-bar">
        <div className="quick-filter-pills">
          <button
            className={`pill-filter-btn ${
              lodgingFilter === 'LODGING_ONLY' ? 'active' : ''
            }`}
            onClick={onLodgingToggle}
          >
            עם לינה בלבד
          </button>

          <button
            className={`pill-filter-btn ${
              kashrutFilter === 'glatt_mehadrin' || kashrutFilter === 'MEHADRIN' ? 'active' : ''
            }`}
            onClick={() =>
              onKashrutChange(
                kashrutFilter === 'glatt_mehadrin' || kashrutFilter === 'MEHADRIN' ? 'ALL' : 'glatt_mehadrin'
              )
            }
          >
            מהדרין בלבד
          </button>

          <button
            className={`pill-filter-btn ${
              availableOnlyFilter ? 'active' : ''
            }`}
            onClick={onAvailableOnlyToggle}
          >
            מקומות פנויים בלבד
          </button>
        </div>

        {hasActiveFilters && (
          <button className="clear-filters-btn" onClick={onResetFilters}>
            איפוס כל הסינונים
          </button>
        )}
      </div>
    </section>
  );
}
