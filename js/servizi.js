document.addEventListener('DOMContentLoaded', () => {
  const isServiziPage = document.getElementById('servizi-interattivi');
  if (!isServiziPage) return;

  const genderButtons = document.querySelectorAll('.gender-selection .btn');
  const categoryButtons = document.querySelectorAll('.category-btn');
  const servicesWrappers = document.querySelectorAll('.services-wrapper');
  const allPriceCardContainers = document.querySelectorAll('.price-cards-container');

  function updateState(gender, category) {
    // Deactivate everything first
    genderButtons.forEach(btn => btn.classList.remove('active'));
    servicesWrappers.forEach(wrapper => wrapper.classList.remove('active'));
    categoryButtons.forEach(btn => btn.classList.remove('active'));
    allPriceCardContainers.forEach(container => container.classList.remove('active'));

    if (gender) {
      const genderButton = document.querySelector(`.gender-selection .btn[data-gender="${gender}"]`);
      const wrapper = document.getElementById(`services-${gender}`);
      
      if (genderButton) genderButton.classList.add('active');
      if (wrapper) {
        wrapper.classList.add('active');
        
        if (category) {
          const categoryButton = wrapper.querySelector(`.category-btn[data-category="${category}"]`);
          const categoryContainer = document.getElementById(category);
          
          if (categoryButton) categoryButton.classList.add('active');
          if (categoryContainer) categoryContainer.classList.add('active');
        }
      }
    }
  }

  // --- Event Handlers ---

  function handleGenderClick(event) {
    event.preventDefault();
    const clickedButton = event.currentTarget;
    const gender = clickedButton.dataset.gender;

    // De-flip all cards
    document.querySelectorAll('.flip-card.flipped').forEach(card => card.classList.remove('flipped'));

    // If clicking the active button, deactivate everything
    if (clickedButton.classList.contains('active')) {
      updateState(null, null);
    } else {
      // Activate the new gender, but no specific category yet
      updateState(gender, null);
    }
  }

  function handleCategoryClick(event) {
    event.preventDefault();
    const clickedButton = event.currentTarget;
    const category = clickedButton.dataset.category;
    const parentWrapper = clickedButton.closest('.services-wrapper');
    const activeGender = parentWrapper ? parentWrapper.id.replace('services-', '') : null;

    // De-flip all cards
    document.querySelectorAll('.flip-card.flipped').forEach(card => card.classList.remove('flipped'));
    
    // If clicking the active category, deactivate it
    if (clickedButton.classList.contains('active')) {
      updateState(activeGender, null);
    } else {
      // Activate the new category
      updateState(activeGender, category);
    }
  }
  
  function handleCardClick(event) {
    // Don't flip if a link inside the card was clicked
    if (event.target.closest('a')) {
      return;
    }
    const card = event.currentTarget;
    card.classList.toggle('flipped');
  }

  // --- Initialization ---

  genderButtons.forEach(button => {
    button.addEventListener('click', handleGenderClick);
  });

  categoryButtons.forEach(button => {
    button.addEventListener('click', handleCategoryClick);
  });
  
  // Use event delegation for flip cards
  isServiziPage.addEventListener('click', function(event) {
      const card = event.target.closest('.flip-card');
      if (card && isServiziPage.contains(card)) {
          handleCardClick.call(card, event);
      }
  });
});