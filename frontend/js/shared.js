/* Shared utilities used across every page: nav/footer injection, cart storage, toasts. */

const CART_KEY = 'bloomgifts_cart';

function formatMoney(n) {
  return '₹' + Number(n).toFixed(2);
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(item) {
  const cart = getCart();
  cart.push(item);
  saveCart(cart);
}

function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
}

function updateCartQty(index, qty) {
  const cart = getCart();
  if (!cart[index]) return;
  cart[index].quantity = qty;
  cart[index].subtotal = round2(cart[index].unit_price * qty);
  saveCart(cart);
}

function cartCount() {
  return getCart().reduce((sum, i) => sum + i.quantity, 0);
}

function cartTotal() {
  return round2(getCart().reduce((sum, i) => sum + i.subtotal, 0));
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
}

function updateCartBadge() {
  const badge = document.getElementById('cartCount');
  if (badge) badge.textContent = cartCount();
}

function showToast(message) {
  let toast = document.getElementById('siteToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'siteToast';
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2600);
}

const BRAND_MARK_SVG = '<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="7.5" r="3.4" fill="white"/><circle cx="12" cy="16.5" r="3.4" fill="white"/><circle cx="7.5" cy="12" r="3.4" fill="white"/><circle cx="16.5" cy="12" r="3.4" fill="white"/><circle cx="12" cy="12" r="3.6" fill="#C9A227"/></svg>';
const BAG_ICON_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l-1 12a2 2 0 0 1-2 1.8H9A2 2 0 0 1 7 20L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>';
const MENU_ICON_SVG = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
const INSTAGRAM_ICON_SVG = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><circle cx="12" cy="12" r="3.8"/><circle cx="17" cy="7" r="1" fill="currentColor" stroke="none"/></svg>';
const USER_ICON_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';

const NAV_LINKS = [
  { href: 'index.html', label: 'Home', page: 'home' },
  { href: 'products.html', label: 'Shop', page: 'products' },
  { href: 'custom-hamper.html', label: 'Build a Hamper', page: 'custom-hamper' },
  { href: 'about.html', label: 'About', page: 'about' },
  { href: 'contact.html', label: 'Contact us', page: 'contact' },
];

function renderHeader() {
  const el = document.getElementById('site-header');
  if (!el) return;
  const currentPage = document.body.dataset.page;
  const links = NAV_LINKS.map(
    (l) => `<a href="${l.href}" class="${currentPage === l.page ? 'active' : ''}">${l.label}</a>`
  ).join('');

  el.innerHTML = `
    <div class="nav-wrap">
      <a href="index.html" class="brand"><img src="assets/images/favicon.jpg" alt="" class="header-brand-mark"> G_giftrees</a>
      <nav class="nav-links" id="navLinks">
        ${links}
        <a href="account.html" class="nav-cart" id="accountLink">${USER_ICON_SVG} <span id="accountLabel">Account</span></a>
        <a href="cart.html" class="nav-cart">${BAG_ICON_SVG} Cart<span class="cart-count" id="cartCount">0</span></a>
      </nav>
      <button class="nav-toggle" id="navToggle" aria-label="Toggle menu">${MENU_ICON_SVG}</button>
    </div>
  `;

  document.getElementById('navToggle').addEventListener('click', () => {
    document.getElementById('navLinks').classList.toggle('open');
  });
  updateCartBadge();
  checkUserSession();
}

function renderFooter() {
  const el = document.getElementById('site-footer');
  if (!el) return;
  el.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div>
          <div class="footer-brand"><img src="assets/images/favicon.jpg" alt="" class="footer-brand-mark"> G_giftrees</div>
          <p style="color: rgba(255,255,255,0.7); max-width: 280px;">Handcrafted bouquets and curated gift hampers, arranged with a little lavender magic and delivered with care.</p>
        </div>
        <div>
          <h4>Shop</h4>
          <a href="products.html?category=bouquets">Customized Bouquets</a>
          <a href="products.html?category=hampers">Gift Hampers</a>
          <a href="products.html?category=chocolate">Chocolate Hampers</a>
          <a href="products.html?category=albums">Albums</a>
          <a href="products.html?category=cards">Greeting Cards</a>
          <a href="custom-hamper.html">Build Your Own Hamper</a>
        </div>
        <div>
          <h4>Company</h4>
          <a href="about.html">About us</a>
          <a href="contact.html">Contact us</a>
          <a href="cart.html">Your cart</a>
        </div>
        <div>
          <h4>Visit our store</h4>
          <a href="contact.html">Pondicherry</a>
          <a href="https://wa.me/917845120668?text=Can%20you%20suggest%20some%20gifts%3F" target="_blank" rel="noopener">+91 78451 20668</a>
          <a href="mailto:ggiftrees31@gmail.com">ggiftrees31@gmail.com</a>
        </div>
      </div>
      <div class="footer-bottom">&copy; ${new Date().getFullYear()} G_giftrees &mdash; a student capstone project. &middot; <a href="admin-login.html" style="color:inherit; text-decoration:underline;">Admin</a></div>
    </div>
  `;
}

function productCardHTML(p) {
  return `
    <a class="product-card tag-card" href="product-detail.html?slug=${escapeHtml(p.slug)}">
      <div class="product-thumb">
        ${p.badge ? `<span class="badge">${escapeHtml(p.badge)}</span>` : ''}
        <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy">
      </div>
      <div class="product-info">
        <h3>${escapeHtml(p.name)}</h3>
        <p class="product-tagline">${escapeHtml(p.tagline || '')}</p>
        <div class="product-price-row">
          <div>
            <div class="price-from">Price</div>
            <div class="price">Custom</div>
          </div>
          <span class="btn btn-outline" style="padding:8px 16px; font-size:0.8rem;">Customize</span>
        </div>
      </div>
    </a>
  `;
}

async function checkUserSession() {
  try {
    const res = await fetch(window.API_BASE_URL + '/api/user/session', { credentials: 'include' });
    const session = await res.json();
    const label = document.getElementById('accountLabel');
    if (session.loggedIn) {
      if (label) label.textContent = session.userName.split(' ')[0];
    } else {
      if (label) label.textContent = 'Login';
      const link = document.getElementById('accountLink');
      if (link) link.href = 'user-login.html';
    }
  } catch (e) { /* ignore */ }
}

document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  renderFooter();
});

