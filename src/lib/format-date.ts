const longFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric"
});

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfLocalDay(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ).getTime();
}

/**
 * Format a date as "Today" / "Yesterday" for same-day or one-day-prior values
 * in the viewer's local timezone, falling back to "Month D, YYYY" for anything
 * else. `now` is injectable for testing.
 */
export function formatDateLong(
  value: Date | string,
  now: Date = new Date()
): string {
  const date = value instanceof Date ? value : new Date(value);
  const diffDays = Math.round(
    (startOfLocalDay(date) - startOfLocalDay(now)) / MS_PER_DAY
  );
  if (diffDays === 0) return "Today";
  if (diffDays === -1) return "Yesterday";
  return longFormatter.format(date);
}
