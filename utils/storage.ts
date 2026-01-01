/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const DB_NAME = 'PixshopDB';
const STORE_NAME = 'session';
const DB_VERSION = 1;

interface SessionState {
  id: string;
  history: File[];
  currentIndex: number;
  timestamp: number;
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

export const saveSession = async (history: File[], currentIndex: number): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // We only save the most recent relevant files to save space, or limit history
    // For this implementation, we'll save the whole history but beware of browser quotas.
    const session: SessionState = {
      id: 'current_session',
      history,
      currentIndex,
      timestamp: Date.now(),
    };

    const request = store.put(session);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const loadSession = async (): Promise<SessionState | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get('current_session');

    request.onsuccess = () => {
      resolve(request.result as SessionState || null);
    };
    request.onerror = () => reject(request.error);
  });
};

export const clearSession = async (): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete('current_session');

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};