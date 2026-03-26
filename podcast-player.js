/**
 * Custom Podcast Player
 * - Play/pause, progress scrubbing, playback speed
 * - Fires GA events for play, 25%/50%/75%/100% milestones
 */
(function () {
  'use strict';

  var audio = document.getElementById('podcast-audio');
  var playBtn = document.getElementById('podcast-play');
  var playIcon = playBtn ? playBtn.querySelector('.podcast-icon--play') : null;
  var pauseIcon = playBtn ? playBtn.querySelector('.podcast-icon--pause') : null;
  var currentEl = document.getElementById('podcast-current');
  var durationEl = document.getElementById('podcast-duration');
  var progressFill = document.getElementById('podcast-progress-fill');
  var progressHandle = document.getElementById('podcast-progress-handle');
  var progressWrap = document.getElementById('podcast-progress-wrap');
  var speedBtn = document.getElementById('podcast-speed');

  if (!audio || !playBtn) return;

  var speeds = [1, 1.25, 1.5, 1.75, 2];
  var speedIndex = 0;
  var isDragging = false;
  var milestones = { 25: false, 50: false, 75: false, 100: false };

  function formatTime(s) {
    if (isNaN(s) || !isFinite(s)) return '0:00';
    var m = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  // Update duration once metadata loads
  audio.addEventListener('loadedmetadata', function () {
    durationEl.textContent = formatTime(audio.duration);
  });

  // Play / Pause
  playBtn.addEventListener('click', function () {
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  });

  audio.addEventListener('play', function () {
    playIcon.hidden = true;
    pauseIcon.hidden = false;
    playBtn.setAttribute('aria-label', 'Pause podcast');

    // GA event
    if (typeof gtag === 'function') {
      gtag('event', 'podcast_play', {
        event_category: 'engagement',
        event_label: 'green_key_podcast'
      });
    }
  });

  audio.addEventListener('pause', function () {
    playIcon.hidden = false;
    pauseIcon.hidden = true;
    playBtn.setAttribute('aria-label', 'Play podcast');
  });

  // Progress update
  audio.addEventListener('timeupdate', function () {
    if (isDragging) return;
    var pct = (audio.currentTime / audio.duration) * 100 || 0;
    progressFill.style.width = pct + '%';
    progressHandle.style.left = pct + '%';
    currentEl.textContent = formatTime(audio.currentTime);

    // Milestone tracking
    checkMilestones(pct);
  });

  function checkMilestones(pct) {
    [25, 50, 75, 100].forEach(function (m) {
      if (pct >= m && !milestones[m]) {
        milestones[m] = true;
        if (typeof gtag === 'function') {
          gtag('event', 'podcast_milestone', {
            event_category: 'engagement',
            event_label: m + '%',
            value: m
          });
        }
      }
    });
  }

  // Scrubbing
  function seekToPosition(e) {
    var rect = progressWrap.getBoundingClientRect();
    var x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    var pct = x / rect.width;
    audio.currentTime = pct * audio.duration;
    progressFill.style.width = (pct * 100) + '%';
    progressHandle.style.left = (pct * 100) + '%';
    currentEl.textContent = formatTime(audio.currentTime);
  }

  progressWrap.addEventListener('mousedown', function (e) {
    isDragging = true;
    progressWrap.classList.add('dragging');
    seekToPosition(e);
  });

  document.addEventListener('mousemove', function (e) {
    if (isDragging) seekToPosition(e);
  });

  document.addEventListener('mouseup', function () {
    if (isDragging) {
      isDragging = false;
      progressWrap.classList.remove('dragging');
    }
  });

  // Touch support
  progressWrap.addEventListener('touchstart', function (e) {
    isDragging = true;
    progressWrap.classList.add('dragging');
    seekToPosition(e.touches[0]);
  }, { passive: true });

  progressWrap.addEventListener('touchmove', function (e) {
    if (isDragging) seekToPosition(e.touches[0]);
  }, { passive: true });

  progressWrap.addEventListener('touchend', function () {
    isDragging = false;
    progressWrap.classList.remove('dragging');
  });

  // Click to seek
  progressWrap.addEventListener('click', function (e) {
    seekToPosition(e);
  });

  // Speed control
  speedBtn.addEventListener('click', function () {
    speedIndex = (speedIndex + 1) % speeds.length;
    audio.playbackRate = speeds[speedIndex];
    speedBtn.textContent = speeds[speedIndex] + 'x';
  });

  // When audio ends
  audio.addEventListener('ended', function () {
    playIcon.hidden = false;
    pauseIcon.hidden = true;
    playBtn.setAttribute('aria-label', 'Play podcast');
  });

})();
