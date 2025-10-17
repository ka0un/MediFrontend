/**
 * Offline Storage Utility using IndexedDB (UC-04 A4)
 * Provides offline caching and sync capabilities for medical records
 */

const DB_NAME = 'MediOfflineDB';
const DB_VERSION = 1;
const MEDICAL_RECORDS_STORE = 'medical-records';
const SYNC_QUEUE_STORE = 'sync-queue';

class OfflineStorage {
  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create medical records store
        if (!db.objectStoreNames.contains(MEDICAL_RECORDS_STORE)) {
          const recordsStore = db.createObjectStore(MEDICAL_RECORDS_STORE, { 
            keyPath: 'patientId' 
          });
          recordsStore.createIndex('cardNumber', 'digitalHealthCardNumber', { unique: false });
          recordsStore.createIndex('cachedAt', 'cachedAt', { unique: false });
        }

        // Create sync queue store
        if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
          db.createObjectStore(SYNC_QUEUE_STORE, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
        }
      };
    });
  }

  /**
   * Cache medical record for offline access
   */
  async cacheMedicalRecord(record: any): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MEDICAL_RECORDS_STORE], 'readwrite');
      const store = transaction.objectStore(MEDICAL_RECORDS_STORE);

      const recordWithCache = {
        ...record,
        cachedAt: new Date().toISOString(),
        offline: true
      };

      const request = store.put(recordWithCache);

      request.onsuccess = () => {
        console.log('Medical record cached:', record.patientId);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to cache record:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get cached medical record
   */
  async getCachedRecord(patientId: number): Promise<any> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MEDICAL_RECORDS_STORE], 'readonly');
      const store = transaction.objectStore(MEDICAL_RECORDS_STORE);
      const request = store.get(patientId);

      request.onsuccess = () => {
        if (request.result) {
          console.log('Retrieved cached record:', patientId);
          resolve(request.result);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('Failed to get cached record:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get cached record by card number
   */
  async getCachedRecordByCardNumber(cardNumber: string): Promise<any> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MEDICAL_RECORDS_STORE], 'readonly');
      const store = transaction.objectStore(MEDICAL_RECORDS_STORE);
      const index = store.index('cardNumber');
      const request = index.get(cardNumber);

      request.onsuccess = () => {
        if (request.result) {
          console.log('Retrieved cached record by card:', cardNumber);
          resolve(request.result);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('Failed to get cached record by card:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all cached records
   */
  async getAllCachedRecords(): Promise<any[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MEDICAL_RECORDS_STORE], 'readonly');
      const store = transaction.objectStore(MEDICAL_RECORDS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Failed to get all cached records:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Add operation to sync queue (for when offline)
   */
  async queueOperation(operation: {
    url: string;
    method: string;
    headers: any;
    body: any;
  }): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SYNC_QUEUE_STORE], 'readwrite');
      const store = transaction.objectStore(SYNC_QUEUE_STORE);

      const queuedOperation = {
        ...operation,
        queuedAt: new Date().toISOString()
      };

      const request = store.add(queuedOperation);

      request.onsuccess = () => {
        console.log('Operation queued for sync');
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to queue operation:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Clear old cached records (older than 7 days)
   */
  async clearOldCache(): Promise<void> {
    if (!this.db) await this.init();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MEDICAL_RECORDS_STORE], 'readwrite');
      const store = transaction.objectStore(MEDICAL_RECORDS_STORE);
      const index = store.index('cachedAt');
      const range = IDBKeyRange.upperBound(sevenDaysAgo.toISOString());

      const request = index.openCursor(range);

      request.onsuccess = (event: any) => {
        const cursor = event.target.result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        } else {
          console.log('Old cache cleared');
          resolve();
        }
      };

      request.onerror = () => {
        console.error('Failed to clear old cache:', request.error);
        reject(request.error);
      };
    });
  }
}

export const offlineStorage = new OfflineStorage();
