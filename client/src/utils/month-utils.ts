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
