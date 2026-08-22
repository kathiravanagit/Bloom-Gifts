const TAG_ICON_SVG = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12.5 2.5h5a2 2 0 0 1 2 2v5a2 2 0 0 1-.6 1.4l-8 8a2 2 0 0 1-2.8 0l-4-4a2 2 0 0 1 0-2.8l8-8a2 2 0 0 1 1.4-.6Z"/><circle cx="16.5" cy="7.5" r="1.3" fill="currentColor" stroke="none"/></svg>';

const CATEGORY_LABELS = {
  bouquets: 'Customized Bouquet',
  hampers: 'Gift Hamper',
  chocolate: 'Chocolate Hamper',
  albums: 'Photo Album',
  cards: 'Greeting Card',
};

let product = null;
let selections = {}; // group_name -> {name, extra_price} for single, or array for multi
let quantity = 1;
let giftNote = '';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  const root = document.getElementById('pdRoot');
  if (!slug) {
    root.innerHTML = '<p style="text-align:center;">No product selected. <a href="products.html">Back to shop</a></p>';
    return;
  }

  try {
    const res = await fetch(window.API_BASE_URL + `/api/products/${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error('not found');
    product = await res.json();
  } catch (err) {
    root.innerHTML = '<p style="text-align:center;">We couldn\'t find that product. <a href="products.html">Back to shop</a></p>';
    return;
  }

  document.title = `${product.name} | Bloom & Gifts`;
  initSelections();
  render();
});

function initSelections() {
  product.option_groups.forEach((group) => {
    if (group.type === 'single') {
      const def = group.options.find((o) => o.is_default) || group.options[0];
      selections[group.name] = def;
    } else {
      selections[group.name] = [];
    }
  });
}

function render() {
  const root = document.getElementById('pdRoot');
  root.innerHTML = `
    <div class="pd-wrap">
      <div class="pd-gallery">
        <img src="${product.image}" alt="${product.name}">
      </div>
      <div class="pd-info">
        <span class="eyebrow">${CATEGORY_LABELS[product.category] || product.category}</span>
        <h1>${product.name}</h1>
        <p class="pd-tagline">${product.tagline || ''}</p>
        <p>${product.description || ''}</p>

        <div id="optionGroups"></div>

        <div class="gift-note-field">
          <label for="giftNote" style="font-weight:700; font-size:0.84rem; display:block; margin-bottom:6px;">Add a personal gift note (optional)</label>
          <textarea id="giftNote" maxlength="140" placeholder="Write a short message to include with this gift..."></textarea>
          <div class="char-count"><span id="noteCount">0</span>/140</div>
        </div>

        <div class="tag-tray">
          <h4>Your gift includes</h4>
          <div class="tag-chips" id="tagChips"></div>
          <div class="price-dial">
            <span class="label">Total</span>
            <span class="amount" id="priceAmount">${formatMoney(product.base_price)}</span>
          </div>
        </div>

        <div class="qty-row">
          <span style="font-weight:700; font-size:0.88rem;">Quantity</span>
          <div class="qty-control">
            <button type="button" id="qtyMinus" aria-label="Decrease quantity">&minus;</button>
            <span id="qtyValue">1</span>
            <button type="button" id="qtyPlus" aria-label="Increase quantity">+</button>
          </div>
        </div>

        <button class="btn btn-primary btn-block" id="addToCartBtn">Add to Cart &mdash; <span id="btnPrice">${formatMoney(product.base_price)}</span></button>
        <p style="margin-top:14px;"><a href="products.html">&larr; Back to shop</a></p>
      </div>
    </div>
  `;

  renderOptionGroups();
  updateTray();

  document.getElementById('giftNote').addEventListener('input', (e) => {
    giftNote = e.target.value;
    document.getElementById('noteCount').textContent = giftNote.length;
    updateTray();
  });
  document.getElementById('qtyMinus').addEventListener('click', () => changeQty(-1));
  document.getElementById('qtyPlus').addEventListener('click', () => changeQty(1));
  document.getElementById('addToCartBtn').addEventListener('click', handleAddToCart);
}

function renderOptionGroups() {
  const wrap = document.getElementById('optionGroups');
  wrap.innerHTML = product.option_groups.map((group, gIdx) => {
    const pills = group.options.map((opt) => {
      const inputType = group.type === 'single' ? 'radio' : 'checkbox';
      const isChecked = group.type === 'single'
        ? selections[group.name] && selections[group.name].name === opt.name
        : selections[group.name].some((o) => o.name === opt.name);
      return `
        <label class="option-pill ${isChecked ? 'selected' : ''}" data-group="${gIdx}" data-option="${opt.id}">
          <input type="${inputType}" name="group-${gIdx}" ${isChecked ? 'checked' : ''}>
          ${opt.name}
          ${opt.extra_price > 0 ? `<span class="extra">+${formatMoney(opt.extra_price)}</span>` : ''}
        </label>
      `;
    }).join('');
    return `
      <div class="option-group">
        <h4>${group.name}</h4>
        <div class="option-pills">${pills}</div>
      </div>
    `;
  }).join('');

  wrap.querySelectorAll('.option-pill').forEach((pill) => {
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      const gIdx = Number(pill.dataset.group);
      const optId = Number(pill.dataset.option);
      const group = product.option_groups[gIdx];
      const opt = group.options.find((o) => o.id === optId);

      if (group.type === 'single') {
        selections[group.name] = opt;
      } else {
        const current = selections[group.name];
        const existingIdx = current.findIndex((o) => o.name === opt.name);
        if (existingIdx >= 0) current.splice(existingIdx, 1);
        else current.push(opt);
      }
      renderOptionGroups();
      updateTray();
    });
  });
}

function changeQty(delta) {
  quantity = Math.max(1, quantity + delta);
  document.getElementById('qtyValue').textContent = quantity;
  updateTray();
}

function computeUnitPrice() {
  let total = product.base_price;
  Object.values(selections).forEach((sel) => {
    if (Array.isArray(sel)) {
      sel.forEach((o) => { total += o.extra_price; });
    } else if (sel) {
      total += sel.extra_price;
    }
  });
  return round2(total);
}

function updateTray() {
  const chipsWrap = document.getElementById('tagChips');
  const chips = [];
  Object.entries(selections).forEach(([groupName, sel]) => {
    if (Array.isArray(sel)) {
      sel.forEach((o) => chips.push(o.name));
    } else if (sel) {
      chips.push(sel.name);
    }
  });
  if (giftNote.trim()) chips.push('Gift note added');

  chipsWrap.innerHTML = chips.length
    ? chips.map((c) => `<span class="tag-chip">${TAG_ICON_SVG}${c}</span>`).join('')
    : '<span class="tag-empty">Choose your options below to build this gift.</span>';

  const unitPrice = computeUnitPrice();
  const total = round2(unitPrice * quantity);
  const amountEl = document.getElementById('priceAmount');
  amountEl.textContent = formatMoney(total);
  amountEl.classList.remove('bump');
  void amountEl.offsetWidth; // restart animation
  amountEl.classList.add('bump');

  document.getElementById('btnPrice').textContent = formatMoney(total);
}

function handleAddToCart() {
  const unitPrice = computeUnitPrice();
  const customizations = {};
  Object.entries(selections).forEach(([groupName, sel]) => {
    customizations[groupName] = Array.isArray(sel) ? sel.map((o) => o.name) : (sel ? sel.name : null);
  });
  if (giftNote.trim()) customizations['Gift Note'] = giftNote.trim();

  addToCart({
    product_id: product.id,
    product_name: product.name,
    slug: product.slug,
    image: product.image,
    unit_price: unitPrice,
    quantity,
    customizations,
    subtotal: round2(unitPrice * quantity),
  });

  showToast(`Added ${product.name} to cart`);
  quantity = 1;
  giftNote = '';
  document.getElementById('qtyValue').textContent = '1';
  document.getElementById('giftNote').value = '';
  document.getElementById('noteCount').textContent = '0';
  updateTray();
}
