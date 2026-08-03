// Backend timestamps arrive as "M/D/YYYY h:mm:ss AM/PM" (.NET's default
// DateTime.ToString()) — not ISO 8601. `new Date(str)` parsing of non-ISO
// strings is implementation-defined per spec: V8 (Metro/Node during dev)
// happens to parse this format, but Hermes (the engine actually running on
// device) returns Invalid Date for it, whose .getTime() is NaN. A NaN
// comparator result makes Array.prototype.sort treat every pair as "equal"
// and silently leave the array in its original order — no error, no crash,
// just a sort that never happens. Parse the known format explicitly instead
// of trusting the Date constructor's string parsing.
const SERVER_DATE_RE =
  /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)$/i;

export function parseServerDate(dateString: string | null | undefined): number {
  if (!dateString) return NaN;
  const match = SERVER_DATE_RE.exec(dateString.trim());
  if (!match) {
    // Fall back to native parsing for any other format (e.g. ISO strings)
    // that may already be handled correctly.
    return new Date(dateString).getTime();
  }
  const [, monthStr, dayStr, yearStr, hourStr, minuteStr, secondStr, meridiem] = match;
  let hour = parseInt(hourStr, 10) % 12;
  if (meridiem.toUpperCase() === 'PM') hour += 12;
  return new Date(
    Number(yearStr),
    Number(monthStr) - 1,
    Number(dayStr),
    hour,
    Number(minuteStr),
    Number(secondStr),
  ).getTime();
}
