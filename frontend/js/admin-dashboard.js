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
    await fetch(window.API_BASE_URL + '/api/admin/logout', { method: 'POST', credentials: 'include' });
    window.location.href = 'admin-login.html';
  });

  document.getElementById('dashboardNav').addEventListener('click', (e) => {
    e.preventDefault();
    setActiveNav('dashboardNav');
    document.getElementById('messagesView').style.display = 'none';
    document.getElementById('detailView').style.display = 'none';
    document.getElementById('productsView').style.display = 'none';
    document.getElementById('listView').style.display = 'block';
    loadOrders();
    loadStats();
  });

  document.getElementById('messagesNav').addEventListener('click', (e) => {
    e.preventDefault();
    setActiveNav('messagesNav');
    document.getElementById('listView').style.display = 'none';
    document.getElementById('detailView').style.display = 'none';
    document.getElementById('productsView').style.display = 'none';
    document.getElementById('messagesView').style.display = 'block';
    loadMessages();
  });

  document.getElementById('productsNav').addEventListener('click', (e) => {
    e.preventDefault();
    openProductsView();
  });

  loadStats();
  loadOrders();
  loadMessageBadge();
});

function setActiveNav(id) {
  document.querySelectorAll('.nav-links-admin a').forEach(a => a.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

async function loadMessageBadge() {
  try {
    const res = await fetch(window.API_BASE_URL + '/api/admin/messages', { credentials: 'include' });
    const messages = await res.json();
    const unread = messages.filter(m => !m.read).length;
    const badge = document.getElementById('msgBadge');
    if (unread > 0) {
      badge.textContent = unread;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  } catch (err) { /* ignore */ }
}

async function loadMessages() {
  const mv = document.getElementById('messagesView');
  mv.innerHTML = '<h2 style="margin-bottom:6px;">Message from Client</h2><p style="margin-bottom:16px; color:var(--charcoal-soft);">Loading…</p>';
  try {
    const res = await fetch(window.API_BASE_URL + '/api/admin/messages', { credentials: 'include' });
    const messages = await res.json();
    const unread = messages.filter((m) => !m.read).length;
    mv.innerHTML = `
      <h2 style="margin-bottom:6px;">Message from Client</h2>
      <p style="margin-bottom:16px; color:var(--charcoal-soft);">Messages sent through the contact form. Click a message to mark it read. (${messages.length} total${messages.length === 1 ? '' : 's'}, ${unread} unread)</p>
      <div id="messagesList"></div>
    `;
    const list = document.getElementById('messagesList');
    if (!messages.length) {
      list.innerHTML = '<p style="text-align:center; padding:30px; color:var(--charcoal-soft);">No messages yet.</p>';
      return;
    }
    list.innerHTML = messages.map((m) => `
      <div class="admin-table-card message-card" data-id="${m.id}" style="padding:18px 20px; margin-bottom:14px; cursor:pointer; border-left:4px solid ${m.read ? '#e3ddd6' : 'var(--plum-deep)'};">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <strong>${escapeHtml(m.name)}</strong>
            ${m.read ? '' : '<span style="background:var(--plum-deep); color:#fff; border-radius:12px; padding:1px 9px; font-size:0.72rem;">New</span>'}
          </div>
          <button class="btn btn-outline msg-delete" data-del="${m.id}" style="padding:4px 10px; background:#f6dede; color:#8a1f1f; border-color:#f6dede;">Delete</button>
        </div>
        <div style="font-size:0.82rem; color:var(--charcoal-soft); margin:6px 0;">${escapeHtml(m.email)} &middot; ${new Date(m.created_at).toLocaleString()}</div>
        <p style="margin:6px 0 0; white-space:pre-wrap;">${escapeHtml(m.message)}</p>
      </div>
    `).join('');

    list.querySelectorAll('.message-card').forEach((card) => {
      card.addEventListener('click', () => markMessageRead(card.dataset.id));
    });
    list.querySelectorAll('.msg-delete').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteMessage(btn.dataset.del);
      });
    });
  } catch (err) {
    mv.innerHTML += '<p>Could not load messages.</p>';
  }
}

