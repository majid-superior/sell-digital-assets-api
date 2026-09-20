import type { SystemStatus } from "../status.service.js";
import { escapeHtml, formatDatabaseName } from "../page.utils.js";

export function renderDatabaseCard(database: SystemStatus["database"]): string {
  const isDbConnected = database.connected;
  const dbStatusText = isDbConnected ? "Connected" : "Disconnected";
  const dbBadgeClass = isDbConnected ? "badge-secondary" : "badge-error";

  return `
      <section class="card">
        <div class="card-header">
          <div class="card-title-wrap">
            <div class="card-icon" aria-hidden="true">
              <!-- Lucide Database -->
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"></path>
              </svg>
            </div>
            <h2 class="card-title">PostgreSQL Database</h2>
          </div>
          <span class="badge ${dbBadgeClass}">
            <span class="beacon ${isDbConnected ? 'online' : 'offline'}"></span>
            <span>${dbStatusText}</span>
          </span>
        </div>

        <div class="metrics-list">
          <div class="metric-row">
            <span class="metric-label">Connection</span>
            <span class="metric-value" style="color: ${isDbConnected ? 'var(--color-secondary)' : 'var(--color-error)'}">
              ${isDbConnected ? 'Active Connection' : 'Disconnected'}
            </span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Database Name</span>
            <span class="metric-value">${escapeHtml(formatDatabaseName(database.database))}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Round-Trip Latency</span>
            <span class="metric-value">${database.latencyMs !== undefined ? `${database.latencyMs} ms` : "N/A"}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Engine Version</span>
            <span class="metric-value">${escapeHtml(database.version || "PostgreSQL")}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Connection Pool</span>
            <span class="metric-value">${database.pool.total} Total (${database.pool.idle} Idle, ${database.pool.waiting} Waiting)</span>
          </div>
        </div>

        ${!isDbConnected && database.error
      ? `<div class="error-box">
                <strong>Connection Error:</strong>
                <span>${escapeHtml(database.error)}</span>
              </div>`
      : ""
    }
      </section>`;
}
