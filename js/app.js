(function () {
  'use strict';

  // ── Tab Navigation ──
  const tabs = document.querySelectorAll('.tab[data-tab]');
  const tabContents = document.querySelectorAll('.tab-content');
  const pageTitle = document.getElementById('page-title');
  const pageSubtitle = document.getElementById('page-subtitle');

  const pageInfo = {
    summary:    { title: 'Overview',       subtitle: 'High-level summary for Board of Directors \u00b7 Click any card or panel to explore details' },
    finance:    { title: 'Finance',        subtitle: 'Budget tracking, revenue sources, reserves, and Neighbours Fund' },
    recreation: { title: 'Recreation',     subtitle: 'Program fill rates, facility utilization, and drop-in activity' },
    services:   { title: 'Services',       subtitle: 'Membership, community engagement, Green Depot, child care, and operations' },
    governance: { title: 'Governance',     subtitle: 'Board attendance, committees, resolutions, and AGM preparation' },
    strategic:  { title: 'Strategic Plan', subtitle: '2024\u20132028 strategic plan progress across all pillars' }
  };

  let animating = false;

  function switchTab(tabName) {
    const info = pageInfo[tabName];
    if (!info) return;

    tabs.forEach(function (t) {
      const isActive = t.getAttribute('data-tab') === tabName;
      t.classList.toggle('active', isActive);
      t.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    tabContents.forEach(function (tc) {
      const isActive = tc.id === 'tab-' + tabName;
      tc.classList.toggle('active', isActive);
      tc.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });

    if (pageTitle) pageTitle.textContent = info.title;
    if (pageSubtitle) pageSubtitle.textContent = info.subtitle;

    window.scrollTo({ top: 0, behavior: 'smooth' });
    animateBars();
  }

  // ── Event delegation for tabs ──
  document.querySelector('.nav-tabs').addEventListener('click', function (e) {
    const tab = e.target.closest('.tab[data-tab]');
    if (tab) switchTab(tab.getAttribute('data-tab'));
  });

  // ── Event delegation for card/panel navigation ──
  document.querySelector('.page').addEventListener('click', function (e) {
    const nav = e.target.closest('[data-navigate]');
    if (nav) switchTab(nav.getAttribute('data-navigate'));
  });

  // ── Keyboard support for tabs ──
  document.querySelector('.nav-tabs').addEventListener('keydown', function (e) {
    const tabArr = Array.from(tabs);
    const current = tabArr.indexOf(e.target);
    if (current === -1) return;

    let next = -1;
    if (e.key === 'ArrowRight') next = (current + 1) % tabArr.length;
    else if (e.key === 'ArrowLeft') next = (current - 1 + tabArr.length) % tabArr.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabArr.length - 1;

    if (next >= 0) {
      e.preventDefault();
      tabArr[next].focus();
      switchTab(tabArr[next].getAttribute('data-tab'));
    }
  });

  // ── Animate progress bars with guard against rapid switching ──
  function animateBars() {
    if (animating) return;
    animating = true;

    const activeTab = document.querySelector('.tab-content.active');
    if (!activeTab) { animating = false; return; }

    activeTab.querySelectorAll('.bar-fill').forEach(function (bar) {
      const w = bar.style.width;
      bar.style.width = '0%';
      // Brief delay lets the browser register 0% before animating to target
      setTimeout(function () { bar.style.width = w; }, 100);
    });

    setTimeout(function () { animating = false; }, 1100);
  }

  // Initial animation on load
  window.addEventListener('load', animateBars);
})();
