let userSession = null;

document.addEventListener('DOMContentLoaded', async () => {
  const cart = getCart();
  if (!cart.length) {
    window.location.href = 'cart.html';
    return;
  }
  renderSummary(cart);

  try {
    const sr = await fetch(window.API_BASE_URL + '/api/user/session', { credentials: 'include' });
    userSession = await sr.json();
  } catch (e) {
    userSession = { loggedIn: false };
  }

  if (userSession.loggedIn) {
    renderLoggedInView(cart);
  } else {
    renderGuestView();
  }
});

function renderSummary(cart) {
  const itemsWrap = document.getElementById('checkoutItems');
  itemsWrap.innerHTML = cart.map((item) => `
    <div class="summary-row"><span>${item.quantity} &times; ${escapeHtml(item.product_name)}</span><span>Custom</span></div>
  `).join('');
  document.getElementById('sumSubtotal').textContent = 'Custom';
  document.getElementById('sumTotal').textContent = 'To be confirmed by shop';
}

function renderLoggedInView(cart) {
  document.getElementById('sectionEyebrow').textContent = 'Step 2 of 2';
  document.getElementById('sectionTitle').textContent = 'Confirm Your Order';
  document.getElementById('sectionSubtitle').textContent = 'Review your details below. Edit if anything needs changing.';

  const form = document.getElementById('checkoutForm');
  form.innerHTML = `
    <div id="confirmView">
      <div class="confirm-detail-card">
        <h4>Your Details</h4>
        <div id="detailsDisplay">
          <p style="margin:4px 0;"><strong>Name:</strong> ${escapeHtml(userSession.userName || '')}</p>
          <p style="margin:4px 0;"><strong>Email:</strong> ${escapeHtml(userSession.userEmail || '')}</p>
          <p style="margin:4px 0;"><strong>Phone:</strong> ${escapeHtml(userSession.userPhone || '')}</p>
        </div>
        <button type="button" class="btn btn-outline" id="editDetailsBtn" style="margin-top:12px; font-size:0.82rem;">Edit Details</button>
      </div>

      <div class="form-field full" style="margin-top:18px;">
        <label for="gift_note">Delivery Notes (optional)</label>
        <textarea id="gift_note" name="gift_note" placeholder="e.g. any pickup notes..."></textarea>
      </div>

      <h4 style="text-transform:uppercase; font-size:0.85rem; letter-spacing:0.05em; margin: 26px 0 10px;">Payment Method</h4>
      <label class="payment-option">
        <input type="radio" name="payment_method" value="Pay on Collection" checked style="width:18px; height:18px;">
        <span class="icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2.3" y="6" width="19.4" height="12" rx="1.6"/><circle cx="12" cy="12" r="2.6"/><path d="M5.3 9v0M18.7 15v0"/></svg></span>
        <span>Pay on Collection &mdash; pick up from store and pay in cash</span>
      </label>

      <button type="submit" class="btn btn-primary btn-block" style="margin-top:26px;" id="placeOrderBtn">Confirm Order</button>
    </div>

    <div id="editView" style="display:none;">
      <div class="form-grid">
        <div class="form-field">
          <label for="guest_name">Full Name</label>
          <input type="text" id="guest_name" name="guest_name" autocomplete="name" value="${escapeAttr(userSession.userName || '')}">
          <div class="form-error">Please enter your full name.</div>
        </div>
        <div class="form-field">
          <label for="mobile">Mobile Number</label>
          <input type="tel" id="mobile" name="mobile" autocomplete="tel" placeholder="e.g. 9123 4567" value="${escapeAttr(userSession.userPhone || '')}">
          <div class="form-error">Please enter a valid mobile number.</div>
        </div>
        <div class="form-field">
          <label for="email">Email Address</label>
          <input type="email" id="email" name="email" autocomplete="email" value="${escapeAttr(userSession.userEmail || '')}">
          <div class="form-error">Please enter a valid email address.</div>
        </div>
      </div>

      <div class="form-field full" style="margin-top:12px;">
        <label for="gift_note_edit">Delivery Notes (optional)</label>
        <textarea id="gift_note_edit" name="gift_note" placeholder="e.g. any pickup notes..."></textarea>
      </div>

      <h4 style="text-transform:uppercase; font-size:0.85rem; letter-spacing:0.05em; margin: 26px 0 10px;">Payment Method</h4>
      <label class="payment-option">
        <input type="radio" name="payment_method" value="Pay on Collection" checked style="width:18px; height:18px;">
        <span class="icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2.3" y="6" width="19.4" height="12" rx="1.6"/><circle cx="12" cy="12" r="2.6"/><path d="M5.3 9v0M18.7 15v0"/></svg></span>
        <span>Pay on Collection &mdash; pick up from store and pay in cash</span>
      </label>

      <div style="display:flex; gap:10px; margin-top:26px;">
        <button type="button" class="btn btn-outline" id="cancelEditBtn" style="flex:0 0 auto;">Cancel</button>
        <button type="submit" class="btn btn-primary" style="flex:1;" id="placeOrderBtn">Confirm Order</button>
      </div>
    </div>
  `;

  document.getElementById('editDetailsBtn').addEventListener('click', () => {
    document.getElementById('confirmView').style.display = 'none';
    document.getElementById('editView').style.display = 'block';
  });

  document.getElementById('cancelEditBtn').addEventListener('click', () => {
    document.getElementById('editView').style.display = 'none';
    document.getElementById('confirmView').style.display = 'block';
  });

  form.addEventListener('submit', handleLoggedInSubmit);
}

