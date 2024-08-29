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

const t = async (f: () => Promise<string>): Promise<string> => {
  try {
    return await f();
  } catch (error) {
    console.error(error);
    return `Error unknown`;
  }
};

// server class

class Server {
  constructor(readonly basePath: URL) {}

  async currentTimer() {
    const res = await fetch(new URL(`./timer/current`, this.basePath));
    const data = await res.json();
    return data;
  }

  async createTimer(title: string) {
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

function renderTimer(timer: any) {
  if (timer == null) throw new Error("No timer found");
  const startAt = new Date(timer.start_at);
  const relativeTimer = () => {
    const milliseconds = Date.now() - timer.start_at;
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);

    const str: string[] = [];

    if (milliseconds > 60 * 1000) {
      str.push(`${minutes}m`);
    }

    // if (milliseconds > 1000) {
    // }
    str.push(`${seconds % 60}s`);

    // str.push(`${milliseconds % 1000}ms`);

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
        ]),
        c("text", `run 'focus stop' to stop timer`),
        c("text", `Press Ctrl+C to exit`),
      ]),
    ),
  );
}

const run = async () => {
  if (options.stop) {
    console.log(`Stop timer`);
    await server.stopTimer();
  } else if (options.create) {
    if (!options.title) throw new Error("Missing '--title' argument");

    const timer = await server.createTimer(options.title);
    console.log(`New timer created`);
    while (true) {
      console.clear();
      renderTimer(timer);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  } else {
    const timer = await server.currentTimer();
    if (timer == null) {
      console.error(styleText("reset", `No timer found`));
      return;
    }
    while (true) {
      console.clear();
      renderTimer(timer);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
};

await run();
