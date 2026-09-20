import { escapeHtml } from "../page.utils.js";

export function renderActionsBar(port: number | string): string {
  return `
    <div class="actions-card">
      <div class="quick-links">
        <button type="button" class="btn btn-primary" onclick="window.location.reload()">
          <!-- Lucide RefreshCw -->
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
            <path d="M21 3v5h-5"></path>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
            <path d="M8 16H3v5"></path>
          </svg>
          Refresh Status
        </button>

        <a href="/doc/" class="btn btn-secondary">
          <!-- Lucide BookOpen -->
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
          API Documentation
        </a>
      </div>

      <div style="font-size: 0.85rem; color: var(--color-on-surface-variant);">
        Listening on Port: <strong style="color: var(--color-on-surface); font-family: var(--font-mono);">${escapeHtml(port)}</strong>
      </div>
    </div>`;
}
