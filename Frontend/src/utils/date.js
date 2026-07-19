/**
 * Formats a date string into Israeli locale date format (DD/MM/YYYY)
 * @param {string} dateString - ISO date string or similar date representation
 * @returns {string} Formatted date string or original input if invalid
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
};
