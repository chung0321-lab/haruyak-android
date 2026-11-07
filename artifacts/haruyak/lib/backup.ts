import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Database, exportDatabase, today, validateBackup } from './store';

export async function pickBackup(): Promise<Database | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', 'application/octet-stream'],
    copyToCacheDirectory: true, multiple: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if ((asset.size ?? 0) > 10 * 1024 * 1024) throw Error('백업은 10MB 이하만 지원합니다.');
  const file = new File(asset.uri);
  if (file.size > 10 * 1024 * 1024) throw Error('백업은 10MB 이하만 지원합니다.');
  return validateBackup(JSON.parse(await file.text()));
}
export async function shareBackup(): Promise<void> {
  if (!await Sharing.isAvailableAsync()) throw Error('이 기기에서는 파일 공유를 사용할 수 없습니다.');
  const file = new File(Paths.cache, `혜진의 하루약-백업-${today()}.json`);
  file.create({ overwrite: true });
  file.write(await exportDatabase());
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: '하루약 백업 저장', UTI: 'public.json' });
}
