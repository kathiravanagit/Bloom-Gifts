document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const orderNumber = params.get('order');
  const root = document.getElementById('confirmRoot');

  if (!orderNumber) {
    root.innerHTML = emptyMessage();
    return;
  }

  let order = null;
  try {
    const cached = JSON.parse(sessionStorage.getItem('bloomgifts_last_order') || 'null');
    if (cached && cached.order_number === orderNumber) {
      order = cached;
    } else {
      const res = await fetch(window.API_BASE_URL + `/api/orders/${encodeURIComponent(orderNumber)}`);
      if (res.ok) order = await res.json();
    }
  } catch (err) {
    order = null;
  }

  if (!order) {
    root.innerHTML = emptyMessage();
    return;
  }

  render(order);
});

function emptyMessage() {
  return `
    <div class="empty-state">
      <div class="icon"><svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20 15.2 15.2"/></svg></div>
      <h3>We couldn't find that order</h3>
      <p>Double check the link, or head back to the shop to place a new order.</p>
      <a href="products.html" class="btn btn-primary">Back to shop</a>
    </div>
  `;
}

function render(order) {
  const root = document.getElementById('confirmRoot');
  const itemsHTML = order.items.map((item) => `
    <div class="confirm-item-row">
      <div>
        <strong>${item.quantity} &times; ${item.product_name}</strong><br>
        <span style="font-size:0.82rem; color:var(--charcoal-soft);">${customizationLine(item.customizations)}</span>
      </div>
      <div>${formatMoney(item.subtotal)}</div>
    </div>
  `).join('');

  root.innerHTML = `
    <div class="confirm-box">
      <div class="confirm-check"><svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="white" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4.5 4.5L19 7"/></svg></div>
      <h2>Thank you, ${escapeHtml(order.guest_name)}!</h2>
      <p>Your order has been placed and will be paid by <strong>Cash on Delivery</strong>.</p>
      <div class="confirm-order-number">Order #${order.order_number}</div>

      <div class="confirm-detail-card">
        <h4>Items</h4>
        ${itemsHTML}
        <div class="summary-row total" style="margin-top:14px;"><span>Total</span><span>${formatMoney(order.total_amount)}</span></div>
      </div>

      <div class="confirm-detail-card" style="margin-top:20px;">
        <h4>Delivery Details</h4>
        <p style="margin:0;"><strong>${escapeHtml(order.guest_name)}</strong><br>
        ${escapeHtml(order.address)}, ${escapeHtml(order.city)} ${escapeHtml(order.postal_code)}<br>
        ${escapeHtml(order.mobile)} &middot; ${escapeHtml(order.email)}</p>
        ${order.gift_note ? `<p style="margin-top:10px;"><strong>Note:</strong> ${escapeHtml(order.gift_note)}</p>` : ''}
      </div>

      <div style="display:flex; gap:14px; justify-content:center; margin-top:30px; flex-wrap:wrap;">
        <button class="btn btn-outline" onclick="window.print()">Print Receipt</button>
        <a href="products.html" class="btn btn-primary">Continue Shopping</a>
      </div>
    </div>
  `;
}

function customizationLine(c) {
  return Object.entries(c || {})
    .filter(([, v]) => v && (!Array.isArray(v) || v.length))
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
    .join(' &middot; ');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}
