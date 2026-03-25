/**
 * Content Gate
 * - Partial gate: hero + overview visible, detailed sections locked
 * - Email required to unlock full content
 * - Submits to Supabase `email_captures` table
 * - Unlocks permanently via localStorage
 * - Duplicate emails handled gracefully (just unlocks)
 * - Also disables nav links to gated sections when locked
 */
(function () {
  'use strict';

  // ── Supabase config ──
  const SUPABASE_URL = 'https://dlhegdwfioyhsmlkeolb.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsaGVnZHdmaW95aHNtbGtlb2xiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MjI3MDEsImV4cCI6MjA4ODk5ODcwMX0.V11lgE78svJsMpCStEEV0ogiwL2dkzAtf9HYSqZ0hxI';

  const STORAGE_KEY = 'gk_email_captured';

  // ── DOM refs ──
  const preview = document.getElementById('gate-preview');
  const gatedContent = document.getElementById('gated-content');
  const form = document.getElementById('gate-form');
  const emailInput = document.getElementById('gate-email');
  const submitBtn = document.getElementById('gate-submit');
  const btnText = submitBtn ? submitBtn.querySelector('.gate-btn__text') : null;
  const btnLoading = submitBtn ? submitBtn.querySelector('.gate-btn__loading') : null;
  const successEl = document.getElementById('gate-success');

  // Gated section IDs — these nav links get disabled when locked
  const gatedSections = [
    'certification-process', 'structure', 'changes',
    'stricter-standards', 'status-changes', 'actions'
  ];

  if (!preview || !gatedContent || !form) return;

  // ── Check if already unlocked ──
  if (localStorage.getItem(STORAGE_KEY)) {
    unlockContent(false); // no animation
    return;
  }

  // Disable nav links to gated sections
  disableGatedNavLinks();

  /**
   * Unlock the content — show gated sections, hide gate
   */
  function unlockContent(animate) {
    preview.hidden = true;
    preview.setAttribute('aria-hidden', 'true');

    gatedContent.style.display = '';
    if (animate) {
      gatedContent.style.animation = 'gateReveal 0.6s ease-out';
    } else {
      gatedContent.style.animation = 'none';
    }

    // Re-enable nav links
    enableGatedNavLinks();

    // Re-trigger reveal animations for newly visible content
    if (typeof IntersectionObserver !== 'undefined') {
      setTimeout(function () {
        var reveals = gatedContent.querySelectorAll('.reveal');
        reveals.forEach(function (el) {
          el.classList.remove('reveal--visible');
        });
        // The main app.js observer should pick these up on next intersection
      }, 100);
    }
  }

  /**
   * Disable nav links pointing to gated sections
   */
  function disableGatedNavLinks() {
    gatedSections.forEach(function (id) {
      var links = document.querySelectorAll('a[href="#' + id + '"]');
      links.forEach(function (link) {
        link.dataset.originalHref = link.getAttribute('href');
        link.removeAttribute('href');
        link.style.opacity = '0.4';
        link.style.cursor = 'default';
        link.style.pointerEvents = 'none';
        link.setAttribute('aria-disabled', 'true');
        link.title = 'Unlock with your email to access this section';
      });
    });
  }

  /**
   * Re-enable nav links
   */
  function enableGatedNavLinks() {
    gatedSections.forEach(function (id) {
      var links = document.querySelectorAll('[data-original-href="#' + id + '"]');
      links.forEach(function (link) {
        link.setAttribute('href', link.dataset.originalHref);
        link.style.opacity = '';
        link.style.cursor = '';
        link.style.pointerEvents = '';
        link.removeAttribute('aria-disabled');
        link.title = '';
      });
    });
  }

  // ── Form submission ──
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var email = emailInput.value.trim();
    if (!email) return;

    submitBtn.disabled = true;
    if (btnText) btnText.hidden = true;
    if (btnLoading) btnLoading.hidden = false;

    try {
      if (SUPABASE_URL !== '__SUPABASE_URL__' && SUPABASE_ANON_KEY !== '__SUPABASE_ANON_KEY__') {
        var response = await fetch(SUPABASE_URL + '/rest/v1/email_captures', {
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

        // 409 = duplicate email (unique constraint) — that's fine, just unlock
        if (response.status === 409 || response.status === 201) {
          // Success or already exists — both unlock
        }
      }
    } catch (err) {
      // Silently handle — still unlock the content
      console.warn('Email capture: Supabase unavailable', err);
    }

    // Store email and show success
    localStorage.setItem(STORAGE_KEY, email);

    // Show success message briefly
    form.hidden = true;
    successEl.hidden = false;

    // Fire GA event
    if (typeof gtag === 'function') {
      gtag('event', 'email_capture', {
        event_category: 'engagement',
        event_label: 'content_gate'
      });
    }

    // Unlock after a brief moment
    setTimeout(function () {
      unlockContent(true);

      // Smooth scroll to the first gated section
      setTimeout(function () {
        var firstSection = document.getElementById('certification-process');
        if (firstSection) {
          firstSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }, 1200);
  });

})();
