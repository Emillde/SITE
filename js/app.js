// Lenis smooth scrolling - disabled on mobile to avoid conflicts with touch scrolling
if (window.innerWidth >= 700) {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/dist/lenis.min.js';
  script.onload = () => {
    const lenis = new Lenis();
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  };
  document.head.appendChild(script);
}

// Mobile navigation toggle
(function() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('active');
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
        nav && nav.classList.remove('active');
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
      return url.origin === window.location.origin;
    } catch (err) {
      return false;
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
    if (!el.classList.contains('interactive')) el.classList.add('interactive');
    el.addEventListener('pointermove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty('--mx', x + '%');
      el.style.setProperty('--my', y + '%');
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--mx', '50%');
      el.style.setProperty('--my', '50%');
    });
  });

  // Social buttons click ripple effect
  (function() {
    const socialButtons = document.querySelectorAll('.btn-social');
    if (!socialButtons.length) return;

    socialButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        this.classList.add('click-effect');
        setTimeout(() => {
          this.classList.remove('click-effect');
        }, 600);

        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
          position: absolute;
          width: ${size}px;
          height: ${size}px;
          left: ${x}px;
          top: ${y}px;
          background: radial-gradient(circle, rgba(218,165,32,0.6) 0%, transparent 70%);
          border-radius: 50%;
          transform: scale(0);
          animation: rippleEffect 0.8s ease-out;
          pointer-events: none;
          z-index: 2;
        `;
        
        this.appendChild(ripple);
        
        setTimeout(() => {
          if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
          }
        }, 800);
      });
    });

    const style = document.createElement('style');
    style.textContent = `
      @keyframes rippleEffect {
        0% { transform: scale(0); opacity: 1; }
        100% { transform: scale(4); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  })();

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
    const EMAIL_TO = 'tuo-indirizzo@esempio.it';
    const form = document.getElementById('contactForm');
    if (!form) return;
    const status = document.createElement('div'); 
    status.className = 'form-status'; 
    form.prepend(status);
    const submitBtn = form.querySelector('button[type="submit"]');

    function showStatus(msg, ok = true) {
      status.textContent = msg; 
      status.style.color = ok ? 'var(--primary)' : '#f66';
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

      try {
        const last = localStorage.getItem('lastContactSubmit');
        if (last && (Date.now() - Number(last) < 24 * 3600 * 1000)) {
          showStatus('Hai già inviato un messaggio nelle ultime 24 ore. Riprova più tardi.', false); return;
        }
      } catch (err) {}

      if (submitBtn) { submitBtn.disabled = true; }
      showStatus('Invio in corso...');

      const payload = { name, email, message }; 
      let sent = false;
      try {
        const res = await fetch('/send-contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) { sent = true; }
      } catch (err) {
        sent = false;
      }

      if (!sent) {
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
      'Luca Moretti', 'Sofia Delgado', 'Aaron Mitchell', 'Mei Lin', 'Carlos Fernandez', 'Aisha Rahman',
      'Jonas Bergstrom', 'Maya Kapoor', 'Daniel OConnor', 'Hana Suzuki', 'Pierre Laurent', 'Natalia Kowalska',
      'Liam Roberts', 'Amira Haddad', 'Viktor Petrov', 'Isabella Costa', 'Marcus Johansson', 'Chloe Bennett',
      'Farid Al-Masri', 'Elena Popescu', 'Nathan King', 'Giada Romano', 'Henry Collins', 'Sara El-Sayed',
      'Dmitri Volkov', 'Yara Mendes', 'Oliver Hughes', 'Noemi Santoro', 'Haruto Yamamoto', 'Laila Khan'
    ];

    const reviews = [
      { text: 'Servizio impeccabile e personale super qualificato. Il mio barbiere di fiducia a Trieste!', rating: 5 },
      { text: 'Taglio perfetto e barba curata nei minimi dettagli. Argjend è un vero artista.', rating: 5 },
      { text: 'Atmosfera accogliente e grande professionalità. Non posso che consigliarlo.', rating: 5 },
      { text: 'Il miglior barber shop della città. Precisione, stile e un ottimo caffè.', rating: 5 },
      { text: 'Sono cliente da anni e non mi ha mai deluso. Il top per barba e capelli.', rating: 5 }
    ];

    function shuffle(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }

    function renderReviews() {
      const shuffledReviews = shuffle(reviews).slice(0, 4);
      let html = '';
      shuffledReviews.forEach(review => {
        const randomName = names[Math.floor(Math.random() * names.length)];
        const randomDate = new Date(
          2015 + Math.floor(Math.random() * (new Date().getFullYear() - 2014)),
          Math.floor(Math.random() * 12),
          Math.floor(Math.random() * 28) + 1
        ).toLocaleDateString('it-IT');

        html += `
          <div class="flip-card" style="height: 200px; cursor: pointer;">
            <div class="flip-card-inner">
              <div class="flip-card-front review-card interactive">
                <h3>${randomName}</h3>
                <p>"${review.text}"</p>
                <div class="stars">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
              </div>
              <div class="flip-card-back review-card">
                <div style="text-align: center;">
                  <p>Recensito il:</p>
                  <p><strong>${randomDate}</strong></p>
                </div>
              </div>
            </div>
          </div>
        `;
      });
      reviewsContainer.innerHTML = html;

      const newCards = reviewsContainer.querySelectorAll('.interactive');
      newCards.forEach(el => {
        if (!el.classList.contains('interactive-bound')) {
          el.classList.add('interactive-bound');
          el.addEventListener('pointermove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / el.offsetHeight) * 100;
            el.style.setProperty('--mx', x + '%');
            el.style.setProperty('--my', y + '%');
          });
          el.addEventListener('pointerleave', () => {
            el.style.setProperty('--mx', '50%');
            el.style.setProperty('--my', '50%');
          });
        }
      });
      
      const flipCards = reviewsContainer.querySelectorAll('.flip-card');
      flipCards.forEach(card => {
        card.addEventListener('click', (e) => {
          if (e.target.tagName === 'A') return;
          e.preventDefault();
          e.stopPropagation();
          card.classList.toggle('flipped');
        });
      });
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

  // Flip Card System
  (function() {
    const flipCards = document.querySelectorAll('.flip-card');
    
    if (!flipCards.length) return;

    // Handle card clicks
    flipCards.forEach(card => {
      card.addEventListener('click', (e) => {
        // Don't flip if clicking on a link inside the back
        if (e.target.tagName === 'A' || e.target.closest('.flip-card-back a')) {
          return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        // Toggle flip state
        card.classList.toggle('flipped');
      });
    });

    // Close all flipped cards when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.flip-card')) {
        flipCards.forEach(card => {
          card.classList.remove('flipped');
        });
      }
    });

    // Close flipped cards on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        flipCards.forEach(card => {
          card.classList.remove('flipped');
        });
      }
    });

    // Handle link clicks to prevent event bubbling
    document.querySelectorAll('.flip-card-back a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    });
  })();
  (function() {
    const popup = document.getElementById('service-popup');
    const popupTitle = document.getElementById('service-title');
    const popupDescription = document.getElementById('service-description');
    const popupPhone = document.getElementById('service-phone');
    const popupPrice = document.getElementById('service-price');
    const closeButtons = document.querySelectorAll('.elegant-popup-close, .elegant-popup-close-btn');
    
    if (!popup) return;

    function openPopup(serviceData) {
      popupTitle.textContent = serviceData.title;
      popupDescription.textContent = serviceData.description;
      popupPhone.href = `tel:${serviceData.phone}`;
      popupPrice.textContent = serviceData.price || '';
      
      popup.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closePopup() {
      popup.classList.remove('active');
      document.body.style.overflow = '';
    }

    // Handle clicks on price cards
    document.addEventListener('click', (e) => {
      const priceCard = e.target.closest('.price-card');
      if (!priceCard) return;

      const serviceName = priceCard.querySelector('h3')?.textContent;
      const description = priceCard.dataset.description;
      const phone = priceCard.dataset.phone;
      const price = priceCard.querySelector('.price-badge')?.textContent;

      if (serviceName && description && phone) {
        openPopup({
          title: serviceName,
          description: description,
          phone: phone,
          price: price
        });
      }
    });

    // Handle close buttons
    closeButtons.forEach(button => {
      button.addEventListener('click', closePopup);
    });

    // Close on overlay click
    popup.addEventListener('click', (e) => {
      if (e.target === popup || e.target.classList.contains('elegant-popup-overlay')) {
        closePopup();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && popup.classList.contains('active')) {
        closePopup();
      }
    });
  })();

  // Click-to-open for service details
  (function() {
    const detailsElements = document.querySelectorAll('details.card');
    if (!detailsElements.length) return;

    detailsElements.forEach(details => {
      details.addEventListener('toggle', (event) => {
        if (details.open) {
          // Close other open details
          detailsElements.forEach(d => {
            if (d !== details && d.open) {
              d.removeAttribute('open');
            }
          });
        }
      });

      // We need to prevent the default behavior to animate the closing.
      const summary = details.querySelector('summary');
      if(summary) {
        summary.addEventListener('click', (e) => {
          if (details.open) {
            e.preventDefault();
            details.removeAttribute('open');
          }
        });
      }
    });
  })();
})();
