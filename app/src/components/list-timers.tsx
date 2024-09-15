import { useMemo } from "react";
import style from "./list-timers.module.css";
import { useFocus } from "../focus/use-focus"
import TimerPrint from "./timer-print";

export default () => {
  const focus = useFocus();

  const timers = useMemo(() => focus.timers?.sort((a, b) => b.start_at - a.start_at), [focus.timers]);

  return <div className={style.items}>
    {timers?.map(timer =>
      <>
        <span className={style.contentTimer}>
          <div className={style.title}>{timer.title}</div>
          {timer.notes && <div className={style.notes}>{timer.notes}</div>}
        </span>
        <span className={style.itemTimeStamp}><TimerPrint start_at={timer.start_at} end_at={timer.end_at} ></TimerPrint></span>
      </>
    )}
  </div>
}