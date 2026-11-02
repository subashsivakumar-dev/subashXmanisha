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
   4. SCRATCH CARD
   ═══════════════════════════════════════════════════════════ */
const ScratchCard = (() => {
  const canvas  = $('#scratchCanvas');
  const hint    = $('#scratchHint');
  const msgBox  = $('#scratchMessage');

  let ctx;
  let isDrawing = false;
  let revealed  = false;
  let totalPixels  = 0;
  let scratchedPixels = 0;

  // Gold gradient pattern
  function buildGoldGradient() {
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0.00, '#B8931F');
    grad.addColorStop(0.15, '#D4AF37');
    grad.addColorStop(0.30, '#E8C84A');
    grad.addColorStop(0.45, '#F5E7B2');
    grad.addColorStop(0.60, '#D4AF37');
    grad.addColorStop(0.75, '#C8A85A');
    grad.addColorStop(0.90, '#B8931F');
    grad.addColorStop(1.00, '#D4AF37');
    return grad;
  }

  function drawScratchSurface() {
    // Gold gradient
    ctx.fillStyle = buildGoldGradient();
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative text on the scratch surface
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.font = `bold ${Math.round(canvas.width * 0.06)}px 'Cinzel', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✦ SCRATCH HERE ✦', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = `${Math.round(canvas.width * 0.04)}px 'Montserrat', sans-serif`;
    ctx.fillText('A message from our hearts', canvas.width / 2, canvas.height / 2 + 20);

    // Shiny shimmer pattern
    for (let i = 0; i < canvas.width; i += 30) {
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 60, canvas.height);
      ctx.stroke();
    }
    ctx.restore();

    totalPixels = canvas.width * canvas.height;
  }

  function scratch(x, y) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();

    // Check how much has been scratched (sample every 32px for performance)
    checkReveal();
  }

  function checkReveal() {
    if (revealed) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let cleared = 0;
    for (let i = 3; i < imageData.data.length; i += 32 * 4) {
      if (imageData.data[i] < 128) cleared++;
    }
    const ratio = cleared / (imageData.data.length / (32 * 4));
    if (ratio > 0.5) {
      revealFully();
    }
  }

  function revealFully() {
    revealed = true;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.style.pointerEvents = 'none';
    if (hint) {
      hint.style.opacity = '0';
      hint.style.pointerEvents = 'none';
    }
  }

  function getCanvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top)  * scaleY,
    };
  }

  function init() {
    if (!canvas) return;

    // Size canvas to match the message container
    function resizeCanvas() {
      if (!msgBox) return;
      const rect = msgBox.getBoundingClientRect();
      canvas.width  = rect.width;
      canvas.height = rect.height;
      ctx = canvas.getContext('2d');
      drawScratchSurface();
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mouse events
    canvas.addEventListener('mousedown', (e) => {
      isDrawing = true;
      if (hint) hint.style.opacity = '0';
      const pos = getCanvasPos(e);
      scratch(pos.x, pos.y);
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!isDrawing) return;
      const pos = getCanvasPos(e);
      scratch(pos.x, pos.y);
    });

    canvas.addEventListener('mouseup',   () => { isDrawing = false; });
    canvas.addEventListener('mouseleave',() => { isDrawing = false; });

    // Touch events
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      isDrawing = true;
      if (hint) hint.style.opacity = '0';
      const pos = getCanvasPos(e);
      scratch(pos.x, pos.y);
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!isDrawing) return;
      const pos = getCanvasPos(e);
      scratch(pos.x, pos.y);
    }, { passive: false });

    canvas.addEventListener('touchend', () => { isDrawing = false; });

    // Keyboard shortcut: Space/Enter to reveal
    canvas.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        revealFully();
      }
    });
  }

  return { init };
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
  ScratchCard.init();
  StoryCarousel.init();

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
    }
  }, 5100);
});

/* ═══════════════════════════════════════════════════════════
   10. PREVENT CONTEXT MENU ON CANVAS (better UX)
   ═══════════════════════════════════════════════════════════ */
document.addEventListener('contextmenu', (e) => {
  if (e.target.id === 'scratchCanvas') {
    e.preventDefault();
  }
});

/* ═══════════════════════════════════════════════════════════
   11. HANDLE VISIBILITY CHANGE (pause audio on tab switch)
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
