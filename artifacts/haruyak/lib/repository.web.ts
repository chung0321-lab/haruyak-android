import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database, emptyDatabase, validateBackup } from './model';
const KEY = 'haruyak.v1';
let queue: Promise<unknown> = Promise.resolve();
export async function read(): Promise<Database> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? validateBackup(JSON.parse(raw)) : emptyDatabase();
}
export function mutate(change: (db: Database) => Database): Promise<Database> {
  const result = queue.then(async () => {
    const next = validateBackup(change(await read()));
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    return next;
  });
  queue = result.catch(() => undefined);
  return result;
}
