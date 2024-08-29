import type { Store } from "./store";

export interface Timer {
  id: string;
  title: string;
  start_at: number;
  end_at: number;
}

export class Timers {
  #db: import("bun:sqlite").Database;

  constructor(readonly store: Store) {
    this.#db = store.db;
  }

  async init() {
    this.#db.run(`
              CREATE TABLE IF NOT EXISTS timers (
                  id TEXT PRIMARY KEY,
                  title TEXT,
                  start_at INTEGER,
                  end_at INTEGER
              )
          `);
  }

  async getTimers() {
    return this.#db.query<Timer, any>("SELECT * FROM timers").all();
  }

  async getTimer(timerId: string) {
    return this.#db
      .query<Timer, string>(
        `
              SELECT * FROM timers WHERE id = ?
          `,
      )
      .get(timerId);
  }

  async currentTime() {
    // find timer with end_at as null
    return this.#db
      .query<Timer, any>("SELECT * FROM timers WHERE end_at IS NULL")
      .get();
  }

  async createTimer(title: string) {
    const currentTime = await this.currentTime();
    if (currentTime) {
      throw new Error("Ongoing timer found");
    }

    const timerId = crypto.randomUUID();

    await this.#db.run(
      "INSERT INTO timers (id, title, start_at) VALUES (?, ?, ?)",
      [timerId, title, Date.now()],
    );

    const timer = await this.getTimer(timerId);

    if (!timer) {
      throw new Error("Failed to create timer");
    }

    return timer;
  }

  async stopTimer() {
    const currentTime = await this.currentTime();
    if (!currentTime) {
      throw new Error("No ongoing timer found");
    }
    await this.#db.run("UPDATE timers SET end_at = ? WHERE id = ?", [
      Date.now(),
      currentTime.id,
    ]);
  }
}
