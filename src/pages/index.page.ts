import type { SystemStatus } from "./status.service.js";
import { organization } from "../data/organizations.js";
import { escapeHtml } from "./page.utils.js";
import { renderHeader } from "./components/header.component.js";
import { renderServerCard } from "./components/server-card.component.js";
import { renderDatabaseCard } from "./components/database-card.component.js";
import { renderActionsBar } from "./components/actions.component.js";
import { renderFooter } from "./components/footer.component.js";

export function renderIndexPage(data: SystemStatus): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="${escapeHtml(organization.description)}" />
  <title>${escapeHtml(organization.title)} | API</title>
  <link rel="icon" type="${escapeHtml(organization.favicon.type)}" href="${escapeHtml(organization.favicon.url)}" />

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

  <!-- Theme Styles & Self-Hosted Fonts (/theme) -->
  <link rel="stylesheet" href="/theme/fonts.css">
  <link rel="stylesheet" href="/theme/theme.css">
  <link rel="stylesheet" href="/css/style.css">
  <script src="/js/theme.js" defer></script>
</head>
<body>
  <main class="container">
    ${renderHeader(data)}

    <!-- Status Cards Grid -->
    <div class="status-grid">
      ${renderServerCard(data.server)}
      ${renderDatabaseCard(data.database)}
    </div>

    <!-- Quick Navigation & Actions Bar -->
    ${renderActionsBar(data.server.port)}

    <!-- Footer -->
    ${renderFooter(data.server.timestamp)}
  </main>
</body>
</html>`;
}
