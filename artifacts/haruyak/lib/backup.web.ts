import { Database, exportDatabase, today, validateBackup } from './store';
export function pickBackup(): Promise<Database | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json,application/json';
    input.oncancel = () => resolve(null);
    input.onchange = async () => {
      try {
        const file = input.files?.[0];
        if (!file) return resolve(null);
        if (file.size > 10 * 1024 * 1024) throw Error('백업은 10MB 이하만 지원합니다.');
        resolve(validateBackup(JSON.parse(await file.text())));
      } catch (e) { reject(e); }
    };
    input.click();
  });
}
export async function shareBackup(): Promise<void> {
  const url = URL.createObjectURL(new Blob([await exportDatabase()], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = `혜진의 하루약-백업-${today()}.json`;
  a.click(); setTimeout(() => URL.revokeObjectURL(url), 60000);
}
