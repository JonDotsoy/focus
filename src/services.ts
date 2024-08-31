import { timers } from "./db/store.js";

export const listTimers = async () => {
  return await timers.getTimers();
};

export const getCurrentTimer = async () => {
  const timer = await timers.currentTime();
  return timer;
};

export const stopCurrentTimer = async () => {
  await timers.stopCurrentTimer();
};

export const createTimer = async (title: string) => {
  const timer = await timers.createTimer(title);
  return timer;
};

export const updateNote = async (note: string) => {
  const timer = await timers.updateNote(note);
  return timer;
};
