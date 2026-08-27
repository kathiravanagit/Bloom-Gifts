document.addEventListener('DOMContentLoaded', () => {
  const cart = getCart();
  if (!cart.length) {
    window.location.href = 'cart.html';
    return;
  }
  renderSummary(cart);
  document.getElementById('checkoutForm').addEventListener('submit', handleSubmit);
});

function renderSummary(cart) {
  const itemsWrap = document.getElementById('checkoutItems');
  itemsWrap.innerHTML = cart.map((item) => `
    <div class="summary-row"><span>${item.quantity} &times; ${item.product_name}</span><span>Custom</span></div>
  `).join('');

  document.getElementById('sumSubtotal').textContent = 'Custom';
  document.getElementById('sumTotal').textContent = 'To be confirmed by shop';
}

function setFieldError(id, hasError) {
  const field = document.getElementById(id).closest('.form-field');
  field.classList.toggle('invalid', hasError);
}

function validateForm() {
  const name = document.getElementById('guest_name').value.trim();
  const mobile = document.getElementById('mobile').value.trim();
  const email = document.getElementById('email').value.trim();

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const mobileOk = /^[0-9+\-\s]{7,15}$/.test(mobile);

  setFieldError('guest_name', !name);
  setFieldError('mobile', !mobileOk);
  setFieldError('email', !emailOk);

  return name && mobileOk && emailOk;
}

async function handleSubmit(e) {
  e.preventDefault();
  if (!validateForm()) {
    showToast('Please fix the highlighted fields');
    return;
  }

  const btn = document.getElementById('placeOrderBtn');
  btn.disabled = true;
  btn.textContent = 'Placing order...';

  const cart = getCart();
  const payload = {
    guest_name: document.getElementById('guest_name').value.trim(),
    email: document.getElementById('email').value.trim(),
    mobile: document.getElementById('mobile').value.trim(),
    gift_note: document.getElementById('gift_note').value.trim(),
    payment_method: 'Pay at Shop',
    items: cart.map((i) => ({
      product_id: i.product_id,
      product_name: i.product_name,
      quantity: i.quantity,
      unit_price: i.unit_price,
      customizations: i.customizations,
      subtotal: round2(i.subtotal),
    })),
  };

  try {
    const res = await fetch(window.API_BASE_URL + '/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not place order');

    sessionStorage.setItem('bloomgifts_last_order', JSON.stringify(data));
    clearCart();
    window.location.href = `confirmation.html?order=${encodeURIComponent(data.order_number)}`;
  } catch (err) {
    showToast(err.message || 'Something went wrong. Please try again.');
    btn.disabled = false;
    btn.textContent = 'Place Order';
  }
}
