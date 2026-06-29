"use client";

import { useCountdown } from "../../lib/landing/use-countdown";
import { padTwoDigits } from "../../lib/landing/countdown";

interface CountdownBlocksProps {
  deadline: Date;
  unitClassName?: string;
  numberClassName?: string;
  labelClassName?: string;
}

export function CountdownBlocks({
  deadline,
  unitClassName = "",
  numberClassName = "",
  labelClassName = "",
}: CountdownBlocksProps) {
  const remaining = useCountdown(deadline);

  const units: Array<{ label: string; value: number }> = [
    { label: "Días", value: remaining?.days ?? 0 },
    { label: "Hrs", value: remaining?.hours ?? 0 },
    { label: "Min", value: remaining?.minutes ?? 0 },
    { label: "Seg", value: remaining?.seconds ?? 0 },
  ];

  return (
    <>
      {units.map((unit) => (
        <div key={unit.label} className={unitClassName}>
          <span className={numberClassName}>{padTwoDigits(unit.value)}</span>
          <span className={labelClassName}>{unit.label}</span>
        </div>
      ))}
    </>
  );
}

export function CountdownInline({ deadline }: { deadline: Date }) {
  const remaining = useCountdown(deadline);

  if (!remaining) {
    return <span aria-hidden="true">--:--:--:--</span>;
  }

  const { days, hours, minutes, seconds } = remaining;
  return (
    <span>
      {days}d {padTwoDigits(hours)}:{padTwoDigits(minutes)}:{padTwoDigits(seconds)}
    </span>
  );
}
