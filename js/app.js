// Mobile navigation toggle
(function() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('primary-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const el = id && document.querySelector(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        nav && nav.classList.remove('open');
        toggle && toggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Dynamic year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Scroll reveal animations
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealEls = Array.from(document.querySelectorAll('.reveal'));

  const makeVisible = (el) => el.classList.add('reveal-visible');

  if (revealEls.length) {
    if (prefersReduced || !('IntersectionObserver' in window)) {
      // Show immediately for reduced motion or older browsers
      revealEls.forEach(makeVisible);
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            makeVisible(entry.target);
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });

      revealEls.forEach((el) => io.observe(el));
    }
  }

  // Page transitions (fade)
  const root = document.documentElement;
  const add = (el, c) => el.classList.add(c);
  const rem = (el, c) => el.classList.remove(c);

  // Enter animation on load
  add(root, 'page-enter');
  requestAnimationFrame(() => {
    add(root, 'page-enter-active');
    setTimeout(() => { rem(root, 'page-enter'); rem(root, 'page-enter-active'); }, 320);
  });

  // Intercept navigation for exit animation
  function shouldHandleLink(a, e) {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || a.target === '_blank' || e.ctrlKey || e.metaKey) return false;
    try {
      const url = new URL(href, window.location.href);
      return url.origin === window.location.origin; // same-origin only
    } catch (err) {
      return false; // Invalid URL
    }
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    if (!shouldHandleLink(a, e)) return;
    
    e.preventDefault();
    add(root, 'page-exit');
    requestAnimationFrame(() => add(root, 'page-exit-active'));
    const to = a.href;
    setTimeout(() => { window.location.href = to; }, 200);
  });

  // Animated interactive elements: track mouse for radial glow
  const interactiveSelectors = ['.menu-tile', '.card', '.price-card', '.social-card', '.price-item', '.btn-social'];
  const interactives = document.querySelectorAll(interactiveSelectors.join(','));
  interactives.forEach(el => {
    // mark as interactive for CSS overlay
    if (!el.classList.contains('interactive')) el.classList.add('interactive');
    el.addEventListener('pointermove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty('--mx', x + '%');
      el.style.setProperty('--my', y + '%');
    });
    // on pointerleave reset to center
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--mx', '50%');
      el.style.setProperty('--my', '50%');
    });
  });

  // Starfield in hero
  const canvas = document.getElementById('starfield');
  if (canvas && !prefersReduced) {
    const ctx = canvas.getContext('2d');
    let w, h, stars;
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.offsetWidth; h = canvas.offsetHeight;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.scale(dpr, dpr);
      stars = Array.from({ length: Math.floor((w * h) / 4500) + 60 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random() * 0.8 + 0.2,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2
      }));
    }
    let raf;
    function loop() {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      stars.forEach(s => {
        s.x += s.vx; s.y += s.vy;
        if (s.x < -2) s.x = w + 2; if (s.x > w + 2) s.x = -2;
        if (s.y < -2) s.y = h + 2; if (s.y > h + 2) s.y = -2;
        const r = s.z * 1.2;
        ctx.globalAlpha = 0.5 + s.z * 0.5;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(loop);
    }
    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);
    resize();
    loop();
    window.addEventListener('pagehide', () => cancelAnimationFrame(raf));
  }

  /* Global subtle stars canvas, shooting stars and cursor light */
  if (!prefersReduced) {
    // Global stars canvas
    const gWrap = document.createElement('div'); gWrap.id = 'global-stars';
    const gCanvas = document.createElement('canvas'); gWrap.appendChild(gCanvas);
    document.body.appendChild(gWrap);
    const gctx = gCanvas.getContext('2d');
    let gw = 0, gh = 0, gDpr = Math.min(window.devicePixelRatio || 1, 2);
    const gstars = [];
    const explosions = [];
    
    function gResize() {
      gw = window.innerWidth; gh = window.innerHeight;
      gCanvas.width = gw * gDpr; gCanvas.height = gh * gDpr; gCanvas.style.width = gw + 'px'; gCanvas.style.height = gh + 'px';
      gctx.setTransform(gDpr, 0, 0, gDpr, 0, 0);
      // initialize stars with randomized twinkle phases
      if (!gstars.length) {
        for (let i = 0; i < 28; i++) {
          gstars.push({ 
            x: Math.random() * gw, 
            y: Math.random() * gh, 
            r: Math.random() * 1.2 + 0.4, 
            tw: Math.random() * Math.PI * 2, 
            a: Math.random() * 0.9 + 0.1,
            twSpeed: (Math.random() - 0.5) * 0.04 + 0.02, // randomized twinkle speed
            hasPulse: Math.random() > 0.6 // only ~40% of stars pulse
          });
        }
      }
    }
    
    let gRaf;
    const shoots = [];
    let mouse = { x: -100, y: -100 };
    let lastSpawnX = -999;
    
    window.addEventListener('pointermove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    function spawnShooting() {
      const startX = Math.random() * gw;
      const startY = Math.random() * gh;
      const vx = (Math.random() - 0.5) * 6; // allow movement in any horizontal direction
      const vy = (Math.random() - 0.5) * 6; // allow movement in any vertical direction
      shoots.push({ x: startX, y: startY, vx, vy, life: 0, maxLife: 80 + Math.floor(Math.random() * 60) });
    }
    
    function createExplosion(x, y) {
      for (let i = 0; i < 18; i++) {
        const angle = (Math.PI * 2 * i) / 18;
        const speed = 3 + Math.random() * 3;
        explosions.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 20 + Math.random() * 15,
          size: 2 + Math.random() * 2
        });
      }
    }
    
    function gLoop() {
      gctx.clearRect(0, 0, gw, gh);
      
      // draw subtle stars with randomized pulsing
      gstars.forEach(s => {
        if (s.hasPulse) {
          s.tw += s.twSpeed;
          const alpha = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(s.tw));
          gctx.fillStyle = `rgba(255,255,255,${alpha * s.a})`;
        } else {
          gctx.fillStyle = `rgba(255,255,255,${0.3 * s.a})`;
        }
        gctx.beginPath(); 
        gctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); 
        gctx.fill();
      });
      
      // draw shooting stars
      for (let i = shoots.length - 1; i >= 0; i--) {
        const s = shoots[i];
        s.x += s.vx; s.y += s.vy; s.life++;

        // boundary conditions: make them reappear on the opposite side
        if (s.x < -10) s.x = gw + 10;
        if (s.x > gw + 10) s.x = -10;
        if (s.y < -10) s.y = gh + 10;
        if (s.y > gh + 10) s.y = -10;

        // check for mouse intersection
        const dist = Math.sqrt((s.x - mouse.x) ** 2 + (s.y - mouse.y) ** 2);
        if (dist < 50) {
          createExplosion(s.x, s.y);
          shoots.splice(i, 1);
          continue; // star is gone, skip drawing it
        }

        const fade = 1 - s.life / s.maxLife;
        gctx.strokeStyle = `rgba(255,255,255,${0.95 * fade})`;
        gctx.lineWidth = 2;
        gctx.beginPath();
        gctx.moveTo(s.x, s.y);
        // Adjust tail length based on speed
        gctx.lineTo(s.x - s.vx * 4, s.y - s.vy * 4);
        gctx.stroke();
        if (s.life > s.maxLife) shoots.splice(i, 1);
      }
      
      // draw explosions
      for (let i = explosions.length - 1; i >= 0; i--) {
        const e = explosions[i];
        e.x += e.vx; e.y += e.vy; e.life++;
        const fade = 1 - e.life / e.maxLife;
        gctx.fillStyle = `rgba(255,255,255,${0.8 * fade})`;
        gctx.beginPath();
        gctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        gctx.fill();
        if (e.life > e.maxLife) explosions.splice(i, 1);
      }
      
      gRaf = requestAnimationFrame(gLoop);
    }
    
    gResize(); gLoop();
    window.addEventListener('resize', () => { cancelAnimationFrame(gRaf); gResize(); gLoop(); });
    // occasionally spawn shooting star
    setInterval(() => { if (Math.random() < 0.3) spawnShooting(); }, 1800);

    // Cursor light - only visible in specific sections, disabled on nav/images/footer
    const cursor = document.createElement('div'); cursor.className = 'cursor-light'; document.body.appendChild(cursor);
    let cursorTimer;
    const shouldShowCursor = (e) => {
      if (document.querySelector('.site-footer')?.contains(e.target)) return false; // hide in footer
      if (e.target.tagName === 'IMG') return false; // hide on images
      if (e.target.closest('a, button')) return false; // hide on any link or button
      return true;
    };
    
    window.addEventListener('pointermove', (e) => {
      if (!shouldShowCursor(e)) {
        cursor.style.opacity = 0;
        clearTimeout(cursorTimer);
        return;
      }
      
      const header = document.querySelector('.site-header');
      const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
      let opacity = 1;

      if (e.clientY < headerBottom) {
        // Dynamically reduce opacity from 0.5 at the top to 1 at the bottom of the header
        opacity = 0.3 + (e.clientY / headerBottom) * 0.7;
      }

      cursor.style.left = e.clientX + 'px'; 
      cursor.style.top = e.clientY + 'px'; 
      cursor.style.opacity = opacity;
      cursor.style.transform = 'translate(-50%,-50%) scale(1)';
      clearTimeout(cursorTimer);
      cursorTimer = setTimeout(() => { cursor.style.opacity = 0; }, 600);
    });
    
    window.addEventListener('pointerleave', () => {
      cursor.style.opacity = 0;
    });
  }

  // Contact form handling (client-side validation + 1 submit per day limit)
  (function() {
    const EMAIL_TO = 'tuo-indirizzo@esempio.it'; // <--- sostituisci con la mail desiderata
    const form = document.getElementById('contactForm');
    if (!form) return;
    // create status element
    const status = document.createElement('div'); status.className = 'form-status'; form.prepend(status);
    const submitBtn = form.querySelector('button[type="submit"]');

    function showStatus(msg, ok = true) {
      status.textContent = msg; status.style.color = ok ? 'var(--primary)' : '#f66';
    }

    function isValidEmail(email) {
      return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = (data.get('name') || '').toString().trim();
      const email = (data.get('email') || '').toString().trim();
      const message = (data.get('message') || '').toString().trim();

      if (name.length < 2) { showStatus('Inserisci un nome valido (almeno 2 caratteri).', false); return; }
      if (!isValidEmail(email)) { showStatus('Inserisci un indirizzo email valido.', false); return; }
      if (message.length < 10) { showStatus('Il messaggio è troppo breve (minimo 10 caratteri).', false); return; }

      // rate limit: 1 submit per 24h (client-side)
      try {
        const last = localStorage.getItem('lastContactSubmit');
        if (last && (Date.now() - Number(last) < 24 * 3600 * 1000)) {
          showStatus('Hai già inviato un messaggio nelle ultime 24 ore. Riprova più tardi.', false); return;
        }
      } catch (err) { /* ignore storage errors */ }

      // disable button
      if (submitBtn) { submitBtn.disabled = true; }
      showStatus('Invio in corso...');

      // Try to POST to a backend endpoint '/send-contact' (server required). If not available, fallback to mailto.
      const payload = { name, email, message }; let sent = false;
      try {
        const res = await fetch('/send-contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) { sent = true; }
      } catch (err) {
        sent = false;
      }

      if (!sent) {
        // fallback: open mail client prefilled (note: user must confirm send)
        const subject = encodeURIComponent('Messaggio dal sito — ' + name);
        const body = encodeURIComponent(message + '\n\n---\nNome: ' + name + '\nEmail: ' + email);
        window.location.href = `mailto:${EMAIL_TO}?subject=${subject}&body=${body}`;
        sent = true;
      }

      if (sent) {
        try { localStorage.setItem('lastContactSubmit', String(Date.now())); } catch (err) {}
        showStatus('Messaggio inviato. Grazie — ti risponderemo al più presto.');
        form.reset();
      } else {
        showStatus('Errore durante l\'invio. Riprova più tardi.', false);
      }
      if (submitBtn) { submitBtn.disabled = false; }
    });
  })();
})();
