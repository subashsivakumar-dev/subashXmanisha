/**
 * script.js — Subash & Manisha Wedding Invitation
 * Vanilla JS: Envelope, Audio, Countdown, Scratch Card, Carousel, Scroll Animations
 */

'use strict';

/* ═══════════════════════════════════════════════════════════
   UTILITY HELPERS
   ═══════════════════════════════════════════════════════════ */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/** Clamp a number between min and max */
const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

/** Get pointer position (mouse or touch) relative to an element */
function getPointerPos(e, el) {
  const rect = el.getBoundingClientRect();
  const src  = e.touches ? e.touches[0] : e;
  return {
    x: src.clientX - rect.left,
    y: src.clientY - rect.top
  };
}

/* ═══════════════════════════════════════════════════════════
   1. ENVELOPE INTERACTION
   ═══════════════════════════════════════════════════════════ */
const EnvelopeModule = (() => {
  const overlay   = $('#envelope-overlay');
  const seal      = $('#waxSeal');
  const cardMain  = $('#invitationCard');
  const audioToggle = $('#audioToggle');

  let opened = false;

  function openEnvelope() {
    if (opened) return;
    opened = true;

    // 1. Trigger audio unlock (required by iOS Safari / Android Chrome policy)
    AudioModule.tryPlay();

    // Start hero video playback
    const heroVid = $('#heroVideo');
    if (heroVid) {
      heroVid.play().catch(() => {});
    }

    // 2. Animate overlay out — scale up slightly then fade
    overlay.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    overlay.style.transform  = 'scale(1.04)';
    overlay.style.opacity    = '0';

    // 3. Reveal invitation content
    setTimeout(() => {
      overlay.classList.add('hidden');
      cardMain.removeAttribute('aria-hidden');
      cardMain.setAttribute('aria-live', 'polite');
      audioToggle.classList.add('visible');
      ScrollAnimations.init();
      Countdown.init();
      ScrollDiscovery.showTrack();
    }, 700);

    // 4. Remove from DOM flow
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 1500);
  }

  function init() {
    if (!overlay) return;

    // Tap the seal or anywhere on the overlay
    [seal, overlay].forEach(el => {
      el.addEventListener('click', openEnvelope, { once: true });
      el.addEventListener('touchend', (e) => {
        e.preventDefault();
        openEnvelope();
      }, { once: true, passive: false });
    });

    // Keyboard accessibility
    seal && seal.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openEnvelope();
      }
    });
  }

  return { init };
})();

/* ═══════════════════════════════════════════════════════════
   2. AUDIO MODULE
   ═══════════════════════════════════════════════════════════ */
const AudioModule = (() => {
  const audio  = $('#wedding-music');
  const btn    = $('#audioToggle');
  const icon   = $('#audioIcon');
  let isPlaying = false;

  function updateUI() {
    if (isPlaying) {
      icon.textContent = '♫';
      btn.classList.add('playing');
      btn.setAttribute('aria-label', 'Pause wedding music');
      btn.title = 'Pause music';
    } else {
      icon.textContent = '♪';
      btn.classList.remove('playing');
      btn.setAttribute('aria-label', 'Play wedding music');
      btn.title = 'Play music';
    }
  }

  function tryPlay() {
    if (!audio) return;
    audio.volume = 0.5;
    const promise = audio.play();
    if (promise !== undefined) {
      promise
        .then(() => {
          isPlaying = true;
          updateUI();
        })
        .catch(() => {
          // Autoplay blocked — user must interact manually
          isPlaying = false;
          updateUI();
        });
    }
  }

  function toggle() {
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      isPlaying = false;
    } else {
      audio.volume = 0.5;
      audio.play().then(() => {
        isPlaying = true;
        updateUI();
      }).catch(() => {});
      isPlaying = true; // optimistic
    }
    updateUI();
  }

  function init() {
    if (!btn) return;
    btn.addEventListener('click', toggle);
    btn.addEventListener('touchend', (e) => {
      e.preventDefault();
      toggle();
    }, { passive: false });

    if (audio) {
      audio.addEventListener('pause', () => { isPlaying = false; updateUI(); });
      audio.addEventListener('play',  () => { isPlaying = true;  updateUI(); });
    }
  }

  return { init, tryPlay };
})();

