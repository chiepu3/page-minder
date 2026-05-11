import type { ImageRecord } from './image-storage';

export async function saveImage(blob: Blob, mimeType: string): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const resp = await browser.runtime.sendMessage({ type: 'IMAGE_SAVE', buffer, mimeType });
  return resp.id as string;
}

export async function getImage(id: string): Promise<Blob | null> {
  const resp = await browser.runtime.sendMessage({ type: 'IMAGE_GET', id });
  if (!resp?.buffer) return null;
  return new Blob([resp.buffer as ArrayBuffer], { type: resp.mimeType as string });
}

export async function deleteImages(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await browser.runtime.sendMessage({ type: 'IMAGE_DELETE_MANY', ids });
}

export type { ImageRecord };
