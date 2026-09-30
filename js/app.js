/**
 * NOVA | Gaming Directory — Minimalist Application Logic
 * Supports dynamic filtering, category tabs, hero carousel,
 * favourites management, recommended slider, and modal interactions.
 */

const storageKeys = {
  favourites: 'nova-game-favourites',
  preferences: 'nova-preferences',
  theme: 'nova-theme',
};

const heroSlides = [
  {
    image: 'https://cdn.akamai.steamstatic.com/steam/apps/1086940/header.jpg',
    alt: "Official Baldur's Gate 3 store artwork",
    eyebrow: 'Gaming Portal',
    headline: 'Baldur\'s Gate 3',
    text: 'Shape a party, make consequential choices, and explore an expansive fantasy role-playing adventure.',
  },
  {
    image: 'https://cdn.akamai.steamstatic.com/steam/apps/1551360/header.jpg',
    alt: 'Official Forza Horizon 5 store artwork',
    eyebrow: 'Open-World Racing',
    headline: 'Forza Horizon 5',
    text: 'Race and roam across a festival-scale open world, with events for every kind of driving mood.',
  },
  {
    image: 'https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg',
    alt: 'Official Cyberpunk 2077 store artwork',
    eyebrow: 'Featured RPG',
    headline: 'Cyberpunk 2077',
    text: 'Enter Night City for a character-driven science-fiction story shaped by your choices.',
  },
];

const state = {
  experiences: [],
  favourites: [],
  searchTerm: '',
  category: 'All',
  location: 'All Locations',
  sort: 'Recommended',
  featured: 'All',
  heroIndex: 0,
};

const favouritesSet = new Set();

const elements = {
  header: document.getElementById('siteHeader'),
  searchInput: document.getElementById('searchInput'),
  searchButton: document.getElementById('searchButton'),
  resetSearchButton: document.getElementById('resetSearchButton'),
  categoryFilter: document.getElementById('categoryFilter'),
  locationFilter: document.getElementById('locationFilter'),
  sortFilter: document.getElementById('sortFilter'),
  featuredFilter: document.getElementById('featuredFilter'),
  clearFiltersButton: document.getElementById('clearFiltersButton'),
  categoryTabs: document.getElementById('categoryTabs'),
  resultsContainer: document.getElementById('resultsContainer'),
  resultsCount: document.getElementById('resultsCount'),
  favouritesContainer: document.getElementById('favouritesContainer'),
  navFavBadge: document.getElementById('navFavBadge'),
  mobileFavBadge: document.getElementById('mobileFavBadge'),
  modal: document.getElementById('experienceModal'),
  modalContent: document.getElementById('modalContent'),
  modalClose: document.querySelector('.modal-close'),
  contactForm: document.getElementById('contactForm'),
  formSuccessState: document.getElementById('formSuccessState'),
  resetFormButton: document.getElementById('resetFormButton'),
  navToggle: document.querySelector('.nav-toggle'),
  mobileMenu: document.querySelector('.mobile-menu'),

  // Theme Toggles
  themeToggle: document.getElementById('themeToggle'),
  mobileThemeToggle: document.getElementById('mobileThemeToggle'),
  mobileThemeText: document.getElementById('mobileThemeText'),
  mobileThemeIndicator: document.getElementById('mobileThemeIndicator'),
  
  // Hero Elements
  heroFrame: document.getElementById('heroFrame'),
  heroBgImage: document.getElementById('heroMainImage'),
  heroHeadline: document.querySelector('.hero-headline'),
  heroEyebrow: document.querySelector('.hero-eyebrow'),
  heroLeadText: document.querySelector('.hero-lead-text'),
  heroIndicators: document.getElementById('heroIndicators'),
  
  // Recommended Slider
  recTrack: document.getElementById('recommendedTrack'),
  recScrollPrev: document.getElementById('recScrollPrev'),
  recScrollNext: document.getElementById('recScrollNext'),
};

