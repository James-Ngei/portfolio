(function () {
  'use strict';

  const OFFSET = 20; // adjust for fixed header if needed

  function scrollElementToTop(el, offset = 0) {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const targetY = window.pageYOffset + rect.top - offset;
    window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
  }

  function initProjectTabs(root = document) {
    const tabsEl = root.querySelector('.project-tabs');
    if (!tabsEl) return;

    const buttons = tabsEl.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');

    buttons.forEach(button => {
      if (button.dataset.tabInit) return; // already initialized
      button.dataset.tabInit = '1';

      button.addEventListener('click', function () {
        const target = this.dataset.tab;
        buttons.forEach(b => b.classList.toggle('active', b === this));
        contents.forEach(c => c.classList.toggle('active', c.id === target));
        try { this.focus({ preventScroll: true }); } catch (e) {}
        scrollElementToTop(tabsEl, OFFSET);
      });
    });
  }

  // helper to run init after client-side swap (give the router time to inject content)
  function runInitAfterSwap() {
    // microtask/next-tick to ensure new content is in DOM
    setTimeout(() => initProjectTabs(document), 20);
  }

  // init on first full load
  document.addEventListener('DOMContentLoaded', () => initProjectTabs(document));

  // re-init on common client-side nav events (add Hydejack hy-push-state event)
  [
    'pjax:end', 'pjax:complete',
    'turbolinks:load', 'turbolinks:render',
    'htmx:afterSwap',
    'hy-push-state-after' // listen on document as a backup
  ].forEach(ev => {
    document.addEventListener(ev, runInitAfterSwap);
  });

  // Also listen directly on Hydejack's _pushState element (Hydejack fires here)
  const pushStateEl = document.getElementById('_pushState');
  if (pushStateEl && pushStateEl.addEventListener) {
    pushStateEl.addEventListener('hy-push-state-after', runInitAfterSwap);
  } else {
    // if element is created later, observe and attach when available
    const observer = new MutationObserver(() => {
      const el = document.getElementById('_pushState');
      if (el) {
        el.addEventListener('hy-push-state-after', runInitAfterSwap);
        observer.disconnect();
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  // extra fallbacks
  window.addEventListener('load', () => initProjectTabs(document));
  window.addEventListener('hashchange', () => initProjectTabs(document));
})();