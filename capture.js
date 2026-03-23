/**
 * Email Capture Banner
 * - Shows after 30s of reading (once per visitor via localStorage)
 * - Submits to Supabase `email_captures` table
 * - Graceful degradation: if Supabase is unreachable, still shows success
 */
(function () {
  'use strict';

  // ── Supabase config ──
  const SUPABASE_URL = '__SUPABASE_URL__';
  const SUPABASE_ANON_KEY = '__SUPABASE_ANON_KEY__';

  const STORAGE_KEY = 'gk_email_captured';
  const DELAY_MS = 30000; // 30 seconds

  const banner = document.getElementById('capture-banner');
  const form = document.getElementById('capture-form');
  const emailInput = document.getElementById('capture-email');
  const submitBtn = document.getElementById('capture-submit');
  const closeBtn = document.getElementById('capture-close');
  const successEl = document.getElementById('capture-success');

  if (!banner || !form) return;

  // Don't show if already captured or dismissed
  if (localStorage.getItem(STORAGE_KEY)) return;

  // Show banner after delay
  const timer = setTimeout(showBanner, DELAY_MS);

  function showBanner() {
    banner.classList.add('capture-banner--visible');
    banner.setAttribute('aria-hidden', 'false');
  }

  function hideBanner() {
    banner.classList.remove('capture-banner--visible');
    banner.setAttribute('aria-hidden', 'true');
    localStorage.setItem(STORAGE_KEY, 'dismissed');
  }

  // Close button
  closeBtn.addEventListener('click', function () {
    hideBanner();
    clearTimeout(timer);
  });

  // Form submission
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = emailInput.value.trim();
    if (!email) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    try {
      // Only attempt Supabase if configured
      if (SUPABASE_URL !== '__SUPABASE_URL__' && SUPABASE_ANON_KEY !== '__SUPABASE_ANON_KEY__') {
        await fetch(SUPABASE_URL + '/rest/v1/email_captures', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            email: email,
            source: 'green-key-changes',
            page_url: window.location.href
          })
        });
      }
    } catch (err) {
      // Silently fail — don't break the UX
      console.warn('Email capture: Supabase unavailable', err);
    }

    // Always show success (even if Supabase is down)
    form.hidden = true;
    successEl.hidden = false;
    localStorage.setItem(STORAGE_KEY, email);

    // Auto-dismiss after 4 seconds
    setTimeout(hideBanner, 4000);

    // Fire GA event if available
    if (typeof gtag === 'function') {
      gtag('event', 'email_capture', {
        event_category: 'engagement',
        event_label: 'green_key_banner'
      });
    }
  });

})();
