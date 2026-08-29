document.addEventListener('DOMContentLoaded', () => {
  showWelcomeOverlay();
  initHeroSlideshow();
  loadBestsellers();
  showWelcomeBanner();
});

function showWelcomeOverlay() {
  if (localStorage.getItem('bloomgifts_welcomed')) return;
  const overlay = document.getElementById('welcomeOverlay');
  if (!overlay) return;

  overlay.style.display = 'flex';

  // Generate petals
  const petalsWrap = document.getElementById('welcomePetals');
  const colors = ['#d4b8e8', '#e8d4f0', '#c9a2d4', '#f0e6f6', '#b89cc9', '#dfc8ee'];
  for (let i = 0; i < 35; i++) {
    const petal = document.createElement('div');
    petal.className = 'petal';
    const size = 10 + Math.random() * 18;
    petal.style.setProperty('--size', size + 'px');
    petal.style.setProperty('--petal-color', colors[Math.floor(Math.random() * colors.length)]);
    petal.style.setProperty('--opacity', (0.3 + Math.random() * 0.5).toFixed(2));
    petal.style.setProperty('--duration', (3 + Math.random() * 4).toFixed(1) + 's');
    petal.style.setProperty('--delay', (Math.random() * 3).toFixed(1) + 's');
    petal.style.setProperty('--drift', (Math.random() * 80 - 40).toFixed(0) + 'px');
    petal.style.setProperty('--rotate', Math.floor(Math.random() * 360) + 'deg');
    petal.style.left = Math.random() * 100 + '%';
    petalsWrap.appendChild(petal);
  }

  function dismissOverlay() {
    localStorage.setItem('bloomgifts_welcomed', '1');
    overlay.classList.add('fade-out');
    setTimeout(() => { overlay.style.display = 'none'; }, 600);
  }

  document.getElementById('welcomeEnter').addEventListener('click', dismissOverlay);

  // Auto-dismiss after 5 seconds
  setTimeout(dismissOverlay, 5000);
}

async function showWelcomeBanner() {
  try {
    const res = await fetch(window.API_BASE_URL + '/api/user/session', { credentials: 'include' });
    const session = await res.json();
    if (!session.loggedIn) {
      document.getElementById('welcomeBanner').style.display = 'block';
    }
  } catch (e) { /* show banner on error too */ document.getElementById('welcomeBanner').style.display = 'block'; }
}

function initHeroSlideshow() {
  const slides = Array.from(document.querySelectorAll('.hero-media'));
  const dotsWrap = document.getElementById('heroDots');
  if (!slides.length || !dotsWrap) return;

  let current = 0;
  slides.forEach((s, i) => {
    const dot = document.createElement('button');
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  function goTo(index) {
    slides[current].style.opacity = '0';
    dotsWrap.children[current].classList.remove('active');
    current = index;
    slides[current].style.opacity = '1';
    dotsWrap.children[current].classList.add('active');
  }

  setInterval(() => {
    goTo((current + 1) % slides.length);
  }, 5000);
}

async function loadBestsellers() {
  const grid = document.getElementById('bestsellerGrid');
  if (!grid) return;
  try {
    const res = await fetch(window.API_BASE_URL + '/api/products');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const products = await res.json();
    const featured = products.filter((p) => p.badge).slice(0, 4);
    const list = featured.length ? featured : products.slice(0, 4);
    grid.innerHTML = list.map(productCardHTML).join('');
  } catch (err) {
    console.error('loadBestsellers error:', err);
    grid.innerHTML = '<p style="text-align:center; grid-column:1/-1;">Could not load products right now.</p>';
  }
}
