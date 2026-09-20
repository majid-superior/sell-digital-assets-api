/**
 * AssetDrop / Sell Digital Assets - Client Theme Switcher
 * Handles local storage persistence, HTML root attribute sync, and OS preference matching.
 */
(function() {
  const THEME_STORAGE_KEY = 'theme';

  function getSavedTheme() {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') return stored;
    } catch (e) {}
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    const root = document.documentElement;

    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {}

    // Update aria-label and titles on toggle buttons
    const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
    toggleBtns.forEach(btn => {
      btn.setAttribute('aria-label', isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme');
      btn.setAttribute('title', isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme');
    });
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || getSavedTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  }

  // Listen for system theme changes if user has not explicitly set preference
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', function(e) {
        try {
          if (!localStorage.getItem(THEME_STORAGE_KEY)) {
            applyTheme(e.matches ? 'dark' : 'light');
          }
        } catch (err) {}
      });
    }
  }

  // Bind click handlers when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('.theme-toggle-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', toggleTheme);
    });
  });

  // Expose toggle function globally
  window.toggleTheme = toggleTheme;
  window.applyTheme = applyTheme;
})();
