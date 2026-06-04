/**
 * Formats an ISO8601 timestamp for display on the order success screen.
 * Returns "today at H:MM AM/PM" if the date is today, otherwise "Mon D, H:MM AM/PM".
 * Returns empty string for null/undefined/unparseable input.
 */
export function formatOrderTimestamp(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '';

  const now   = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth()    === now.getMonth() &&
    date.getDate()     === now.getDate();

  const timeStr = date.toLocaleTimeString('en-US', {
    hour:   'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (isToday) return `today at ${timeStr}`;

  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${dateStr}, ${timeStr}`;
}
