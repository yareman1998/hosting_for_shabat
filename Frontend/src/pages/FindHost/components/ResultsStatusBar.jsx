import React from 'react';

export default function ResultsStatusBar({ count, loading, isDebouncing }) {
  return (
    <div className="results-status-bar">
      <span>
        {loading ? (
          'מחפש מארחים תואמים בבסיס הנתונים...'
        ) : (
          <>
            נמצאו <strong className="results-count">{count}</strong> מארחים תואמים בבסיס הנתונים
          </>
        )}
      </span>

      {isDebouncing && !loading && (
        <span className="debouncing-indicator">
          מחדש תוצאות...
        </span>
      )}
    </div>
  );
}
