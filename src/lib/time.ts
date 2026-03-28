import { formatDistanceStrict } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

import { IST_TIMEZONE } from "@/lib/constants";

export function calculateCutoffTime(startTimeUtc: Date, cutoffMinutes: number) {
  return new Date(startTimeUtc.getTime() - cutoffMinutes * 60 * 1000);
}

export function formatMatchDateTime(date: Date) {
  return {
    date: formatInTimeZone(date, IST_TIMEZONE, "EEE, d MMM yyyy"),
    time: formatInTimeZone(date, IST_TIMEZONE, "h:mm a 'IST'"),
    shortDate: formatInTimeZone(date, IST_TIMEZONE, "d MMM"),
  };
}

export function formatDateTimeLocalValue(date: Date) {
  return formatInTimeZone(date, IST_TIMEZONE, "yyyy-MM-dd'T'HH:mm");
}

export function parseIstDateTimeInput(value: string) {
  return fromZonedTime(value, IST_TIMEZONE);
}

export function getIstDateKey(date: Date) {
  return formatInTimeZone(date, IST_TIMEZONE, "yyyy-MM-dd");
}

export function isSameIstDate(left: Date, right: Date) {
  return getIstDateKey(left) === getIstDateKey(right);
}

export function toIstDate(date: Date) {
  return toZonedTime(date, IST_TIMEZONE);
}

export function getCountdownLabel(targetDate: Date, now = new Date()) {
  const distance = targetDate.getTime() - now.getTime();

  if (distance <= 0) {
    return "Closed";
  }

  return formatDistanceStrict(targetDate, now, {
    unit: distance > 24 * 60 * 60 * 1000 ? "day" : undefined,
  });
}
