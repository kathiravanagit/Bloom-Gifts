// Fixed display order (server returns groups keyed by category, order not guaranteed)
const CATEGORY_ORDER = ['base', 'flowers', 'sweets', 'drinks', 'extras', 'cards'];

const SECTION_META = {
  base: {
    title: 'Choose Your Base', subtitle: 'Pick one container to start with.', type: 'single',
    icon: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h16l-1.5 9a2 2 0 0 1-2 1.7H7.5a2 2 0 0 1-2-1.7L4 10Z"/><path d="M4 10 Q12 5.5 20 10"/><path d="M9 4.3c0 2 1.3 3.2 3 3.2s3-1.2 3-3.2"/></svg>',
  },
  flowers: {
    title: 'Add Flowers', subtitle: 'A few fresh stems tucked into the hamper.', type: 'multi',
    icon: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="7.5" r="2.2"/><circle cx="14" cy="6.3" r="2.2"/><circle cx="11.2" cy="10.4" r="2.4"/><path d="M11.2 12.8 10 20M11.2 12.8 12.4 20"/></svg>',
  },
  sweets: {
    title: 'Add Something Sweet', subtitle: 'Chocolates, truffles, and cookies.', type: 'multi',
    icon: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8.5" width="16" height="11" rx="1.4"/><path d="M4 8.5 12 3.5 20 8.5"/><circle cx="8.6" cy="14" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="14" r="1" fill="currentColor" stroke="none"/><circle cx="15.4" cy="14" r="1" fill="currentColor" stroke="none"/></svg>',
  },
  drinks: {
    title: 'Add a Drink', subtitle: 'Something to sip alongside.', type: 'multi',
    icon: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2h4v4.5l3 4.5v9a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-9l3-4.5V2Z"/><path d="M8.5 14h7"/></svg>',
  },
  extras: {
    title: 'Finishing Touches', subtitle: 'Candles, plush, and cozy extras.', type: 'multi',
    icon: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M9 6h6l1 4H8l1-4Z"/><path d="M8 10h8l1 10a1.4 1.4 0 0 1-1.4 1.6H8.4A1.4 1.4 0 0 1 7 20L8 10Z"/></svg>',
  },
  cards: {
    title: 'Add a Card', subtitle: 'A personal note tucked inside.', type: 'multi',
    icon: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="1.4"/><path d="M3.5 7 12 13.2 20.5 7"/></svg>',
  },
};

const HAMPER_PREVIEW_IMAGE = 'https://images.pexels.com/photos/1666069/pexels-photo-1666069.jpeg?auto=compress&cs=tinysrgb&w=800';

let componentGroups = {};
let selections = {}; // category -> component object (base) or array of component objects (others)
let quantity = 1;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch(window.API_BASE_URL + '/api/products/meta/hamper-components');
    componentGroups = await res.json();
  } catch (err) {
    document.getElementById('builderSections').innerHTML = '<p style="text-align:center;">Could not load hamper components right now.</p>';
    return;
  }

  CATEGORY_ORDER.forEach((cat) => { selections[cat] = cat === 'base' ? null : []; });
  renderSections();
  updateSummary();

  document.getElementById('builderQtyMinus').addEventListener('click', () => changeQty(-1));
  document.getElementById('builderQtyPlus').addEventListener('click', () => changeQty(1));
  document.getElementById('builderAddToCart').addEventListener('click', handleAddToCart);
});

