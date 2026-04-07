/**
 * Analytics Service - Enterprise-grade analytics with advanced features
 *
 * Implements:
 * - Data aggregation and statistical analysis
 * - Time-series data management
 * - Efficient chart rendering with debouncing
 * - Data validation and sanitization
 * - Performance optimization with caching
 * - Memory-efficient data structures
 *
 * @class AnalyticsService
 */

import storageService from '../services/storage-service.js';
import eventBus from '../services/event-bus.js';

class AnalyticsService {
  static STORAGE_KEY = 'sim-analytics-data';
  static MAX_RECENT_JOBS = 50; // Increased from 10
  static RETENTION_DAYS = 30;

  constructor() {
    this.data = this._loadData();
    this.charts = new Map();
    this._chartRenderDebounced = this._debounce(this._renderChartsInternal.bind(this), 250);
    this._initializeEventListeners();
  }

  /**
   * Initialize event listeners
   * @private
   */
  _initializeEventListeners() {
    eventBus.on('simulation:submitted', (event) => {
      const { jobData, responseTime, success } = event.data;
      this.recordSubmission(jobData, responseTime, success);
    });

    eventBus.on('analytics:refresh', () => {
      this.refresh();
    });

    eventBus.on('analytics:clear', () => {
      this.clearData();
    });
  }

  /**
   * Load analytics data with validation
   * @private
   * @returns {Object} Analytics data
   */
  _loadData() {
    const defaultData = this._getDefaultData();
    const stored = storageService.get(AnalyticsService.STORAGE_KEY, defaultData);

    // Validate and sanitize
    return this._validateData(stored) ? stored : defaultData;
  }

  /**
   * Get default data structure
   * @private
   * @returns {Object}
   */
  _getDefaultData() {
    return {
      totalSubmissions: 0,
      successfulSubmissions: 0,
      failedSubmissions: 0,
      averageResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      recentJobs: [],
      statusDistribution: {
        SUBMITTED: 0,
        PROCESSING: 0,
        COMPLETED: 0,
        FAILED: 0
      },
      hourlyActivity: new Array(24).fill(0),
      dailyActivity: new Array(7).fill(0), // Last 7 days
      lastUpdated: new Date().toISOString(),
      metadata: {
        version: '2.0.0',
        createdAt: new Date().toISOString()
      }
    };
  }

  /**
   * Validate data structure
   * @private
   * @param {Object} data - Data to validate
   * @returns {boolean} Is valid
   */
  _validateData(data) {
    if (!data || typeof data !== 'object') return false;

    const required = [
      'totalSubmissions',
      'successfulSubmissions',
      'failedSubmissions',
      'recentJobs',
      'statusDistribution',
      'hourlyActivity'
    ];

    return required.every(key => key in data);
  }

  /**
   * Save analytics data
   * @private
   */
  _saveData() {
    this.data.lastUpdated = new Date().toISOString();
    const success = storageService.set(AnalyticsService.STORAGE_KEY, this.data);

    if (!success) {
      console.error('Failed to save analytics data');
      eventBus.emit('analytics:save:failed', { data: this.data });
    }

    return success;
  }

  /**
   * Record a simulation submission
   * @param {Object} jobData - Job data
   * @param {number} responseTime - Response time in ms
   * @param {boolean} success - Success status
   */
  recordSubmission(jobData, responseTime, success = true) {
    try {
      // Input validation
      if (!jobData || typeof jobData !== 'object') {
        throw new Error('Invalid job data');
      }

      if (typeof responseTime !== 'number' || responseTime < 0) {
        throw new Error('Invalid response time');
      }

      // Update counters
      this.data.totalSubmissions++;

      if (success) {
        this.data.successfulSubmissions++;
        const status = this._sanitizeStatus(jobData.status || 'SUBMITTED');
        this.data.statusDistribution[status] =
          (this.data.statusDistribution[status] || 0) + 1;
      } else {
        this.data.failedSubmissions++;
        this.data.statusDistribution.FAILED++;
      }

      // Update response time statistics
      this._updateResponseTimeStats(responseTime);

      // Update activity tracking
      this._updateActivityTracking();

      // Add to recent jobs with sanitization
      this._addRecentJob({
        jobId: this._sanitizeString(jobData.jobId || 'N/A'),
        status: this._sanitizeStatus(jobData.status || (success ? 'SUBMITTED' : 'FAILED')),
        timestamp: new Date().toISOString(),
        responseTime: Math.round(responseTime),
        systemId: this._sanitizeString(jobData.systemId || 'Unknown')
      });

      // Clean old data
      this._cleanOldData();

      // Save and emit event
      this._saveData();
      eventBus.emit('analytics:updated', { stats: this.getStats() });

    } catch (error) {
      console.error('Error recording submission:', error);
      eventBus.emit('analytics:error', { error });
    }
  }

