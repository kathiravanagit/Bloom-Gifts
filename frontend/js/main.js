document.addEventListener('DOMContentLoaded', () => {
  initHeroSlideshow();
  loadBestsellers();
});

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
