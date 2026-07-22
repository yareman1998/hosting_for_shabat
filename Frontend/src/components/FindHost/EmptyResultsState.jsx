

export default function EmptyResultsState({ onResetFilters }) {
  return (
    <div className="empty-results-state">
      <h3>לא נמצאו מארחים בבסיס הנתונים</h3>
      <p>נסה לשנות את מילות החיפוש, להסיר סינונים או לבחור עיר אחרת.</p>
      {onResetFilters && (
        <button className="reset-search-btn" onClick={onResetFilters}>
          איפוס סינונים וחיפוש
        </button>
      )}
    </div>
  );
}
