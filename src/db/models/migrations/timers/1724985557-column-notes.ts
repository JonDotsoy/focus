import type { Database } from "bun:sqlite";

export const up = async (db: Database) => {
  const columns = await db
    .query<{ name: string }, any>(
      `
    PRAGMA table_info(timers)
  `,
    )
    .all();

  const notesColumn = columns.find((column) => column.name === "notes");
  if (notesColumn) return;

  await db.run(`
    ALTER TABLE timers ADD COLUMN notes TEXT
  `);
};
