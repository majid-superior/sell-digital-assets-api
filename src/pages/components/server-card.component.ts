import type { SystemStatus } from "../status.service.js";
import { escapeHtml, capitalizeFirstLetter } from "../page.utils.js";

export function renderServerCard(server: SystemStatus["server"]): string {
  return `
      <section class="card">
        <div class="card-header">
          <div class="card-title-wrap">
            <div class="card-icon" aria-hidden="true">
              <!-- Lucide Server -->
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="20" height="8" x="2" y="2" rx="2" ry="2"></rect>
                <rect width="20" height="8" x="2" y="14" rx="2" ry="2"></rect>
                <line x1="6" x2="6.01" y1="6" y2="6"></line>
                <line x1="6" x2="6.01" y1="18" y2="18"></line>
              </svg>
            </div>
            <h2 class="card-title">API Server</h2>
          </div>
          <span class="badge badge-secondary">
            <span class="beacon online"></span>
            <span>Online</span>
          </span>
        </div>

        <div class="metrics-list">
          <div class="metric-row">
            <span class="metric-label">Uptime</span>
            <span class="metric-value">${escapeHtml(server.uptimeFormatted)}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Environment</span>
            <span class="metric-value">${escapeHtml(capitalizeFirstLetter(server.environment))}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Node.js Engine</span>
            <span class="metric-value">${escapeHtml(server.nodeVersion)}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Port &amp; PID</span>
            <span class="metric-value">:${escapeHtml(server.port)} (PID ${escapeHtml(server.pid)})</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Heap Memory</span>
            <span class="metric-value">${escapeHtml(server.memoryUsageMb.heapUsed)} MB / ${escapeHtml(server.memoryUsageMb.heapTotal)} MB</span>
          </div>
        </div>
      </section>`;
}
