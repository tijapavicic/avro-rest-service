/**
 * Simple View Router
 * Handles navigation between Dashboard, Analytics, and Settings
 */

class ViewRouter {
  constructor() {
    this.currentView = 'dashboard';
    this.views = new Map();
    this.navButtons = new Map();
  }

  /**
   * Register a view
   */
  registerView(name, element) {
    this.views.set(name, element);
  }

  /**
   * Register navigation button
   */
  registerNavButton(name, button) {
    this.navButtons.set(name, button);
    button.addEventListener('click', () => this.navigateTo(name));
  }

  /**
   * Navigate to a view
   */
  navigateTo(viewName) {
    if (!this.views.has(viewName)) {
      console.error(`View "${viewName}" not found`);
      return;
    }

    // Hide all views
    this.views.forEach((view, name) => {
      view.style.display = 'none';
    });

    // Show selected view
    this.views.get(viewName).style.display = 'block';

    // Update navigation buttons
    this.navButtons.forEach((button, name) => {
      if (name === viewName) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });

    this.currentView = viewName;

    // Trigger view-specific initialization
    this.initializeView(viewName);

    // Update URL hash
    window.location.hash = viewName;
  }

  /**
   * Initialize view-specific logic
   */
  initializeView(viewName) {
    switch (viewName) {
      case 'analytics':
        if (window.analyticsManager) {
          window.analyticsManager.refresh();
        }
        break;
      case 'settings':
        if (window.settingsManager) {
          window.settingsManager.loadSettings();
        }
        break;
    }
  }

  /**
   * Initialize from URL hash
   */
  initFromHash() {
    const hash = window.location.hash.substring(1);
    if (hash && this.views.has(hash)) {
      this.navigateTo(hash);
    } else {
      this.navigateTo('dashboard');
    }
  }
}

// Export as global
window.ViewRouter = ViewRouter;