/* ═══════════════════════════════════════════════════════════
   3. COUNTDOWN TIMER
   ═══════════════════════════════════════════════════════════ */
const Countdown = (() => {
  // Wedding: February 10, 2027 at 09:00 AM IST (UTC+5:30)
  const TARGET = new Date('2027-02-10T09:00:00+05:30').getTime();

  const els = {
    days:  $('#cntDays'),
    hours: $('#cntHours'),
    mins:  $('#cntMins'),
    secs:  $('#cntSecs'),
  };

  let raf;

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    const now  = Date.now();
    const diff = TARGET - now;

    if (diff <= 0) {
      // Wedding day!
      if (els.days)  els.days.textContent  = '00';
      if (els.hours) els.hours.textContent = '00';
      if (els.mins)  els.mins.textContent  = '00';
      if (els.secs)  els.secs.textContent  = '🎊';
      return;
    }

    const days  = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins  = Math.floor((diff % 3600000)  / 60000);
    const secs  = Math.floor((diff % 60000)    / 1000);

    if (els.days)  els.days.textContent  = pad(days);
    if (els.hours) els.hours.textContent = pad(hours);
    if (els.mins)  els.mins.textContent  = pad(mins);
    if (els.secs)  els.secs.textContent  = pad(secs);

    raf = requestAnimationFrame(tick);
  }

  function init() {
    tick();
  }

  return { init };
})();

/* ═══════════════════════════════════════════════════════════
   4. FALLING PETALS REVEAL
   ═══════════════════════════════════════════════════════════ */
const PetalsReveal = (() => {
  const container = $('#heartsCard');
  const btn       = $('#scratchHint');
  const veil      = $('#petalsVeil');
  const petalsLayer = $('#petalsLayer');

  let revealed = false;

  function createPetals() {
    if (!petalsLayer) return;
    petalsLayer.innerHTML = '';

    const types = ['purple', 'rose', 'gold', 'lotus', 'amber', 'jasmine'];
    const count = 36;

    for (let i = 0; i < count; i++) {
      const petal = document.createElement('div');
      const type = types[i % types.length];
      petal.className = `petal petal--${type}`;

      // Distribute across the veil card
      const left = ((i * 5.7) % 92 + 2).toFixed(1);
      const top = ((i * 7.3) % 88 + 3).toFixed(1);
      const delay = ((i * 0.04) % 1.2).toFixed(2);
      const duration = (2.2 + (i % 6) * 0.25).toFixed(2);
      const drift = (((i % 2 === 0 ? 1 : -1) * (35 + (i % 4) * 20))).toFixed(0) + 'px';
      const scale = (0.75 + (i % 5) * 0.12).toFixed(2);
      const rot = (i * 41) % 360;

      petal.style.left = `${left}%`;
      petal.style.top = `${top}%`;
      petal.style.setProperty('--delay', `${delay}s`);
      petal.style.setProperty('--duration', `${duration}s`);
      petal.style.setProperty('--drift', drift);
      petal.style.setProperty('--scale', scale);
      petal.style.setProperty('--rot', `${rot}deg`);

      petalsLayer.appendChild(petal);
    }
  }

  function triggerReveal() {
    if (revealed) return;
    revealed = true;

    if (container) container.classList.add('revealed');
    if (veil) veil.classList.add('falling');
    if (btn) {
      btn.classList.add('revealed');
      btn.setAttribute('aria-expanded', 'true');
    }

    setTimeout(() => {
      if (veil) veil.style.display = 'none';
      if (btn) btn.style.display = 'none';
    }, 2800);
  }

  function init() {
    createPetals();

    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerReveal();
      });
      btn.addEventListener('touchend', (e) => {
        e.stopPropagation();
        e.preventDefault();
        triggerReveal();
      }, { passive: false });
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          triggerReveal();
        }
      });
    }
  }

  return { init, triggerReveal };
})();

/* ═══════════════════════════════════════════════════════════
   5. STORY CAROUSEL
   ═══════════════════════════════════════════════════════════ */