  /**
   * Update response time statistics
   * @private
   */
  _updateResponseTimeStats(responseTime) {
    // Update average using online algorithm (more numerically stable)
    const n = this.data.totalSubmissions;
    const oldAvg = this.data.averageResponseTime;
    this.data.averageResponseTime = oldAvg + (responseTime - oldAvg) / n;

    // Update min/max
    this.data.minResponseTime = Math.min(this.data.minResponseTime, responseTime);
    this.data.maxResponseTime = Math.max(this.data.maxResponseTime, responseTime);
  }

  /**
   * Update activity tracking
   * @private
   */
  _updateActivityTracking() {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    this.data.hourlyActivity[hour]++;
    this.data.dailyActivity[dayOfWeek]++;
  }

  /**
   * Add job to recent jobs
   * @private
   */
  _addRecentJob(job) {
    this.data.recentJobs.unshift(job);

    // Keep only recent jobs
    if (this.data.recentJobs.length > AnalyticsService.MAX_RECENT_JOBS) {
      this.data.recentJobs = this.data.recentJobs.slice(0, AnalyticsService.MAX_RECENT_JOBS);
    }
  }

  /**
   * Clean old data based on retention policy
   * @private
   */
  _cleanOldData() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - AnalyticsService.RETENTION_DAYS);
    const cutoffTime = cutoffDate.toISOString();

    this.data.recentJobs = this.data.recentJobs.filter(
      job => job.timestamp >= cutoffTime
    );
  }

  /**
   * Sanitize string input
   * @private
   */
  _sanitizeString(str) {
    if (typeof str !== 'string') return String(str);

    // Remove any HTML tags and limit length
    return str.replace(/<[^>]*>/g, '').substring(0, 200);
  }

  /**
   * Sanitize status value
   * @private
   */
  _sanitizeStatus(status) {
    const validStatuses = ['SUBMITTED', 'PROCESSING', 'COMPLETED', 'FAILED'];
    const normalized = String(status).toUpperCase();
    return validStatuses.includes(normalized) ? normalized : 'SUBMITTED';
  }

  /**
   * Get statistics summary
   * @returns {Object} Statistics
   */
  getStats() {
    const total = this.data.totalSubmissions;
    const successRate = total > 0
      ? ((this.data.successfulSubmissions / total) * 100).toFixed(1)
      : 0;

    return {
      total,
      successful: this.data.successfulSubmissions,
      failed: this.data.failedSubmissions,
      successRate: `${successRate}%`,
      averageResponseTime: `${Math.round(this.data.averageResponseTime)}ms`,
      minResponseTime: this.data.minResponseTime === Infinity
        ? 'N/A'
        : `${this.data.minResponseTime}ms`,
      maxResponseTime: this.data.maxResponseTime === 0
        ? 'N/A'
        : `${this.data.maxResponseTime}ms`,
      lastUpdated: this.data.lastUpdated
    };
  }

  /**
   * Render analytics dashboard
   * @param {string} containerId - Container element ID
   */
  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container ${containerId} not found`);
      return;
    }

    const stats = this.getStats();
    container.innerHTML = this._generateHTML(stats);

    this._attachEventListeners(container);
    this._chartRenderDebounced();
  }

  /**
   * Generate HTML
   * @private
   */
  _generateHTML(stats) {
    return `
      <div class="analytics-header">
        <h2>📊 Analytics Dashboard</h2>
        <button id="refresh-analytics" class="refresh-btn" aria-label="Refresh analytics">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M14 8A6 6 0 1 1 2 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M2 3v5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      ${this._renderStatsCards(stats)}
      ${this._renderCharts()}
      ${this._renderRecentJobs()}

      <div class="analytics-footer">
        <small>Last updated: ${new Date(stats.lastUpdated).toLocaleString()}</small>
      </div>
    `;
  }

  /**
   * Render stats cards
   * @private
   */
  _renderStatsCards(stats) {
    return `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" stroke-width="2"/>
              <path d="M2 17L12 22L22 17M2 12L12 17L22 12" stroke="white" stroke-width="2"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">Total Submissions</div>
            <div class="stat-value">${stats.total}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #10b981 0%, #34d399 100%);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="white" stroke-width="2"/>
              <path d="M8 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">Success Rate</div>
            <div class="stat-value">${stats.successRate}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #fbbf24 0%, #fcd34d 100%);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="white" stroke-width="2"/>
              <path d="M12 6v6l4 2" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">Avg Response Time</div>
            <div class="stat-value">${stats.averageResponseTime}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="white" stroke-width="2"/>
              <path d="M15 9l-6 6M9 9l6 6" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">Failed Submissions</div>
            <div class="stat-value">${stats.failed}</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render charts section
   * @private
   */
  _renderCharts() {
    return `
      <div class="charts-row">
        <div class="chart-card">
          <h3>Status Distribution</h3>
          <canvas id="status-chart"></canvas>
        </div>

        <div class="chart-card">
          <h3>Hourly Activity</h3>
          <canvas id="activity-chart"></canvas>
        </div>
      </div>
    `;
  }

  /**
   * Render recent jobs section
   * @private
   */
  _renderRecentJobs() {
    return `
      <div class="recent-jobs-card">
        <h3>Recent Simulations</h3>
        <div class="jobs-table-container">
          ${this._renderRecentJobsTable()}
        </div>
      </div>
    `;
  }

  /**
   * Render recent jobs table
   * @private
   */
  _renderRecentJobsTable() {
    if (this.data.recentJobs.length === 0) {
      return `
        <div class="empty-state">
          <p>No simulations recorded yet</p>
          <small>Submit a simulation to see analytics</small>
        </div>
      `;
    }

    return `
      <table class="jobs-table">
        <thead>
          <tr>
            <th>Job ID</th>
            <th>Status</th>
            <th>System ID</th>
            <th>Response Time</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          ${this.data.recentJobs.map(job => `
            <tr>
              <td><code>${job.jobId}</code></td>
              <td><span class="status-badge status-${job.status.toLowerCase()}">${job.status}</span></td>
              <td>${job.systemId}</td>
              <td>${job.responseTime}ms</td>
              <td>${new Date(job.timestamp).toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  /**
   * Attach event listeners
   * @private
   */
  _attachEventListeners(container) {
    const refreshBtn = container.querySelector('#refresh-analytics');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refresh());
    }
  }

  /**
   * Debounce function
   * @private
   */
  _debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Render charts with debouncing
   * @private
   */
  _renderChartsInternal() {
    // Use requestAnimationFrame for optimal performance
    requestAnimationFrame(() => {
      this._renderStatusChart();
      this._renderActivityChart();
    });
  }

  /**
   * Render status distribution chart
   * @private
   */
  _renderStatusChart() {
    const canvas = document.getElementById('status-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const data = this.data.statusDistribution;

    canvas.width = canvas.offsetWidth;
    canvas.height = 200;

    const statuses = Object.keys(data);
    const values = Object.values(data);
    const maxValue = Math.max(...values, 1);

    const barWidth = canvas.width / statuses.length;
    const colors = {
      SUBMITTED: '#60a5fa',
      PROCESSING: '#fbbf24',
      COMPLETED: '#10b981',
      FAILED: '#ef4444'
    };

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    statuses.forEach((status, index) => {
      const value = values[index];
      const barHeight = (value / maxValue) * (canvas.height - 40);
      const x = index * barWidth + barWidth * 0.2;
      const y = canvas.height - barHeight - 20;

      ctx.fillStyle = colors[status] || '#60a5fa';
      ctx.fillRect(x, y, barWidth * 0.6, barHeight);

      ctx.fillStyle = '#f1f5f9';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(value, x + barWidth * 0.3, y - 5);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(status, x + barWidth * 0.3, canvas.height - 5);
    });
  }

  /**
   * Render hourly activity chart
   * @private
   */
  _renderActivityChart() {
    const canvas = document.getElementById('activity-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const data = this.data.hourlyActivity;

    canvas.width = canvas.offsetWidth;
    canvas.height = 200;

    const maxValue = Math.max(...data, 1);
    const pointSpacing = canvas.width / (data.length - 1);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (canvas.height - 40) * (i / 4) + 10;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw line
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((value, index) => {
      const x = index * pointSpacing;
      const y = canvas.height - 20 - ((value / maxValue) * (canvas.height - 40));

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw points
    data.forEach((value, index) => {
      const x = index * pointSpacing;
      const y = canvas.height - 20 - ((value / maxValue) * (canvas.height - 40));

      ctx.fillStyle = '#60a5fa';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw current hour indicator
    const currentHour = new Date().getHours();
    const currentX = currentHour * pointSpacing;
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(currentX, 10);
    ctx.lineTo(currentX, canvas.height - 20);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /**
   * Refresh analytics display
   */
  refresh() {
    eventBus.emit('analytics:refreshing');
    this.render('analytics-content');
    eventBus.emit('analytics:refreshed');
  }

  /**
   * Clear all analytics data with confirmation
   * @returns {Promise<boolean>} Success status
   */
  async clearData() {
    return new Promise((resolve) => {
      if (confirm('Are you sure you want to clear all analytics data? This cannot be undone.')) {
        storageService.remove(AnalyticsService.STORAGE_KEY);
        this.data = this._getDefaultData();
        this.refresh();
        eventBus.emit('analytics:cleared');
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }

  /**
   * Export analytics data
   * @param {string} format - Export format ('json' or 'csv')
   * @returns {string} Exported data
   */
  export(format = 'json') {
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(this.data, null, 2);

      case 'csv':
        return this._exportToCSV();

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export to CSV format
   * @private
   */
  _exportToCSV() {
    const headers = ['Job ID', 'Status', 'System ID', 'Response Time (ms)', 'Timestamp'];
    const rows = this.data.recentJobs.map(job => [
      job.jobId,
      job.status,
      job.systemId,
      job.responseTime,
      job.timestamp
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }
}

// Export singleton instance
const analyticsService = new AnalyticsService();
window.analyticsService = analyticsService;
export default analyticsService;