async function markMessageRead(id) {
  try {
    await fetch(window.API_BASE_URL + `/api/admin/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
  } catch (err) { /* ignore */ }
  loadMessages();
  loadMessageBadge();
}

async function deleteMessage(id) {
  if (!confirm('Delete this message?')) return;
  try {
    const res = await fetch(window.API_BASE_URL + `/api/admin/messages/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      showToast('Message deleted');
      loadMessages();
      loadMessageBadge();
    } else {
      showToast('Could not delete message');
    }
  } catch (err) {
    showToast('Could not delete message');
  }
}

async function checkSession() {
  try {
    const res = await fetch(window.API_BASE_URL + '/api/admin/session', { credentials: 'include' });
    return await res.json();
  } catch (err) {
    return { loggedIn: false };
  }
}

async function loadStats() {
  const grid = document.getElementById('statGrid');
  try {
    const res = await fetch(window.API_BASE_URL + '/api/admin/stats', { credentials: 'include' });
    const s = await res.json();
    grid.innerHTML = `
      <div class="stat-card"><div class="stat-label">Total Orders</div><div class="stat-value">${s.totalOrders}</div></div>
      <div class="stat-card"><div class="stat-label">Total Revenue</div><div class="stat-value">${formatMoney(s.totalRevenue)}</div></div>
      <div class="stat-card"><div class="stat-label">Pending Orders</div><div class="stat-value">${s.pending}</div></div>
      <div class="stat-card"><div class="stat-label">New Messages</div><div class="stat-value">${s.unreadMessages || 0}</div></div>
    `;
  } catch (err) {
    grid.innerHTML = '<p>Could not load stats.</p>';
  }
}

