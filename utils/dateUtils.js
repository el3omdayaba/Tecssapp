// utils/dateUtils.js

/**
 * 📅 Returns today's date in YYYY-MM-DD format.
 * Optionally pass a day offset (e.g., -1 for yesterday).
 */
export function getTodayDate(offsetDays = 0) {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return date.toISOString().split("T")[0];
  }
  