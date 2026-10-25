export function renderDocModal(): string {
  return `
  <!-- Documentation Access Modal Backdrop -->
  <div id="doc-modal-backdrop" class="modal-backdrop" aria-hidden="true" style="display: none;">
    <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="doc-modal-title">
      <div class="modal-header">
        <div class="modal-title-wrap">
          <div class="modal-icon" aria-hidden="true">
            <!-- Lucide Lock -->
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <div>
            <h2 class="modal-title" id="doc-modal-title">API Documentation Access</h2>
            <span class="badge badge-primary" style="font-size: 11px; padding: 0.15rem 0.5rem; margin-top: 3px;">Admin Password Required</span>
          </div>
        </div>
        <button type="button" class="modal-close-btn" id="doc-modal-close" aria-label="Close dialog">&times;</button>
      </div>

      <form id="doc-modal-form" method="POST" action="/doc/auth">
        <div class="modal-body">
          <p style="font-size: 0.9rem; color: var(--color-on-surface-variant); margin-bottom: 1rem; line-height: 1.5;">
            The interactive OpenAPI / Swagger documentation is password restricted. Enter the platform Administrator password to proceed.
          </p>

          <div id="doc-modal-error" class="doc-auth-error" style="display: none; margin-bottom: 1rem;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span id="doc-modal-error-text">Invalid administrator password. Please try again.</span>
          </div>

          <div class="form-group">
            <label for="doc-modal-password" class="form-label">Administrator Password</label>
            <div class="input-group">
              <input
                type="password"
                id="doc-modal-password"
                name="password"
                class="form-input"
                placeholder="Enter Administrator Password"
                required
                autocomplete="current-password"
              />
              <button type="button" class="password-toggle-btn" id="doc-modal-toggle-pwd" aria-label="Toggle password visibility" title="Show or hide password">
                <svg class="eye-open" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <svg class="eye-closed" style="display: none;" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m9.88 9.88 4.24 4.24"></path>
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
                  <line x1="2" y1="2" x2="22" y2="22"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline" id="doc-modal-cancel">Cancel</button>
          <button type="submit" class="btn btn-primary" id="doc-modal-submit">
            <!-- Lucide Unlock -->
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
            </svg>
            <span>Unlock & Open</span>
          </button>
        </div>
      </form>
    </div>
  </div>

  <script>
    (function() {
      var backdrop = document.getElementById('doc-modal-backdrop');
      var closeBtn = document.getElementById('doc-modal-close');
      var cancelBtn = document.getElementById('doc-modal-cancel');
      var form = document.getElementById('doc-modal-form');
      var pwdInput = document.getElementById('doc-modal-password');
      var toggleBtn = document.getElementById('doc-modal-toggle-pwd');
      var errorBox = document.getElementById('doc-modal-error');
      var errorText = document.getElementById('doc-modal-error-text');
      var submitBtn = document.getElementById('doc-modal-submit');

      function openModal() {
        if (!backdrop) return;
        backdrop.style.display = 'flex';
        backdrop.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        if (errorBox) errorBox.style.display = 'none';
        if (pwdInput) {
          pwdInput.value = '';
          setTimeout(function() { pwdInput.focus(); }, 50);
        }
      }

      function closeModal() {
        if (!backdrop) return;
        backdrop.style.display = 'none';
        backdrop.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }

      // Intercept clicks on links pointing to /doc/ or /doc
      document.addEventListener('click', function(e) {
        var target = e.target;
        while (target && target !== document.body) {
          if (target.tagName === 'A') {
            var href = target.getAttribute('href') || '';
            if (href === '/doc/' || href === '/doc' || href.startsWith('/doc?')) {
              var isUnlocked = document.cookie.indexOf('doc_auth_state=1') !== -1;
              if (!isUnlocked) {
                e.preventDefault();
                openModal();
                return;
              }
            }
          }
          target = target.parentElement;
        }
      });

      if (closeBtn) closeBtn.addEventListener('click', closeModal);
      if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
      if (backdrop) {
        backdrop.addEventListener('click', function(e) {
          if (e.target === backdrop) closeModal();
        });
      }
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && backdrop && backdrop.style.display !== 'none') {
          closeModal();
        }
      });

      // Toggle password visibility
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

      // Handle Modal AJAX Submit
      if (form) {
        form.addEventListener('submit', function(e) {
          e.preventDefault();
          var password = pwdInput ? pwdInput.value : '';
          if (!password) return;

          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Verifying...</span>';
          }
          if (errorBox) errorBox.style.display = 'none';

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
              return { ok: res.ok, data: data };
            });
          })
          .then(function(result) {
            if (result.ok && result.data && result.data.success) {
              window.location.href = '/doc/';
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
                submitBtn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg><span>Unlock & Open</span>';
              }
            }
          })
          .catch(function() {
            form.submit();
          });
        });
      }
    })();
  </script>
`;
}

