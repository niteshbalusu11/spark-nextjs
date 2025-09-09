/**
 * UMA Persistence Utility
 * Handles storing and retrieving UMA data in localStorage and IndexedDB
 */

import type {
  UMAAccount,
  UMATransaction,
  UMABalance,
  ActivityLog,
  MockRecipient,
  UMAConfig,
} from '@/types/uma';

const DB_NAME = 'UMAWalletDB';
const DB_VERSION = 1;

// IndexedDB store names
const STORES = {
  TRANSACTIONS: 'transactions',
  ACTIVITY_LOG: 'activityLog',
  RECIPIENTS: 'recipients',
} as const;

// localStorage keys
const LOCAL_STORAGE_KEYS = {
  ACCOUNT: 'uma_account',
  BALANCE: 'uma_balance',
  CONFIG: 'uma_config',
} as const;

/**
 * Initialize IndexedDB
 */
async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create transactions store
      if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
        const transactionStore = db.createObjectStore(STORES.TRANSACTIONS, {
          keyPath: 'id',
          autoIncrement: false,
        });
        transactionStore.createIndex('timestamp', 'timestamp', { unique: false });
        transactionStore.createIndex('type', 'type', { unique: false });
        transactionStore.createIndex('status', 'status', { unique: false });
      }

      // Create activity log store
      if (!db.objectStoreNames.contains(STORES.ACTIVITY_LOG)) {
        const activityStore = db.createObjectStore(STORES.ACTIVITY_LOG, {
          keyPath: 'id',
          autoIncrement: false,
        });
        activityStore.createIndex('timestamp', 'timestamp', { unique: false });
        activityStore.createIndex('type', 'type', { unique: false });
      }

      // Create recipients store
      if (!db.objectStoreNames.contains(STORES.RECIPIENTS)) {
        const recipientStore = db.createObjectStore(STORES.RECIPIENTS, {
          keyPath: 'id',
          autoIncrement: false,
        });
        recipientStore.createIndex('umaAddress', 'umaAddress', { unique: true });
      }
    };
  });
}

/**
 * Generic function to add item to IndexedDB store
 */
async function addToStore<T>(storeName: string, item: T): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction([storeName], 'readwrite');
  const store = transaction.objectStore(storeName);
  store.add(item);
  
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

/**
 * Generic function to update item in IndexedDB store
 */
async function updateInStore<T>(storeName: string, item: T): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction([storeName], 'readwrite');
  const store = transaction.objectStore(storeName);
  store.put(item);
  
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

/**
 * Generic function to get all items from IndexedDB store
 */
async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const db = await initDB();
  const transaction = db.transaction([storeName], 'readonly');
  const store = transaction.objectStore(storeName);
  const request = store.getAll();
  
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      db.close();
      resolve(request.result);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Get items from store with limit and sorting
 */
async function getFromStoreWithLimit<T>(
  storeName: string,
  indexName: string,
  limit: number,
  descending: boolean = true
): Promise<T[]> {
  const db = await initDB();
  const transaction = db.transaction([storeName], 'readonly');
  const store = transaction.objectStore(storeName);
  const index = store.index(indexName);
  
  const results: T[] = [];
  const direction: IDBCursorDirection = descending ? 'prev' : 'next';
  const request = index.openCursor(null, direction);
  
  return new Promise((resolve, reject) => {
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor && results.length < limit) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        db.close();
        resolve(results);
      }
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

// UMA Account functions
export function saveUMAAccount(account: UMAAccount): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.ACCOUNT, JSON.stringify(account));
  } catch (error) {
    console.error('Failed to save UMA account:', error);
  }
}

export function loadUMAAccount(): UMAAccount | null {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.ACCOUNT);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load UMA account:', error);
    return null;
  }
}

export function clearUMAAccount(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.ACCOUNT);
  } catch (error) {
    console.error('Failed to clear UMA account:', error);
  }
}

// UMA Balance functions
export function saveUMABalance(balance: UMABalance): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.BALANCE, JSON.stringify(balance));
  } catch (error) {
    console.error('Failed to save UMA balance:', error);
  }
}

export function loadUMABalance(): UMABalance | null {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.BALANCE);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load UMA balance:', error);
    return null;
  }
}

// UMA Config functions (for non-sensitive config only)
export function saveUMAConfig(config: Partial<UMAConfig>): void {
  try {
    // Don't save sensitive data like clientSecret
    const safeConfig = {
      network: config.network,
      vaspDomain: config.vaspDomain,
      apiEndpoint: config.apiEndpoint,
    };
    localStorage.setItem(LOCAL_STORAGE_KEYS.CONFIG, JSON.stringify(safeConfig));
  } catch (error) {
    console.error('Failed to save UMA config:', error);
  }
}

