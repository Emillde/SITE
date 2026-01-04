document.addEventListener('DOMContentLoaded', () => {
  const scrollIndicator = document.getElementById('scrollIndicator');
  const quickNav = document.getElementById('quickNav');
  
  if (!scrollIndicator) return;

  // Handle scroll indicator click
  scrollIndicator.addEventListener('click', () => {
    if (quickNav) {
      quickNav.scrollIntoView({ behavior: 'smooth' });
    } else {
      const nextSection = scrollIndicator.nextElementSibling;
      if (nextSection) {
        nextSection.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
      }
    }
  });

  // Hide scroll indicator immediately when user starts scrolling
  let userHasScrolled = false;
  window.addEventListener('scroll', () => {
    if (!userHasScrolled && window.scrollY > 5) {
      userHasScrolled = true;
      scrollIndicator.style.opacity = '0';
      scrollIndicator.style.pointerEvents = 'none';
      setTimeout(() => {
        scrollIndicator.style.display = 'none';
      }, 300);
    }
  });

  // Add entrance animation
  scrollIndicator.style.opacity = '0';
  scrollIndicator.style.transform = 'translateX(-50%) translateY(20px)';
  
  setTimeout(() => {
    scrollIndicator.style.opacity = '1';
    scrollIndicator.style.transform = 'translateX(-50%) translateY(0)';
  }, 1000);
});