async function loadOrders() {
  const body = document.getElementById('ordersBody');
  try {
    const res = await fetch(window.API_BASE_URL + '/api/admin/orders', { credentials: 'include' });
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
        <td>${o.total_amount ? formatMoney(o.total_amount) : 'TBD'}</td>
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

  const res = await fetch(window.API_BASE_URL + `/api/admin/orders/${orderId}`, { credentials: 'include' });
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
        <div class="summary-row total" style="margin-top:14px;"><span>Total</span><span>${order.total_amount ? formatMoney(order.total_amount) : 'TBD'}</span></div>
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
          <div class="form-field" style="margin-top:12px;">
            <label for="amountInput" style="font-size:0.82rem; font-weight:700;">Amount (₹) — set when confirming</label>
            <input type="number" id="amountInput" min="0" step="0.01" value="${order.total_amount || ''}" placeholder="e.g. 2500" style="width:100%; padding:8px 10px; border:1px solid #ddd; border-radius:8px;">
          </div>
          <button class="btn btn-primary btn-block" id="updateStatusBtn">Save Status</button>
          <button class="btn btn-block" id="deleteOrderBtn" style="margin-top:10px; background:#f6dede; color:#8a1f1f;">Delete Order</button>
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
    const amountRaw = document.getElementById('amountInput').value;
    if (status === 'Confirmed' && (!amountRaw || Number(amountRaw) <= 0)) {
      showToast('Please enter the order amount (₹) before confirming.');
      return;
    }
    const body = { status };
    if (amountRaw !== '') body.amount = Number(amountRaw);
    const res = await fetch(window.API_BASE_URL + `/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    if (res.ok) {
      showToast('Order updated');
      showDetail(orderId);
    } else {
      showToast('Could not update order');
    }
  });

  document.getElementById('deleteOrderBtn').addEventListener('click', async () => {
    if (!window.confirm('Delete this order permanently? This cannot be undone.')) return;
    const res = await fetch(window.API_BASE_URL + `/api/admin/orders/${orderId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      showToast('Order deleted');
      document.getElementById('detailView').style.display = 'none';
      document.getElementById('listView').style.display = 'block';
      loadOrders();
      loadStats();
    } else {
      showToast('Could not delete order');
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

// ---------- Edit Products (CRUD) ----------
let currentProdTab = 'products';

function openProductsView() {
  setActiveNav('productsNav');
  document.getElementById('listView').style.display = 'none';
  document.getElementById('detailView').style.display = 'none';
  document.getElementById('messagesView').style.display = 'none';
  const view = document.getElementById('productsView');
  view.style.display = 'block';
  view.innerHTML = `
    <h2 style="margin-bottom:6px;">Edit Products</h2>
    <p style="margin-bottom:18px;">Manage shop products and Build-a-Hamper components — create, edit, or delete any item.</p>
    <div style="display:flex; gap:10px; margin-bottom:16px; flex-wrap:wrap;">
      <button class="btn btn-outline" id="tabProducts">Shop Products</button>
      <button class="btn btn-outline" id="tabComponents">Hamper Components</button>
      <button class="btn btn-primary" id="addItemBtn" style="margin-left:auto;">+ Add</button>
    </div>
    <div id="prodList"></div>
    <div id="compList" style="display:none;"></div>
    <div id="itemForm" style="display:none; margin-top:20px;"></div>
  `;
  document.getElementById('tabProducts').addEventListener('click', () => switchProdTab('products'));
  document.getElementById('tabComponents').addEventListener('click', () => switchProdTab('components'));
  document.getElementById('addItemBtn').addEventListener('click', () => showItemForm(currentProdTab, null));
  switchProdTab('products');
}

function switchProdTab(tab) {
  currentProdTab = tab;
  document.getElementById('prodList').style.display = tab === 'products' ? 'block' : 'none';
  document.getElementById('compList').style.display = tab === 'components' ? 'block' : 'none';
  document.getElementById('itemForm').style.display = 'none';
  const tp = document.getElementById('tabProducts'), tc = document.getElementById('tabComponents');
  tp.style.borderColor = tab === 'products' ? 'var(--plum-deep)' : '#ccc';
  tp.style.color = tab === 'products' ? 'var(--plum-deep)' : 'inherit';
  tc.style.borderColor = tab === 'components' ? 'var(--plum-deep)' : '#ccc';
  tc.style.color = tab === 'components' ? 'var(--plum-deep)' : 'inherit';
  if (tab === 'products') loadProductsList(); else loadComponentsList();
}

async function loadProductsList() {
  const el = document.getElementById('prodList');
  el.innerHTML = '<p>Loading…</p>';
  try {
    const res = await fetch(window.API_BASE_URL + '/api/admin/products', { credentials: 'include' });
    const items = await res.json();
    if (!items.length) { el.innerHTML = '<p>No products yet.</p>'; return; }
    el.innerHTML = `<div class="table-scroll"><table class="orders-table"><thead><tr><th>Name</th><th>Category</th><th>Image</th><th></th></tr></thead><tbody>
      ${items.map(p => `<tr>
        <td><strong>${escapeHtml(p.name)}</strong><br><small style="color:var(--charcoal-soft);">${escapeHtml(p.slug)}</small></td>
        <td>${escapeHtml(p.category)}</td>
        <td>${p.image ? `<img src="${escapeHtml(p.image)}" style="width:46px;height:46px;object-fit:cover;border-radius:8px;">` : '—'}</td>
        <td style="white-space:nowrap;"><button class="btn btn-outline" style="padding:4px 10px;" data-edit="product" data-id="${p.id}">Edit</button> <button class="btn btn-outline" style="padding:4px 10px; background:#f6dede; color:#8a1f1f; border-color:#f6dede;" data-del="product" data-id="${p.id}">Delete</button></td>
      </tr>`).join('')}
    </tbody></table></div>`;
    el.querySelectorAll('[data-edit="product"]').forEach(b => b.addEventListener('click', () => showItemForm('products', b.dataset.id)));
    el.querySelectorAll('[data-del="product"]').forEach(b => b.addEventListener('click', () => deleteItem('products', b.dataset.id)));
  } catch (e) { el.innerHTML = '<p>Could not load products.</p>'; }
}

async function loadComponentsList() {
  const el = document.getElementById('compList');
  el.innerHTML = '<p>Loading…</p>';
  try {
    const res = await fetch(window.API_BASE_URL + '/api/admin/hamper-components', { credentials: 'include' });
    const items = await res.json();
    if (!items.length) { el.innerHTML = '<p>No components yet.</p>'; return; }
    el.innerHTML = `<div class="table-scroll"><table class="orders-table"><thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Description</th><th></th></tr></thead><tbody>
      ${items.map(c => `<tr>
        <td><strong>${escapeHtml(c.name)}</strong></td>
        <td>${escapeHtml(c.category)}</td>
        <td>₹${Number(c.price).toFixed(2)}</td>
        <td>${escapeHtml(c.description || '')}</td>
        <td style="white-space:nowrap;"><button class="btn btn-outline" style="padding:4px 10px;" data-edit="comp" data-id="${c.id}">Edit</button> <button class="btn btn-outline" style="padding:4px 10px; background:#f6dede; color:#8a1f1f; border-color:#f6dede;" data-del="comp" data-id="${c.id}">Delete</button></td>
      </tr>`).join('')}
    </tbody></table></div>`;
    el.querySelectorAll('[data-edit="comp"]').forEach(b => b.addEventListener('click', () => showItemForm('components', b.dataset.id)));
    el.querySelectorAll('[data-del="comp"]').forEach(b => b.addEventListener('click', () => deleteItem('components', b.dataset.id)));
  } catch (e) { el.innerHTML = '<p>Could not load components.</p>'; }
}

async function showItemForm(kind, id) {
  const wrap = document.getElementById('itemForm');
  let data = null;
  if (id) {
    const res = await fetch(window.API_BASE_URL + (kind === 'products' ? '/api/admin/products' : '/api/admin/hamper-components'), { credentials: 'include' });
    const list = await res.json();
    data = list.find(x => x.id === id);
  }
  if (kind === 'products') renderProductForm(data); else renderComponentForm(data);
  wrap.style.display = 'block';
  wrap.scrollIntoView({ behavior: 'smooth' });
}

function renderProductForm(d) {
  d = d || {};
  const cats = ['bouquets', 'hampers', 'chocolate', 'albums', 'cards'];
  const wrap = document.getElementById('itemForm');
  wrap.innerHTML = `
    <div class="admin-table-card" style="padding:24px;">
      <h4 style="text-transform:uppercase; font-size:0.85rem; letter-spacing:0.05em; margin-bottom:14px;">${d.id ? 'Edit' : 'Add'} Product</h4>
      <div class="form-field"><label>Name</label><input id="f_name" value="${escapeHtml(d.name || '')}"></div>
      <div class="form-field"><label>Category</label><select id="f_category">${cats.map(c => `<option ${c === d.category ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
      <div class="form-field"><label>Slug</label><input id="f_slug" value="${escapeHtml(d.slug || '')}" placeholder="e.g. rose-romance-bouquet"></div>
      <div class="form-field"><label>Tagline</label><input id="f_tagline" value="${escapeHtml(d.tagline || '')}"></div>
      <div class="form-field"><label>Description</label><textarea id="f_description" rows="3">${escapeHtml(d.description || '')}</textarea></div>
      <div class="form-field"><label>Image path</label><input id="f_image" value="${escapeHtml(d.image || '')}" placeholder="assets/images/pr1.jpeg"></div>
      <div class="form-field"><label>Badge</label><input id="f_badge" value="${escapeHtml(d.badge || '')}" placeholder="Bestseller / Signature / Popular / (blank)"></div>
      <div class="form-field"><label>Options (JSON)</label><textarea id="f_options" rows="4" placeholder='[{"group_name":"Size","group_type":"single","items":[["Small",0,1]]}]'>${escapeHtml(JSON.stringify(d.options || [], null, 0))}</textarea></div>
      <div style="display:flex; gap:10px; margin-top:12px;">
        <button class="btn btn-primary" id="f_save">Save</button>
        <button class="btn btn-outline" id="f_cancel">Cancel</button>
      </div>
    </div>`;
  document.getElementById('f_cancel').addEventListener('click', () => { wrap.style.display = 'none'; });
  document.getElementById('f_save').addEventListener('click', () => saveProduct(d.id));
}

async function saveProduct(id) {
  const payload = {
    name: document.getElementById('f_name').value.trim(),
    category: document.getElementById('f_category').value,
    slug: document.getElementById('f_slug').value.trim(),
    tagline: document.getElementById('f_tagline').value.trim(),
    description: document.getElementById('f_description').value.trim(),
    image: document.getElementById('f_image').value.trim(),
    badge: document.getElementById('f_badge').value.trim() || null,
  };
  let options = [];
  const optRaw = document.getElementById('f_options').value.trim();
  if (optRaw) {
    try { options = JSON.parse(optRaw); }
    catch (e) { showToast('Options field is not valid JSON'); return; }
  }
  payload.options = options;
  if (!payload.name || !payload.slug || isNaN(payload.base_price)) { showToast('Name, slug and a valid price are required'); return; }
  try {
    const url = id ? `/api/admin/products/${id}` : '/api/admin/products';
    const res = await fetch(window.API_BASE_URL + url, {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) { const er = await res.json().catch(() => ({})); showToast(er.error || 'Save failed'); return; }
    showToast('Product saved');
    document.getElementById('itemForm').style.display = 'none';
    loadProductsList();
  } catch (e) { showToast('Save failed'); }
}

function renderComponentForm(d) {
  d = d || {};
  const cats = ['base', 'flowers', 'sweets', 'drinks', 'extras', 'cards'];
  const wrap = document.getElementById('itemForm');
  wrap.innerHTML = `
    <div class="admin-table-card" style="padding:24px;">
      <h4 style="text-transform:uppercase; font-size:0.85rem; letter-spacing:0.05em; margin-bottom:14px;">${d.id ? 'Edit' : 'Add'} Hamper Component</h4>
      <div class="form-field"><label>Name</label><input id="f_name" value="${escapeHtml(d.name || '')}"></div>
      <div class="form-field"><label>Category</label><select id="f_category">${cats.map(c => `<option ${c === d.category ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
      <div class="form-field"><label>Price (₹)</label><input id="f_price" type="number" step="0.01" value="${d.price != null ? d.price : ''}"></div>
      <div class="form-field"><label>Description</label><input id="f_description" value="${escapeHtml(d.description || '')}"></div>
      <div class="form-field"><label>Sort order</label><input id="f_sort" type="number" value="${d.sort_order != null ? d.sort_order : 0}"></div>
      <div style="display:flex; gap:10px; margin-top:12px;">
        <button class="btn btn-primary" id="f_save">Save</button>
        <button class="btn btn-outline" id="f_cancel">Cancel</button>
      </div>
    </div>`;
  document.getElementById('f_cancel').addEventListener('click', () => { wrap.style.display = 'none'; });
  document.getElementById('f_save').addEventListener('click', () => saveComponent(d.id));
}

async function saveComponent(id) {
  const payload = {
    name: document.getElementById('f_name').value.trim(),
    category: document.getElementById('f_category').value,
    price: Number(document.getElementById('f_price').value),
    description: document.getElementById('f_description').value.trim(),
    sort_order: Number(document.getElementById('f_sort').value || 0),
  };
  if (!payload.name || isNaN(payload.price)) { showToast('Name and a valid price are required'); return; }
  try {
    const url = id ? `/api/admin/hamper-components/${id}` : '/api/admin/hamper-components';
    const res = await fetch(window.API_BASE_URL + url, {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) { const er = await res.json().catch(() => ({})); showToast(er.error || 'Save failed'); return; }
    showToast('Component saved');
    document.getElementById('itemForm').style.display = 'none';
    loadComponentsList();
  } catch (e) { showToast('Save failed'); }
}

async function deleteItem(kind, id) {
  if (!window.confirm('Delete this item permanently?')) return;
  const url = kind === 'products' ? `/api/admin/products/${id}` : `/api/admin/hamper-components/${id}`;
  try {
    const res = await fetch(window.API_BASE_URL + url, { method: 'DELETE', credentials: 'include' });
    if (res.ok) {
      showToast('Deleted');
      kind === 'products' ? loadProductsList() : loadComponentsList();
    } else {
      showToast('Delete failed');
    }
  } catch (e) { showToast('Delete failed'); }
}
