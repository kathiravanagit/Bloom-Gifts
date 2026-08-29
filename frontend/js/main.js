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

  // 1. Bokeh orbs — large soft glowing circles
  const bokehWrap = document.getElementById('welcomeBokeh');
  const orbColors = [
    'rgba(168,139,196,0.35)', 'rgba(212,168,67,0.2)', 'rgba(180,140,200,0.3)',
    'rgba(140,100,180,0.25)', 'rgba(200,170,220,0.2)', 'rgba(180,130,60,0.15)',
  ];
  for (let i = 0; i < 8; i++) {
    const orb = document.createElement('div');
    orb.className = 'bokeh-orb';
    const size = 100 + Math.random() * 200;
    orb.style.width = size + 'px';
    orb.style.height = size + 'px';
    orb.style.left = Math.random() * 100 + '%';
    orb.style.top = Math.random() * 100 + '%';
    orb.style.setProperty('--orb-color', orbColors[i % orbColors.length]);
    orb.style.setProperty('--orb-duration', (6 + Math.random() * 6).toFixed(1) + 's');
    orb.style.setProperty('--orb-delay', (Math.random() * 4).toFixed(1) + 's');
    orb.style.setProperty('--orb-dx', (Math.random() * 60 - 30).toFixed(0) + 'px');
    orb.style.setProperty('--orb-dy', (Math.random() * 40 - 20).toFixed(0) + 'px');
    orb.style.setProperty('--orb-blur', (15 + Math.random() * 25).toFixed(0) + 'px');
    orb.style.setProperty('--orb-opacity', (0.25 + Math.random() * 0.3).toFixed(2));
    bokehWrap.appendChild(orb);
  }

  // 2. Falling petals
  const petalsWrap = document.getElementById('welcomePetals');
  const petalColors = ['#d4b8e8', '#e0c4f0', '#c9a2d4', '#f0e0f8', '#b89cc9', '#dfc8ee', '#e8d0f5'];
  for (let i = 0; i < 40; i++) {
    const petal = document.createElement('div');
    petal.className = 'petal';
    const size = 8 + Math.random() * 16;
    petal.style.setProperty('--size', size + 'px');
    petal.style.setProperty('--petal-color', petalColors[Math.floor(Math.random() * petalColors.length)]);
    petal.style.setProperty('--petal-opacity', (0.4 + Math.random() * 0.45).toFixed(2));
    petal.style.setProperty('--duration', (3.5 + Math.random() * 5).toFixed(1) + 's');
    petal.style.setProperty('--delay', (Math.random() * 4).toFixed(1) + 's');
    petal.style.setProperty('--drift', (Math.random() * 100 - 50).toFixed(0) + 'px');
    petal.style.left = Math.random() * 100 + '%';
    petalsWrap.appendChild(petal);
  }

  // 3. Sparkle particles
  const sparkWrap = document.getElementById('welcomeSparkles');
  for (let i = 0; i < 30; i++) {
    const sp = document.createElement('div');
    sp.className = 'sparkle';
    sp.style.left = Math.random() * 100 + '%';
    sp.style.top = Math.random() * 100 + '%';
    sp.style.setProperty('--spark-duration', (1.5 + Math.random() * 2.5).toFixed(1) + 's');
    sp.style.setProperty('--spark-delay', (Math.random() * 3).toFixed(1) + 's');
    sp.style.setProperty('--spark-opacity', (0.5 + Math.random() * 0.5).toFixed(2));
    sparkWrap.appendChild(sp);
  }

  function dismissOverlay() {
    localStorage.setItem('bloomgifts_welcomed', '1');
    overlay.classList.add('fade-out');
    setTimeout(() => { overlay.style.display = 'none'; }, 800);
  }

  document.getElementById('welcomeEnter').addEventListener('click', dismissOverlay);

  // Auto-dismiss after 6 seconds
  setTimeout(dismissOverlay, 6000);
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
