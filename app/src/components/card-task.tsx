import { useFocus } from "../focus/use-focus";
import button from "./common/button.module.css";
import style from "./card-task.module.css";

export default () => {
  const { currentTimer, updateNotes, stopCurrentTimer } = useFocus();

  if (!currentTimer) return null;

  return <div className={style.card}>
    <div className={style.blockId}>{currentTimer.id}</div>
    <div className={style.blockTitle}>{currentTimer.title}</div>
    <div className={style.blockNotes}>
      <span className={style.label}>Notas:</span>
      <textarea name="" id="" defaultValue={currentTimer.notes ?? ''}
        onChange={(e) => updateNotes(e.target.value)}
      ></textarea>
    </div>
    <div className={style.controls}>
      <button className={button.button} onClick={stopCurrentTimer}>Stop</button>
    </div>
  </div>
}