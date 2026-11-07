import { Database, Medication, slots, today, validDay, validateBackup } from './model';
import { mutate, read } from './repository';
export * from './model';
export const readDatabase = read;

async function commit(change: (db: Database) => Database): Promise<Database> {
  // UI actions redraw after persistence and surface redraw failures separately.
  // Headless widget tasks do the same after their atomic mutation.
  return mutate(change);
}
export function toggleDose(key: string): Promise<Database> {
  return commit(db => {
    const day = key.split('|')[0];
    if (!validDay(day) || day > today()) throw Error('미래 날짜에는 복용 체크를 할 수 없습니다.');
    if (!slots(db, day).some(s => s.key === key)) throw Error('변경된 일정입니다. 새로고침해 주세요.');
    if (db.checks[key]) delete db.checks[key];
    else db.checks[key] = new Date().toISOString();
    return db;
  });
}
// Set intent, not toggle: rapid repeated taps on an old launcher frame are
// idempotent instead of checking and immediately unchecking the same dose.
export function setDoseFromWidget(key: string, completed: boolean): Promise<Database> {
  return mutate(db => {
    const day = key.split('|')[0];
    if (day !== today() || !slots(db, day).some(s => s.key === key)) return db;
    if (completed) db.checks[key] ??= new Date().toISOString();
    else delete db.checks[key];
    return db;
  });
}
export function saveMedication(m: Medication): Promise<Database> {
  return commit(db => {
    const found = db.meds.findIndex(x => x.id === m.id);
    if (found < 0) db.meds.push(m);
    else db.meds[found] = m;
    return validateBackup(db);
  });
}
export function deleteMedication(id: string): Promise<Database> {
  return commit(db => ({ ...db, meds: db.meds.filter(m => m.id !== id) }));
}
export function reorderDose(key: string, target: number): Promise<Database> {
  return commit(db => {
    const items = slots(db, key.split('|')[0]);
    const from = items.findIndex(s => s.key === key);
    if (from < 0 || !Number.isInteger(target) || target < 0 || target >= items.length) throw Error('이동할 위치가 올바르지 않습니다.');
    const all = [...new Set([...db.order, ...db.meds.flatMap(m => m.times.map(t => `${m.id}|${t}`))])];
    const visible = new Set(items.map(s => `${s.m.id}|${s.t}`));
    const [moved] = items.splice(from, 1);
    items.splice(target, 0, moved);
    let index = 0;
    db.order = all.map(id => visible.has(id) ? `${items[index].m.id}|${items[index++].t}` : id);
    return db;
  });
}
export function restoreDatabase(raw: unknown): Promise<Database> {
  const incoming = validateBackup(raw);
  return commit(() => incoming);
}
export async function exportDatabase(): Promise<string> {
  return JSON.stringify({ ...await read(), exportedAt: new Date().toISOString() }, null, 2);
}