const HERO_IMAGE_OPACITY = '0.42';
const AUTO_SLIDE_DELAY = 5000;
let autoSlideTimer = null;

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
  initTheme();
  bindEvents();
  loadPreferences();
  loadFavourites();
  loadExperiences();
  updateHeaderState();
  updateFavBadges();
  startHeroAutoSlide();
  initContactVideo();
}

function bindEvents() {
  // Live Search
  elements.searchInput?.addEventListener('input', (event) => {
    state.searchTerm = event.target.value.trim();
    renderExperiences();
    savePreferences();
  });

  // Search Action Button
  elements.searchButton?.addEventListener('click', () => {
    const target = document.getElementById('explore');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    renderExperiences();
  });

  // Reset Search
  elements.resetSearchButton?.addEventListener('click', () => {
    state.searchTerm = '';
    if (elements.searchInput) elements.searchInput.value = '';
    renderExperiences();
    savePreferences();
  });

  // Category Filter Dropdown
  elements.categoryFilter?.addEventListener('change', (event) => {
    state.category = event.target.value;
    syncCategoryTabs(state.category);
    renderExperiences();
    savePreferences();
  });

  // Category Tabs Strip
  elements.categoryTabs?.addEventListener('click', (event) => {
    const tabBtn = event.target.closest('.cat-pill-tab');
    if (!tabBtn) return;
    
    const cat = tabBtn.dataset.cat;
    state.category = cat;
    
    if (elements.categoryFilter) {
      elements.categoryFilter.value = cat;
    }
    
    syncCategoryTabs(cat);
    renderExperiences();
    savePreferences();
  });

  // Location Filter
  elements.locationFilter?.addEventListener('change', (event) => {
    state.location = event.target.value;
    renderExperiences();
    savePreferences();
  });

  // Sort Filter
  elements.sortFilter?.addEventListener('change', (event) => {
    state.sort = event.target.value;
    renderExperiences();
    savePreferences();
  });

  elements.featuredFilter?.addEventListener('change', (event) => {
    state.featured = event.target.value;
    renderExperiences();
    savePreferences();
  });

  // Clear All Filters
  elements.clearFiltersButton?.addEventListener('click', resetFilters);

  // Mobile Navigation Toggle
  elements.navToggle?.addEventListener('click', () => {
    const isOpen = elements.mobileMenu.classList.toggle('is-open');
    elements.navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  document.querySelectorAll('.mobile-menu a').forEach((link) => {
    link.addEventListener('click', () => {
      elements.mobileMenu.classList.remove('is-open');
      elements.navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Theme Toggles (Desktop & Mobile)
  elements.themeToggle?.addEventListener('click', toggleTheme);
  elements.mobileThemeToggle?.addEventListener('click', toggleTheme);

  // Hero Indicators (dots) & Hover Pause
  elements.heroIndicators?.addEventListener('click', (event) => {
    const dot = event.target.closest('.hero-indicator-dot');
    if (dot) {
      const idx = Number(dot.dataset.slide);
      changeHeroSlide(idx);
      startHeroAutoSlide();
    }
  });

  elements.heroFrame?.addEventListener('mouseenter', stopHeroAutoSlide);
  elements.heroFrame?.addEventListener('mouseleave', startHeroAutoSlide);

  // Mobile Touch Swipe Support for Hero
  let touchStartX = 0;
  let touchEndX = 0;

  elements.heroFrame?.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    stopHeroAutoSlide();
  }, { passive: true });

  elements.heroFrame?.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const swipeDiff = touchEndX - touchStartX;
    if (swipeDiff < -40) {
      changeHeroSlide((state.heroIndex + 1) % heroSlides.length);
    } else if (swipeDiff > 40) {
      changeHeroSlide((state.heroIndex - 1 + heroSlides.length) % heroSlides.length);
    }
    startHeroAutoSlide();
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 860 && elements.mobileMenu?.classList.contains('is-open')) {
      elements.mobileMenu.classList.remove('is-open');
      elements.navToggle?.setAttribute('aria-expanded', 'false');
    }
  });

  // Recommended Slider Controls
  elements.recScrollPrev?.addEventListener('click', () => {
    elements.recTrack?.scrollBy({ left: -330, behavior: 'smooth' });
  });

  elements.recScrollNext?.addEventListener('click', () => {
    elements.recTrack?.scrollBy({ left: 330, behavior: 'smooth' });
  });

  // Global Click Delegations (Favourites, Details, Modal Close)
  document.addEventListener('click', (event) => {
    const favouriteButton = event.target.closest('.favourite-btn');
    const detailButton = event.target.closest('.details-btn');
    const modalBackdrop = event.target.closest('[data-close-modal="true"]');

    if (favouriteButton) {
      const id = Number(favouriteButton.dataset.id);
      toggleFavourite(id, favouriteButton);
      return;
    }

    if (detailButton) {
      const id = Number(detailButton.dataset.id);
      openExperienceModal(id);
      return;
    }

    if (modalBackdrop) {
      closeExperienceModal();
      return;
    }

    if (event.target === elements.modal) {
      closeExperienceModal();
    }
  });

  elements.modalClose?.addEventListener('click', closeExperienceModal);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !elements.modal.classList.contains('hidden')) {
      closeExperienceModal();
    }
  });

  window.addEventListener('scroll', updateHeaderState);

  // Contact Form Validation
  elements.contactForm?.addEventListener('submit', (event) => {
    event.preventDefault();

    const isValid = validateForm();
    if (!isValid) return;

    elements.contactForm.classList.add('hidden');
    elements.formSuccessState.classList.remove('hidden');
  });

  elements.resetFormButton?.addEventListener('click', resetFormState);
}

