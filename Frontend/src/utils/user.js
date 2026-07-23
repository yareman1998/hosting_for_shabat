/**
 * Generates display initials from user profile details.
 * @param {object} user - The Redux user object
 * @returns {string} 1-letter or 2-letter uppercase initials
 */
export function getUserInitials(user) {
  if (user?.full_name) {
    return user.full_name.trim().charAt(0).toUpperCase();
  }
  if (user?.email) {
    return user.email.trim().charAt(0).toUpperCase();
  }
  return 'מ';
}
