const DELIVERY_FEE = 4.90;

document.addEventListener('DOMContentLoaded', renderCart);

function customizationSummary(c) {
  return Object.entries(c || {})
    .filter(([, v]) => v && (!Array.isArray(v) || v.length))
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
    .join(' &middot; ');
}

function renderCart() {
  const root = document.getElementById('cartRoot');
  const cart = getCart();

  if (!cart.length) {
    root.innerHTML = `
      <div class="empty-state">
        <div class="icon"><svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l-1 12a2 2 0 0 1-2 1.8H9A2 2 0 0 1 7 20L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg></div>
        <h3>Your cart is empty</h3>
        <p>Looks like you haven't added a gift yet.</p>
        <a href="products.html" class="btn btn-primary">Browse the shop</a>
      </div>
    `;
    return;
  }

  const subtotal = cartTotal();
  const total = round2(subtotal + DELIVERY_FEE);

  root.innerHTML = `
    <div class="cart-layout">
      <div>
        <div id="cartItems">
          ${cart.map((item, i) => cartItemHTML(item, i)).join('')}
        </div>
      </div>
      <div class="summary-card">
        <h3 style="margin-bottom:18px;">Order Summary</h3>
        <div class="summary-row"><span>Subtotal</span><span>Custom</span></div>
        <div class="summary-row"><span>Delivery Fee</span><span>Custom</span></div>
        <div class="summary-row total"><span>Total</span><span>Custom</span></div>
        <a href="checkout.html" class="btn btn-primary btn-block" style="margin-top:18px;">Proceed to Checkout</a>
        <a href="products.html" class="btn btn-outline btn-block" style="margin-top:10px;">Continue Shopping</a>
      </div>
    </div>
  `;

  document.getElementById('cartItems').addEventListener('click', (e) => {
    const minus = e.target.closest('[data-action="minus"]');
    const plus = e.target.closest('[data-action="plus"]');
    const remove = e.target.closest('[data-action="remove"]');
    if (minus) {
      const idx = Number(minus.dataset.index);
      const item = getCart()[idx];
      if (item.quantity > 1) updateCartQty(idx, item.quantity - 1);
      renderCart();
    } else if (plus) {
      const idx = Number(plus.dataset.index);
      const item = getCart()[idx];
      updateCartQty(idx, item.quantity + 1);
      renderCart();
    } else if (remove) {
      removeFromCart(Number(remove.dataset.index));
      renderCart();
      showToast('Item removed from cart');
    }
  });
}

function cartItemHTML(item, index) {
  return `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.product_name}">
      <div>
        <h4>${item.product_name}</h4>
        <div class="meta">${customizationSummary(item.customizations)}</div>
        <div class="qty-control" style="margin-top:10px;">
          <button type="button" data-action="minus" data-index="${index}">&minus;</button>
          <span>${item.quantity}</span>
          <button type="button" data-action="plus" data-index="${index}">+</button>
        </div>
        <a href="#" class="remove-link" data-action="remove" data-index="${index}">Remove</a>
      </div>
      <div style="text-align:right; font-weight:800; color:var(--plum-deep); font-family:var(--font-display); font-size:1.1rem;">
        Custom
      </div>
    </div>
  `;
}
