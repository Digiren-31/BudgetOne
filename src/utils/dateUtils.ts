// Date utility functions
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  subMonths,
  subYears,
  isToday,
  isYesterday,
  isThisWeek,
  isThisMonth,
  isThisYear,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
} from 'date-fns';

export function getRelativeTimeString(date: Date): string {
  const now = new Date();
  const diffMins = differenceInMinutes(now, date);
  const diffHours = differenceInHours(now, date);
  const diffDays = differenceInDays(now, date);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return format(date, 'MMM d');
  }
}

export function formatExpenseDate(date: Date): string {
  if (isToday(date)) {
    return `Today, ${format(date, 'h:mm a')}`;
  } else if (isYesterday(date)) {
    return `Yesterday, ${format(date, 'h:mm a')}`;
  } else if (isThisWeek(date)) {
    return format(date, 'EEEE, h:mm a');
  } else if (isThisYear(date)) {
    return format(date, 'MMM d, h:mm a');
  } else {
    return format(date, 'MMM d, yyyy h:mm a');
  }
}

export function getDateRangeForPeriod(period: 'today' | 'week' | 'month' | 'year'): {
  start: Date;
  end: Date;
} {
  const now = new Date();

  switch (period) {
    case 'today':
      return {
        start: startOfDay(now),
        end: endOfDay(now),
      };
    case 'week':
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case 'month':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
    case 'year':
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
      };
  }
}

export function getStartOfDay(date: Date = new Date()): Date {
  return startOfDay(date);
}

export function getEndOfDay(date: Date = new Date()): Date {
  return endOfDay(date);
}

export function formatDateForDisplay(date: Date, formatString: string = 'MMM d, yyyy'): string {
  return format(date, formatString);
}

export {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  subMonths,
  subYears,
  isToday,
  isYesterday,
  isThisWeek,
  isThisMonth,
  isThisYear,
};