function renderGuestView() {
  document.getElementById('sectionTitle').textContent = 'Checkout as Guest';
  document.getElementById('sectionSubtitle').textContent = 'A simple process \u2014 just your details.';

  const form = document.getElementById('checkoutForm');
  form.innerHTML = `
    <div class="form-grid">
      <div class="form-field">
        <label for="guest_name">Full Name</label>
        <input type="text" id="guest_name" name="guest_name" autocomplete="name">
        <div class="form-error">Please enter your full name.</div>
      </div>
      <div class="form-field">
        <label for="mobile">Mobile Number</label>
        <input type="tel" id="mobile" name="mobile" autocomplete="tel" placeholder="e.g. 9123 4567">
        <div class="form-error">Please enter a valid mobile number.</div>
      </div>
      <div class="form-field">
        <label for="email">Email Address</label>
        <input type="email" id="email" name="email" autocomplete="email">
        <div class="form-error">Please enter a valid email address.</div>
      </div>
    </div>

    <div class="form-field full">
      <label for="gift_note">Delivery Notes (optional)</label>
      <textarea id="gift_note" name="gift_note" placeholder="e.g. any pickup notes..."></textarea>
    </div>

    <h4 style="text-transform:uppercase; font-size:0.85rem; letter-spacing:0.05em; margin: 26px 0 10px;">Payment Method</h4>
    <label class="payment-option">
        <input type="radio" name="payment_method" value="Pay on Collection" checked style="width:18px; height:18px;">
        <span class="icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2.3" y="6" width="19.4" height="12" rx="1.6"/><circle cx="12" cy="12" r="2.6"/><path d="M5.3 9v0M18.7 15v0"/></svg></span>
        <span>Pay on Collection &mdash; pick up from store and pay in cash</span>
    </label>

    <button type="submit" class="btn btn-primary btn-block" style="margin-top:26px;" id="placeOrderBtn">Place Order</button>
  `;

  form.addEventListener('submit', handleGuestSubmit);
}

function setFieldError(id, hasError) {
  const el = document.getElementById(id);
  if (!el) return;
  const field = el.closest('.form-field');
  if (field) field.classList.toggle('invalid', hasError);
}

function validateGuestForm() {
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

function buildPayload(name, email, mobile, giftNote) {
  const cart = getCart();
  return {
    guest_name: name,
    email: email,
    mobile: mobile,
    gift_note: giftNote,
    payment_method: 'Pay on Collection',
    items: cart.map((i) => ({
      product_id: i.product_id,
      product_name: i.product_name,
      quantity: i.quantity,
      unit_price: i.unit_price,
      customizations: i.customizations,
      subtotal: round2(i.subtotal),
    })),
  };
}

async function submitOrder(payload, btn) {
  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = 'Placing order...';
  try {
    const res = await fetch(window.API_BASE_URL + '/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not place order');
    localStorage.setItem('bloomgifts_last_order', JSON.stringify(data));
    clearCart();
    window.location.href = `confirmation.html?order=${encodeURIComponent(data.order_number)}`;
  } catch (err) {
    showToast(err.message || 'Something went wrong. Please try again.');
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

async function handleLoggedInSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('placeOrderBtn');
  const isEditing = document.getElementById('editView').style.display !== 'none';

  let name, email, mobile, giftNote;
  if (isEditing) {
    name = document.getElementById('guest_name').value.trim();
    email = document.getElementById('email').value.trim();
    mobile = document.getElementById('mobile').value.trim();
    giftNote = document.getElementById('gift_note_edit').value.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const mobileOk = /^[0-9+\-\s]{7,15}$/.test(mobile);
    setFieldError('guest_name', !name);
    setFieldError('mobile', !mobileOk);
    setFieldError('email', !emailOk);
    if (!name || !mobileOk || !emailOk) {
      showToast('Please fix the highlighted fields');
      return;
    }
  } else {
    name = userSession.userName || '';
    email = userSession.userEmail || '';
    mobile = userSession.userPhone || '';
    giftNote = document.getElementById('gift_note').value.trim();
  }

  await submitOrder(buildPayload(name, email, mobile, giftNote), btn);
}

async function handleGuestSubmit(e) {
  e.preventDefault();
  if (!validateGuestForm()) {
    showToast('Please fix the highlighted fields');
    return;
  }
  const btn = document.getElementById('placeOrderBtn');
  const payload = buildPayload(
    document.getElementById('guest_name').value.trim(),
    document.getElementById('email').value.trim(),
    document.getElementById('mobile').value.trim(),
    document.getElementById('gift_note').value.trim()
  );
  await submitOrder(payload, btn);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function escapeAttr(str) {
  return String(str == null ? '' : str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
