import { escapeHtml } from "./page.utils.js";
import { company } from "../data/company.js";
import { renderHeader } from "./components/header.component.js";
import { renderFooter } from "./components/footer.component.js";

export function renderErrorPage(urlPath: string): string {
  const safePath = escapeHtml(urlPath);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>404 - Page Not Available | ${escapeHtml(company.title)}</title>
  <link rel="icon" type="${escapeHtml(company.favicon.type)}" href="${escapeHtml(company.favicon.url)}" />

  <!-- Prevent Theme Flashing (Zero-FOUC Head Script) -->
  <script>
    (function() {
      try {
        var stored = localStorage.getItem('theme');
        var isDark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (isDark) {
          document.documentElement.classList.add('dark');
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.setAttribute('data-theme', 'light');
        }
      } catch (e) {}
    })();
  </script>

  <!-- Google Fonts: Plus Jakarta Sans & JetBrains Mono -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">

  <!-- Unified Master Stylesheet -->
  <link rel="stylesheet" href="/css/style.css">
  <script src="/js/theme.js" defer></script>
</head>
<body>
  <main class="container">
    ${renderHeader()}

    <div class="error-wrapper">
      <section class="error-card">
        <!-- Lucide ServerCrash / AlertTriangle Icon -->
        <div class="error-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>

        <span class="badge badge-error">404 Error &bull; Route Not Found</span>

        <h2 class="error-heading">Page Not Available</h2>

        <p class="description">
          The requested route is not registered on this API server or is blocked from direct browser access:
        </p>

        <div class="url-chip">${safePath}</div>

        <p class="description">
          Only the System Status dashboard is accessible via browser navigation.
        </p>

        <div class="nav-actions">
          <a href="/" class="btn btn-primary">
            <!-- Lucide Home -->
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Status Dashboard
          </a>
        </div>

        <div class="notice">
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <span>${escapeHtml(company.name)} &bull; All REST endpoints require client API requests and return JSON payloads.</span>
          </div>
          <div style="font-size: 0.75rem; color: var(--color-on-surface-variant); opacity: 0.85; margin-top: 4px;">
            Support: <a href="mailto:${escapeHtml(company.contact.email)}" style="color: var(--color-primary);">${escapeHtml(company.contact.email)}</a> &bull; ${escapeHtml(company.contact.phone)}
          </div>
        </div>
      </section>
    </div>

    ${renderFooter(new Date().toISOString())}
  </main>
</body>
</html>`;
}
