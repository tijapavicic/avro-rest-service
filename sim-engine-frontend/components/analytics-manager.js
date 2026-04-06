/**
 * Analytics Manager
 * Manages simulation analytics, statistics, and data visualization
 */

class AnalyticsManager {
  constructor() {
    this.data = this.loadData();
    this.charts = new Map();
  }

  /**
   * Load analytics data from localStorage
   */
  loadData() {
    const stored = localStorage.getItem('sim-analytics-data');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse analytics data:', e);
      }
    }

    // Default data structure
    return {
      totalSubmissions: 0,
      successfulSubmissions: 0,
      failedSubmissions: 0,
      averageResponseTime: 0,
      recentJobs: [],
      statusDistribution: {
        SUBMITTED: 0,
        PROCESSING: 0,
        COMPLETED: 0,
        FAILED: 0
      },
      hourlyActivity: new Array(24).fill(0),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Save analytics data to localStorage
   */
  saveData() {
    this.data.lastUpdated = new Date().toISOString();
    localStorage.setItem('sim-analytics-data', JSON.stringify(this.data));
  }

  /**
   * Record a simulation submission
   */
  recordSubmission(jobData, responseTime, success = true) {
    this.data.totalSubmissions++;

    if (success) {
      this.data.successfulSubmissions++;
      const status = jobData.status || 'SUBMITTED';
      this.data.statusDistribution[status] = (this.data.statusDistribution[status] || 0) + 1;
    } else {
      this.data.failedSubmissions++;
      this.data.statusDistribution.FAILED++;
    }

    // Update average response time
    const currentAvg = this.data.averageResponseTime;
    const totalCount = this.data.totalSubmissions;
    this.data.averageResponseTime = ((currentAvg * (totalCount - 1)) + responseTime) / totalCount;

    // Record hourly activity
    const hour = new Date().getHours();
    this.data.hourlyActivity[hour]++;

    // Add to recent jobs (keep last 10)
    this.data.recentJobs.unshift({
      jobId: jobData.jobId || 'N/A',
      status: jobData.status || (success ? 'SUBMITTED' : 'FAILED'),
      timestamp: new Date().toISOString(),
      responseTime: responseTime,
      systemId: jobData.systemId || 'Unknown'
    });
    this.data.recentJobs = this.data.recentJobs.slice(0, 10);

    this.saveData();
  }

  /**
   * Get statistics summary
   */
  getStats() {
    const total = this.data.totalSubmissions;
    const successRate = total > 0 ? (this.data.successfulSubmissions / total * 100).toFixed(1) : 0;

    return {
      total: total,
      successful: this.data.successfulSubmissions,
      failed: this.data.failedSubmissions,
      successRate: successRate + '%',
      averageResponseTime: this.data.averageResponseTime.toFixed(0) + 'ms',
      lastUpdated: this.data.lastUpdated
    };
  }

  /**
   * Render analytics dashboard
   */
  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const stats = this.getStats();

    container.innerHTML = `
      <div class="analytics-header">
        <h2>📊 Analytics Dashboard</h2>
        <button id="refresh-analytics" class="refresh-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M14 8A6 6 0 1 1 2 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M2 3v5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Refresh
        </button>
      </div>

      <!-- Stats Cards -->
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

      <!-- Charts Row -->
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

      <!-- Recent Jobs Table -->
      <div class="recent-jobs-card">
        <h3>Recent Simulations</h3>
        <div class="jobs-table-container">
          ${this.renderRecentJobsTable()}
        </div>
      </div>

      <!-- Last Updated -->
      <div class="analytics-footer">
        <small>Last updated: ${new Date(stats.lastUpdated).toLocaleString()}</small>
      </div>
    `;

    // Attach refresh button listener
    document.getElementById('refresh-analytics')?.addEventListener('click', () => {
      this.refresh();
    });

    // Render charts
    this.renderCharts();
  }

  /**
   * Render recent jobs table
   */
  renderRecentJobsTable() {
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
   * Render charts
   */
  renderCharts() {
    this.renderStatusChart();
    this.renderActivityChart();
  }

  /**
   * Render status distribution chart (simple bar chart)
   */
  renderStatusChart() {
    const canvas = document.getElementById('status-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const data = this.data.statusDistribution;

    // Simple bar chart
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

      // Draw bar
      ctx.fillStyle = colors[status] || '#60a5fa';
      ctx.fillRect(x, y, barWidth * 0.6, barHeight);

      // Draw value
      ctx.fillStyle = '#f1f5f9';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(value, x + barWidth * 0.3, y - 5);

      // Draw label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(status, x + barWidth * 0.3, canvas.height - 5);
    });
  }

  /**
   * Render hourly activity chart (line chart)
   */
  renderActivityChart() {
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
    this.render('analytics-content');
  }

  /**
   * Clear all analytics data
   */
  clearData() {
    if (confirm('Are you sure you want to clear all analytics data? This cannot be undone.')) {
      localStorage.removeItem('sim-analytics-data');
      this.data = this.loadData();
      this.refresh();
    }
  }
}

// Export as global
window.AnalyticsManager = AnalyticsManager;