function updateHeaderState() {
  if (window.scrollY > 20) {
    elements.header?.classList.add('scrolled');
  } else {
    elements.header?.classList.remove('scrolled');
  }
}

function startHeroAutoSlide() {
  stopHeroAutoSlide();
  autoSlideTimer = setInterval(() => {
    const nextIdx = (state.heroIndex + 1) % heroSlides.length;
    changeHeroSlide(nextIdx);
  }, AUTO_SLIDE_DELAY);
}

function stopHeroAutoSlide() {
  if (autoSlideTimer) {
    clearInterval(autoSlideTimer);
    autoSlideTimer = null;
  }
}

function changeHeroSlide(index) {
  state.heroIndex = index;
  const slide = heroSlides[index];
  if (!slide) return;

  if (elements.heroBgImage) {
    elements.heroBgImage.style.opacity = '0.08';
    setTimeout(() => {
      elements.heroBgImage.src = slide.image;
      elements.heroBgImage.alt = slide.alt;
      elements.heroBgImage.style.opacity = HERO_IMAGE_OPACITY;
    }, 220);
  }

  if (elements.heroEyebrow) elements.heroEyebrow.innerHTML = slide.eyebrow;
  if (elements.heroHeadline) elements.heroHeadline.innerHTML = slide.headline;
  if (elements.heroLeadText) elements.heroLeadText.innerHTML = slide.text;

  const dots = elements.heroIndicators?.querySelectorAll('.hero-indicator-dot');
  dots?.forEach((dot, idx) => {
    dot.classList.toggle('active', idx === index);
  });
}

function syncCategoryTabs(selectedCat) {
  const tabs = elements.categoryTabs?.querySelectorAll('.cat-pill-tab');
  tabs?.forEach((tab) => {
    const isMatch = tab.dataset.cat === selectedCat;
    tab.classList.toggle('active', isMatch);
    tab.setAttribute('aria-selected', String(isMatch));
  });
}

