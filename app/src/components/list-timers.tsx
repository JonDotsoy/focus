import { useMemo } from "react";
import style from "./list-timers.module.css";
import { useFocus } from "../focus/use-focus"
import TimerPrint from "./timer-print";

export default () => {
  const focus = useFocus();

  const timers = useMemo(() => Object.groupBy(focus.timers?.sort((a, b) => b.start_at - a.start_at) ?? [], e => new Date(e.start_at).toLocaleDateString(undefined, { dateStyle: 'full' })), [focus.timers]);

  return <div className={style.container}>
    {Object.entries(timers).map(([k, timers]) =>
      <>
        <div className={style.labelTime}>{k}</div>
        <div className={style.items}>
          {timers?.map(timer =>
            <div className={style.cardTimer}>
              <div className={style.blockTitle}>{timer.title}</div>
              {timer.notes && <div className={style.blockNotes}>{timer.notes}</div>}
              <div className={style.blockTimer}>
                <TimerPrint start_at={timer.start_at} end_at={timer.end_at} ></TimerPrint>
              </div>
            </div>
          )}
        </div>
      </>
    )}
  </div>
}