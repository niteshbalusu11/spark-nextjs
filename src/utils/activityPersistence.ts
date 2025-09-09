/**
 * Activity Persistence Utility
 * Handles storing and retrieving wallet activity data in localStorage
 */

import type {
  WalletTransfer,
  LightningReceiveRequest,
  LightningSendRequest,
} from '@/types/spark-wallet';

const STORAGE_KEYS = {
  TRANSFERS: 'spark_wallet_transfers',
  LIGHTNING_INVOICES: 'spark_wallet_lightning_invoices',
  LIGHTNING_SEND_REQUESTS: 'spark_wallet_lightning_send_requests',
  DEPOSIT_ADDRESSES: 'spark_wallet_deposit_addresses',
} as const;

// Maximum items to store per category to prevent excessive storage usage
const MAX_ITEMS_PER_CATEGORY = 100;

/**
 * Safely parse JSON with error handling
 */
function safeJsonParse<T>(json: string | null, defaultValue: T): T {
  if (!json) return defaultValue;
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error('Failed to parse JSON from localStorage:', error);
    return defaultValue;
  }
}

/**
 * Save transfers to localStorage
 */
export function saveTransfers(transfers: WalletTransfer[]): void {
  try {
    // Limit the number of items stored
    const itemsToStore = transfers.slice(0, MAX_ITEMS_PER_CATEGORY);
    localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(itemsToStore));
  } catch (error) {
    console.error('Failed to save transfers to localStorage:', error);
  }
}

/**
 * Load transfers from localStorage
 */
export function loadTransfers(): WalletTransfer[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TRANSFERS);
    return safeJsonParse<WalletTransfer[]>(stored, []);
  } catch (error) {
    console.error('Failed to load transfers from localStorage:', error);
    return [];
  }
}

/**
 * Save lightning invoices to localStorage
 */
export function saveLightningInvoices(invoices: LightningReceiveRequest[]): void {
  try {
    const itemsToStore = invoices.slice(0, MAX_ITEMS_PER_CATEGORY);
    localStorage.setItem(STORAGE_KEYS.LIGHTNING_INVOICES, JSON.stringify(itemsToStore));
  } catch (error) {
    console.error('Failed to save lightning invoices to localStorage:', error);
  }
}

/**
 * Load lightning invoices from localStorage
 */
export function loadLightningInvoices(): LightningReceiveRequest[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LIGHTNING_INVOICES);
    return safeJsonParse<LightningReceiveRequest[]>(stored, []);
  } catch (error) {
    console.error('Failed to load lightning invoices from localStorage:', error);
    return [];
  }
}

/**
 * Save lightning send requests to localStorage
 */
export function saveLightningSendRequests(requests: LightningSendRequest[]): void {
  try {
    const itemsToStore = requests.slice(0, MAX_ITEMS_PER_CATEGORY);
    localStorage.setItem(STORAGE_KEYS.LIGHTNING_SEND_REQUESTS, JSON.stringify(itemsToStore));
  } catch (error) {
    console.error('Failed to save lightning send requests to localStorage:', error);
  }
}

/**
 * Load lightning send requests from localStorage
 */
export function loadLightningSendRequests(): LightningSendRequest[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LIGHTNING_SEND_REQUESTS);
    return safeJsonParse<LightningSendRequest[]>(stored, []);
  } catch (error) {
    console.error('Failed to load lightning send requests from localStorage:', error);
    return [];
  }
}

/**
 * Save deposit addresses to localStorage
 */
export function saveDepositAddresses(addresses: string[]): void {
  try {
    const itemsToStore = addresses.slice(0, MAX_ITEMS_PER_CATEGORY);
    localStorage.setItem(STORAGE_KEYS.DEPOSIT_ADDRESSES, JSON.stringify(itemsToStore));
  } catch (error) {
    console.error('Failed to save deposit addresses to localStorage:', error);
  }
}

/**
 * Load deposit addresses from localStorage
 */
export function loadDepositAddresses(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DEPOSIT_ADDRESSES);
    return safeJsonParse<string[]>(stored, []);
  } catch (error) {
    console.error('Failed to load deposit addresses from localStorage:', error);
    return [];
  }
}

/**
 * Clear all stored activity data
 */
export function clearAllActivityData(): void {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Failed to clear activity data from localStorage:', error);
  }
}

/**
 * Check if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}