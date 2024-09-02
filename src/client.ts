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
import { createHTTPClient } from "./utils/simplerpc.js";
import { pkg } from "./pkg.js";

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

const service = await createHTTPClient<typeof import("./services.js")>(
  new URL(`http://${configs.server.host}:${configs.server.port}`),
);

type Options = {
  list: boolean;
  create: boolean;
  version: boolean;
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
  rule(command("version"), isBooleanAt("version")),
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
    const hours = Math.floor(minutes / 60);

    const str: string[] = [];

    if (hours > 60 * 60 * 1000) {
      str.push(`${hours}h`);
    }

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

const runVersion = () => {
  console.log(`Version: v${pkg.version}`);
};

const run = async () => {
  if (options.list) return await runListTimers();
  if (options.stop) return await runStopTimer();
  if (options.create) return await runCreateTimer();
  if (options.version) return await runVersion();

  await runLookTimer();
};

await run();
