import { useEffect, useState } from "react";

const timersValues: { label: string, divisor: number }[] = [
  {
    label: 'millisecond',
    divisor: 1,
  },
  {
    label: 'second',
    divisor: 1000,
  },
  {
    label: 'minute',
    divisor: 60 * 1000,
  },
  {
    label: 'hour',
    divisor: 60 * 60 * 1000,
  },
  {
    label: 'day',
    divisor: 24 * 60 * 60 * 1000,
  },
]
const timers = timersValues.map(val => ({
  ...val,
  format: new Intl.NumberFormat(undefined, {
    style: 'unit',
    unit: val.label,
    maximumFractionDigits: 0,
  }),
}))


export default ({ start_at, end_at }: { start_at: number, end_at: null | number }) => {
  const calculateDuration = () => (end_at ?? Date.now()) - start_at;
  const [duration, setDuration] = useState(calculateDuration());

  useEffect(() => {
    if (end_at === null) {
      const t = setInterval(() => {
        setDuration(calculateDuration());
      }, 100);

      return () => clearInterval(t)
    }
  }, [end_at])

  const relativeTime = (durationMs: number) => {
    const t = timers.findLast(val => durationMs > val.divisor);
    if (t) return t.format.format(durationMs / t.divisor);
    return `durationMs`;
  }

  return `${relativeTime(duration)}`
}