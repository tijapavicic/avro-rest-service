/**
 * Event Bus - Centralized event management for decoupled communication
 *
 * Implements pub/sub pattern for loose coupling between components.
 * Supports event namespacing, wildcards, and error handling.
 *
 * @class EventBus
 */
class EventBus {
  constructor() {
    this.listeners = new Map();
    this.eventHistory = [];
    this.maxHistorySize = 100;
  }

  /**
   * Subscribe to an event
   * @param {string} eventName - Event name (supports wildcards with *)
   * @param {Function} callback - Callback function
   * @param {Object} [options] - Subscription options
   * @returns {Function} Unsubscribe function
   */
  on(eventName, callback, options = {}) {
    if (typeof callback !== 'function') {
      throw new TypeError('Callback must be a function');
    }

    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }

    const subscription = {
      callback,
      once: options.once || false,
      priority: options.priority || 0,
      context: options.context || null
    };

    this.listeners.get(eventName).push(subscription);

    // Sort by priority (higher priority executes first)
    this.listeners.get(eventName).sort((a, b) => b.priority - a.priority);

    // Return unsubscribe function
    return () => this.off(eventName, callback);
  }

  /**
   * Subscribe to an event once
   * @param {string} eventName - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  once(eventName, callback) {
    return this.on(eventName, callback, { once: true });
  }

  /**
   * Unsubscribe from an event
   * @param {string} eventName - Event name
   * @param {Function} [callback] - Specific callback to remove (optional)
   */
  off(eventName, callback = null) {
    if (!this.listeners.has(eventName)) {
      return;
    }

    if (callback === null) {
      // Remove all listeners for this event
      this.listeners.delete(eventName);
    } else {
      // Remove specific callback
      const listeners = this.listeners.get(eventName);
      const filtered = listeners.filter(sub => sub.callback !== callback);

      if (filtered.length === 0) {
        this.listeners.delete(eventName);
      } else {
        this.listeners.set(eventName, filtered);
      }
    }
  }

  /**
   * Emit an event
   * @param {string} eventName - Event name
   * @param {*} data - Event data
   * @returns {boolean} Whether any listeners were called
   */
  emit(eventName, data = null) {
    const event = {
      name: eventName,
      data,
      timestamp: Date.now(),
      propagationStopped: false
    };

    // Store in history
    this._addToHistory(event);

    let called = false;

    // Get exact match listeners
    if (this.listeners.has(eventName)) {
      called = this._callListeners(eventName, event) || called;
    }

    // Get wildcard listeners
    this._getWildcardListeners(eventName).forEach(wildcardEvent => {
      called = this._callListeners(wildcardEvent, event) || called;
    });

    return called;
  }

  /**
   * Call listeners for an event
   * @private
   */
  _callListeners(eventName, event) {
    const listeners = this.listeners.get(eventName) || [];
    let called = false;

    // Create a copy to handle once() subscriptions
    const listenersCopy = [...listeners];

    for (const subscription of listenersCopy) {
      if (event.propagationStopped) {
        break;
      }

      try {
        const context = subscription.context || null;
        subscription.callback.call(context, event);
        called = true;

        // Remove if once subscription
        if (subscription.once) {
          this.off(eventName, subscription.callback);
        }
      } catch (error) {
        console.error(`Error in event listener for ${eventName}:`, error);
      }
    }

    return called;
  }

  /**
   * Get wildcard event names that match
   * @private
   */
  _getWildcardListeners(eventName) {
    const matches = [];

    for (const [listenerName] of this.listeners) {
      if (listenerName.includes('*')) {
        const regex = new RegExp('^' + listenerName.replace(/\*/g, '.*') + '$');
        if (regex.test(eventName)) {
          matches.push(listenerName);
        }
      }
    }

    return matches;
  }

  /**
   * Add event to history
   * @private
   */
  _addToHistory(event) {
    this.eventHistory.push(event);

    // Trim history if too large
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * Get event history
   * @param {string} [eventName] - Filter by event name
   * @param {number} [limit] - Limit number of results
   * @returns {Array} Event history
   */
  getHistory(eventName = null, limit = null) {
    let history = this.eventHistory;

    if (eventName) {
      history = history.filter(e => e.name === eventName);
    }

    if (limit) {
      history = history.slice(-limit);
    }

    return history;
  }

  /**
   * Clear all listeners
   */
  clear() {
    this.listeners.clear();
  }

  /**
   * Get listener count for an event
   * @param {string} [eventName] - Event name (optional)
   * @returns {number} Listener count
   */
  listenerCount(eventName = null) {
    if (eventName) {
      return (this.listeners.get(eventName) || []).length;
    }

    let total = 0;
    for (const listeners of this.listeners.values()) {
      total += listeners.length;
    }
    return total;
  }

  /**
   * Get all event names
   * @returns {Array<string>} Event names
   */
  eventNames() {
    return Array.from(this.listeners.keys());
  }
}

// Export singleton instance
window.eventBus = new EventBus();
export default window.eventBus;

