import { configs } from "./configs.js";
import {
  command,
  flag,
  flags,
  isBooleanAt,
  isStringAt,
  rule,
  type Rule,
} from "@jondotsoy/flags";
import { styleText } from "@jondotsoy/style-text";
import { render, c } from "@jondotsoy/console-draw";
import { emitKeypressEvents } from "readline";
import { $ } from "bun";
import * as os from "os";
import * as fs from "fs/promises";
import type { Timer } from "./db/models/timers.js";

const t = async (f: () => Promise<string>): Promise<string> => {
  try {
    return await f();
  } catch (error) {
    console.error(error);
    return `Error unknown`;
  }
};

type State<T> = {
  current?: T;
};
const state = <T>(state?: T) => ({ current: state });

// server class

class Server {
  constructor(readonly basePath: URL) { }

  async currentTimer(): Promise<Timer | undefined> {
    const res = await fetch(new URL(`./timer/current`, this.basePath));
    const data = await res.json();
    return data ?? undefined;
  }

  async createTimer(title: string): Promise<Timer> {
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

  async updateNote(note: string): Promise<Timer> {
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

const server = new Server(
  new URL(`http://${configs.server.host}:${configs.server.port}`),
);

// parse arguments
const args = process.argv.slice(2);

type Options = {
  create: boolean;
  stop: boolean;
  title: string;
};

const rules: Rule<Options>[] = [
  rule(command("stop"), isBooleanAt("stop")),
  rule(command("create"), isBooleanAt("create")),
  rule(flag("-t", "--title"), isStringAt("title")),
];

const options = flags<Options>(process.argv.slice(2), {}, rules);

function renderTimer($timer: State<Timer>) {
  const timer = $timer.current;
  if (!timer) throw new Error("No timer found");
  const startAt = new Date(timer.start_at);
  const relativeTimer = () => {
    const milliseconds = Date.now() - timer.start_at;
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);

    const str: string[] = [];

    if (milliseconds > 60 * 1000) {
      str.push(`${minutes}m`);
    }

    str.push(`${seconds % 60}s`);

    return str.join(" ");
  };
  console.log(
    render(
      c("div", [
        c("div", { border: {} }, [
          c("text", `${styleText(["gray", "italic"], timer.id)}`),
          c("text", `Title: ${timer.title}`),
          c(
            "text",
            `Start At: ${startAt.toLocaleString()} (${styleText("cyan", relativeTimer())})`,
          ),
          c("text", `Notes:`),
          c(
            "text",
            `${timer.notes ?? styleText(["gray", "italic"], "No notes")}`,
          ),
        ]),
        c("text", `Press q to stop timer`),
        c("text", `Press e to edit notes`),
        c("text", `Press Ctrl+C to exit`),
      ]),
    ),
  );
}

const editNotes = async (timer: State<Timer>) => {
  const notesPath = new URL(
    `${os.tmpdir()}/${crypto.randomUUID()}/NOTES.nd`,
    "file:",
  );
  await fs.mkdir(new URL("./", notesPath), { recursive: true });
  await fs.writeFile(notesPath, timer.current?.notes ?? '', "utf-8");
  await $`code -w ${notesPath.pathname}`;
  console.log(`Notes saved to ${notesPath.pathname}`);
  const notes = await fs.readFile(notesPath, "utf-8");
  timer.current = await server.updateNote(notes);
};

const onKeyInput = (timer: State<Timer>) => {
  emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.on("keypress", async (chunk, key) => {
    // Stop timer
    if (key && key.name === "q") {
      await server.stopTimer();
      console.log(`Stop timer`);
      process.exit();
    }
    // Edition notes
    if (key && key.name === "e") {
      await editNotes(timer);
    }
    if (key && key.name === "c" && key.ctrl) {
      process.exit();
    }
  });
};

const run = async () => {
  if (options.stop) {
    console.log(`Stop timer`);
    await server.stopTimer();
  } else if (options.create) {
    if (!options.title) throw new Error("Missing '--title' argument");

    const timer = state(await server.createTimer(options.title));
    console.log(`New timer created`);
    onKeyInput(timer);
    while (true) {
      console.clear();
      renderTimer(timer);
      await new Promise((resolve) =>
        setTimeout(resolve, configs.client.terminal.refresh),
      );
    }
  } else {
    const $timer = state(await server.currentTimer());
    if (!$timer.current) {
      console.error(styleText("reset", `No timer found`));
      return;
    }
    onKeyInput($timer);
    while (true) {
      console.clear();
      renderTimer($timer);
      await new Promise((resolve) =>
        setTimeout(resolve, configs.client.terminal.refresh),
      );
    }
  }
};

await run();
