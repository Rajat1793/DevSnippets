import { File, Directory, Paths } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { FileItem } from '@/types';

function docSubDir(name: string): Directory {
  const dir = new Directory(Paths.document, name);
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

// URI-based constants for file manager navigation
export const APP_FILES_DIR = Paths.document.uri + 'files/';
export const ATTACHMENTS_DIR = Paths.document.uri + 'attachments/';
export const EXPORTS_DIR = Paths.document.uri + 'exports/';
export const TEMPLATES_DIR = Paths.document.uri + 'templates/';

export async function initFileSystem(): Promise<void> {
  ['files', 'attachments', 'templates', 'exports'].forEach((name) => {
    const dir = new Directory(Paths.document, name);
    if (!dir.exists) dir.create({ intermediates: true });
  });
}

export async function listDirectory(dirUri: string): Promise<FileItem[]> {
  const dir = new Directory(dirUri);
  if (!dir.exists) {
    dir.create({ intermediates: true });
    return [];
  }
  const items = dir.list();
  return items
    .map((item) => {
      const isDir = item instanceof Directory;
      const name = isDir ? (item as Directory).name : (item as File).name;
      return {
        name,
        path: item.uri,
        uri: item.uri,
        size: isDir ? null : ((item as File).size ?? null),
        isDirectory: isDir,
        modifiedAt: null,
      };
    })
    .sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

export async function deleteFile(uri: string): Promise<void> {
  const file = new File(uri);
  if (file.exists) { file.delete(); return; }
  const dir = new Directory(uri);
  if (dir.exists) dir.delete();
}

export async function createFolder(parentUri: string, name: string): Promise<string> {
  const sanitized = name.replace(/[^a-zA-Z0-9-_ ]/g, '_');
  const newDir = new Directory(parentUri, sanitized);
  newDir.create({ intermediates: true });
  return newDir.uri;
}

export async function readTextFile(uri: string): Promise<string> {
  return new File(uri).text();
}

export async function writeTextFile(uri: string, content: string): Promise<void> {
  new File(uri).write(content);
}

export async function copyFile(sourceUri: string, destDirUri: string): Promise<string> {
  const file = new File(sourceUri);
  const destDir = new Directory(destDirUri);
  file.copy(destDir);
  return new File(destDir, file.name).uri;
}

export async function moveFile(sourceUri: string, destDirUri: string): Promise<string> {
  const file = new File(sourceUri);
  const destDir = new Directory(destDirUri);
  file.move(destDir);
  return new File(destDir, file.name).uri;
}

export async function getFileSize(uri: string): Promise<number> {
  const file = new File(uri);
  return file.exists ? file.size : 0;
}

export async function pickAndImportDocument(destDirUri: string): Promise<FileItem | null> {
  const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  const destDir = new Directory(destDirUri);
  new File(asset.uri).copy(destDir);
  const destFile = new File(destDir, asset.name ?? 'imported_file');
  return {
    name: asset.name ?? 'imported_file',
    path: destFile.uri,
    uri: destFile.uri,
    size: asset.size ?? null,
    isDirectory: false,
    modifiedAt: new Date().toISOString(),
  };
}

export async function pickAndAttachImage(snippetId: string): Promise<string | null> {
  const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permResult.granted) throw new Error('Media library permission denied.');
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
    allowsEditing: false,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  const ext = asset.uri.split('.').pop() ?? 'jpg';
  const attDir = docSubDir('attachments');
  new File(asset.uri).copy(attDir);
  return new File(attDir, `${snippetId}.${ext}`).uri;
}

export function formatFileSize(bytes: number | null): string {
  if (bytes === null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileIcon(name: string, isDirectory: boolean): string {
  if (isDirectory) return '📁';
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const icons: Record<string, string> = {
    js: '🟨', ts: '🔷', py: '🐍', java: '☕', go: '🐹',
    rs: '🦀', rb: '💎', php: '🐘', swift: '🍎', kt: '🇰',
    html: '🌐', css: '🎨', sql: '🗄️', sh: '💻', md: '📝',
    json: '📋', yaml: '📄', yml: '📄', txt: '📃', png: '🖼️',
    jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', pdf: '📕', zip: '📦',
  };
  return icons[ext] ?? '📄';
}
