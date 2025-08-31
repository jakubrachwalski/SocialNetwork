

export function formatTimeAgo(date: Date | any): string {
  // Handle different date formats
  let dateObj: Date;
  
  if (date instanceof Date) {
    dateObj = date;
  } else if (date && typeof date === 'object' && date.toDate) {
    // Firestore timestamp
    dateObj = date.toDate();
  } else if (date && typeof date === 'string') {
    // ISO string
    dateObj = new Date(date);
  } else if (date && typeof date === 'number') {
    // Unix timestamp
    dateObj = new Date(date);
  } else {
    // Fallback to current date if invalid
    console.warn('Invalid date format passed to formatTimeAgo:', date);
    return 'just now';
  }

  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    console.warn('Invalid date object created:', dateObj);
    return 'just now';
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
}
