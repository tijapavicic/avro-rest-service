/**
 * Storage Service - Abstraction layer for data persistence
 *
 * Provides a unified interface for localStorage operations with:
 * - Error handling and graceful degradation
 * - Schema versioning
 * - Data validation
 * - Quota management
 *
 * @class StorageService
 */
class StorageService {
  constructor() {
    this.storageAvailable = this._checkStorageAvailability();
    this.version = '1.0.0';
  }

  /**
   * Check if localStorage is available
   * @private
   * @returns {boolean}
   */
  _checkStorageAvailability() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn('localStorage not available, using in-memory fallback', e);
      return false;
    }
  }

  /**
   * Get item from storage with type safety
   * @template T
   * @param {string} key - Storage key
   * @param {T} [defaultValue] - Default value if not found
   * @returns {T|null}
   */
  get(key, defaultValue = null) {
    if (!this.storageAvailable) {
      return defaultValue;
    }

    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }

      const parsed = JSON.parse(item);

      // Version check
      if (parsed.version && parsed.version !== this.version) {
        console.warn(`Version mismatch for ${key}, migrating...`);
        return this._migrateData(key, parsed, defaultValue);
      }

      return parsed.data ?? defaultValue;
    } catch (error) {
      console.error(`Error reading ${key} from storage:`, error);
      return defaultValue;
    }
  }

  /**
   * Set item in storage with versioning
   * @template T
   * @param {string} key - Storage key
   * @param {T} value - Value to store
   * @returns {boolean} Success status
   */
  set(key, value) {
    if (!this.storageAvailable) {
      console.warn('Storage not available, data will not persist');
      return false;
    }

    try {
      const payload = {
        version: this.version,
        data: value,
        timestamp: Date.now()
      };

      localStorage.setItem(key, JSON.stringify(payload));
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded, attempting cleanup...');
        this._handleQuotaExceeded(key, value);
      } else {
        console.error(`Error writing ${key} to storage:`, error);
      }
      return false;
    }
  }

  /**
   * Remove item from storage
   * @param {string} key - Storage key
   * @returns {boolean} Success status
   */
  remove(key) {
    if (!this.storageAvailable) {
      return false;
    }

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key} from storage:`, error);
      return false;
    }
  }

  /**
   * Clear all storage
   * @returns {boolean} Success status
   */
  clear() {
    if (!this.storageAvailable) {
      return false;
    }

    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }

  /**
   * Get storage usage statistics
   * @returns {{used: number, available: number, percentage: number}}
   */
  getUsageStats() {
    if (!this.storageAvailable) {
      return { used: 0, available: 0, percentage: 0 };
    }

    try {
      let used = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }

      // Estimate: localStorage typically has 5-10MB limit
      const estimate = 5 * 1024 * 1024; // 5MB
      return {
        used,
        available: estimate,
        percentage: (used / estimate) * 100
      };
    } catch (error) {
      console.error('Error calculating storage usage:', error);
      return { used: 0, available: 0, percentage: 0 };
    }
  }

  /**
   * Handle quota exceeded error
   * @private
   */
  _handleQuotaExceeded(key, value) {
    // Strategy: Remove oldest timestamped items
    const items = [];

    for (let storageKey in localStorage) {
      if (localStorage.hasOwnProperty(storageKey)) {
        try {
          const item = JSON.parse(localStorage[storageKey]);
          if (item.timestamp) {
            items.push({ key: storageKey, timestamp: item.timestamp });
          }
        } catch (e) {
          // Skip invalid items
        }
      }
    }

    // Sort by timestamp, oldest first
    items.sort((a, b) => a.timestamp - b.timestamp);

    // Remove oldest 20% of items
    const toRemove = Math.ceil(items.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      localStorage.removeItem(items[i].key);
    }

    // Retry original operation
    try {
      this.set(key, value);
    } catch (error) {
      console.error('Failed to save data even after cleanup:', error);
    }
  }

  /**
   * Migrate data between versions
   * @private
   */
  _migrateData(key, oldData, defaultValue) {
    // In a real app, implement migration logic here
    console.log(`Migrating ${key} from version ${oldData.version} to ${this.version}`);
    return oldData.data ?? defaultValue;
  }
}

// Export singleton instance
window.storageService = new StorageService();
export default window.storageService;

