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
import { createClientService } from "./utils/service_generator.js";

const relativeTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  if (seconds > 0) return `${seconds}s`;
  return `0s`;
};

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

const service = await createClientService<typeof import("./services.js")>(
  new URL(`http://${configs.server.host}:${configs.server.port}`),
);

// class Service {
//   constructor(readonly basePath: URL) { }

//   async getCurrentTimer(): Promise<Timer | undefined> {
//     const res = await fetch(new URL(`./timer/current`, this.basePath));
//     const data = await res.json();
//     return data ?? undefined;
//   }

//   async createTimer(title: string): Promise<Timer> {
//     const url = new URL(`./timer`, this.basePath);
//     url.searchParams.set("title", title);
//     const res = await fetch(url, { method: "POST" });
//     if (res.status !== 201)
//       throw new Error(
//         `Failed to create timer. Service status response ${res.status}: ${await t(() => res.text())}`,
//       );
//     const data = await res.json();
//     return data;
//   }

//   async stopCurrentTimer() {
//     const url = new URL(`./timer/stop`, this.basePath);
//     const res = await fetch(url, { method: "POST" });
//     if (res.status !== 200)
//       throw new Error(
//         `Failed to stop timer. Service status response ${res.status}: ${await t(() => res.text())}`,
//       );
//   }

//   async updateNote(note: string): Promise<Timer> {
//     const url = new URL(`./timer/note`, this.basePath);
//     url.searchParams.set("note", note);
//     const res = await fetch(url, { method: "PUT" });
//     if (res.status !== 201)
//       throw new Error(
//         `Failed to update note. Service status response ${res.status}: ${await t(() => res.text())}`,
//       );
//     const time = await res.json();
//     return time;
//   }
// }

// const service = new Service(
//   new URL(`http://${configs.server.host}:${configs.server.port}`),
// );

// parse arguments
const args = process.argv.slice(2);

type Options = {
  list: boolean;
  create: boolean;
  editNotes: boolean;
  stop: boolean;
  detach: boolean;
  force: boolean;
  title: string;
};

const rules: Rule<Options>[] = [
  rule(command("list"), isBooleanAt("list")),
  rule(command("stop"), isBooleanAt("stop")),
  rule(command("notes"), isBooleanAt("editNotes")),
  rule(command("create"), isBooleanAt("create")),
  rule(flag("-t", "--title"), isStringAt("title")),
  rule(flag("-d", "--detach"), isBooleanAt("detach")),
  rule(flag("-f", "--force"), isBooleanAt("force")),
];

const options = flags<Options>(process.argv.slice(2), {}, rules);

const terminalAttached = !(options.detach ?? false);
const force = options.force ?? false;

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
        ...(terminalAttached
          ? [
              c("text", `Press q to stop timer`),
              c("text", `Press e to edit notes`),
              c("text", `Press Ctrl+C to exit`),
            ]
          : []),
      ]),
    ),
  );
}

const editNotes = async (timer: State<Timer>) => {
  const notesPath = new URL(
    `${os.tmpdir()}/${crypto.randomUUID()}/NOTES.md`,
    "file:",
  );
  await fs.mkdir(new URL("./", notesPath), { recursive: true });
  await fs.writeFile(notesPath, timer.current?.notes ?? "", "utf-8");
  await $`code -w ${notesPath.pathname}`;
  console.log(`Notes saved to ${notesPath.pathname}`);
  const notes = await fs.readFile(notesPath, "utf-8");
  try {
    timer.current = (await service.updateNote(notes)) ?? undefined;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

const attachKeyInputs = (timer: State<Timer>) => {
  if (!terminalAttached) return;
  emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) process.stdin.setRawMode(true);
  process.stdin.on("keypress", async (chunk, key) => {
    // Stop timer
    if (key && key.name === "q") {
      await service.stopCurrentTimer();
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

const runStopTimer = async () => {
  console.log(`Stop timer`);
  await service.stopCurrentTimer();
};

const runCreateTimer = async () => {
  if (!options.title) throw new Error("Missing '--title' argument");

  if (force) {
    const currentTimer = await service.getCurrentTimer();
    if (currentTimer) await service.stopCurrentTimer();
    console.log(`Force stop timer`);
  }

  const timerCreated = await service.createTimer(options.title);
  const $timer = state(timerCreated);
  console.log(`New timer created`);
  attachKeyInputs($timer);
  do {
    console.clear();
    renderTimer($timer);
    await new Promise((resolve) =>
      setTimeout(resolve, configs.client.terminal.refresh),
    );
  } while (terminalAttached);
};

const runLookTimer = async () => {
  const $timer = state((await service.getCurrentTimer()) ?? undefined);

  if (!$timer.current) {
    console.error(styleText("reset", `No timer found`));
    return false;
  }

  attachKeyInputs($timer);
  do {
    console.clear();
    renderTimer($timer);
    await new Promise((resolve) =>
      setTimeout(resolve, configs.client.terminal.refresh),
    );
  } while (terminalAttached);
};

const runListTimers = async () => {
  const timers = await service.listTimers();
  console.log(
    render(
      c("div", [
        c("text", `Timers:`),
        ...timers.map((timer) =>
          c(
            "text",
            `- ${timer.end_at ? styleText("cyan", relativeTime(timer.end_at - timer.start_at)) : "active"} ${timer.title}`,
          ),
        ),
      ]),
    ),
  );
};

const run = async () => {
  if (options.list) return await runListTimers();
  if (options.stop) return await runStopTimer();
  if (options.create) return await runCreateTimer();

  await runLookTimer();
};

await run();
