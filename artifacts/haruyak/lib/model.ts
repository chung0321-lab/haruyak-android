export interface Medication {
  id: string; name: string; dose: string; note: string;
  start: string; end: string; days: number[]; times: string[];
}
export interface Database {
  version: 1; meds: Medication[]; checks: Record<string, string>; order: string[];
}
export interface Slot { m: Medication; t: string; key: string }
export const emptyDatabase = (): Database => ({ version: 1, meds: [], checks: {}, order: [] });
export const today = () => localDay(new Date());
export function localDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function shift(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() + n);
  return localDay(d);
}
export function validDay(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T12:00:00`);
  return !Number.isNaN(d.valueOf()) && localDay(d) === value;
}
export function slots(db: Database, day: string): Slot[] {
  const rank = new Map(db.order.map((id, i) => [id, i]));
  const weekday = new Date(`${day}T12:00:00`).getDay();
  return db.meds.filter(m => m.start <= day && (!m.end || m.end >= day) && m.days.includes(weekday))
    .flatMap(m => m.times.map(t => ({ m, t, key: `${day}|${m.id}|${t}` })))
    .sort((a, b) => (rank.get(`${a.m.id}|${a.t}`) ?? Infinity) - (rank.get(`${b.m.id}|${b.t}`) ?? Infinity));
}
export function validateBackup(raw: unknown): Database {
  if (!raw || typeof raw !== 'object') throw Error('올바른 하루약 백업이 아닙니다.');
  const v = raw as Record<string, unknown>;
  if (v.version !== 1 || !Array.isArray(v.meds) || v.meds.length > 1000 ||
      !v.checks || typeof v.checks !== 'object' || Array.isArray(v.checks)) {
    throw Error('지원하는 형식은 기존 하루약 JSON 백업(version: 1)입니다.');
  }
  const ids = new Set<string>();
  for (const m of v.meds) {
    if (!m || typeof m.id !== 'string' || !m.id || ids.has(m.id) ||
      typeof m.name !== 'string' || !m.name.trim() || m.name.length > 80 ||
      typeof m.dose !== 'string' || m.dose.length > 80 ||
      typeof m.note !== 'string' || m.note.length > 200 ||
      !validDay(m.start) || (m.end && (!validDay(m.end) || m.end < m.start)) ||
      !Array.isArray(m.days) || !m.days.length || !m.days.every((d: unknown) => Number.isInteger(d) && Number(d) >= 0 && Number(d) <= 6) ||
      !Array.isArray(m.times) || !m.times.length || !m.times.every((t: unknown) =>
        typeof t === 'string' && t.trim().length > 0 && t.length <= 40 && !/[|,，\n\r\x00-\x1f]/.test(t))) {
      throw Error('약 일정이 올바르지 않습니다. 이름·일정·요일·날짜를 확인해 주세요.');
    }
    ids.add(m.id);
  }
  const checks: Record<string, string> = {};
  for (const [key, timestamp] of Object.entries(v.checks)) {
    if (!validDay(key.split('|')[0]) || typeof timestamp !== 'string' || Number.isNaN(Date.parse(timestamp))) {
      throw Error('복용 기록의 날짜가 올바르지 않습니다.');
    }
    Object.defineProperty(checks, key, { value: timestamp, enumerable: true, writable: true, configurable: true });
  }
  if (v.order !== undefined && (!Array.isArray(v.order) || v.order.length > 50000 ||
      !v.order.every(x => typeof x === 'string' && x.length <= 300))) throw Error('목록 순서가 올바르지 않습니다.');
  return {
    version: 1,
    meds: v.meds.map(m => ({
      id: m.id, name: m.name, dose: m.dose, note: m.note, start: m.start,
      end: m.end || '', days: [...m.days], times: [...new Set<string>(m.times)],
    })),
    checks, order: [...(v.order as string[] || [])],
  };
}
// Earliest timed, uncompleted dose, including overdue doses. Label-only schedules
// have no invented clock time and retain the user's list order.
export function nextDose(db: Database, day = today()): Slot | undefined {
  const pending = slots(db, day).filter(s => !db.checks[s.key]);
  const minutes = (s: Slot) => {
    const m = s.t.match(/(?:^|\s|·)([01]\d|2[0-3]):([0-5]\d)(?:$|\s)/);
    return m ? Number(m[1]) * 60 + Number(m[2]) : Infinity;
  };
  return pending.sort((a, b) => minutes(a) - minutes(b))[0];
}