async function loadExperiences() {
  showLoadingState();

  try {
    const response = await fetch('./data/games.json');

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const experiences = await response.json();
    state.experiences = Array.isArray(experiences) ? experiences : [];

    if (state.experiences.length === 0) {
      showEmptyState();
      return;
    }

    renderExperiences();
    renderRecommendedGames();
    renderFavourites();
  } catch (error) {
    console.error('Error loading experiences:', error);
    showErrorState();
  }
}

function showLoadingState() {
  const skeletons = Array.from({ length: 6 }, () => `
    <div class="skeleton-card">
      <div class="skeleton-shimmer skeleton-image"></div>
      <div class="skeleton-shimmer skeleton-line short"></div>
      <div class="skeleton-shimmer skeleton-line medium"></div>
      <div class="skeleton-shimmer skeleton-line"></div>
      <div class="skeleton-shimmer skeleton-line short"></div>
    </div>
  `).join('');

  if (elements.resultsContainer) {
    elements.resultsContainer.innerHTML = `
      <div class="loading-state" aria-live="polite">
        <h3>Curating standout picks...</h3>
        <p>Loading handpicked games, genres, and must-try worlds.</p>
        <div class="loading-grid">${skeletons}</div>
      </div>
    `;
  }
}

function showErrorState() {
  if (elements.resultsContainer) {
    elements.resultsContainer.innerHTML = `
      <div class="error-state" aria-live="polite">
        <h3>Could not load the library</h3>
        <p>There was a problem retrieving the gaming directory. Please try again.</p>
        <button class="primary-btn" type="button" id="retryLoadButton">Retry Now</button>
      </div>
    `;

    document.getElementById('retryLoadButton')?.addEventListener('click', loadExperiences);
  }
}

function showEmptyState() {
  if (elements.resultsContainer) {
    elements.resultsContainer.innerHTML = `
      <div class="empty-state" aria-live="polite">
        <h3>No matching titles found</h3>
        <p>Try clearing your filters or searching for another game, genre, or platform.</p>
        <button class="primary-btn" type="button" id="emptyStateButton">Reset Filters</button>
      </div>
    `;

    document.getElementById('emptyStateButton')?.addEventListener('click', resetFilters);
  }
}

function renderExperiences() {
  const filteredExperiences = filterExperiences();

  const allActive =
    !state.searchTerm &&
    state.category === 'All' &&
    state.location === 'All Locations' &&
    state.sort === 'Recommended';

  if (elements.resultsCount) {
    elements.resultsCount.textContent = allActive
      ? `${state.experiences.length} curated games in the library`
      : `${filteredExperiences.length} ${filteredExperiences.length === 1 ? 'game found' : 'games found'}`;
  }

  if (!filteredExperiences.length) {
    showEmptyState();
    return;
  }

  const cardsMarkup = filteredExperiences
    .map((experience) => createExperienceCardMarkup(experience))
    .join('');

  if (elements.resultsContainer) {
    elements.resultsContainer.innerHTML = cardsMarkup;
  }
}

function renderRecommendedGames() {
  if (!elements.recTrack) return;

  const featuredGames = state.experiences.filter((game) => game.featured).slice(0, 6);
  elements.recTrack.innerHTML = featuredGames
    .map((game) => `
      <article class="rec-card">
        <div class="rec-img-wrap">
          <img src="${game.image}" alt="${game.imageAlt || game.name}" loading="lazy" />
          <span class="rec-country-badge">${game.category}</span>
        </div>
        <div class="rec-card-body">
          <h3>${game.name}</h3>
          <p>${game.description}</p>
          <div class="rec-card-footer">
            <button class="rec-action-link details-btn" type="button" data-id="${game.id}">
              View Details <span class="arrow" aria-hidden="true">→</span>
            </button>
            <a class="rec-price-pill" href="${game.imageSourceUrl}" target="_blank" rel="noreferrer">Steam Store</a>
          </div>
        </div>
      </article>
    `)
    .join('');
}

