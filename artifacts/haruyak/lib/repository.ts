import * as SQLite from 'expo-sqlite';
import { Database, emptyDatabase, validateBackup } from './model';

const filename = 'haruyak.db';
let initialized: Promise<void> | undefined;
function initialize(): Promise<void> {
  if (!initialized) {
    initialized = (async () => {
      const db = await SQLite.openDatabaseAsync(filename);
      await db.execAsync('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=10000; CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK(id=1), json TEXT NOT NULL);');
      await db.runAsync('INSERT OR IGNORE INTO app_state (id,json) VALUES (1,?)', JSON.stringify(emptyDatabase()));
    })().catch(e => { initialized = undefined; throw e; });
  }
  return initialized;
}
export async function read(): Promise<Database> {
  await initialize();
  const db = await SQLite.openDatabaseAsync(filename);
  const row = await db.getFirstAsync<{ json: string }>('SELECT json FROM app_state WHERE id=1');
  if (!row) throw Error('저장된 기록을 읽을 수 없습니다.');
  return validateBackup(JSON.parse(row.json));
}
// A fresh connection + BEGIN IMMEDIATE serializes read-modify-write across
// foreground React and headless widget tasks, not only inside one JS runtime.
export async function mutate(change: (db: Database) => Database): Promise<Database> {
  await initialize();
  const db = await SQLite.openDatabaseAsync(filename, { useNewConnection: true });
  let inTransaction = false;
  try {
    await db.execAsync('PRAGMA busy_timeout=10000; BEGIN IMMEDIATE;');
    inTransaction = true;
    const row = await db.getFirstAsync<{ json: string }>('SELECT json FROM app_state WHERE id=1');
    if (!row) throw Error('저장된 기록을 읽을 수 없습니다.');
    const next = validateBackup(change(validateBackup(JSON.parse(row.json))));
    await db.runAsync('UPDATE app_state SET json=? WHERE id=1', JSON.stringify(next));
    await db.execAsync('COMMIT');
    inTransaction = false;
    return next;
  } finally {
    if (inTransaction) await db.execAsync('ROLLBACK');
    await db.closeAsync();
  }
}
