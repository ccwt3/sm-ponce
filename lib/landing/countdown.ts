export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = MS_PER_SECOND * 60;
const MS_PER_HOUR = MS_PER_MINUTE * 60;
const MS_PER_DAY = MS_PER_HOUR * 24;

export function getTimeRemaining(deadline: Date, now: Date = new Date()): TimeRemaining {
  const diffMs = deadline.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  return {
    days: Math.floor(diffMs / MS_PER_DAY),
    hours: Math.floor((diffMs % MS_PER_DAY) / MS_PER_HOUR),
    minutes: Math.floor((diffMs % MS_PER_HOUR) / MS_PER_MINUTE),
    seconds: Math.floor((diffMs % MS_PER_MINUTE) / MS_PER_SECOND),
    isExpired: false,
  };
}

export function padTwoDigits(value: number): string {
  return String(value).padStart(2, "0");
}