function filterExperiences() {
  const searchTerm = state.searchTerm.toLowerCase();

  const filtered = state.experiences.filter((experience) => {
    const matchesSearch =
      !searchTerm ||
      [
        experience.name,
        experience.description,
        experience.location,
        experience.category,
        ...(experience.platforms || []),
        ...(experience.tags || []),
      ]
        .join(' ')
        .toLowerCase()
        .includes(searchTerm);

    const matchesCategory = state.category === 'All' || experience.category === state.category;
    const matchesLocation =
      state.location === 'All Locations' || (experience.platforms || [experience.location]).includes(state.location);
    const matchesFeatured = state.featured !== 'Featured' || experience.featured === true;

    return matchesSearch && matchesCategory && matchesLocation && matchesFeatured;
  });

  const sorted = [...filtered];

  switch (state.sort) {
    case 'Name A-Z':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'Name Z-A':
      sorted.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'Category A-Z':
      sorted.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
      break;
    case 'Recommended':
    default:
      sorted.sort((a, b) => Number(b.featured) - Number(a.featured));
      break;
  }

  return sorted;
}

function createExperienceCardMarkup(experience) {
  const isSaved = isFavourite(experience.id);
  const platformLabel = experience.platforms?.length > 1
    ? `${experience.platforms[0]} + ${experience.platforms.length - 1}`
    : experience.platforms?.[0] || experience.location;

  return `
    <article class="experience-card" data-id="${experience.id}">
      <div class="card-image-wrap">
        <img src="${experience.image}" alt="${experience.imageAlt || experience.name}" loading="lazy" />
        <span class="category-badge">${experience.category}</span>
        <button
          class="favourite-btn ${isSaved ? 'active' : ''}"
          type="button"
          data-id="${experience.id}"
          aria-label="${isSaved ? 'Remove from favourites' : 'Save to favourites'}"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21s-8.5-5.2-10.5-9.6C.7 9.2 2.2 5 6.2 5c2 0 3.2 1.1 4.1 2.4C11.2 6.1 12.4 5 14.4 5c4 0 5.5 4.2 4.7 6.4C20.5 15.8 12 21 12 21Z" />
          </svg>
        </button>
      </div>
      <div class="card-content">
        <div class="card-meta">
          <span class="card-location">
            <span class="location-dot" aria-hidden="true"></span>
            ${platformLabel}
          </span>
          <span class="card-rating">Steam Store</span>
        </div>
        <h3>${experience.name}</h3>
        <p>${experience.description}</p>
        <div class="card-footer">
          <a class="price-tag" href="${experience.imageSourceUrl}" target="_blank" rel="noreferrer">View on Steam</a>
          <button class="secondary-btn details-btn" type="button" data-id="${experience.id}">
            View Details
          </button>
        </div>
      </div>
    </article>
  `;
}

function resetFilters() {
  state.searchTerm = '';
  state.category = 'All';
  state.location = 'All Locations';
  state.sort = 'Recommended';
  state.featured = 'All';

  if (elements.searchInput) elements.searchInput.value = '';
  if (elements.categoryFilter) elements.categoryFilter.value = 'All';
  if (elements.locationFilter) elements.locationFilter.value = 'All Locations';
  if (elements.sortFilter) elements.sortFilter.value = 'Recommended';
  if (elements.featuredFilter) elements.featuredFilter.value = 'All';

  syncCategoryTabs('All');
  renderExperiences();
  savePreferences();
}

function initTheme() {
  let savedTheme = null;
  try {
    savedTheme = localStorage.getItem(storageKeys.theme);
  } catch (error) {
    console.warn('Unable to read theme from localStorage:', error);
  }

  const initialTheme = savedTheme || 'dark';
  applyTheme(initialTheme, false);

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(storageKeys.theme)) {
        applyTheme(e.matches ? 'dark' : 'light', false);
      }
    });
  }
}

