import button from "./common/button.module.css"
import style from "./create-new-timer.module.css";
import { useFocus } from "../focus/use-focus";
import { FormEvent } from "react";

export default () => {
  const { createTimer } = useFocus();

  const sub = async (event: FormEvent<HTMLFormElement>) => {
    const target = event.target;
    if (target instanceof HTMLFormElement) {
      event.preventDefault();
      const dataForm = new FormData(target);
      const title = dataForm.get('title')?.toString() ?? '';
      await createTimer(title);
      target.reset();
    }
  }

  return <div className={style.container}>
    <form onSubmit={sub} className={style.form}>
      <input type="text" name="title" />
      <div>
        <button type="submit" className={button.button}>Iniciar Timer</button>
      </div>
    </form>
  </div>;
}