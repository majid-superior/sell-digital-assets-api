import type { SystemStatus } from "../status.service.js";
import { organization } from "../../data/organizations.js";
import { escapeHtml } from "../page.utils.js";

export function renderHeader(data?: SystemStatus | null): string {
  const isAllGood = data?.overallStatus === "operational";
  const overallBadgeClass = isAllGood ? "badge-secondary" : "badge-error";
  const overallText = isAllGood ? "All Systems Operational" : "System Degraded";

  const badgeHtml = data
    ? `<div class="badge ${overallBadgeClass}">
          <span class="beacon ${isAllGood ? 'online' : 'offline'}"></span>
          <span>${overallText}</span>
        </div>`
    : `<div class="badge badge-error">
          <span class="beacon offline"></span>
          <span>404 Not Found</span>
        </div>`;

  return `
    <header class="header">
      <a href="/" class="brand-wrap" title="${escapeHtml(organization.title)}">
        <div class="brand-icon">
          <img src="${escapeHtml(organization.logo.url)}" alt="${escapeHtml(organization.logo.alt)}" width="${organization.logo.width}" height="${organization.logo.height}" />
        </div>
        <div class="brand-info">
          <h1>Asset<span style="color: var(--color-primary); font-weight: 800;">Drop</span> <span style="font-weight: 500; font-size: 0.9em; opacity: 0.85;">API</span></h1>
          <p>${escapeHtml(organization.tagline)}</p>
        </div>
      </a>

      <div class="header-actions">
        ${badgeHtml}

        <!-- Navigate to Swagger API Docs -->
        <a href="/doc/" class="btn btn-secondary" title="View Swagger API Documentation">
          <!-- Lucide BookOpen -->
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
          <span>API Docs</span>
        </a>

        <!-- Light/Dark Mode Switcher -->
        <button type="button" class="theme-toggle-btn" id="theme-toggle" aria-label="Toggle Theme" title="Toggle Theme">
          <!-- Lucide Sun (Shown in Dark Mode) -->
          <svg class="theme-icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="4"></circle>
            <path d="M12 2v2"></path>
            <path d="M12 20v2"></path>
            <path d="m4.93 4.93 1.41 1.41"></path>
            <path d="m17.66 17.66 1.41 1.41"></path>
            <path d="M2 12h2"></path>
            <path d="M20 12h2"></path>
            <path d="m6.34 17.66-1.41 1.41"></path>
            <path d="m19.07 4.93-1.41 1.41"></path>
          </svg>
          <!-- Lucide Moon (Shown in Light Mode) -->
          <svg class="theme-icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
          </svg>
        </button>
      </div>
    </header>`;
}
