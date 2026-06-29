"use client";

import { useEffect, useState } from "react";
import { getTimeRemaining, type TimeRemaining } from "./countdown";

export function useCountdown(deadline: Date): TimeRemaining | null {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);

  useEffect(() => {
    setTimeRemaining(getTimeRemaining(deadline));

    const intervalId = window.setInterval(() => {
      setTimeRemaining(getTimeRemaining(deadline));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [deadline]);

  return timeRemaining;
}
