// =============================================================================
// PageMinder - Image Storage (IndexedDB)
// =============================================================================

import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger';

const DB_NAME = 'pageminder-images';
const DB_VERSION = 1;
const STORE_NAME = 'images';

export interface ImageRecord {
    id: string;
    blob: Blob;
    mimeType: string;
    createdAt: string;
}

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function withStore(
    db: IDBDatabase,
    mode: IDBTransactionMode,
    fn: (store: IDBObjectStore) => IDBRequest,
): Promise<IDBRequest> {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);
        const req = fn(store);
        req.onsuccess = () => resolve(req);
        req.onerror = () => reject(req.error);
    });
}

export async function saveImage(blob: Blob, mimeType: string): Promise<string> {
    const id = uuidv4();
    const db = await openDB();
    try {
        await withStore(db, 'readwrite', (store) =>
            store.add({ id, blob, mimeType, createdAt: new Date().toISOString() }),
        );
        logger.info('Image saved', { imageId: id });
        return id;
    } finally {
        db.close();
    }
}

export async function getImage(id: string): Promise<Blob | null> {
    const db = await openDB();
    try {
        const req = await withStore(db, 'readonly', (store) => store.get(id));
        const record = req.result as ImageRecord | undefined;
        return record?.blob ?? null;
    } finally {
        db.close();
    }
}

export async function getImageRecord(id: string): Promise<ImageRecord | null> {
    const db = await openDB();
    try {
        const req = await withStore(db, 'readonly', (store) => store.get(id));
        return (req.result as ImageRecord | undefined) ?? null;
    } finally {
        db.close();
    }
}

export async function deleteImage(id: string): Promise<void> {
    const db = await openDB();
    try {
        await withStore(db, 'readwrite', (store) => store.delete(id));
        logger.info('Image deleted', { imageId: id });
    } finally {
        db.close();
    }
}

export async function deleteImages(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const db = await openDB();
    try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        for (const id of ids) {
            store.delete(id);
        }
        await new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
        logger.info('Images deleted', { count: ids.length });
    } finally {
        db.close();
    }
}

export async function getAllImages(): Promise<ImageRecord[]> {
    const db = await openDB();
    try {
        const req = await withStore(db, 'readonly', (store) => store.getAll());
        return (req.result as ImageRecord[]) ?? [];
    } finally {
        db.close();
    }
}

export async function importImages(images: ImageRecord[]): Promise<void> {
    if (images.length === 0) return;
    const db = await openDB();
    try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        for (const img of images) {
            store.put(img);
        }
        await new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
        logger.info('Images imported', { count: images.length });
    } finally {
        db.close();
    }
}

export async function getOrphanImageIds(usedIds: Set<string>): Promise<string[]> {
    const all = await getAllImages();
    return all.filter((img) => !usedIds.has(img.id)).map((img) => img.id);
}
