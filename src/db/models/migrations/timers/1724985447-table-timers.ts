import type { Database } from "bun:sqlite";

export const up = async (db: Database) => {
  await db.run(`
      CREATE TABLE IF NOT EXISTS timers (
          id TEXT PRIMARY KEY,
          title TEXT,
          start_at INTEGER,
          end_at INTEGER
      )
  `);
};