export function loadUMAConfig(): Partial<UMAConfig> | null {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.CONFIG);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load UMA config:', error);
    return null;
  }
}

// Transaction functions
export async function saveTransaction(transaction: UMATransaction): Promise<void> {
  try {
    await updateInStore(STORES.TRANSACTIONS, transaction);
  } catch (error) {
    console.error('Failed to save transaction:', error);
    throw error;
  }
}

export async function loadTransactions(limit: number = 50): Promise<UMATransaction[]> {
  try {
    return await getFromStoreWithLimit<UMATransaction>(
      STORES.TRANSACTIONS,
      'timestamp',
      limit,
      true
    );
  } catch (error) {
    console.error('Failed to load transactions:', error);
    return [];
  }
}

export async function loadTransactionsByType(
  type: 'send' | 'receive',
  limit: number = 50
): Promise<UMATransaction[]> {
  try {
    const allTransactions = await loadTransactions(limit * 2);
    return allTransactions
      .filter(tx => tx.type === type)
      .slice(0, limit);
  } catch (error) {
    console.error('Failed to load transactions by type:', error);
    return [];
  }
}

// Activity Log functions
export async function saveActivityLog(log: ActivityLog): Promise<void> {
  try {
    await updateInStore(STORES.ACTIVITY_LOG, log);
  } catch (error) {
    console.error('Failed to save activity log:', error);
    throw error;
  }
}

export async function loadActivityLogs(limit: number = 100): Promise<ActivityLog[]> {
  try {
    return await getFromStoreWithLimit<ActivityLog>(
      STORES.ACTIVITY_LOG,
      'timestamp',
      limit,
      true
    );
  } catch (error) {
    console.error('Failed to load activity logs:', error);
    return [];
  }
}

// Recipients functions
export async function saveRecipient(recipient: MockRecipient): Promise<void> {
  try {
    await updateInStore(STORES.RECIPIENTS, recipient);
  } catch (error) {
    console.error('Failed to save recipient:', error);
    throw error;
  }
}

export async function loadRecipients(): Promise<MockRecipient[]> {
  try {
    return await getAllFromStore<MockRecipient>(STORES.RECIPIENTS);
  } catch (error) {
    console.error('Failed to load recipients:', error);
    return [];
  }
}

export async function findRecipientByAddress(umaAddress: string): Promise<MockRecipient | null> {
  try {
    const recipients = await loadRecipients();
    return recipients.find(r => r.umaAddress === umaAddress) || null;
  } catch (error) {
    console.error('Failed to find recipient:', error);
    return null;
  }
}

// Clear all UMA data
export async function clearAllUMAData(): Promise<void> {
  try {
    // Clear localStorage
    Object.values(LOCAL_STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });

    // Clear IndexedDB
    const db = await initDB();
    const transaction = db.transaction(
      [STORES.TRANSACTIONS, STORES.ACTIVITY_LOG, STORES.RECIPIENTS],
      'readwrite'
    );
    
    transaction.objectStore(STORES.TRANSACTIONS).clear();
    transaction.objectStore(STORES.ACTIVITY_LOG).clear();
    transaction.objectStore(STORES.RECIPIENTS).clear();
    
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    });
  } catch (error) {
    console.error('Failed to clear all UMA data:', error);
    throw error;
  }
}

// Initialize default mock recipients
export async function initializeMockRecipients(): Promise<void> {
  const mockRecipients: MockRecipient[] = [
    {
      id: '1',
      name: 'Alice Johnson',
      umaAddress: '$alice@vasp1.com',
      avatar: '👩‍💼',
      isOnline: true,
    },
    {
      id: '2',
      name: 'Bob Smith',
      umaAddress: '$bob@vasp2.com',
      avatar: '👨‍💻',
      isOnline: true,
    },
    {
      id: '3',
      name: 'Charlie Brown',
      umaAddress: '$charlie@lightning.network',
      avatar: '👨‍🎨',
      isOnline: false,
    },
    {
      id: '4',
      name: 'Diana Prince',
      umaAddress: '$diana@payments.io',
      avatar: '👸',
      isOnline: true,
    },
    {
      id: '5',
      name: 'Test VASP',
      umaAddress: '$test@uma-test.lightspark.com',
      avatar: '🧪',
      isOnline: true,
    },
  ];

  try {
    for (const recipient of mockRecipients) {
      await saveRecipient(recipient);
    }
  } catch (error) {
    console.error('Failed to initialize mock recipients:', error);
  }
}

// Check if localStorage is available
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__uma_storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}