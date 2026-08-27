const slides = Array.from(document.querySelectorAll('.slide'));
const rail = document.getElementById('slide-rail');
const stage = document.getElementById('stage');
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');
const counter = document.getElementById('slide-counter');
const progressBar = document.getElementById('progress-bar');
const progressLabel = document.getElementById('progress-label');
const currentKicker = document.getElementById('current-kicker');
const toast = document.getElementById('toast');

let currentIndex = 0;
let toastTimer;

const pad = (number) => String(number).padStart(2, '0');

// Build the compact slide index from the content itself, so the navigation stays in sync.
const railLinks = slides.map((slide, index) => {
  const link = document.createElement('button');
  link.type = 'button';
  link.className = 'rail-link';
  link.setAttribute('aria-label', `Go to slide ${index + 1}: ${slide.dataset.title}`);
  link.innerHTML = `<span class="rail-number">${pad(index + 1)}</span><span class="rail-title">${slide.dataset.title}</span>`;
  link.addEventListener('click', () => goToSlide(index));
  rail.appendChild(link);
  return link;
});

// Keep every slide inside the fixed deck viewport.
// Dense slides (the design, decisions, pricing and process pages) are scaled down
// just enough to fit instead of being cut off by the stage.
const supportsZoom = typeof document.body.style.zoom === 'string';
const MIN_SLIDE_SCALE = 0.62;

function fitSlide(slide) {
  if (!slide) return;
  slide.style.zoom = '';

  // On phones the deck reads better with natural scrolling than with shrunken type.
  if (!supportsZoom || window.matchMedia('(max-width: 700px)').matches) return;

  const available = slide.clientHeight;
  const needed = slide.scrollHeight;
  if (!available || needed <= available + 2) return;

  let scale = Math.max(MIN_SLIDE_SCALE, available / needed);
  slide.style.zoom = String(scale);

  // Reflowed text can change the height, so refine once with the new measurements.
  if (slide.scrollHeight > slide.clientHeight + 2) {
    scale = Math.max(MIN_SLIDE_SCALE, (scale * slide.clientHeight) / slide.scrollHeight);
    slide.style.zoom = String(scale);
  }
}

let fitTimer;
function refitCurrentSlide() {
  window.clearTimeout(fitTimer);
  fitTimer = window.setTimeout(() => fitSlide(slides[currentIndex]), 120);
}

window.addEventListener('resize', refitCurrentSlide);
window.addEventListener('orientationchange', refitCurrentSlide);
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => fitSlide(slides[currentIndex]));
}
window.addEventListener('beforeprint', () => slides.forEach((slide) => { slide.style.zoom = ''; }));
window.addEventListener('afterprint', () => fitSlide(slides[currentIndex]));

