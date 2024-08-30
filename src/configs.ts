import { file } from "bun";
import * as YAML from "yaml";
import { get } from "./utils/get";
import os from "os";

const configFileAlternatives = [
  new URL(".config/focus/configs.yaml", new URL(`${os.homedir()}/`, "file:")),
  new URL("../configs.yaml", import.meta.url),
];

let configFile: URL | null = null;

for (const file of configFileAlternatives) {
  if (await Bun.file(file).exists()) {
    configFile = file;
    break;
  }
}

export const configsRaw: unknown = configFile
  ? YAML.parse(await file(configFile).text())
  : {};

export const configs = {
  server: {
    host: get.string(configsRaw, "server", "host") ?? "localhost",
    port: get.number(configsRaw, "server", "port"),
    database: new URL(
      get.string(configsRaw, "server", "database") ?? "./db.sqlite",
      configFile ?? `file://${process.cwd()}`,
    ),
  },
  client: {
    terminal: {
      refresh: get.number(configsRaw, "client", "terminal", "refresh") ?? 500,
    },
  },
} as const;
