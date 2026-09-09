/**
 * All date-bucketing (today / this week / this month) is done in the
 * business timezone (Asia/Kolkata, UTC+5:30) regardless of the server's
 * own timezone, per spec section 46/47.
 */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function toIST(date: Date): Date {
  return new Date(date.getTime() + IST_OFFSET_MS);
}

function fromISTStartOfDay(istDate: Date): Date {
  const y = istDate.getUTCFullYear();
  const m = istDate.getUTCMonth();
  const d = istDate.getUTCDate();
  // Midnight IST expressed back in UTC
  return new Date(Date.UTC(y, m, d, 0, 0, 0) - IST_OFFSET_MS);
}

export function startOfTodayIST(): Date {
  const nowIST = toIST(new Date());
  return fromISTStartOfDay(nowIST);
}

export function endOfTodayIST(): Date {
  const start = startOfTodayIST();
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

export function startOfYesterdayIST(): Date {
  const start = startOfTodayIST();
  return new Date(start.getTime() - 24 * 60 * 60 * 1000);
}

export function startOfWeekIST(): Date {
  const nowIST = toIST(new Date());
  const dayOfWeek = nowIST.getUTCDay(); // 0 = Sunday
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // week starts Monday
  const startIST = new Date(nowIST.getTime() - diff * 24 * 60 * 60 * 1000);
  return fromISTStartOfDay(startIST);
}

export function startOfMonthIST(): Date {
  const nowIST = toIST(new Date());
  const y = nowIST.getUTCFullYear();
  const m = nowIST.getUTCMonth();
  return new Date(Date.UTC(y, m, 1, 0, 0, 0) - IST_OFFSET_MS);
}

export function daysAgoIST(days: number): Date {
  const start = startOfTodayIST();
  return new Date(start.getTime() - days * 24 * 60 * 60 * 1000);
}
