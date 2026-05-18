const longFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric"
});

const shortFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric"
});

const mediumFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
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

function relativeLabel(date: Date, now: Date): "Today" | "Yesterday" | null {
  const diffDays = Math.round(
    (startOfLocalDay(date) - startOfLocalDay(now)) / MS_PER_DAY
  );
  if (diffDays === 0) return "Today";
  if (diffDays === -1) return "Yesterday";
  return null;
}

function coerce(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
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
  const date = coerce(value);
  return relativeLabel(date, now) ?? longFormatter.format(date);
}

/**
 * Same Today/Yesterday rule as {@link formatDateLong}, falling back to a
 * compact "Mon D" form (no year) used on item cards.
 */
export function formatDateShort(
  value: Date | string,
  now: Date = new Date()
): string {
  const date = coerce(value);
  return relativeLabel(date, now) ?? shortFormatter.format(date);
}

/**
 * Same Today/Yesterday rule as {@link formatDateLong}, falling back to a
 * "Mon D, YYYY" form (short month, with year) used on the file-row list.
 */
export function formatDateMedium(
  value: Date | string,
  now: Date = new Date()
): string {
  const date = coerce(value);
  return relativeLabel(date, now) ?? mediumFormatter.format(date);
}
