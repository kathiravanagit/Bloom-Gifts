const DELIVERY_FEE = 4.90;

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
    <div class="summary-row"><span>${item.quantity} &times; ${item.product_name}</span><span>${formatMoney(item.subtotal)}</span></div>
  `).join('');

  const subtotal = cartTotal();
  const total = round2(subtotal + DELIVERY_FEE);
  document.getElementById('sumSubtotal').textContent = formatMoney(subtotal);
  document.getElementById('sumDelivery').textContent = formatMoney(DELIVERY_FEE);
  document.getElementById('sumTotal').textContent = formatMoney(total);
}

function setFieldError(id, hasError) {
  const field = document.getElementById(id).closest('.form-field');
  field.classList.toggle('invalid', hasError);
}

function validateForm() {
  const name = document.getElementById('guest_name').value.trim();
  const mobile = document.getElementById('mobile').value.trim();
  const email = document.getElementById('email').value.trim();
  const city = document.getElementById('city').value.trim();
  const address = document.getElementById('address').value.trim();
  const postal = document.getElementById('postal_code').value.trim();

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const mobileOk = /^[0-9+\-\s]{7,15}$/.test(mobile);

  setFieldError('guest_name', !name);
  setFieldError('mobile', !mobileOk);
  setFieldError('email', !emailOk);
  setFieldError('city', !city);
  setFieldError('address', !address);
  setFieldError('postal_code', !postal);

  return name && mobileOk && emailOk && city && address && postal;
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
    address: document.getElementById('address').value.trim(),
    city: document.getElementById('city').value.trim(),
    postal_code: document.getElementById('postal_code').value.trim(),
    gift_note: document.getElementById('gift_note').value.trim(),
    payment_method: 'Cash on Delivery',
    items: cart.map((i) => ({
      product_id: i.product_id,
      product_name: i.product_name,
      quantity: i.quantity,
      unit_price: i.unit_price,
      customizations: i.customizations,
      subtotal: round2(i.subtotal),
    })).concat([{
      product_id: null, product_name: 'Delivery Fee', quantity: 1,
      unit_price: DELIVERY_FEE, customizations: {}, subtotal: DELIVERY_FEE,
    }]),
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
