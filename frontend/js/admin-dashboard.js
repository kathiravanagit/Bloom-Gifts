const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Out for Delivery', 'Delivered', 'Cancelled'];

document.addEventListener('DOMContentLoaded', async () => {
  const session = await checkSession();
  if (!session.loggedIn) {
    window.location.href = 'admin-login.html';
    return;
  }
  document.getElementById('adminUsername').textContent = `, ${session.username}`;

  document.getElementById('logoutLink').addEventListener('click', async (e) => {
    e.preventDefault();
    await fetch(window.API_BASE_URL + '/api/admin/logout', { method: 'POST' });
    window.location.href = 'admin-login.html';
  });

  loadStats();
  loadOrders();
});

async function checkSession() {
  try {
    const res = await fetch(window.API_BASE_URL + '/api/admin/session');
    return await res.json();
  } catch (err) {
    return { loggedIn: false };
  }
}

async function loadStats() {
  const grid = document.getElementById('statGrid');
  try {
    const res = await fetch(window.API_BASE_URL + '/api/admin/stats');
    const s = await res.json();
    grid.innerHTML = `
      <div class="stat-card"><div class="stat-label">Total Orders</div><div class="stat-value">${s.totalOrders}</div></div>
      <div class="stat-card"><div class="stat-label">Total Revenue</div><div class="stat-value">${formatMoney(s.totalRevenue)}</div></div>
      <div class="stat-card"><div class="stat-label">Pending Orders</div><div class="stat-value">${s.pending}</div></div>
      <div class="stat-card"><div class="stat-label">Top Category</div><div class="stat-value" style="font-size:1.2rem; text-transform:capitalize;">${s.topCategory}</div></div>
    `;
  } catch (err) {
    grid.innerHTML = '<p>Could not load stats.</p>';
  }
}

async function loadOrders() {
  const body = document.getElementById('ordersBody');
  try {
    const res = await fetch(window.API_BASE_URL + '/api/admin/orders');
    const orders = await res.json();
    if (!orders.length) {
      body.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px;">No orders yet.</td></tr>';
      return;
    }
    body.innerHTML = orders.map((o) => `
      <tr data-id="${o.id}">
        <td><strong>${o.order_number}</strong></td>
        <td>${escapeHtml(o.guest_name)}</td>
        <td>${new Date(o.created_at).toLocaleString()}</td>
        <td>${formatMoney(o.total_amount)}</td>
        <td><span class="status-pill status-${o.status.replace(/\s+/g, '-')}">${o.status}</span></td>
      </tr>
    `).join('');

    body.querySelectorAll('tr').forEach((row) => {
      row.addEventListener('click', () => showDetail(row.dataset.id));
    });
  } catch (err) {
    body.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px;">Could not load orders.</td></tr>';
  }
}

async function showDetail(orderId) {
  const listView = document.getElementById('listView');
  const detailView = document.getElementById('detailView');
  listView.style.display = 'none';
  detailView.style.display = 'block';
  detailView.innerHTML = '<p>Loading order&hellip;</p>';

  const res = await fetch(window.API_BASE_URL + `/api/admin/orders/${orderId}`);
  const order = await res.json();

  const itemsHTML = order.items.map((item) => `
    <div class="confirm-item-row">
      <div>
        <strong>${item.quantity} &times; ${escapeHtml(item.product_name)}</strong><br>
        <span style="font-size:0.82rem; color:var(--charcoal-soft);">${customizationLine(item.customizations)}</span>
      </div>
      <div>${formatMoney(item.subtotal)}</div>
    </div>
  `).join('');

  detailView.innerHTML = `
    <a href="#" id="backToList" style="font-weight:700;">&larr; Back to all orders</a>
    <h2 style="margin-top:16px;">Order ${order.order_number}</h2>

    <div style="display:grid; grid-template-columns: 1.4fr 1fr; gap: 30px; margin-top:20px; align-items:start;">
      <div class="admin-table-card" style="padding:24px;">
        <h4 style="text-transform:uppercase; font-size:0.85rem; letter-spacing:0.05em; margin-bottom:14px;">Items</h4>
        ${itemsHTML}
        <div class="summary-row total" style="margin-top:14px;"><span>Total</span><span>${formatMoney(order.total_amount)}</span></div>
      </div>

      <div>
        <div class="admin-table-card" style="padding:24px; margin-bottom:20px;">
          <h4 style="text-transform:uppercase; font-size:0.85rem; letter-spacing:0.05em; margin-bottom:14px;">Customer</h4>
          <p style="margin:0;"><strong>${escapeHtml(order.guest_name)}</strong><br>
          ${escapeHtml(order.mobile)}<br>${escapeHtml(order.email)}<br><br>
          ${escapeHtml(order.address)}<br>${escapeHtml(order.city)}, ${escapeHtml(order.postal_code)}</p>
          ${order.gift_note ? `<p style="margin-top:10px;"><strong>Note:</strong> ${escapeHtml(order.gift_note)}</p>` : ''}
          <p style="margin-top:10px;"><strong>Payment:</strong> ${escapeHtml(order.payment_method)}</p>
        </div>

        <div class="admin-table-card" style="padding:24px;">
          <h4 style="text-transform:uppercase; font-size:0.85rem; letter-spacing:0.05em; margin-bottom:14px;">Update Status</h4>
          <div class="form-field">
            <select id="statusSelect">
              ${STATUS_OPTIONS.map((s) => `<option value="${s}" ${s === order.status ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
          <button class="btn btn-primary btn-block" id="updateStatusBtn">Save Status</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('backToList').addEventListener('click', (e) => {
    e.preventDefault();
    detailView.style.display = 'none';
    listView.style.display = 'block';
    loadOrders();
    loadStats();
  });

  document.getElementById('updateStatusBtn').addEventListener('click', async () => {
    const status = document.getElementById('statusSelect').value;
    const res = await fetch(window.API_BASE_URL + `/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      showToast('Order status updated');
      showDetail(orderId);
    } else {
      showToast('Could not update status');
    }
  });
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
