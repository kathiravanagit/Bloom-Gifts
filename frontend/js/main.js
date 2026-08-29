let mainSession = null;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch(window.API_BASE_URL + '/api/user/session', { credentials: 'include' });
    mainSession = await res.json();
  } catch (e) {
    mainSession = { loggedIn: false };
  }

  if (!mainSession.loggedIn) {
    showWelcomeOverlay();
  } else {
    document.body.classList.remove('auth-pending');
    initHeroSlideshow();
    loadBestsellers();
  }
});

function showWelcomeOverlay() {
  if (localStorage.getItem('bloomgifts_welcomed')) {
    window.location.href = 'user-login.html';
    return;
  }
  const overlay = document.getElementById('welcomeOverlay');
  if (!overlay) {
    window.location.href = 'user-login.html';
    return;
  }

  overlay.style.display = 'flex';

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

  function goToLogin() {
    localStorage.setItem('bloomgifts_welcomed', '1');
    window.location.href = 'user-login.html';
  }

  document.getElementById('welcomeEnter').addEventListener('click', goToLogin);

  setTimeout(goToLogin, 6000);
}
