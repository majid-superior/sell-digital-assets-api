import type { SystemStatus } from "./status.service.js";
import { company } from "../data/company.js";
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
  <meta name="description" content="${escapeHtml(company.description)}" />
  <title>System Status | ${escapeHtml(company.title)}</title>
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