function toggleTheme() {
  const isCurrentlyDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const newTheme = isCurrentlyDark ? 'light' : 'dark';
  applyTheme(newTheme, true);
}

function applyTheme(theme, save = true) {
  const isDark = theme === 'dark';

  if (isDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
    elements.themeToggle?.setAttribute('aria-label', 'Switch to light mode');
    elements.themeToggle?.setAttribute('title', 'Switch to light mode');
    if (elements.mobileThemeText) elements.mobileThemeText.textContent = 'Appearance: Dark Mode';
    if (elements.mobileThemeIndicator) elements.mobileThemeIndicator.textContent = '🌙';
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    elements.themeToggle?.setAttribute('aria-label', 'Switch to dark mode');
    elements.themeToggle?.setAttribute('title', 'Switch to dark mode');
    if (elements.mobileThemeText) elements.mobileThemeText.textContent = 'Appearance: Light Mode';
    if (elements.mobileThemeIndicator) elements.mobileThemeIndicator.textContent = '☀️';
  }

  if (save) {
    try {
      localStorage.setItem(storageKeys.theme, theme);
    } catch (error) {
      console.warn('Unable to save theme to localStorage:', error);
    }
  }
}

function savePreferences() {
  try {
    localStorage.setItem(
      storageKeys.preferences,
      JSON.stringify({
        searchTerm: state.searchTerm,
        category: state.category,
        location: state.location,
        sort: state.sort,
        featured: state.featured,
      })
    );
  } catch (error) {
    console.warn('Unable to save preferences:', error);
  }
}

function loadPreferences() {
  try {
    const raw = localStorage.getItem(storageKeys.preferences);
    if (!raw) return;

    const preferences = JSON.parse(raw);
    if (typeof preferences !== 'object' || preferences === null) return;

    state.searchTerm = typeof preferences.searchTerm === 'string' ? preferences.searchTerm : '';
    const categories = ['All', 'RPG', 'Action', 'FPS', 'Adventure', 'Puzzle', 'Simulation', 'Co-op', 'Strategy', 'Racing'];
    const platforms = ['All Locations', 'PC', 'PlayStation', 'Xbox', 'Switch', 'Mobile'];
    const sortOptions = ['Recommended', 'Name A-Z', 'Name Z-A', 'Category A-Z'];
    const featuredOptions = ['All', 'Featured'];
    state.category = categories.includes(preferences.category) ? preferences.category : 'All';
    state.location = platforms.includes(preferences.location) ? preferences.location : 'All Locations';
    state.sort = sortOptions.includes(preferences.sort) ? preferences.sort : 'Recommended';
    state.featured = featuredOptions.includes(preferences.featured) ? preferences.featured : 'All';

    if (elements.searchInput) elements.searchInput.value = state.searchTerm;
    if (elements.categoryFilter) elements.categoryFilter.value = state.category;
    if (elements.locationFilter) elements.locationFilter.value = state.location;
    if (elements.sortFilter) elements.sortFilter.value = state.sort;
    if (elements.featuredFilter) elements.featuredFilter.value = state.featured;

    syncCategoryTabs(state.category);
  } catch (error) {
    console.warn('Unable to load preferences:', error);
  }
}

function saveFavourites() {
  try {
    localStorage.setItem(storageKeys.favourites, JSON.stringify([...favouritesSet]));
  } catch (error) {
    console.warn('Unable to save favourites:', error);
  }
}

function loadFavourites() {
  try {
    const raw = localStorage.getItem(storageKeys.favourites);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;

    favouritesSet.clear();
    parsed.forEach((id) => {
      if (Number.isFinite(Number(id))) {
        favouritesSet.add(Number(id));
      }
    });
    state.favourites = [...favouritesSet];
    updateFavBadges();
  } catch (error) {
    console.warn('Unable to load favourites:', error);
  }
}

