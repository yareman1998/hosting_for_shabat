/**
 * Returns dynamic styling and text for AI Match Percentage badge
 */
export const getMatchStyle = (percentage) => {
  if (percentage >= 90) {
    return {
      color: 'var(--match-high-color)',
      bg: 'var(--match-high-bg)',
      border: 'var(--match-high-border)',
      text: 'מצוין'
    };
  }
  if (percentage >= 75) {
    return {
      color: 'var(--match-med-color)',
      bg: 'var(--match-med-bg)',
      border: 'var(--match-med-border)',
      text: 'טוב'
    };
  }
  return {
    color: 'var(--match-low-color)',
    bg: 'var(--match-low-bg)',
    border: 'var(--match-low-border)',
    text: 'מתאים'
  };
};
