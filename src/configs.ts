import { file } from "bun";
import * as YAML from "yaml";
import { get } from "@jondotsoy/utils-js";
import os from "os";

const configFileAlternatives = [
  new URL(".config/focus/configs.yaml", new URL(`${os.homedir()}/`, "file:")),
];

let configFile: URL | null = null;

for (const configFileAlternative of configFileAlternatives) {
  if (await file(configFileAlternative).exists()) {
    configFile = configFileAlternative;
    break;
  }
}

export const configsRaw: unknown = configFile
  ? YAML.parse(await file(configFile).text())
  : {};

export const configs = {
  server: {
    host: get.string(configsRaw, "server", "host") ?? "localhost",
    port: get.number(configsRaw, "server", "port") ?? 56895,
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
