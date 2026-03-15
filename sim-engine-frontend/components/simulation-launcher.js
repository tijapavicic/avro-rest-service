/**
 * <simulation-launcher> Web Component
 *
 * Attributes:
 *   backend-url  – full URL of POST /api/simulations  (default: http://localhost:8082/api/simulations)
 *   system-id    – systemId sent in the request body  (default: SYS-001)
 *
 * Usage:
 *   <simulation-launcher backend-url="http://localhost:8082/api/simulations"></simulation-launcher>
 */
class SimulationLauncher extends HTMLElement {

  /* ── Lifecycle ──────────────────────────────────────── */

  connectedCallback() {
    this._render();
    this._btn().addEventListener('click', () => this._launch());
  }

  /* ── Private helpers ────────────────────────────────── */

  _backendUrl() {
    return this.getAttribute('backend-url') || 'http://localhost:8082/api/simulations';
  }

  _systemId() {
    return this.getAttribute('system-id') || 'SYS-001';
  }

  _btn()    { return this.shadowRoot.getElementById('launch-btn'); }
  _status() { return this.shadowRoot.getElementById('status'); }
  _result() { return this.shadowRoot.getElementById('result'); }

  /* ── Template ───────────────────────────────────────── */

  _render() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }
        .card {
          background: #1a1d27;
          border: 1px solid #2e3347;
          border-radius: 12px;
          padding: 2rem 2.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          align-items: center;
        }
        button {
          cursor: pointer;
          background: #4f8ef7;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 0.75rem 2.5rem;
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: 0.03em;
          transition: background 0.18s, transform 0.1s;
          min-width: 200px;
        }
        button:hover:not(:disabled) { background: #6aa3ff; transform: translateY(-1px); }
        button:active:not(:disabled){ transform: translateY(0); }
        button:disabled { opacity: 0.55; cursor: not-allowed; }
        #status {
          font-size: 0.85rem;
          color: #94a3b8;
          min-height: 1.2em;
        }
        #result {
          background: #0f1117;
          border: 1px solid #2e3347;
          border-radius: 8px;
          padding: 1rem 1.25rem;
          font-size: 0.82rem;
          font-family: monospace;
          color: #e2e8f0;
          width: 100%;
          white-space: pre-wrap;
          word-break: break-all;
          display: none;
        }
        #result.visible { display: block; }
        .badge {
          display: inline-block;
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.05em;
        }
        .badge-submitted { background: #1e3a5f; color: #4f8ef7; }
        .badge-error     { background: #3b1f1f; color: #f87171; }
      </style>

      <div class="card">
        <button id="launch-btn">🚀 Launch Simulation</button>
        <div id="status"></div>
        <pre id="result"></pre>
      </div>
    `;
  }

  /* ── Core action ────────────────────────────────────── */

  async _launch() {
    const btn    = this._btn();
    const status = this._status();
    const result = this._result();

    btn.disabled   = true;
    result.classList.remove('visible');
    result.textContent = '';
    status.innerHTML   = '<span>Sending request…</span>';

    const payload = {
      systemId:    this._systemId(),
      requestedAt: new Date().toISOString()
    };

    try {
      const res = await fetch(this._backendUrl(), {
        method:  'POST',
        headers: {
          'Content-Type':    'application/json',
          'Accept':          'application/json',
          'X-Correlation-Id': crypto.randomUUID()
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const data = await res.json();

      status.innerHTML = `
        <span class="badge badge-submitted">${data.status}</span>
        &nbsp; Job ID: <strong>${data.jobId}</strong>
      `;
      result.textContent = JSON.stringify(data, null, 2);
      result.classList.add('visible');

    } catch (err) {
      status.innerHTML = `<span class="badge badge-error">ERROR</span> ${err.message}`;

    } finally {
      btn.disabled = false;
    }
  }
}

customElements.define('simulation-launcher', SimulationLauncher);