function updateSlide(index, shouldUpdateHash = true) {
  currentIndex = Math.max(0, Math.min(index, slides.length - 1));

  slides.forEach((slide, slideIndex) => {
    const isCurrent = slideIndex === currentIndex;
    slide.classList.toggle('active', isCurrent);
    slide.setAttribute('aria-hidden', String(!isCurrent));
  });

  railLinks.forEach((link, linkIndex) => {
    const isCurrent = linkIndex === currentIndex;
    link.classList.toggle('is-active', isCurrent);
    if (isCurrent) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  const activeSlide = slides[currentIndex];
  counter.textContent = `${pad(currentIndex + 1)} / ${pad(slides.length)}`;
  progressLabel.textContent = activeSlide.dataset.title || '';
  currentKicker.textContent = activeSlide.dataset.kicker || '';
  progressBar.style.width = `${((currentIndex + 1) / slides.length) * 100}%`;
  prevButton.disabled = currentIndex === 0;
  nextButton.disabled = currentIndex === slides.length - 1;

  // Hidden slides can retain a scroll position after the user swipes or uses the rail.
  activeSlide.scrollTop = 0;
  fitSlide(activeSlide);
  railLinks[currentIndex].scrollIntoView({ block: 'nearest' });

  if (shouldUpdateHash) {
    history.replaceState(null, '', `#${activeSlide.id}`);
  }
}

function goToSlide(index) {
  if (index === currentIndex || index < 0 || index >= slides.length) return;
  updateSlide(index);
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('is-visible');
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3200);
}

prevButton.addEventListener('click', () => goToSlide(currentIndex - 1));
nextButton.addEventListener('click', () => goToSlide(currentIndex + 1));

document.addEventListener('keydown', (event) => {
  const target = event.target;
  const isTyping = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
  if (isTyping) return;

  if (['ArrowRight', 'PageDown', ' '].includes(event.key)) {
    event.preventDefault();
    goToSlide(currentIndex + 1);
  }
  if (['ArrowLeft', 'PageUp'].includes(event.key)) {
    event.preventDefault();
    goToSlide(currentIndex - 1);
  }
  if (event.key === 'Home') {
    event.preventDefault();
    goToSlide(0);
  }
  if (event.key === 'End') {
    event.preventDefault();
    goToSlide(slides.length - 1);
  }
});

document.querySelectorAll('[data-goto]').forEach((element) => {
  element.addEventListener('click', (event) => {
    event.preventDefault();
    goToSlide(Number(element.dataset.goto));
  });
});

document.querySelector('.brand').addEventListener('click', (event) => {
  event.preventDefault();
  goToSlide(0);
});

// Support trackpad / phone swipes without hijacking normal vertical scrolling.
let touchStartX = 0;
let touchStartY = 0;
stage.addEventListener('touchstart', (event) => {
  const touch = event.changedTouches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}, { passive: true });

stage.addEventListener('touchend', (event) => {
  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;
  if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) {
    goToSlide(currentIndex + (deltaX < 0 ? 1 : -1));
  }
}, { passive: true });

const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
  const isSoft = document.body.classList.toggle('is-soft');
  themeToggle.setAttribute('aria-pressed', String(isSoft));
  showToast(isSoft ? 'Soft reading contrast enabled.' : 'Original contrast restored.');
});

const shareButton = document.getElementById('share-button');
shareButton.addEventListener('click', async () => {
  const shareData = {
    title: 'Agra SK Baghel — Website & Online Booking Proposal',
    text: 'Website and online booking proposal for Agra SK Baghel Town & Travels.',
    url: window.location.href,
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      showToast('Proposal share sheet opened.');
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Proposal link copied to clipboard.');
    } else {
      showToast('Copy the proposal URL from your browser to share it.');
    }
  } catch (error) {
    if (error && error.name !== 'AbortError') showToast('Copy the proposal URL to share it.');
  }
});

document.getElementById('print-button').addEventListener('click', () => {
  showToast('Opening print preview — choose “Save as PDF” to export the deck.');
  window.setTimeout(() => window.print(), 350);
});

const bookingForm = document.getElementById('booking-demo');
const vehicleSelect = document.getElementById('vehicle-select');
const formConfirm = document.getElementById('form-confirm');

vehicleSelect.addEventListener('change', () => {
  const amount = Number(vehicleSelect.value).toLocaleString('en-IN');
  showToast(`${vehicleSelect.options[vehicleSelect.selectedIndex].text.split(' · ')[0]} selected · example fare ₹${amount}.`);
});

bookingForm.addEventListener('submit', (event) => {
  event.preventDefault();
  formConfirm.hidden = false;
  showToast('Booking details captured in the proposal demo.');
});

document.querySelectorAll('.pay-demo').forEach((button) => {
  button.addEventListener('click', () => showToast('Payment gateway preview — server-side verification comes next.'));
});

document.querySelectorAll('.outline-button').forEach((button) => {
  button.addEventListener('click', () => showToast('WhatsApp number is a client-provided detail to confirm.'));
});

// Open directly on a slide when a shared hash is present.
const requestedSlide = slides.findIndex((slide) => `#${slide.id}` === window.location.hash);
updateSlide(requestedSlide >= 0 ? requestedSlide : 0, false);
