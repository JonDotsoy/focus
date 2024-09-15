import useSWR from "swr";
import useSWRMutation from "swr/mutation"
import { createHTTPClient } from "@jondotsoy/simplerpc";

const API_URL = "http://localhost:56893/";

const client = createHTTPClient<typeof import("../../../src/services.js")>(API_URL);

const useClientCurrentTimer = () =>
  useSWR("/timer/current", () => client.getCurrentTimer());

const useClientUpdateNotes = () =>
  useSWRMutation<any, any, string, { newNotes: string }>("/timer/update/note", async (_key, { arg: { newNotes } }) => {
    return await client.updateNote(newNotes);
  })

const useClientCreateTimer = () =>
  useSWRMutation<any, any, string, { title: string }>('/timer/create/timer', async (_key, { arg: { title } }) => {
    await client.createTimer(title);
  })
const useClientListTimers = () =>
  useSWR('/timer/list', async () => client.listTimers());

export const useFocus = () => {
  const clientCurrentTimer = useClientCurrentTimer();
  const clientUpdateNotes = useClientUpdateNotes();
  const clientCreateTimer = useClientCreateTimer();
  const clientListTimers = useClientListTimers();

  const refresh = () => Promise.all([
    clientCurrentTimer.mutate(),
    clientListTimers.mutate(),
  ]);

  const updateNotes = async (newNotes: string) => {
    await clientUpdateNotes.trigger({ newNotes });
    await refresh();
  }

  const stopCurrentTimer = async () => {
    if (clientCurrentTimer.data) {
      await client.stopCurrentTimer();
    }
    await refresh();
  }

  const createTimer = async (title: string) => {
    await stopCurrentTimer();
    await clientCreateTimer.trigger({ title });
    await refresh();
  }

  return {
    timers: clientListTimers.data,
    currentTimer: clientCurrentTimer.data,
    updateNotes,
    createTimer,
    stopCurrentTimer,
  };
};
