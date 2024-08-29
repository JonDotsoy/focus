import { Database } from "bun:sqlite";
import { configs } from "../configs";
import { Store } from "./models/store";
import { Timers } from "./models/timers";

export const store = new Store(configs.server.database.pathname);

export const timers = new Timers(store);

await timers.init();
