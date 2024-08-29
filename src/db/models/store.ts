import { Database } from "bun:sqlite";

export class Store {
  db: Database;
  constructor(dbPath: string) {
    this.db = new Database(dbPath);
  }
}
