/**
 * AssetDrop / Sell Digital Assets - Client Theme Switcher
 * Handles local storage persistence, HTML root attribute sync, and Dark Mode default fallback.
 */
(function() {
  const THEME_STORAGE_KEY = 'theme';
  const DEFAULT_THEME = 'dark';

  function getSavedTheme() {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') return stored;
    } catch (e) {}
    return DEFAULT_THEME;
  }

  function applyTheme(theme, persist = true) {
    const resolvedTheme = theme === 'light' || theme === 'dark' ? theme : DEFAULT_THEME;
    const isDark = resolvedTheme === 'dark';
    const root = document.documentElement;

    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }

    if (persist) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, resolvedTheme);
      } catch (e) {}
    }

    // Update aria-label and titles on toggle buttons
    const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
    toggleBtns.forEach(btn => {
      btn.setAttribute('aria-label', isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme');
      btn.setAttribute('title', isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme');
    });
  }

  function toggleTheme() {
    const currentAttr = document.documentElement.getAttribute('data-theme');
    const current = currentAttr === 'dark' || currentAttr === 'light' ? currentAttr : getSavedTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next, true);
  }

  // Sync across tabs if theme preference changes or is cleared in localStorage
  window.addEventListener('storage', function(e) {
    if (e.key && e.key !== THEME_STORAGE_KEY) return;
    applyTheme(getSavedTheme(), false);
  });

  // Bind click handlers and sync initial state when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    applyTheme(getSavedTheme(), false);
    const buttons = document.querySelectorAll('.theme-toggle-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', toggleTheme);
    });
  });

  // Expose toggle function globally
  window.toggleTheme = toggleTheme;
  window.applyTheme = applyTheme;
})();
