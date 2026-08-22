document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const initialCategory = params.get('category') || 'all';
  setActiveChip(initialCategory);
  loadProducts(initialCategory);

  document.getElementById('filterBar').addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    const category = chip.dataset.category;
    setActiveChip(category);
    loadProducts(category);
    const url = new URL(window.location);
    if (category === 'all') url.searchParams.delete('category');
    else url.searchParams.set('category', category);
    window.history.replaceState({}, '', url);
  });
});

function setActiveChip(category) {
  document.querySelectorAll('.filter-chip').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.category === category);
  });
}

async function loadProducts(category) {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = '<p style="text-align:center; grid-column:1/-1;">Loading products&hellip;</p>';
  try {
    const res = await fetch(`/api/products?category=${encodeURIComponent(category)}`);
    const products = await res.json();
    if (!products.length) {
      grid.innerHTML = '<p style="text-align:center; grid-column:1/-1;">No products in this category yet.</p>';
      return;
    }
    grid.innerHTML = products.map(productCardHTML).join('');
  } catch (err) {
    grid.innerHTML = '<p style="text-align:center; grid-column:1/-1;">Could not load products right now.</p>';
  }
}