function renderSections() {
  const wrap = document.getElementById('builderSections');
  wrap.innerHTML = CATEGORY_ORDER.filter((cat) => componentGroups[cat] && componentGroups[cat].length).map((cat) => {
    const meta = SECTION_META[cat];
    const items = componentGroups[cat];
    const cards = items.map((item) => {
      const isSelected = cat === 'base'
        ? selections.base && selections.base.id === item.id
        : selections[cat].some((o) => o.id === item.id);
      return `
        <button type="button" class="component-card ${isSelected ? 'selected' : ''}" data-cat="${cat}" data-id="${item.id}">
          <span class="component-icon">${meta.icon}</span>
          <span class="component-name">${item.name}</span>
          <span class="component-desc">${item.description || ''}</span>
          <span class="component-price">Custom</span>
        </button>
      `;
    }).join('');

    return `
      <div class="builder-section">
        <h4 class="builder-section-title">${meta.title}${cat === 'base' ? ' <span class=\"required-tag\">Required</span>' : ''}</h4>
        <p class="builder-section-sub">${meta.subtitle}</p>
        <div class="component-grid">${cards}</div>
      </div>
    `;
  }).join('');

  wrap.querySelectorAll('.component-card').forEach((card) => {
    card.addEventListener('click', () => {
      const cat = card.dataset.cat;
      const id = Number(card.dataset.id);
      const item = componentGroups[cat].find((c) => c.id === id);

      if (cat === 'base') {
        selections.base = (selections.base && selections.base.id === id) ? null : item;
      } else {
        const list = selections[cat];
        const idx = list.findIndex((o) => o.id === id);
        if (idx >= 0) list.splice(idx, 1);
        else list.push(item);
      }
      renderSections();
      updateSummary();
    });
  });
}

function computeTotal() {
  let total = selections.base ? selections.base.price : 0;
  CATEGORY_ORDER.forEach((cat) => {
    if (cat === 'base') return;
    selections[cat].forEach((item) => { total += item.price; });
  });
  return round2(total);
}

function changeQty(delta) {
  quantity = Math.max(1, quantity + delta);
  document.getElementById('builderQtyValue').textContent = quantity;
  updateSummary();
}

function updateSummary() {
  const chipsWrap = document.getElementById('builderChips');
  const chips = [];
  if (selections.base) chips.push(selections.base.name);
  CATEGORY_ORDER.forEach((cat) => {
    if (cat === 'base') return;
    selections[cat].forEach((item) => chips.push(item.name));
  });

  chipsWrap.innerHTML = chips.length
    ? chips.map((c) => `<span class="tag-chip">${TAG_ICON_SVG_LOCAL}${c}</span>`).join('')
    : '<span class="tag-empty">Choose a base to start building.</span>';

  const unitPrice = computeTotal();
  const total = round2(unitPrice * quantity);
  document.getElementById('builderTotal').textContent = 'Custom';

  const addBtn = document.getElementById('builderAddToCart');
  if (!selections.base) {
    addBtn.disabled = true;
    addBtn.textContent = 'Choose a base first';
  } else {
    addBtn.disabled = false;
    addBtn.textContent = `Add Hamper to Cart — Custom`;
  }
}

const TAG_ICON_SVG_LOCAL = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12.5 2.5h5a2 2 0 0 1 2 2v5a2 2 0 0 1-.6 1.4l-8 8a2 2 0 0 1-2.8 0l-4-4a2 2 0 0 1 0-2.8l8-8a2 2 0 0 1 1.4-.6Z"/><circle cx="16.5" cy="7.5" r="1.3" fill="currentColor" stroke="none"/></svg>';

function handleAddToCart() {
  if (!selections.base) return;
  const unitPrice = computeTotal();
  const customizations = { Base: selections.base.name };
  CATEGORY_ORDER.forEach((cat) => {
    if (cat === 'base') return;
    if (selections[cat].length) {
      const label = SECTION_META[cat].title.replace('Add ', '').replace('Finishing Touches', 'Extras');
      customizations[label] = selections[cat].map((o) => o.name);
    }
  });

  addToCart({
    product_id: null,
    product_name: 'Custom Hamper',
    slug: null,
    image: HAMPER_PREVIEW_IMAGE,
    unit_price: unitPrice,
    quantity,
    customizations,
    subtotal: round2(unitPrice * quantity),
  });

  showToast('Custom hamper added to cart');
  quantity = 1;
  document.getElementById('builderQtyValue').textContent = '1';
  selections = {};
  CATEGORY_ORDER.forEach((cat) => { selections[cat] = cat === 'base' ? null : []; });
  renderSections();
  updateSummary();
}
