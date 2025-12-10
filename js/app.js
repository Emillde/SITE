// Lenis smooth scrolling - disabled on mobile to avoid conflicts with touch scrolling
if (window.innerWidth >= 700) {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/dist/lenis.min.js';
  document.head.appendChild(script);
  script.onload = () => {
    const lenis = new Lenis();
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  };
}

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

  // Background parallax for 3D depth
  window.addEventListener('pointermove', (e) => {
    if (prefersReduced || document.body.classList.contains('static-background')) return;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const deltaX = (e.clientX - centerX) * 0.01;
    const deltaY = (e.clientY - centerY) * 0.01;
    document.body.style.backgroundPosition = `calc(50% + ${deltaX}px) calc(50% + ${deltaY}px)`;
  });





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
