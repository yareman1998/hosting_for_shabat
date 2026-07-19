export default function Table({ headers, dataLength, fallbackText, children }) {
  const hasData = typeof dataLength === 'number' ? dataLength > 0 : true;

  return (
    <div className="admin-table-wrapper">
      <table className="admin-table">
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hasData ? (
            children
          ) : (
            <tr>
              <td 
                colSpan={headers.length} 
                className="admin-table-fallback"
              >
                {fallbackText || 'אין נתונים להצגה'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