const StoryCarousel = (() => {
  const wrapper  = $('#storyCarousel');
  const track    = $('#carouselTrack');
  const prevBtn  = $('#prevSlide');
  const nextBtn  = $('#nextSlide');
  const dotsEl   = $('#carouselDots');
  const slides   = $$('.story-slide');
  const dots     = $$('.dot', dotsEl);

  let current    = 0;
  let startX     = 0;
  let startY     = 0;
  let isDragging = false;
  let dragDeltaX = 0;

  const TOTAL = slides.length;

  function goTo(index, animate = true) {
    current = clamp(index, 0, TOTAL - 1);

    if (!animate) {
      track.style.transition = 'none';
    } else {
      track.style.transition = 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)';
    }

    track.style.transform = `translateX(-${current * 100}%)`;

    // Update dots
    dots.forEach((d, i) => {
      const isActive = i === current;
      d.classList.toggle('active', isActive);
      d.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }

  function next() { goTo(current === TOTAL - 1 ? 0 : current + 1); }
  function prev() { goTo(current === 0 ? TOTAL - 1 : current - 1); }

  // Touch / drag swipe
  function onTouchStart(e) {
    startX     = e.touches[0].clientX;
    startY     = e.touches[0].clientY;
    isDragging = true;
    dragDeltaX = 0;
    track.style.transition = 'none';
  }

  function onTouchMove(e) {
    if (!isDragging) return;
    dragDeltaX = e.touches[0].clientX - startX;
    const dragDeltaY = e.touches[0].clientY - startY;

    // If mostly vertical, don't interfere with page scroll
    if (Math.abs(dragDeltaY) > Math.abs(dragDeltaX) && Math.abs(dragDeltaX) < 10) {
      isDragging = false;
      return;
    }

    // Move track
    const base = current * 100;
    const offset = (dragDeltaX / (wrapper.offsetWidth || 375)) * 100;
    track.style.transform = `translateX(calc(-${base}% + ${dragDeltaX}px))`;
  }

  function onTouchEnd() {
    if (!isDragging) return;
    isDragging = false;

    const SWIPE_THRESHOLD = 50;
    if (dragDeltaX < -SWIPE_THRESHOLD) {
      next();
    } else if (dragDeltaX > SWIPE_THRESHOLD) {
      prev();
    } else {
      goTo(current); // snap back
    }
  }

  // Auto-advance every 5s
  let autoTimer;
  function startAuto() {
    autoTimer = setInterval(next, 5000);
  }
  function resetAuto() {
    clearInterval(autoTimer);
    startAuto();
  }

  function init() {
    if (!track || slides.length === 0) return;

    prevBtn && prevBtn.addEventListener('click', () => { prev(); resetAuto(); });
    nextBtn && nextBtn.addEventListener('click', () => { next(); resetAuto(); });

    // Dot navigation
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => { goTo(i); resetAuto(); });
    });

    // Touch swipe on the wrapper
    if (wrapper) {
      wrapper.addEventListener('touchstart', onTouchStart, { passive: true });
      wrapper.addEventListener('touchmove',  onTouchMove,  { passive: true });
      wrapper.addEventListener('touchend',   onTouchEnd,   { passive: true });
    }

    // Keyboard navigation
    wrapper && wrapper.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft')  { prev(); resetAuto(); }
      if (e.key === 'ArrowRight') { next(); resetAuto(); }
    });

    goTo(0, false);
    startAuto();
  }

  return { init };
})();

/* ═══════════════════════════════════════════════════════════
   6. SCROLL-TRIGGERED REVEAL ANIMATIONS
   ═══════════════════════════════════════════════════════════ */
const ScrollAnimations = (() => {
  let observer;

  function init() {
    if (!('IntersectionObserver' in window)) {
      // Fallback: show everything
      $$('.reveal, .reveal-left, .reveal-right').forEach(el => {
        el.classList.add('visible');
      });
      return;
    }

    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -60px 0px',
      threshold: 0.1,
    });

    $$('.reveal, .reveal-left, .reveal-right').forEach(el => observer.observe(el));
  }

  return { init };
})();

/* ═══════════════════════════════════════════════════════════
   7. SCROLL-TO-TOP BUTTON
   ═══════════════════════════════════════════════════════════ */
const ScrollTop = (() => {
  const btn = $('#scrollTop');

  function init() {
    if (!btn) return;

    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    btn.addEventListener('touchend', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, { passive: false });
  }

  return { init };
})();

/* ═══════════════════════════════════════════════════════════
   7b. SCROLL DISCOVERY & PROGRESS
   ═══════════════════════════════════════════════════════════ */
