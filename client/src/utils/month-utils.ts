/**
 * Format month number (1-12) to month name
 * @param monthNumber - Month number (1 = Jan, 2 = Feb, etc.)
 * @returns Short month name (Jan, Feb, Mar, etc.)
 */
export function formatMonthNumber(monthNumber: number): string {
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const monthIndex = (monthNumber - 1) % 12;
  return monthNames[monthIndex];
}