function isFavourite(id) {
  return favouritesSet.has(id);
}

function toggleFavourite(id, buttonElement) {
  const isNowFavourite = !favouritesSet.has(id);

  if (isNowFavourite) {
    favouritesSet.add(id);
  } else {
    favouritesSet.delete(id);
  }

  state.favourites = [...favouritesSet];
  saveFavourites();
  updateFavBadges();
  renderExperiences();
  renderFavourites();

  // Sync all favourite buttons on the page with this ID, including modal buttons
  document.querySelectorAll(`.favourite-btn[data-id="${id}"]`).forEach((btn) => {
    btn.classList.toggle('active', isNowFavourite);
    btn.setAttribute(
      'aria-label',
      isNowFavourite ? 'Remove from favourites' : 'Save to favourites'
    );
    btn.setAttribute(
      'title',
      isNowFavourite ? 'Remove from favourites' : 'Save to favourites'
    );
    const labelSpan = btn.querySelector('.modal-fav-text');
    if (labelSpan) {
      labelSpan.textContent = isNowFavourite ? 'Saved in Favourites' : 'Add to Favourites';
    }
    btn.classList.add('is-animating');
    setTimeout(() => btn.classList.remove('is-animating'), 350);
  });
}

function updateFavBadges() {
  const count = String(favouritesSet.size);
  if (elements.navFavBadge) elements.navFavBadge.textContent = count;
  if (elements.mobileFavBadge) elements.mobileFavBadge.textContent = count;
}

function renderFavourites() {
  if (!elements.favouritesContainer) return;

  const savedExperiences = state.experiences.filter((experience) => isFavourite(experience.id));

  if (!savedExperiences.length) {
    elements.favouritesContainer.innerHTML = `
      <div class="empty-state">
        <h3>Nothing saved yet</h3>
        <p>Explore the directory above and tap the heart icon to build your own game shortlist.</p>
        <a href="#explore" class="primary-btn" role="button">Discover Titles</a>
      </div>
    `;
    return;
  }

  const favouritesMarkup = savedExperiences
    .map(
      (experience) => `
      <article class="favorite-card">
        <div class="card-image-wrap">
          <img src="${experience.image}" alt="${experience.imageAlt || experience.name}" loading="lazy" />
          <span class="category-badge">${experience.category}</span>
          <button
            class="favourite-btn active"
            type="button"
            data-id="${experience.id}"
            aria-label="Remove from favourites"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 21s-8.5-5.2-10.5-9.6C.7 9.2 2.2 5 6.2 5c2 0 3.2 1.1 4.1 2.4C11.2 6.1 12.4 5 14.4 5c4 0 5.5 4.2 4.7 6.4C20.5 15.8 12 21 12 21Z" />
            </svg>
          </button>
        </div>
        <div class="card-content">
          <div class="card-meta">
            <span class="card-location">
              <span class="location-dot" aria-hidden="true"></span>
              ${experience.location}
            </span>
            <span class="card-rating">Steam Store</span>
          </div>
          <h3>${experience.name}</h3>
          <p>${experience.description}</p>
          <div class="card-footer">
            <span class="price-tag">${experience.priceRange}</span>
            <button class="secondary-btn details-btn" type="button" data-id="${experience.id}">
              View Details
            </button>
          </div>
        </div>
      </article>
    `
    )
    .join('');

  elements.favouritesContainer.innerHTML = favouritesMarkup;
}