const ScrollDiscovery = (() => {
  const indicator     = $('#heroScrollIndicator');
  const progressTrack = $('#scrollProgressTrack');
  const progressBar   = $('#scrollProgressBar');

  function update() {
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;

    // Disappear indicator gracefully as soon as visitor scrolls
    if (indicator) {
      indicator.classList.toggle('faded', scrollY > 40);
    }

    // Update vertical champagne-gold progress line
    if (progressBar && docHeight > 0) {
      const progress = Math.min(100, Math.max(0, (scrollY / docHeight) * 100));
      progressBar.style.height = `${progress.toFixed(1)}%`;
    }
  }

  function scrollToNext() {
    const nextTarget = $('#familySection') || $('.family-section') || $('#familyDivider');
    if (!nextTarget) return;

    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    nextTarget.scrollIntoView({
      behavior: prefersReduced ? 'auto' : 'smooth',
      block: 'start'
    });
  }

  function showTrack() {
    if (progressTrack) {
      progressTrack.classList.add('active');
    }
  }

  function init() {
    if (indicator) {
      indicator.addEventListener('click', (e) => {
        e.preventDefault();
        scrollToNext();
      });

      indicator.addEventListener('touchend', (e) => {
        e.preventDefault();
        scrollToNext();
      }, { passive: false });

      indicator.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          scrollToNext();
        }
      });
    }

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  return { init, showTrack };
})();

/* ═══════════════════════════════════════════════════════════
   8. APPLY REVEAL CLASSES TO SECTIONS
   ═══════════════════════════════════════════════════════════ */
function applyRevealClasses() {
  const revealMap = [
    ['.hero-section .vedic-verse',       'reveal'],
    ['.hero-section .vedic-sub',         'reveal'],
    ['.hero-section .hero-logo-wrapper', 'reveal'],
    ['.hero-section .event-meta',        'reveal'],
    ['.hero-section .countdown-container','reveal'],
    ['.family-section .section-header',  'reveal'],
    ['.groom-card',                      'reveal-left'],
    ['.family-connector',                'reveal'],
    ['.bride-card',                      'reveal-right'],
    ['.schedule-section .section-header','reveal'],
    ['.mini-calendar',                   'reveal'],
    ['.timeline-item',                   'reveal'],
    ['.schedule-actions',                'reveal'],
    ['.venue-card',                      'reveal'],
    ['.scratch-section .section-header', 'reveal'],
    ['.scratch-container',               'reveal'],
    ['.story-section .section-header',   'reveal'],
    ['.carousel-wrapper',                'reveal'],
    ['.invitation-footer',               'reveal'],
  ];

  revealMap.forEach(([selector, cls]) => {
    $$(selector).forEach(el => el.classList.add(cls));
  });
}

/* ═══════════════════════════════════════════════════════════
   9. INIT ON DOM READY
   ═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Apply reveal classes before observer starts
  applyRevealClasses();

  // Initialize modules that don't need envelope opening
  AudioModule.init();
  ScrollTop.init();
  PetalsReveal.init();
  StoryCarousel.init();
  ScrollDiscovery.init();

  // Envelope opens everything else
  EnvelopeModule.init();

  // If user visits without overlay (e.g. direct link)
  // check after 5s if envelope was closed
  setTimeout(() => {
    const overlay = $('#envelope-overlay');
    if (overlay && !overlay.classList.contains('hidden')) {
      // Still showing — that's fine, waiting for user
    } else {
      ScrollAnimations.init();
      Countdown.init();
      ScrollDiscovery.showTrack();
    }
  }, 5100);
});

/* ═══════════════════════════════════════════════════════════
   10. HANDLE VISIBILITY CHANGE (pause audio on tab switch)
   ═══════════════════════════════════════════════════════════ */
document.addEventListener('visibilitychange', () => {
  const audio = $('#wedding-music');
  if (!audio) return;
  if (document.hidden) {
    audio.pause();
  }
  // Don't auto-resume — let user decide
});

/* ═══════════════════════════════════════════════════════════
   12. PAGE LOAD PROGRESS (optional subtle effect)
   ═══════════════════════════════════════════════════════════ */
window.addEventListener('load', () => {
  document.body.classList.add('loaded');
});
