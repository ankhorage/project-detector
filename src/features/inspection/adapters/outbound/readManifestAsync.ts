import { constants } from 'node:fs';
import { type FileHandle, open, realpath } from 'node:fs/promises';
import path from 'node:path';

/*** Read bounded regular-file text without following a final symlink or leaving the scan root. */
export async function readManifestAsync(
  file: string,
  root: string,
  maxBytes: number,
): Promise<string> {
  const resolved = await realpath(file);
  const relative = path.relative(root, resolved);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error('Manifest resolved outside the inspection root.');
  }
  const handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const stat = await handle.stat();
    if (!stat.isFile()) throw new Error('Manifest is not a regular file.');
    if (stat.size > maxBytes) throw new Error('Manifest exceeds the configured byte limit.');
    const buffer = Buffer.alloc(maxBytes + 1);
    const bytesRead = await readBytesAsync(handle, buffer, 0);
    if (bytesRead > maxBytes) throw new Error('Manifest exceeds the configured byte limit.');
    return buffer.subarray(0, bytesRead).toString('utf8');
  } finally {
    await handle.close();
  }
}

/*** Handle short reads while retaining a strict allocation/read ceiling. */
async function readBytesAsync(handle: FileHandle, buffer: Buffer, offset: number): Promise<number> {
  if (offset === buffer.length) return offset;
  const { bytesRead } = await handle.read(buffer, offset, buffer.length - offset, offset);
  return bytesRead === 0 ? offset : readBytesAsync(handle, buffer, offset + bytesRead);
}
