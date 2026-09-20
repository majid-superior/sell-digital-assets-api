/**
 * Sell Digital Assets - Swagger UI Layout & Brand Injector
 * Integrates application Header, Swagger UI centered in layout container, and Footer.
 * Supports synchronized Light & Dark themes with the application theme switcher.
 */
(function () {
  // 1. Immediately apply saved theme to avoid FOUC
  try {
    var storedTheme = localStorage.getItem('theme');
    var isDark = storedTheme === 'dark' || (!storedTheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } catch (e) {}

  function initLayout() {
    const swaggerUiDiv = document.getElementById('swagger-ui');
    if (!swaggerUiDiv) return false;
    if (document.querySelector('.swagger-main-layout')) return true;

    // Create wrapper main container
    const container = document.createElement('main');
    container.className = 'container swagger-main-layout';

    // Build Header matching application design system
    const header = document.createElement('header');
    header.className = 'header';
    header.innerHTML = `
      <a href="/" class="brand-wrap" title="Sell Digital Assets API Dashboard">
        <div class="brand-icon">
          <img src="/logo.png" alt="Sell Digital Assets Logo" width="48" height="48" />
        </div>
        <div class="brand-info">
          <h1>Sell Digital Assets API</h1>
          <p>System Status & Observability Dashboard</p>
        </div>
      </a>

      <div class="header-actions">
        <div class="badge badge-secondary" id="swagger-status-badge">
          <span class="beacon online"></span>
          <span id="swagger-status-text">All Systems Operational</span>
        </div>

        <!-- Navigate to Status Dashboard -->
        <a href="/" class="btn btn-secondary" title="View System Status Dashboard">
          <!-- Lucide Activity / Pulse -->
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
          </svg>
          <span>Status Dashboard</span>
        </a>

        <!-- Light/Dark Mode Switcher Matching App Icon Style -->
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
    `;

    // Build Footer matching application design system
    const footer = document.createElement('footer');
    footer.className = 'footer';
    const currentTime = new Date().toLocaleTimeString();
    footer.innerHTML = `
      <div>Checked: <span id="swagger-checked-time" style="font-family: var(--font-mono); font-weight: 500;">${currentTime}</span></div>
      <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
        <span>Sell Digital Assets • Digital Assets Marketplace</span>
      </div>
    `;

    // Restructure DOM: Insert container before swaggerUiDiv, move swaggerUiDiv inside between header and footer
    swaggerUiDiv.parentNode.insertBefore(container, swaggerUiDiv);
    container.appendChild(header);
    container.appendChild(swaggerUiDiv);
    container.appendChild(footer);

    // Bind Theme Toggle button to global theme switcher
    const toggleBtn = header.querySelector('#theme-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        if (typeof window.toggleTheme === 'function') {
          window.toggleTheme();
        } else {
          const isDarkNow = document.documentElement.classList.contains('dark') || document.documentElement.getAttribute('data-theme') === 'dark';
          const next = isDarkNow ? 'light' : 'dark';
          if (next === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.setAttribute('data-theme', 'dark');
          } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.setAttribute('data-theme', 'light');
          }
          try { localStorage.setItem('theme', next); } catch (err) {}
        }
      });
    }

    // Check live API health to update status badge
    fetch('/api/health')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        const isOk = data.status === 'ok' || data.success === true || (data.data && data.data.overallStatus === 'operational');
        const badge = document.getElementById('swagger-status-badge');
        const text = document.getElementById('swagger-status-text');
        const beacon = badge ? badge.querySelector('.beacon') : null;
        if (badge && text && beacon) {
          if (isOk) {
            badge.className = 'badge badge-secondary';
            beacon.className = 'beacon online';
            text.textContent = 'All Systems Operational';
          } else {
            badge.className = 'badge badge-error';
            beacon.className = 'beacon offline';
            text.textContent = 'System Degraded';
          }
        }
      })
      .catch(function () {});

    return true;
  }

  // Attempt layout initialization on load / intervals
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLayout);
  } else {
    initLayout();
  }

  const interval = setInterval(function () {
    if (initLayout()) {
      clearInterval(interval);
    }
  }, 50);

  setTimeout(function () { clearInterval(interval); }, 10000);
})();
