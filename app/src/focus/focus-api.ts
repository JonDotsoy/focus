import { TimerDTO } from "./dto/timer.dto";

const t = async (f: () => Promise<string>): Promise<string> => {
  try {
    return await f();
  } catch (error) {
    console.error(error);
    return `Error unknown`;
  }
};

export class FocusClient {
  constructor(readonly basePath: URL) {}

  async currentTimer(): Promise<TimerDTO | undefined> {
    const res = await fetch(new URL(`./timer/current`, this.basePath));
    const data = await res.json();
    return data ?? undefined;
  }

  async createTimer(title: string): Promise<TimerDTO> {
    const url = new URL(`./timer`, this.basePath);
    url.searchParams.set("title", title);
    const res = await fetch(url, { method: "POST" });
    if (res.status !== 201)
      throw new Error(
        `Failed to create timer. Service status response ${res.status}: ${await t(() => res.text())}`,
      );
    const data = await res.json();
    return data;
  }

  async stopTimer() {
    const url = new URL(`./timer/stop`, this.basePath);
    const res = await fetch(url, { method: "POST" });
    if (res.status !== 200)
      throw new Error(
        `Failed to stop timer. Service status response ${res.status}: ${await t(() => res.text())}`,
      );
  }

  async updateNote(note: string): Promise<TimerDTO> {
    const url = new URL(`./timer/note`, this.basePath);
    url.searchParams.set("note", note);
    const res = await fetch(url, { method: "PUT" });
    if (res.status !== 201)
      throw new Error(
        `Failed to update note. Service status response ${res.status}: ${await t(() => res.text())}`,
      );
    const time = await res.json();
    return time;
  }
}
