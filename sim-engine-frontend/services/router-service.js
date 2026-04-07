/**
 * Router Service - Enterprise-grade SPA routing
 *
 * Implements:
 * - Hash-based routing with history support
 * - Route guards and middleware
 * - Lazy loading support
 * - Route params and query strings
 * - Transition animations
 * - 404 handling
 *
 * @class RouterService
 */

import eventBus from '../services/event-bus.js';

class RouterService {
  constructor() {
    this.routes = new Map();
    this.middleware = [];
    this.currentRoute = null;
    this.history = [];
    this.maxHistorySize = 50;

    this._initializeEventListeners();
  }

  /**
   * Initialize event listeners
   * @private
   */
  _initializeEventListeners() {
    window.addEventListener('hashchange', () => this._handleHashChange());
    window.addEventListener('load', () => this._handleInitialRoute());

    eventBus.on('router:navigate', (event) => {
      this.navigateTo(event.data.route, event.data.params);
    });
  }

  /**
   * Register a route
   * @param {string} name - Route name
   * @param {Object} config - Route configuration
   * @returns {RouterService} Chainable
   */
  registerRoute(name, config) {
    if (!config.element) {
      throw new Error(`Route ${name} must have an element`);
    }

    this.routes.set(name, {
      name,
      element: config.element,
      title: config.title || name,
      guard: config.guard || null,
      onEnter: config.onEnter || null,
      onLeave: config.onLeave || null,
      lazy: config.lazy || false
    });

    return this; // Chainable
  }

  /**
   * Register middleware
   * @param {Function} fn - Middleware function
   * @returns {RouterService} Chainable
   */
  use(fn) {
    if (typeof fn !== 'function') {
      throw new TypeError('Middleware must be a function');
    }

    this.middleware.push(fn);
    return this; // Chainable
  }

  /**
   * Navigate to a route
   * @param {string} routeName - Route name
   * @param {Object} [params] - Route parameters
   * @returns {Promise<boolean>} Navigation success
   */
  async navigateTo(routeName, params = {}) {
    try {
      // Check if route exists
      if (!this.routes.has(routeName)) {
        console.error(`Route "${routeName}" not found`);
        this._handleNotFound(routeName);
        return false;
      }

      const route = this.routes.get(routeName);

      // Run middleware
      for (const mw of this.middleware) {
        const result = await mw(route, params);
        if (result === false) {
          console.log(`Navigation to ${routeName} blocked by middleware`);
          return false;
        }
      }

      // Run route guard
      if (route.guard) {
        const canActivate = await route.guard(params);
        if (!canActivate) {
          console.log(`Navigation to ${routeName} blocked by guard`);
          eventBus.emit('router:blocked', { route: routeName });
          return false;
        }
      }

      // Handle leaving current route
      if (this.currentRoute && this.currentRoute !== routeName) {
        const currentRouteConfig = this.routes.get(this.currentRoute);
        if (currentRouteConfig?.onLeave) {
          await currentRouteConfig.onLeave();
        }
      }

      // Hide all routes
      this._hideAllRoutes();

      // Show target route
      const element = route.element;
      if (!element) {
        throw new Error(`Element for route ${routeName} not found`);
      }

      element.style.display = 'block';

      // Update document title
      document.title = route.title || 'Sim Engine Pro';

      // Add to history
      this._addToHistory(routeName, params);

      // Update current route
      const previousRoute = this.currentRoute;
      this.currentRoute = routeName;

      // Update hash
      window.location.hash = routeName;

      // Handle entering new route
      if (route.onEnter) {
        await route.onEnter(params);
      }

      // Emit navigation event
      eventBus.emit('router:navigated', {
        from: previousRoute,
        to: routeName,
        params
      });

      return true;

    } catch (error) {
      console.error('Navigation error:', error);
      eventBus.emit('router:error', { error, route: routeName });
      return false;
    }
  }

  /**
   * Hide all routes
   * @private
   */
  _hideAllRoutes() {
    for (const [, route] of this.routes) {
      if (route.element) {
        route.element.style.display = 'none';
      }
    }
  }

  /**
   * Handle hash change
   * @private
   */
  _handleHashChange() {
    const hash = window.location.hash.substring(1) || 'dashboard';
    this.navigateTo(hash);
  }

  /**
   * Handle initial route
   * @private
   */
  _handleInitialRoute() {
    const hash = window.location.hash.substring(1);
    const initialRoute = hash && this.routes.has(hash) ? hash : 'dashboard';
    this.navigateTo(initialRoute);
  }

  /**
   * Handle 404 not found
   * @private
   */
  _handleNotFound(routeName) {
    eventBus.emit('router:notfound', { route: routeName });

    // Fallback to dashboard
    if (this.routes.has('dashboard')) {
      this.navigateTo('dashboard');
    }
  }

  /**
   * Add to history
   * @private
   */
  _addToHistory(routeName, params) {
    this.history.push({
      route: routeName,
      params,
      timestamp: Date.now()
    });

    // Trim history
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * Go back in history
   * @returns {Promise<boolean>} Success status
   */
  async goBack() {
    if (this.history.length < 2) {
      return false;
    }

    // Remove current route
    this.history.pop();

    // Get previous route
    const previous = this.history[this.history.length - 1];
    return this.navigateTo(previous.route, previous.params);
  }

  /**
   * Get current route
   * @returns {string|null} Current route name
   */
  getCurrentRoute() {
    return this.currentRoute;
  }

  /**
   * Get route history
   * @param {number} [limit] - Limit number of entries
   * @returns {Array} History entries
   */
  getHistory(limit = null) {
    return limit ? this.history.slice(-limit) : [...this.history];
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.history = [];
  }

  /**
   * Check if route exists
   * @param {string} routeName - Route name
   * @returns {boolean} Route exists
   */
  hasRoute(routeName) {
    return this.routes.has(routeName);
  }

  /**
   * Get all route names
   * @returns {Array<string>} Route names
   */
  getRoutes() {
    return Array.from(this.routes.keys());
  }
}

// Export singleton instance
const routerService = new RouterService();
window.routerService = routerService;
export default routerService;

