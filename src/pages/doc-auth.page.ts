import { escapeHtml } from "./page.utils.js";
import { organization } from "../data/organizations.js";
import { renderHeader } from "./components/header.component.js";
import { renderFooter } from "./components/footer.component.js";

export interface DocAuthPageOptions {
  errorMessage?: string;
  redirectUrl?: string;
}

export function renderDocAuthPage(options?: DocAuthPageOptions): string {
  const errorMessage = options?.errorMessage;
  const redirectUrl = options?.redirectUrl || "/doc/";

  return `<!DOCTYPE html>
<html lang="en" class="dark" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="color-scheme" content="dark light" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Protected API Documentation | ${escapeHtml(organization.title)}</title>
  <link rel="icon" type="${escapeHtml(organization.favicon.type)}" href="${escapeHtml(organization.favicon.url)}" />

  <!-- Prevent Theme Flashing (Zero-FOUC Head Script) -->
  <script>
    (function() {
      try {
        var stored = localStorage.getItem('theme');
        var theme = stored === 'dark' || stored === 'light' ? stored : 'dark';
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.setAttribute('data-theme', 'dark');
          document.documentElement.style.colorScheme = 'dark';
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.setAttribute('data-theme', 'light');
          document.documentElement.style.colorScheme = 'light';
        }
      } catch (e) {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.style.colorScheme = 'dark';
      }
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
    ${renderHeader(null, { showBadge: false })}

    <div class="doc-auth-wrapper">
      <section class="doc-auth-card">
        <!-- Shield Lock Icon -->
        <div class="doc-auth-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>

        <h2 class="doc-auth-heading">API Documentation Access</h2>
        <span class="badge badge-primary">Administrator Authorization Required</span>
        <p class="description">
          The OpenAPI specifications and interactive Swagger explorer are protected. Please enter the Administrator password to unlock documentation.
        </p>

        <!-- Error Notification Container -->
        <div id="doc-page-error" class="doc-auth-error" style="${errorMessage ? "display: flex;" : "display: none;"}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span id="doc-page-error-text">${escapeHtml(errorMessage || "Invalid administrator password. Please try again.")}</span>
        </div>

        <!-- Unlock Form -->
        <form method="POST" action="/doc/auth" class="doc-auth-form" id="doc-page-form">
          <input type="hidden" name="redirect" value="${escapeHtml(redirectUrl)}" />
          
          <div class="form-group">
            <label for="doc-page-password" class="form-label">Administrator Password</label>
            <div class="input-group">
              <input
                type="password"
                id="doc-page-password"
                name="password"
                class="form-input"
                placeholder="Enter Administrator Password"
                required
                autofocus
                autocomplete="current-password"
              />
              <button type="button" class="password-toggle-btn" id="doc-page-toggle-pwd" aria-label="Toggle password visibility" title="Show or hide password">
                <!-- Eye Open -->
                <svg class="eye-open" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <!-- Eye Closed -->
                <svg class="eye-closed" style="display: none;" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m9.88 9.88 4.24 4.24"></path>
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
                  <line x1="2" y1="2" x2="22" y2="22"></line>
                </svg>
              </button>
            </div>
          </div>

          <div class="doc-auth-actions">
            <a href="/" class="btn btn-outline" title="Return to System Status Dashboard">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m15 18-6-6 6-6"></path>
              </svg>
              <span>Dashboard</span>
            </a>
            <button type="submit" class="btn btn-primary" id="doc-page-submit-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
              </svg>
              <span>Unlock Documentation</span>
            </button>
          </div>
        </form>
      </section>
    </div>

    ${renderFooter()}
  </main>

  <script>
    (function() {
      var pwdInput = document.getElementById('doc-page-password');
      var toggleBtn = document.getElementById('doc-page-toggle-pwd');
      var form = document.getElementById('doc-page-form');
      var errorBox = document.getElementById('doc-page-error');
      var errorText = document.getElementById('doc-page-error-text');
      var submitBtn = document.getElementById('doc-page-submit-btn');

      // Toggle Password Visibility
      if (toggleBtn && pwdInput) {
        toggleBtn.addEventListener('click', function() {
          var isPwd = pwdInput.type === 'password';
          pwdInput.type = isPwd ? 'text' : 'password';
          var eyeOpen = toggleBtn.querySelector('.eye-open');
          var eyeClosed = toggleBtn.querySelector('.eye-closed');
          if (eyeOpen && eyeClosed) {
            eyeOpen.style.display = isPwd ? 'none' : 'block';
            eyeClosed.style.display = isPwd ? 'block' : 'none';
          }
          pwdInput.focus();
        });
      }

      // Seamless AJAX Verification with Full Graceful Fallback
      if (form) {
        form.addEventListener('submit', function(e) {
          e.preventDefault();
          var password = pwdInput ? pwdInput.value : '';
          if (!password) return;

          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Verifying...</span>';
          }
          if (errorBox) {
            errorBox.style.display = 'none';
          }

          fetch('/doc/auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ password: password })
          })
          .then(function(res) {
            return res.json().then(function(data) {
              return { ok: res.ok, status: res.status, data: data };
            });
          })
          .then(function(result) {
            if (result.ok && result.data && result.data.success) {
              window.location.href = '${escapeHtml(redirectUrl)}';
            } else {
              var msg = (result.data && result.data.message) || 'Invalid administrator password. Please try again.';
              if (errorBox && errorText) {
                errorText.textContent = msg;
                errorBox.style.display = 'flex';
              }
              if (pwdInput) {
                pwdInput.value = '';
                pwdInput.focus();
              }
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg><span>Unlock Documentation</span>';
              }
            }
          })
          .catch(function() {
            // Fall back to standard form submission if network fetch fails
            form.submit();
          });
        });
      }
    })();
  </script>
</body>
</html>`;
}