function openExperienceModal(id) {
  const experience = state.experiences.find((item) => item.id === id);
  if (!experience || !elements.modalContent) return;

  const isSaved = isFavourite(experience.id);

  // Sync header favorite button
  const modalHeaderFav = document.getElementById('modalHeaderFavBtn');
  if (modalHeaderFav) {
    modalHeaderFav.dataset.id = String(experience.id);
    modalHeaderFav.classList.toggle('active', isSaved);
    modalHeaderFav.setAttribute('aria-label', isSaved ? 'Remove from favourites' : 'Save to favourites');
    modalHeaderFav.setAttribute('title', isSaved ? 'Remove from favourites' : 'Save to favourites');
  }

  elements.modalContent.innerHTML = `
    <div class="modal-body">
      <div class="modal-image">
        <img src="${experience.image}" alt="${experience.imageAlt || experience.name}" />
      </div>
      <div class="modal-content">
        <span class="modal-tag">${experience.category}</span>
        <h3 id="modalTitle">${experience.name}</h3>
        <div class="modal-meta">
          <span>${experience.platforms?.join(', ') || experience.location}</span>
          <span>${experience.priceRange}</span>
        </div>
        <p class="modal-description">${experience.description}</p>
        <div class="modal-tags">
          ${(experience.tags || []).map((tag) => `<span>#${tag}</span>`).join('')}
        </div>
        <div class="modal-why">
          <strong>Why Play</strong>
          <p>${experience.whyVisit || 'Explore the official store page for details about this game.'}</p>
        </div>
        <div class="modal-actions">
          <div class="modal-actions-right">
            <button type="button" class="secondary-btn modal-dismiss-btn" data-close-modal="true">Close</button>
            <a class="primary-btn modal-store-btn" href="${experience.imageSourceUrl || '#'}" target="_blank" rel="noreferrer">
              <span>Open Store</span>
              <span class="btn-arrow" aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  `;

  elements.modal?.classList.remove('hidden');
  elements.modal?.setAttribute('aria-hidden', 'false');
}

function closeExperienceModal() {
  elements.modal?.classList.add('hidden');
  elements.modal?.setAttribute('aria-hidden', 'true');
}

function validateForm() {
  clearFormErrors();

  const fullName = document.getElementById('fullName')?.value.trim();
  const email = document.getElementById('email')?.value.trim();
  const subject = document.getElementById('subject')?.value.trim();
  const message = document.getElementById('message')?.value.trim();

  let isValid = true;

  if (!fullName) {
    setFormError('fullName', 'Please enter your full name.');
    isValid = false;
  }

  if (!email) {
    setFormError('email', 'Please enter your email address.');
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setFormError('email', 'Please enter a valid email address.');
    isValid = false;
  }

  if (!subject) {
    setFormError('subject', 'Please add a subject.');
    isValid = false;
  }

  if (!message) {
    setFormError('message', 'Please enter a message.');
    isValid = false;
  } else if (message.length < 15) {
    setFormError('message', 'Your message should be at least 15 characters long.');
    isValid = false;
  }

  return isValid;
}

function setFormError(fieldName, message) {
  const target = document.querySelector(`[data-error-for="${fieldName}"]`);
  if (target) {
    target.textContent = message;
  }
}

function clearFormErrors() {
  document.querySelectorAll('.field-error').forEach((error) => {
    error.textContent = '';
  });
}

function resetFormState() {
  elements.contactForm?.reset();
  elements.contactForm?.classList.remove('hidden');
  elements.formSuccessState?.classList.add('hidden');
  clearFormErrors();
}

function initContactVideo() {
  const video = document.getElementById('contactBgVideo');
  if (!video) return;

  video.muted = true;
  video.defaultMuted = true;

  const playVideo = () => {
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {});
    }
  };

  playVideo();

  // Retry playback on user interaction if initial browser autoplay was blocked
  const onUserInteraction = () => {
    if (video.paused) {
      playVideo();
    }
    document.removeEventListener('click', onUserInteraction);
    document.removeEventListener('touchstart', onUserInteraction);
    document.removeEventListener('scroll', onUserInteraction);
  };

  document.addEventListener('click', onUserInteraction, { passive: true });
  document.addEventListener('touchstart', onUserInteraction, { passive: true });
  document.addEventListener('scroll', onUserInteraction, { passive: true });
}
