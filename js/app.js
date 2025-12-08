// Mobile navigation toggle
(function() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');
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
        const header = document.querySelector('.site-header');
        const headerHeight = header ? header.offsetHeight : 0;
        const rect = el.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        window.scrollTo({
          top: scrollTop + rect.top - headerHeight,
          behavior: 'smooth'
        });
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
      ctx.fillStyle = 'rgba(255,255,255,1.0)';
      stars.forEach(s => {
        s.x += s.vx; s.y += s.vy;
        if (s.x < -2) s.x = w + 2; if (s.x > w + 2) s.x = -2;
        if (s.y < -2) s.y = h + 2; if (s.y > h + 2) s.y = -2;
        const r = s.z * 0.8;
        ctx.globalAlpha = 0.3 + s.z * 0.3;
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
    const planets = [];
    const comets = [];
    const meteorites = [];
    const shootingStars = [];
    const explosions = []; // For explosion effects
    let mouse = { x: gw / 2, y: gh / 2 };
    let exposure = 1.2; // Increased base exposure for higher luminosity

    // Click to explode and spawn
    gCanvas.addEventListener('click', (e) => {
      const rect = gCanvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (gw / rect.width);
      const y = (e.clientY - rect.top) * (gh / rect.height);
      // Find nearby stars to explode
      gstars.forEach(s => {
        const dx = s.x - x;
        const dy = s.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 50) { // Explosion radius
          createExplosion(s.x, s.y);
          gstars.splice(gstars.indexOf(s), 1);
        }
      });
      // Spawn new stars
      for (let i = 0; i < 5; i++) {
        gstars.push({
          x: x + (Math.random() - 0.5) * 100,
          y: y + (Math.random() - 0.5) * 100,
          z: Math.random() * 0.5 + 0.5,
          r: (Math.random() * 1.2 + 0.5) * (Math.random() * 0.5 + 0.5),
          tw: Math.random() * Math.PI * 2,
          twSpeed: (Math.random() - 0.5) * 0.05 + 0.01
        });
      }
      // Spawn a comet
      spawnComet();
    });

    function gResize() {
      gw = window.innerWidth; gh = window.innerHeight;
      gCanvas.width = gw * gDpr; gCanvas.height = gh * gDpr;
      gCanvas.style.width = gw + 'px'; gCanvas.style.height = gh + 'px';
      gctx.setTransform(gDpr, 0, 0, gDpr, 0, 0);

      // Create stars with depth
      if (!gstars.length) {
        for (let i = 0; i < 200; i++) {
          gstars.push({
            x: Math.random() * gw, y: Math.random() * gh,
            z: Math.random() * 0.5 + 0.5, // Z-depth for parallax
            r: (Math.random() * 2.5 + 0.2) * (Math.random() * 0.6 + 0.4), // More variable sizes
            tw: Math.random() * Math.PI * 2,
            twSpeed: (Math.random() - 0.5) * 0.1 + 0.02 // Faster twinkle
          });
        }
      }

      // Create static planets resembling our solar system
      if (!planets.length) {
        const solarPlanets = [
          { name: 'Mercury', r: 3, hue: 0, sat: 0, light: 50, z: 0.8 },
          { name: 'Venus', r: 5, hue: 45, sat: 50, light: 70, z: 0.7 },
          { name: 'Earth', r: 5, hue: 200, sat: 60, light: 60, z: 0.6 },
          { name: 'Mars', r: 3, hue: 0, sat: 80, light: 50, z: 0.5 },
          { name: 'Jupiter', r: 12, hue: 30, sat: 70, light: 50, z: 0.4 },
          { name: 'Saturn', r: 10, hue: 50, sat: 40, light: 70, z: 0.3 },
          { name: 'Uranus', r: 7, hue: 180, sat: 50, light: 60, z: 0.2 },
          { name: 'Neptune', r: 7, hue: 220, sat: 60, light: 50, z: 0.1 }
        ];
        solarPlanets.forEach(p => {
          planets.push({
            x: Math.random() * gw, y: Math.random() * gh, r: p.r,
            hue: p.hue, sat: p.sat, light: p.light, z: p.z,
            twinkle: Math.random() * Math.PI * 2,
            twinkleSpeed: (Math.random() - 0.5) * 0.01
          });
        });
      }
    }

    window.addEventListener('pointermove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    function spawnComet() {
        const fromLeft = Math.random() > 0.5;
        const startX = fromLeft ? -50 : gw + 50;
        const startY = Math.random() * gh;
        const vx = (fromLeft ? 1 : -1) * (Math.random() * 3 + 2); // Faster
        const vy = (Math.random() - 0.5) * 1.5; // More oblique
        comets.push({ x: startX, y: startY, vx, vy, tail: [], maxTail: 30 + Math.random() * 20, time: 0, lifetime: 200 + Math.random() * 200, alpha: 1 });
    }

    function spawnMeteorite() {
        const fromLeft = Math.random() > 0.5;
        const startX = fromLeft ? -50 : gw + 50;
        const startY = Math.random() * gh;
        const vx = (fromLeft ? 1 : -1) * (Math.random() * 3 + 2); // Faster oblique
        const vy = (Math.random() - 0.5) * 2; // Oblique
        meteorites.push({ x: startX, y: startY, vx, vy, tail: [], maxTail: 20 + Math.random() * 10, time: 0, lifetime: 200 + Math.random() * 200, alpha: 1 });
    }

    function spawnShootingStar() {
        const fromLeft = Math.random() > 0.5;
        const startX = fromLeft ? -50 : gw + 50;
        const startY = Math.random() * gh;
        const vx = (fromLeft ? 1 : -1) * (Math.random() * 7 + 5); // Faster than comets
        const vy = (Math.random() - 0.5) * 4; // More oblique
        shootingStars.push({ x: startX, y: startY, vx, vy, tail: [], maxTail: 50 + Math.random() * 30, time: 0, lifetime: 80 + Math.random() * 80, alpha: 1 });
    }

    function createExplosion(x, y) {
        const particles = [];
        for (let i = 0; i < 10; i++) {
            particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 30,
                maxLife: 30
            });
        }
        explosions.push({ particles, life: 30 });
    }


    let gRaf;
    function gLoop() {
      gctx.clearRect(0, 0, gw, gh);

      // Update dynamic exposure with smoother luminosity
      exposure = 0.8 + 0.4 * (0.5 + 0.5 * Math.sin(Date.now() * 0.0005));

      // Parallax effect based on mouse
      const mouseX = mouse.x / gw - 0.5;
      const mouseY = mouse.y / gh - 0.5;

      // Draw planets with parallax, twinkle, and blending
      planets.forEach(p => {
          p.twinkle += p.twinkleSpeed;
          const twinkleFactor = 0.8 + 0.4 * (0.5 + 0.5 * Math.sin(p.twinkle));
          const parallaxX = p.x - mouseX * p.z * 20;
          const parallaxY = p.y - mouseY * p.z * 20;
          const grad = gctx.createRadialGradient(parallaxX, parallaxY, p.r * 0.3, parallaxX, parallaxY, p.r);
          const centerLight = Math.min(100, p.light + 20 * twinkleFactor);
          const edgeLight = Math.max(10, p.light - 30);
          grad.addColorStop(0, `hsl(${p.hue}, ${p.sat}%, ${centerLight}%)`);
          grad.addColorStop(1, `hsl(${p.hue}, ${p.sat}%, ${edgeLight}%)`);
          gctx.globalAlpha = 0.3 + 0.2 * exposure;
          gctx.fillStyle = grad; gctx.beginPath(); gctx.arc(parallaxX, parallaxY, p.r, 0, Math.PI * 2); gctx.fill();
          gctx.globalAlpha = 1;
      });

      // Draw stars with parallax, variable brightness, and exposure
      gstars.forEach(s => {
        s.tw += s.twSpeed;
        const alpha = (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(s.tw))) * s.z * exposure;
        const timeDriftX = Math.sin(Date.now() * 0.0005 + s.x * 0.01) * 2;
        const timeDriftY = Math.cos(Date.now() * 0.0005 + s.y * 0.01) * 2;
        const parallaxX = s.x - mouseX * s.z * 10 + timeDriftX;
        const parallaxY = s.y - mouseY * s.z * 10 + timeDriftY;
        gctx.fillStyle = `rgba(255,255,255,${alpha})`;
        gctx.beginPath(); gctx.arc(parallaxX, parallaxY, s.r * s.z, 0, Math.PI * 2); gctx.fill();
      });

      // Draw & update comets
      for (let i = comets.length - 1; i >= 0; i--) {
        const c = comets[i]; c.x += c.vx; c.y += c.vy; c.time++;
        c.tail.unshift({ x: c.x, y: c.y, size: 2 + Math.random() * 2 });
        if (c.tail.length > c.maxTail) c.tail.pop();
        const lifetimeFade = c.time > c.lifetime * 0.8 ? (c.lifetime - c.time) / (c.lifetime * 0.2) : 1;
        for (let j = 0; j < c.tail.length; j++) {
            const t = c.tail[j]; const fade = 1 - (j / c.tail.length);
            gctx.fillStyle = `rgba(255, 255, 255, ${0.3 * fade * exposure * lifetimeFade})`;
            gctx.beginPath(); gctx.arc(t.x, t.y, t.size * fade, 0, Math.PI * 2); gctx.fill();
        }
        if (c.x < -100 || c.x > gw + 100 || c.time > c.lifetime) comets.splice(i, 1);
      }

      // Draw & update meteorites
      for (let i = meteorites.length - 1; i >= 0; i--) {
        const m = meteorites[i]; m.x += m.vx; m.y += m.vy; m.time++;
        m.tail.unshift({ x: m.x, y: m.y, size: 1 + Math.random() * 1.5 });
        if (m.tail.length > m.maxTail) m.tail.pop();
        const lifetimeFade = m.time > m.lifetime * 0.8 ? (m.lifetime - m.time) / (m.lifetime * 0.2) : 1;
        for (let j = 0; j < m.tail.length; j++) {
            const t = m.tail[j]; const fade = 1 - (j / m.tail.length);
            gctx.fillStyle = `rgba(255, 150, 100, ${0.6 * fade * exposure * lifetimeFade})`;
            gctx.beginPath(); gctx.arc(t.x, t.y, t.size * fade, 0, Math.PI * 2); gctx.fill();
        }
        if (m.y > gh + 100 || m.time > m.lifetime) meteorites.splice(i, 1);
      }

      // Draw & update shooting stars
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i]; ss.x += ss.vx; ss.y += ss.vy; ss.time++;
        ss.tail.unshift({ x: ss.x, y: ss.y, size: 1.5 + Math.random() * 1 });
        if (ss.tail.length > ss.maxTail) ss.tail.pop();
        const lifetimeFade = ss.time > ss.lifetime * 0.8 ? (ss.lifetime - ss.time) / (ss.lifetime * 0.2) : 1;
        for (let j = 0; j < ss.tail.length; j++) {
            const t = ss.tail[j]; const fade = 1 - (j / ss.tail.length);
            gctx.fillStyle = `rgba(255, 255, 255, ${0.8 * fade * exposure * lifetimeFade})`;
            gctx.beginPath(); gctx.arc(t.x, t.y, t.size * fade, 0, Math.PI * 2); gctx.fill();
        }
        if (ss.y > gh + 100 || ss.time > ss.lifetime) shootingStars.splice(i, 1);
      }

      // Collision detection with cursor light
      const cursorRadius = 50; // Approximate cursor light radius
      comets.forEach(c => {
        const dx = c.x - mouse.x;
        const dy = c.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < cursorRadius + 10) { // 10 is comet size approx
          createExplosion(c.x, c.y);
          comets.splice(comets.indexOf(c), 1);
        }
      });
      meteorites.forEach(m => {
        const dx = m.x - mouse.x;
        const dy = m.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < cursorRadius + 10) { // 10 is meteorite size approx
          createExplosion(m.x, m.y);
          meteorites.splice(meteorites.indexOf(m), 1);
        }
      });
      shootingStars.forEach(ss => {
        const dx = ss.x - mouse.x;
        const dy = ss.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < cursorRadius + 10) { // 10 is shooting star size approx
          createExplosion(ss.x, ss.y);
          shootingStars.splice(shootingStars.indexOf(ss), 1);
        }
      });

      // Draw & update explosions
      for (let i = explosions.length - 1; i >= 0; i--) {
        const exp = explosions[i];
        exp.life--;
        exp.particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.life--;
          const alpha = p.life / p.maxLife;
          gctx.fillStyle = `rgba(255, 200, 100, ${alpha * exposure})`;
          gctx.beginPath();
          gctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
          gctx.fill();
        });
        if (exp.life <= 0) explosions.splice(i, 1);
      }

      gRaf = requestAnimationFrame(gLoop);
    }

    gResize(); gLoop();
    window.addEventListener('resize', () => { cancelAnimationFrame(gRaf); gResize(); gLoop(); });

    // Spawn comets at randomized intervals
    function scheduleComet() {
        const delay = 12000 + Math.random() * 20000; // 12-32 seconds
        setTimeout(() => { spawnComet(); scheduleComet(); }, delay);
    }
    scheduleComet();

    // Spawn meteorites at randomized intervals
    function scheduleMeteorite() {
        const delay = 20000 + Math.random() * 28000; // 20-48 seconds
        setTimeout(() => { spawnMeteorite(); scheduleMeteorite(); }, delay);
    }
    scheduleMeteorite();

    // Spawn shooting stars at randomized intervals
    function scheduleShootingStar() {
        const delay = 20000 + Math.random() * 20000; // 20-40 seconds
        setTimeout(() => { spawnShootingStar(); scheduleShootingStar(); }, delay);
    }
    scheduleShootingStar();

    // Cursor light
    const cursor = document.createElement('div'); cursor.className = 'cursor-light'; document.body.appendChild(cursor);
    let cursorTimer;
    const shouldShowCursor = (e) => {
      if (document.querySelector('.site-footer')?.contains(e.target)) return false;
      if (e.target.tagName === 'IMG' || e.target.closest('a, button')) return false;
      return true;
    };

    window.addEventListener('pointermove', (e) => {
      if (!shouldShowCursor(e)) {
        cursor.style.opacity = 0; clearTimeout(cursorTimer); return;
      }
      const header = document.querySelector('.site-header');
      const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
      let opacity = (e.clientY < headerBottom) ? (0.3 + (e.clientY / headerBottom) * 0.7) : 1;
      cursor.style.left = e.clientX + 'px'; cursor.style.top = e.clientY + 'px';
      cursor.style.opacity = opacity; cursor.style.transform = 'translate(-50%,-50%) scale(1)';
      clearTimeout(cursorTimer);
      cursorTimer = setTimeout(() => { cursor.style.opacity = 0; }, 600);
    });

    window.addEventListener('pointerleave', () => { cursor.style.opacity = 0; });
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

  // Randomized reviews
  (function() {
    const reviewsContainer = document.getElementById('reviews-container');
    if (!reviewsContainer) return;

    const names = [
      'Luca Moretti',
      'Sofia Delgado',
      'Aaron Mitchell',
      'Mei Lin',
      'Carlos Fernández',
      'Aisha Rahman',
      'Jonas Bergström',
      'Maya Kapoor',
      'Daniel O’Connor',
      'Hana Suzuki',
      'Pierre Laurent',
      'Natalia Kowalska',
      'Liam Roberts',
      'Amira Haddad',
      'Viktor Petrov',
      'Isabella Costa',
      'Marcus Johansson',
      'Chloe Bennett',
      'Farid Al-Masri',
      'Elena Popescu',
      'Nathan King',
      'Giada Romano',
      'Henry Collins',
      'Sara El-Sayed',
      'Dmitri Volkov',
      'Yara Mendes',
      'Oliver Hughes',
      'Noemi Santoro',
      'Haruto Yamamoto',
      'Laila Khan',
      'Thomas Becker',
      'Ana Martins',
      'Julian Weber',
      'Priya Sharma',
      'Gabriel Duarte',
      'Emma Sinclair',
      'Rami Barakat',
      'Viktoria Novak',
      'Andrej Kovač',
      'Mia Thompson',
      'Omar Hassan',
      'Clara Rinaldi',
      'Felix Baumann',
      'Ava Morgan',
      'Matteo Lombardi',
      'Helena Karlsson',
      'Samuel Foster',
      'Zainab Mohammed',
      'Kenzo Tanaka',
      'Beatrice Colombo',
      'Diego Morales',
      'Niko Nieminen',
      'Alessia Greco',
      'James Carter',
      'Wiktor Zieliński',
      'Layla Ibrahim',
      'Ethan Brooks',
      'Mariana Torres',
      'Yuki Sato',
      'Amadou Diallo',
      'Paolo Giordano',
      'Laura Steiner',
      'Hugo Dubois',
      'Janelle Robinson',
      'Rashid Karim',
      'Tania Marković',
      'Kai Müller',
      'Bianca Leone',
      'Patrick Wallace',
      'Noor Al-Fayed',
      'Sergio Álvarez',
      'Elin Andersson',
      'Ahmed Youssef',
      'Valentina Fabbri',
      'Connor Walsh',
      'Ingrid Petersen',
      'Matteo Ricci',
      'Camila Sáenz',
      'Elias Schneider',
      'Aria Campbell',
      'João Ribeiro',
      'Keiko Matsumoto',
      'Abdulrahman Saidi',
      'Ana Jovanović',
      'David Walsh',
      'Stella Pavlova',
      'Hugo Ferreira',
      'Miriam Cohen',
      'Roberto Paredes',
      'Nora Jensen',
      'Ismael Ortiz',
      'Katarina Vuković',
      'Steven Parker',
      'Elisa Galli',
      'Hassan Qureshi',
      'Fiona McKenzie',
      'Leonardo Braga',
      'Sandra Hoffmann',
      'Khalid Nasser',
      'Olivia Spencer'
    ];

    const reviews = [
      {
        text: 'Servizio impeccabile e personale super qualificato. Il mio barbiere di fiducia a Trieste!',
        rating: 5
      },
      {
        text: 'Taglio perfetto e barba curata nei minimi dettagli. Argjend è un vero artista.',
        rating: 5
      },
      {
        text: 'Atmosfera accogliente e grande professionalità. Non posso che consigliarlo.',
        rating: 5
      },
      {
        text: 'Il miglior barber shop della città. Precisione, stile e un ottimo caffè.',
        rating: 5
      },
      {
        text: 'Sono cliente da anni e non mi ha mai deluso. Il top per barba e capelli.',
        rating: 5
      }
    ];

    function shuffle(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }

    function renderReviews() {
      const shuffledReviews = shuffle(reviews).slice(0, 4); // Take 4 reviews for a 2x2 grid
      let html = '';
      shuffledReviews.forEach(review => {
        const randomName = names[Math.floor(Math.random() * names.length)];
        html += `
          <div class="card interactive">
            <h3>${randomName}</h3>
            <p>"${review.text}"</p>
            <div class="stars">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
          </div>
        `;
      });
      reviewsContainer.innerHTML = html;
    }

    renderReviews();
  })();

  // Cookie Consent
  (function() {
    const popup = document.getElementById('cookie-consent-popup');
    if (!popup) return;

    const acceptBtn = document.getElementById('cookie-accept-btn');
    const declineBtn = document.getElementById('cookie-decline-btn');

    function setCookie(name, value, days) {
      let expires = '';
      if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toUTCString();
      }
      document.cookie = name + '=' + (value || '')  + expires + '; path=/';
    }

    function getCookie(name) {
      const nameEQ = name + '=';
      const ca = document.cookie.split(';');
      for(let i=0;i < ca.length;i++) {
        let c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
      }
      return null;
    }

    function hidePopup() {
      popup.classList.remove('show');
    }

    if (!getCookie('cookie_consent')) {
      popup.classList.add('show');
    }

    acceptBtn.addEventListener('click', () => {
      setCookie('cookie_consent', 'accepted', 365);
      hidePopup();
    });

    declineBtn.addEventListener('click', () => {
      setCookie('cookie_consent', 'declined');
      hidePopup();
    });
  })();
})();
