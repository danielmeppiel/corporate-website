// Product Catalog Display Module - Contoso Migration Integration
// Loads migrated product data and renders with APM compliance standards

class ContosoProductShowcase {
  constructor(targetElementId, catalogPath) {
    this.displayContainer = document.getElementById(targetElementId);
    this.catalogPath = catalogPath;
    this.productData = null;
    this.renderingComplete = false;
  }

  async fetchCatalogData() {
    try {
      const response = await fetch(this.catalogPath);
      if (!response.ok) {
        throw new Error(`Catalog fetch failed: ${response.status}`);
      }
      this.productData = await response.json();
      return true;
    } catch (err) {
      console.error('Product catalog loading error:', err);
      this.displayContainer.innerHTML = `<p class="error-message">Unable to load product catalog. Please try again later.</p>`;
      return false;
    }
  }

  buildProductCard(productItem) {
    const cardElement = document.createElement('article');
    cardElement.className = 'product-card';
    cardElement.setAttribute('role', 'article');
    cardElement.setAttribute('aria-label', productItem.accessibility.ariaLabel);

    const statusBadge = productItem.taxonomy.status === 'live' 
      ? '<span class="badge badge-active">Active</span>'
      : '<span class="badge badge-archived">Archived</span>';

    const featureItems = productItem.capabilities
      .map(cap => `<li class="feature-item">${cap.text}</li>`)
      .join('');

    cardElement.innerHTML = `
      <header class="product-header">
        <h3 class="product-heading">${productItem.heading}</h3>
        ${statusBadge}
      </header>
      <div class="product-body">
        <p class="product-summary">${productItem.summary}</p>
        <div class="pricing-info" role="contentinfo" aria-label="Pricing information">
          <span class="price-amount">$${productItem.subscription.usdMonthly}</span>
          <span class="price-period">/month</span>
        </div>
        <ul class="feature-list" aria-label="Product features">
          ${featureItems}
        </ul>
      </div>
      <footer class="product-footer">
        <span class="product-vertical">${productItem.taxonomy.vertical}</span>
        <span class="gdpr-indicator" title="GDPR Compliant">🔒 Compliant</span>
      </footer>
    `;

    return cardElement;
  }

  renderProductGrid() {
    if (!this.productData || !this.productData.items) {
      this.displayContainer.innerHTML = '<p>No products available.</p>';
      return;
    }

    const gridContainer = document.createElement('div');
    gridContainer.className = 'product-grid';
    gridContainer.setAttribute('role', 'list');

    const activeProducts = this.productData.items.filter(p => p.taxonomy.status === 'live');
    const archivedProducts = this.productData.items.filter(p => p.taxonomy.status === 'archived');

    activeProducts.forEach(product => {
      const cardNode = this.buildProductCard(product);
      gridContainer.appendChild(cardNode);
    });

    if (archivedProducts.length > 0) {
      const archiveHeader = document.createElement('h3');
      archiveHeader.textContent = 'Archived Products';
      archiveHeader.className = 'archive-header';
      gridContainer.appendChild(archiveHeader);

      archivedProducts.forEach(product => {
        const cardNode = this.buildProductCard(product);
        gridContainer.appendChild(cardNode);
      });
    }

    this.displayContainer.innerHTML = '';
    this.displayContainer.appendChild(gridContainer);
    this.renderingComplete = true;
  }

  async initialize() {
    const loadSuccess = await this.fetchCatalogData();
    if (loadSuccess) {
      this.renderProductGrid();
      console.log(`Product showcase initialized: ${this.productData.items.length} items`);
    }
  }
}

export { ContosoProductShowcase };
